"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/config";

interface Player {
    id: number;
    name: string;
    wins: number;
    losses: number;
    draws: number;
    eloBullet: number;
    eloBlitz: number;
    eloRapid: number;
    eloClassical: number;
    puzzleRating: number;
    division: string;
    xp: number;
    avatarUrl?: string;
}

export default function LeaderboardPage() {
    const [tab, setTab] = useState<"elo" | "leagues">("elo");
    const [eloType, setEloType] = useState<string>("blitz");
    const [division, setDivision] = useState<string>("Bronze");
    
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const url = tab === "elo"
                ? `${API_URL}/v1/users/leaderboard/elo?type=${eloType}`
                : `${API_URL}/v1/users/leaderboard/leagues?division=${division}`;
                
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setPlayers(data || []);
            }
        } catch (e) {
            console.error("Error fetching leaderboard:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, [tab, eloType, division]);

    const getDivisionBadgeColor = (div: string) => {
        if (div === "Gold") return "badge-warning text-warning-content";
        if (div === "Silver") return "badge-neutral text-neutral-content";
        return "badge-primary text-primary-content"; // Bronze
    };

    return (
        <div className="flex flex-col items-center w-full max-w-4xl px-4">
            
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold flex items-center justify-center gap-2">
                    🏆 Chessthan Arena Leaderboard
                </h1>
                <p className="text-sm text-base-content/60 mt-1">
                    See where you stand among top players globally and weekly division leagues
                </p>
            </div>

            {/* Main Tabs */}
            <div className="tabs tabs-boxed grid grid-cols-2 w-full max-w-md mb-6 p-1">
                <button
                    onClick={() => setTab("elo")}
                    className={`tab ${tab === "elo" ? "tab-active font-bold" : ""}`}
                >
                    📈 Global ELO Standings
                </button>
                <button
                    onClick={() => setTab("leagues")}
                    className={`tab ${tab === "leagues" ? "tab-active font-bold" : ""}`}
                >
                    💎 Weekly Division Leagues
                </button>
            </div>

            {/* Filters panel */}
            <div className="flex justify-end w-full mb-4">
                {tab === "elo" ? (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-base-content/60">Category:</span>
                        <select
                            className="select select-bordered select-xs"
                            value={eloType}
                            onChange={(e) => setEloType(e.target.value)}
                        >
                            <option value="blitz">⚡ Blitz</option>
                            <option value="bullet">Bullet</option>
                            <option value="rapid">⏱️ Rapid</option>
                            <option value="classical">🏰 Classical</option>
                            <option value="puzzle">🧩 Puzzles</option>
                        </select>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-base-content/60">League Division:</span>
                        <select
                            className="select select-bordered select-xs"
                            value={division}
                            onChange={(e) => setDivision(e.target.value)}
                        >
                            <option value="Bronze">🥉 Bronze League</option>
                            <option value="Silver">🥈 Silver League</option>
                            <option value="Gold">🥇 Gold League</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Leaderboard Table Container */}
            <div className="card w-full bg-base-100 border border-base-300 shadow-xl overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                        <div className="text-xs text-base-content/50 mt-2">Fetching ranking data...</div>
                    </div>
                ) : players.length === 0 ? (
                    <div className="text-center py-16 text-xs text-base-content/40 border border-dashed border-base-300 rounded m-6">
                        No active players in this bracket yet. Be the first to claim a spot!
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr className="bg-base-200">
                                    <th className="w-12 text-center">Rank</th>
                                    <th>Player</th>
                                    {tab === "elo" ? (
                                        <>
                                            <th className="text-center">ELO Rating</th>
                                            <th className="text-center">Record (W/D/L)</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="text-center">Weekly XP</th>
                                            <th className="text-center">League</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {players.map((player, index) => {
                                    const rank = index + 1;
                                    const elo = eloType === "bullet" ? player.eloBullet
                                        : eloType === "rapid" ? player.eloRapid
                                        : eloType === "classical" ? player.eloClassical
                                        : eloType === "puzzle" ? player.puzzleRating
                                        : player.eloBlitz;

                                    return (
                                        <tr key={player.id} className="hover:bg-base-200/50">
                                            <td className="text-center font-bold text-sm">
                                                {rank === 1 && "🥇"}
                                                {rank === 2 && "🥈"}
                                                {rank === 3 && "🥉"}
                                                {rank > 3 && rank}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="avatar placeholder">
                                                        <div className="bg-neutral text-neutral-content rounded-full w-8 h-8 flex items-center justify-center">
                                                            {player.avatarUrl ? (
                                                                <img src={player.avatarUrl} alt={player.name} />
                                                            ) : (
                                                                <span className="text-xs uppercase">{player.name[0]}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <a
                                                            href={`/user/${player.name}`}
                                                            className="font-bold text-sm text-primary link-hover"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            {player.name}
                                                        </a>
                                                        <div className="text-[10px] text-base-content/50">
                                                            ID: #{player.id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            {tab === "elo" ? (
                                                <>
                                                    <td className="text-center font-semibold text-sm">
                                                        {elo}
                                                    </td>
                                                    <td className="text-center text-xs text-base-content/70">
                                                        <span className="text-success font-medium">{player.wins}W</span>
                                                        {" - "}
                                                        <span>{player.draws}D</span>
                                                        {" - "}
                                                        <span className="text-error font-medium">{player.losses}L</span>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="text-center font-bold text-sm text-success">
                                                        {player.xp.toLocaleString()} XP
                                                    </td>
                                                    <td className="text-center">
                                                        <span className={`badge badge-sm font-semibold ${getDivisionBadgeColor(player.division)}`}>
                                                            {player.division}
                                                        </span>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
