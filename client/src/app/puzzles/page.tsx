"use client";

import { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { API_URL } from "@/config";
import {
    IconHeart,
    IconRefresh,
    IconTarget
} from "@tabler/icons-react";

interface Puzzle {
    id: string;
    fen: string;
    moves: string; // e.g. "d1d8,g8f8"
    rating: number;
    theme: string;
}

const FALLBACK_PUZZLES: Puzzle[] = [
    {
        id: "p1",
        fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
        moves: "c4f7,e8f7,f3e5",
        rating: 1250,
        theme: "Fried Liver Attack, Sacrifice"
    },
    {
        id: "p2",
        fen: "r1bqk2r/pppp1ppp/2n2n2/4p3/1b2P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4",
        moves: "c3d5,f6e4,d2d4",
        rating: 1400,
        theme: "Center Fork Trick"
    }
];

export default function PuzzlesPage() {
    const [activeTab, setActiveTab] = useState<"classic" | "rush" | "survival">("classic");
    
    // Core game state
    const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
    const [game, setGame] = useState<Chess | null>(null);
    const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white");
    const [gameFen, setGameFen] = useState("");
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<"solving" | "correct" | "failed" | "passed">("solving");
    const [statusMsg, setStatusMsg] = useState("");

    // Mode-specific states
    const [gameActive, setGameActive] = useState(false);
    const [score, setScore] = useState(0);
    const [strikes, setStrikes] = useState(0);
    const [timeLeft, setTimeLeft] = useState(180);
    const [highScoreRush, setHighScoreRush] = useState(0);
    const [highScoreSurvival, setHighScoreSurvival] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const [boardTheme, setBoardTheme] = useState({ dark: "#0e4a3b", light: "#eeeddf" });
    
    // Track solution progress
    const solutionMovesRef = useRef<string[]>([]);
    const currentStepRef = useRef(0);
    const ratingChangeRef = useRef<number | null>(null);
    const timerRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setHighScoreRush(Number(localStorage.getItem("hs_rush") || "0"));
            setHighScoreSurvival(Number(localStorage.getItem("hs_survival") || "0"));

            const savedTheme = localStorage.getItem("chessthan:boardTheme");
            if (savedTheme) {
                const THEMES = [
                    { id: "emerald", dark: "#0e4a3b", light: "#eeeddf" },
                    { id: "wood", dark: "#b58863", light: "#f0d9b5" },
                    { id: "glass", dark: "#5e81ac", light: "#eceff4" },
                    { id: "slate", dark: "#475569", light: "#cbd5e1" },
                    { id: "royal", dark: "#5b21b6", light: "#ede9fe" }
                ];
                const found = THEMES.find(t => t.id === savedTheme);
                if (found) setBoardTheme({ dark: found.dark, light: found.light });
            }
        }
    }, []);

    useEffect(() => {
        if (activeTab === "rush" && gameActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        endGame();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameActive, activeTab, timeLeft]);

    const startGame = () => {
        setGameActive(true);
        setScore(0);
        setStrikes(0);
        setTimeLeft(180);
        setShowSummary(false);
        loadNewPuzzle();
    };

    const endGame = () => {
        setGameActive(false);
        setShowSummary(true);
        if (timerRef.current) clearInterval(timerRef.current);

        if (activeTab === "rush") {
            if (score > highScoreRush) {
                setHighScoreRush(score);
                localStorage.setItem("hs_rush", String(score));
            }
        } else if (activeTab === "survival") {
            if (score > highScoreSurvival) {
                setHighScoreSurvival(score);
                localStorage.setItem("hs_survival", String(score));
            }
        }
    };

    const loadNewPuzzle = async () => {
        setLoading(true);
        setStatus("solving");
        setStatusMsg("");
        ratingChangeRef.current = null;
        
        try {
            const res = await fetch(`${API_URL}/v1/puzzles/random`, { credentials: "include" });
            let data: Puzzle;
            if (res.ok) {
                data = await res.json();
            } else {
                data = FALLBACK_PUZZLES[Math.floor(Math.random() * FALLBACK_PUZZLES.length)];
            }
            
            const chess = new Chess(data.fen);
            setPuzzle(data);
            setGame(chess);
            setGameFen(chess.fen());
            
            const sideToMove = chess.turn() === "w" ? "white" : "black";
            setBoardOrientation(sideToMove);
            setStatusMsg(`${sideToMove.toUpperCase()} to move and win!`);

            solutionMovesRef.current = data.moves.split(",");
            currentStepRef.current = 0;
        } catch (err) {
            const fallback = FALLBACK_PUZZLES[0];
            const chess = new Chess(fallback.fen);
            setPuzzle(fallback);
            setGame(chess);
            setGameFen(chess.fen());
            setBoardOrientation(chess.turn() === "w" ? "white" : "black");
            setStatusMsg("WHITE to move and win!");
            solutionMovesRef.current = fallback.moves.split(",");
            currentStepRef.current = 0;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "classic") {
            loadNewPuzzle();
        } else {
            setGameActive(false);
            setShowSummary(false);
            setPuzzle(null);
            setGame(null);
        }
    }, [activeTab]);

    const handleArcadeMoveFail = () => {
        const nextStrikes = strikes + 1;
        setStrikes(nextStrikes);
        
        if (nextStrikes >= 3) {
            setStatus("failed");
            setStatusMsg("3 Strikes! Challenge over.");
            endGame();
        } else {
            setStatus("failed");
            setStatusMsg(`Incorrect! Strike ${nextStrikes}/3`);
            setTimeout(() => {
                loadNewPuzzle();
            }, 1000);
        }
    };

    const makeMove = (sourceSquare: string, targetSquare: string) => {
        if (!game || !puzzle || status === "failed" || status === "passed") return false;

        const moveStr = `${sourceSquare}${targetSquare}`;
        const promotion = (targetSquare[1] === "8" || targetSquare[1] === "1") ? "q" : undefined;
        
        const expectedMove = solutionMovesRef.current[currentStepRef.current];

        if (moveStr !== expectedMove) {
            if (activeTab === "classic") {
                setStatus("failed");
                setStatusMsg("Incorrect move! Try another tactic.");
            } else {
                handleArcadeMoveFail();
            }
            return false;
        }

        try {
            const result = game.move({
                from: sourceSquare,
                to: targetSquare,
                promotion
            });

            if (!result) return false;

            setGameFen(game.fen());
            currentStepRef.current += 1;

            if (currentStepRef.current >= solutionMovesRef.current.length) {
                setStatus("passed");
                setStatusMsg("Perfect! Puzzle Solved.");
                
                if (activeTab !== "classic") {
                    setScore((prev) => prev + 1);
                    setTimeout(() => {
                        loadNewPuzzle();
                    }, 800);
                }
            } else {
                setStatusMsg("Correct! Opponent is responding...");
                setTimeout(() => {
                    const opponentMoveStr = solutionMovesRef.current[currentStepRef.current];
                    const from = opponentMoveStr.substring(0, 2);
                    const to = opponentMoveStr.substring(2, 4);
                    
                    game.move({ from, to });
                    setGameFen(game.fen());
                    currentStepRef.current += 1;
                    
                    setStatusMsg("Your turn again!");
                }, 600);
            }
            return true;
        } catch (err) {
            return false;
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-5xl justify-center px-4 py-4">
            
            {/* Top Mode Selector Tabs */}
            <div className="tabs tabs-boxed grid grid-cols-3 p-1 w-full max-w-md bg-base-200 border border-base-300 rounded-xl">
                <button
                    onClick={() => setActiveTab("classic")}
                    className={`tab text-xs font-bold rounded-lg transition-all ${activeTab === "classic" ? "tab-active bg-primary text-primary-content" : "text-slate-400"}`}
                >
                    Tactical Solver
                </button>
                <button
                    onClick={() => setActiveTab("rush")}
                    className={`tab text-xs font-bold rounded-lg transition-all ${activeTab === "rush" ? "tab-active bg-primary text-primary-content" : "text-slate-400"}`}
                >
                    Puzzle Rush
                </button>
                <button
                    onClick={() => setActiveTab("survival")}
                    className={`tab text-xs font-bold rounded-lg transition-all ${activeTab === "survival" ? "tab-active bg-primary text-primary-content" : "text-slate-400"}`}
                >
                    Survival Mode
                </button>
            </div>

            <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-8 w-full justify-center">
                
                {/* Left: Chess Board */}
                <div className="w-full max-w-md bg-base-200 rounded-xl p-4 border border-base-300 shadow-lg flex flex-col justify-center min-h-[400px]">
                    {activeTab !== "classic" && !gameActive && !showSummary ? (
                        <div className="text-center space-y-5 py-8">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">
                                {activeTab === "rush" ? "⚡" : "❤️"}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-black tracking-tight text-slate-100 uppercase font-mono">
                                    {activeTab === "rush" ? "Puzzle Rush" : "Puzzle Survival"}
                                </h3>
                                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                                    {activeTab === "rush"
                                        ? "Solve as many chess puzzles as possible in 3 minutes! 3 strikes and you are out."
                                        : "No timer. Solve puzzles progressively with 3 lives!"}
                                </p>
                            </div>
                            <div className="text-xs font-mono text-slate-400">
                                High Score: <span className="text-emerald-400 font-bold">{activeTab === "rush" ? highScoreRush : highScoreSurvival}</span>
                            </div>
                            <button onClick={startGame} className="btn btn-primary btn-sm font-bold px-6 normal-case">
                                Start Challenge
                            </button>
                        </div>
                    ) : showSummary ? (
                        <div className="text-center space-y-5 py-8">
                            <h3 className="text-lg font-black text-slate-100">Challenge Over</h3>
                            <div className="bg-base-100 border border-base-300 p-4 rounded-xl max-w-xs mx-auto grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[10px] font-mono uppercase font-bold text-slate-400">Solved</div>
                                    <div className="text-2xl font-black text-emerald-400">{score}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-mono uppercase font-bold text-slate-400">High Score</div>
                                    <div className="text-2xl font-black text-slate-200">
                                        {activeTab === "rush" ? highScoreRush : highScoreSurvival}
                                    </div>
                                </div>
                            </div>
                            <button onClick={startGame} className="btn btn-outline btn-sm font-bold border-base-300">
                                <IconRefresh size={14} /> Try Again
                            </button>
                        </div>
                    ) : loading ? (
                        <div className="flex flex-col items-center justify-center h-80">
                            <span className="loading loading-spinner loading-md text-primary"></span>
                        </div>
                    ) : (
                        <Chessboard
                            position={gameFen}
                            onPieceDrop={makeMove}
                            boardOrientation={boardOrientation}
                            customDarkSquareStyle={{ backgroundColor: boardTheme.dark }}
                            customLightSquareStyle={{ backgroundColor: boardTheme.light }}
                        />
                    )}
                </div>

                {/* Right: Info Panel & Controls */}
                <div className="w-full max-w-sm card bg-base-200 border border-base-300 p-5 justify-between space-y-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-base-300 pb-3">
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                <IconTarget size={14} className="text-emerald-400" />
                                {activeTab === "classic" ? "Tactical Solver" : activeTab === "rush" ? "Puzzle Rush" : "Survival"}
                            </span>
                            {puzzle && activeTab === "classic" && (
                                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    {puzzle.rating} ELO
                                </span>
                            )}
                        </div>

                        {activeTab !== "classic" && gameActive && (
                            <div className="grid grid-cols-3 gap-2 bg-base-100 border border-base-300 p-3 rounded-xl text-center">
                                <div>
                                    <div className="text-[9px] font-mono uppercase text-slate-500 font-bold">Solved</div>
                                    <div className="text-lg font-black text-emerald-400">{score}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-mono uppercase text-slate-500 font-bold">Time</div>
                                    <div className="text-lg font-black text-slate-200 font-mono">
                                        {formatTime(timeLeft)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-mono uppercase text-slate-500 font-bold">Lives</div>
                                    <div className="flex gap-1 justify-center mt-1">
                                        {[1, 2, 3].map((num) => (
                                            <IconHeart
                                                key={num}
                                                size={14}
                                                className={num <= 3 - strikes ? "text-rose-500 fill-rose-500" : "text-slate-600"}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {(!showSummary && (puzzle || statusMsg)) && (
                            <div className={`p-3 rounded-lg font-bold text-xs text-center border ${
                                status === "passed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                status === "failed" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-base-100 border-base-300 text-slate-300"
                            }`}>
                                {statusMsg}
                            </div>
                        )}

                        {puzzle?.theme && !showSummary && (
                            <div className="space-y-1">
                                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Tactical Tags</span>
                                <div className="flex gap-1 flex-wrap">
                                    {puzzle.theme.split(",").slice(0, 3).map((tag) => (
                                        <span key={tag} className="px-2 py-0.5 bg-base-100 border border-base-300 text-[10px] font-mono text-slate-400 rounded">
                                            {tag.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-2">
                        {activeTab === "classic" ? (
                            (status === "passed" || status === "failed") ? (
                                <button onClick={loadNewPuzzle} className="btn btn-primary w-full btn-sm font-bold normal-case">
                                    Next Tactical Puzzle ➡️
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setStatus("failed");
                                        setStatusMsg("Puzzle surrendered.");
                                    }}
                                    className="btn btn-outline btn-error w-full btn-sm font-bold border-base-300 normal-case"
                                    disabled={loading}
                                >
                                    Surrender Puzzle
                                </button>
                            )
                        ) : gameActive ? (
                            <button onClick={endGame} className="btn btn-outline btn-error w-full btn-sm font-bold border-base-300 normal-case">
                                End Challenge
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
