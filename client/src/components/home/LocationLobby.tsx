"use client";

import { useState, useEffect, useContext, useRef } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { SessionContext } from "@/context/session";
import { API_URL } from "@/config";

interface NearbyPlayer {
    id: string | number;
    name: string;
    timeControl: string;
    side: string;
    lat: number;
    lon: number;
    distance: number;
}

export default function LocationLobby() {
    const session = useContext(SessionContext);
    const router = useRouter();
    
    const [isActive, setIsActive] = useState(false);
    const [radius, setRadius] = useState(5); // default 5km
    const [timeControl, setTimeControl] = useState("10+0");
    const side = "random";
    const [nearbyPlayers, setNearbyPlayers] = useState<NearbyPlayer[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Socket and Interval refs
    const socketRef = useRef<Socket | null>(null);
    const pollIntervalRef = useRef<any | null>(null);
    const coordsRef = useRef<{ lat: number; lon: number } | null>(null);

    // Challenge notification states
    const [incomingChallenge, setIncomingChallenge] = useState<{
        host: { id: string | number; name: string };
        gameCode: string;
    } | null>(null);

    // Clean up connections on unmount
    useEffect(() => {
        return () => {
            stopMatchmaking();
        };
    }, []);

    // Handle updates when settings change during active scan
    useEffect(() => {
        if (isActive && coordsRef.current) {
            updatePosition(coordsRef.current.lat, coordsRef.current.lon);
        }
    }, [radius, timeControl, side]);

    const startMatchmaking = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        setLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                coordsRef.current = { lat: latitude, lon: longitude };

                try {
                    // Connect to Socket.io
                    const socket = io(API_URL, {
                        withCredentials: true,
                        transports: ["websocket", "polling"]
                    });

                    socketRef.current = socket;

                    socket.on("connect", () => {
                        console.log("Location Lobby socket connected");
                    });

                    // Listen for incoming challenges
                    socket.on("challenge:received", (payload: { host: { id: string | number; name: string }; gameCode: string }) => {
                        setIncomingChallenge(payload);
                    });

                    // Listen for challenge acceptance (if we are the host)
                    socket.on("challenge:accepted", (payload: { guest: any; gameCode: string }) => {
                        router.push(`/${payload.gameCode}`);
                    });

                    // Perform initial update
                    await updatePosition(latitude, longitude);
                    await fetchNearby(latitude, longitude);

                    // Setup periodic update & search (every 8 seconds)
                    pollIntervalRef.current = setInterval(() => {
                        if (coordsRef.current) {
                            updatePosition(coordsRef.current.lat, coordsRef.current.lon);
                            fetchNearby(coordsRef.current.lat, coordsRef.current.lon);
                        }
                    }, 8000);

                    setIsActive(true);
                    setLoading(false);
                } catch (err) {
                    console.error("Matchmaking init error:", err);
                    setError("Failed to initialize matchmaking connection");
                    setLoading(false);
                }
            },
            (err) => {
                console.error("Geolocation error:", err);
                setError(`Location permission denied or unavailable: ${err.message}`);
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    };

    const stopMatchmaking = async () => {
        setIsActive(false);
        setIncomingChallenge(null);
        setNearbyPlayers([]);
        coordsRef.current = null;

        // Clear interval
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }

        // Disconnect socket
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        // Notify backend to remove lobby
        try {
            await fetch(`${API_URL}/v1/location`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "omit" // express session handles credentials separately or with CORS
            });
        } catch (e) {
            console.error("Error leaving lobby:", e);
        }
    };

    const updatePosition = async (lat: number, lon: number) => {
        try {
            await fetch(`${API_URL}/v1/location`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lat, lon, timeControl, side }),
                credentials: "include"
            });
        } catch (err) {
            console.error("Error updating location:", err);
        }
    };

    const fetchNearby = async (lat: number, lon: number) => {
        try {
            const res = await fetch(`${API_URL}/v1/location?lat=${lat}&lon=${lon}&radius=${radius}`, {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                setNearbyPlayers(data.players || []);
            }
        } catch (err) {
            console.error("Error fetching nearby players:", err);
        }
    };

    const handleChallenge = async (player: NearbyPlayer) => {
        try {
            // 1. Create a game on the backend
            const res = await fetch(`${API_URL}/v1/games`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    unlisted: true,
                    side: player.side === "random" ? "white" : (player.side === "white" ? "black" : "white")
                }),
                credentials: "include"
            });

            if (!res.ok) throw new Error("Failed to create game");
            const data = await res.json();
            const gameCode = data.code;

            // 2. Notify player via sockets
            if (socketRef.current) {
                socketRef.current.emit("challenge:send", {
                    challengedId: player.id,
                    gameCode
                });
            }

            // 3. Navigate to game page
            router.push(`/${gameCode}`);
        } catch (err) {
            console.error("Error challenging player:", err);
            alert("Could not start challenge. Please try again.");
        }
    };

    const acceptChallenge = () => {
        if (!incomingChallenge) return;

        // 1. Emit accept event so the host redirects
        if (socketRef.current) {
            socketRef.current.emit("challenge:accept", {
                hostId: incomingChallenge.host.id,
                gameCode: incomingChallenge.gameCode
            });
        }

        // 2. Redirect ourselves
        const code = incomingChallenge.gameCode;
        setIncomingChallenge(null);
        router.push(`/${code}`);
    };

    return (
        <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300 overflow-hidden">
            <div className="card-body p-6">
                <h2 className="card-title text-xl font-bold flex items-center justify-between">
                    <span>📍 Nearby Play Lobby</span>
                    {isActive && (
                        <span className="badge badge-success gap-1 animate-pulse">
                            <span className="h-2 w-2 rounded-full bg-current"></span> Live
                        </span>
                    )}
                </h2>
                <p className="text-sm text-base-content/60">
                    Find and challenge players active within your physical area.
                </p>

                {error && (
                    <div className="alert alert-error text-sm py-2 px-3 mt-2 rounded">
                        <span>{error}</span>
                    </div>
                )}

                {/* Setup / Settings Section */}
                <div className="space-y-3 mt-4">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="label label-text py-1 text-xs">Search Radius</label>
                            <select
                                className="select select-bordered select-sm w-full"
                                value={radius}
                                onChange={(e) => setRadius(Number(e.target.value))}
                                disabled={loading}
                            >
                                <option value={1}>1 km</option>
                                <option value={2}>2 km</option>
                                <option value={5}>5 km</option>
                                <option value={10}>10 km</option>
                                <option value={25}>25 km</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="label label-text py-1 text-xs">Time Control</label>
                            <select
                                className="select select-bordered select-sm w-full"
                                value={timeControl}
                                onChange={(e) => setTimeControl(e.target.value)}
                                disabled={loading}
                            >
                                <option value="3+2">3+2 Blitz</option>
                                <option value="5+0">5+0 Blitz</option>
                                <option value="10+0">10+0 Rapid</option>
                                <option value="15+10">15+10 Rapid</option>
                                <option value="30+0">30m Classical</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Matchmaking Controls */}
                <div className="mt-6 flex justify-center">
                    {!isActive ? (
                        <button
                            onClick={startMatchmaking}
                            className={`btn btn-primary w-full ${loading ? "loading" : ""}`}
                            disabled={!session?.user?.id || loading}
                        >
                            {session?.user?.id ? "Start Radar Scan" : "Log in to scan nearby"}
                        </button>
                    ) : (
                        <button onClick={stopMatchmaking} className="btn btn-error w-full">
                            Stop Radar Scan
                        </button>
                    )}
                </div>

                {/* Pulsing Radar UI */}
                {isActive && (
                    <div className="flex flex-col items-center justify-center py-6 mt-4 relative overflow-hidden bg-base-200/50 rounded-xl border border-base-300">
                        <div className="relative h-28 w-28 flex items-center justify-center">
                            {/* Scanning circles */}
                            <span className="absolute inline-flex h-full w-full rounded-full bg-primary/10 animate-ping opacity-75"></span>
                            <span className="absolute inline-flex h-20 w-20 rounded-full bg-primary/20 animate-ping opacity-60"></span>
                            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-content z-10 shadow-lg font-bold">
                                You
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-base-content/50 animate-pulse text-center">
                            Scanning within {radius}km...
                        </div>
                    </div>
                )}

                {/* Nearby Players List */}
                {isActive && (
                    <div className="mt-4">
                        <h3 className="font-bold text-sm mb-2 text-base-content/80">
                            Nearby Players ({nearbyPlayers.length})
                        </h3>
                        {nearbyPlayers.length === 0 ? (
                            <div className="text-xs text-base-content/40 py-4 text-center border border-dashed border-base-300 rounded">
                                No active players nearby. Ask a friend to scan!
                            </div>
                        ) : (
                            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                                {nearbyPlayers.map((player) => (
                                    <div
                                        key={player.id}
                                        className="flex items-center justify-between p-2 rounded bg-base-200 border border-base-300 text-xs"
                                    >
                                        <div>
                                            <div className="font-bold">{player.name}</div>
                                            <div className="text-[10px] text-base-content/60">
                                                ⏱️ {player.timeControl} | 📍 {(player.distance * 1000).toFixed(0)}m away
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleChallenge(player)}
                                            className="btn btn-xs btn-primary font-medium"
                                        >
                                            Challenge
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Received Challenge Modal */}
            {incomingChallenge && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-sm">
                        <h3 className="font-bold text-lg">⚔️ Challenge Received!</h3>
                        <p className="py-4 text-sm">
                            <span className="font-bold text-primary">{incomingChallenge.host.name}</span> has challenged you to an unlisted match. Do you accept?
                        </p>
                        <div className="modal-action flex justify-end gap-2">
                            <button
                                onClick={() => setIncomingChallenge(null)}
                                className="btn btn-sm btn-ghost"
                            >
                                Decline
                            </button>
                            <button
                                onClick={acceptChallenge}
                                className="btn btn-sm btn-primary"
                            >
                                Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
