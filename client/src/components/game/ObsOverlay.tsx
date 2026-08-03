"use client";

import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { io } from "socket.io-client";
import { API_URL } from "@/config";
import { evaluateBoard } from "@/lib/localEngine";

interface ObsOverlayProps {
    gameCode: string;
}

export default function ObsOverlay({ gameCode }: ObsOverlayProps) {
    const [game, setGame] = useState<Chess>(new Chess());
    const [gameFen, setGameFen] = useState(game.fen());
    const [lobby, setLobby] = useState<any>(null);
    const [evalScore, setEvalScore] = useState<number>(0);
    const [lastMove, setLastMove] = useState<any>({});

    useEffect(() => {
        // Fetch initial game state
        fetch(`${API_URL}/v1/games/${gameCode}`)
            .then(res => res.json())
            .then(data => {
                setLobby(data);
                if (data.pgn) {
                    const temp = new Chess();
                    temp.loadPgn(data.pgn);
                    setGame(temp);
                    setGameFen(temp.fen());
                }
            })
            .catch(err => console.error("Error fetching lobby for OBS overlay:", err));

        // Connect to Socket server
        const socket = io(API_URL, { withCredentials: true });

        socket.on("connect", () => {
            socket.emit("joinLobby", gameCode);
        });

        // Listen for board updates
        socket.on("receivedLatestGame", (updatedLobby: any) => {
            setLobby(updatedLobby);
            if (updatedLobby.pgn) {
                const temp = new Chess();
                temp.loadPgn(updatedLobby.pgn);
                setGame(temp);
                setGameFen(temp.fen());
            }
        });

        socket.on("receivedMove", (m: { from: string; to: string }) => {
            setLastMove({
                [m.from]: { background: "rgba(255, 255, 0, 0.4)" },
                [m.to]: { background: "rgba(255, 255, 0, 0.4)" }
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [gameCode]);

    // Recalculate board evaluation
    useEffect(() => {
        const score = evaluateBoard(game);
        setEvalScore(score / 100);
    }, [gameFen]);

    if (!lobby) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[#00FF00] text-black font-bold font-mono">
                Loading Chessthan Overlay...
            </div>
        );
    }

    // Determine orientation
    const orientation = "white";

    // Evaluation bar sizing
    const scoreVal = Math.max(-8, Math.min(evalScore, 8));
    const evalPercent = ((scoreVal + 8) / 16) * 100;
    const formattedScore = evalScore > 0 ? `+${evalScore.toFixed(1)}` : evalScore.toFixed(1);

    const whiteName = lobby.white?.name || "White Player";
    const blackName = lobby.black?.name || "Black Player";
    const history = game.history();
    const lastThreeMoves = history.slice(-3).join("  •  ");

    return (
        <div className="h-screen w-screen bg-[#00FF00] flex flex-col items-center justify-center p-6 text-white overflow-hidden font-sans select-none">
            
            {/* Minimal Streaming Dashboard Frame */}
            <div className="flex gap-4 items-center bg-slate-900/90 border border-slate-700/80 p-6 rounded-2xl shadow-2xl backdrop-blur-md">
                
                {/* Visual Eval Bar */}
                <div className="w-4 h-96 bg-black border border-slate-600 rounded-full overflow-hidden flex flex-col relative shrink-0">
                    <div
                        className="bg-white transition-all duration-300 ease-out w-full"
                        style={{ height: `${evalPercent}%` }}
                    />
                    <div className="flex-1 bg-black w-full" />
                    
                    {/* Score badge */}
                    <div className={`absolute inset-x-0 text-[8px] font-black text-center py-0.5 ${
                        evalScore >= 0 ? "bottom-2 text-black" : "top-2 text-white"
                    }`}>
                        {Math.abs(evalScore).toFixed(0)}
                    </div>
                </div>

                {/* Main Content Board Column */}
                <div className="flex flex-col gap-2">
                    
                    {/* Black Player Card */}
                    <div className="flex items-center justify-between text-xs px-2 font-extrabold text-slate-300">
                        <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                            {blackName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 py-0.5 px-2 rounded">
                            {evalScore < 0 ? `Eval ${formattedScore}` : ""}
                        </span>
                    </div>

                    {/* Chessboard */}
                    <div className="w-[380px] h-[380px] rounded-lg overflow-hidden border border-slate-700 shadow-lg">
                        <Chessboard
                            position={gameFen}
                            boardOrientation={orientation}
                            arePiecesDraggable={false}
                            customSquareStyles={lastMove}
                            customDarkSquareStyle={{ backgroundColor: "#0e4a3b" }}
                            customLightSquareStyle={{ backgroundColor: "#eeeddf" }}
                        />
                    </div>

                    {/* White Player Card */}
                    <div className="flex items-center justify-between text-xs px-2 font-extrabold text-slate-300">
                        <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-white"></span>
                            {whiteName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 py-0.5 px-2 rounded">
                            {evalScore >= 0 ? `Eval ${formattedScore}` : ""}
                        </span>
                    </div>

                    {/* Move ticker */}
                    {history.length > 0 && (
                        <div className="text-center text-[10px] font-mono font-bold text-slate-400 bg-slate-950/80 py-1.5 px-4 rounded-xl border border-slate-800/80 mt-2 truncate w-[380px]">
                            Moves: {lastThreeMoves}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
