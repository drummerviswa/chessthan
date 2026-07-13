"use client";

import { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { API_URL } from "@/config";
import {
    IconHeart,
    IconHourglass,
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
    const [timeLeft, setTimeLeft] = useState(180); // 3 minutes for Rush
    const [highScoreRush, setHighScoreRush] = useState(0);
    const [highScoreSurvival, setHighScoreSurvival] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    
    // Track solution progress
    const solutionMovesRef = useRef<string[]>([]);
    const currentStepRef = useRef(0);
    const ratingChangeRef = useRef<number | null>(null);
    const userPuzzleRatingRef = useRef<number>(1200);
    const timerRef = useRef<any>(null);

    // Load high scores on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            setHighScoreRush(Number(localStorage.getItem("hs_rush") || "0"));
            setHighScoreSurvival(Number(localStorage.getItem("hs_survival") || "0"));
        }
    }, []);

    // Timer effect for Puzzle Rush
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

        // Update high scores
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
            const res = await fetch(`${API_URL}/v1/puzzles/random`, {
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to fetch puzzle");
            const data: Puzzle = await res.json();
            
            const chess = new Chess(data.fen);
            setPuzzle(data);
            setGame(chess);
            setGameFen(chess.fen());
            
            // Set orientation based on side to move
            const sideToMove = chess.turn() === "w" ? "white" : "black";
            setBoardOrientation(sideToMove);
            setStatusMsg(`${sideToMove.toUpperCase()} to move and win!`);

            // Parse solution moves (split comma)
            solutionMovesRef.current = data.moves.split(",");
            currentStepRef.current = 0;
        } catch (err) {
            console.error("Error loading puzzle:", err);
            setStatusMsg("Could not load a puzzle. Please reload.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "classic") {
            loadNewPuzzle();
        } else {
            // Reset state when switching away from classic
            setGameActive(false);
            setShowSummary(false);
            setPuzzle(null);
            setGame(null);
        }
    }, [activeTab]);

    const submitResult = async (solved: boolean) => {
        if (activeTab !== "classic") return; // No rating updates for arcade modes
        if (!puzzle) return;
        try {
            const res = await fetch(`${API_URL}/v1/puzzles/${puzzle.id}/solve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ solved }),
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                ratingChangeRef.current = data.ratingChange;
                userPuzzleRatingRef.current = data.newRating;
            }
        } catch (e) {
            console.error("Failed to submit puzzle rating:", e);
        }
    };

    const handleArcadeMoveFail = () => {
        const nextStrikes = strikes + 1;
        setStrikes(nextStrikes);
        
        if (nextStrikes >= 3) {
            setStatus("failed");
            setStatusMsg("3 Strikes! Game over.");
            endGame();
        } else {
            setStatus("failed");
            setStatusMsg(`Incorrect move! Strike ${nextStrikes}/3`);
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

        // 1. Validate if player's move matches expected UCI move string
        if (moveStr !== expectedMove) {
            if (activeTab === "classic") {
                setStatus("failed");
                setStatusMsg("Incorrect move! Try another puzzle.");
                submitResult(false);
            } else {
                handleArcadeMoveFail();
            }
            return false;
        }

        // 2. Play the move on local board
        try {
            const result = game.move({
                from: sourceSquare,
                to: targetSquare,
                promotion
            });

            if (!result) return false;

            setGameFen(game.fen());
            currentStepRef.current += 1;

            // 3. Check if puzzle is fully solved
            if (currentStepRef.current >= solutionMovesRef.current.length) {
                setStatus("passed");
                setStatusMsg("Perfect! Puzzle Solved.");
                
                if (activeTab === "classic") {
                    submitResult(true);
                } else {
                    setScore((prev) => prev + 1);
                    setTimeout(() => {
                        loadNewPuzzle();
                    }, 800);
                }
            } else {
                // 4. Play opponent response after a short delay
                setStatusMsg("Correct! Opponent is thinking...");
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
            console.error("Move processing error:", err);
            return false;
        }
    };

    // Format time (e.g. 180 -> 3:00)
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-5xl justify-center px-4 py-4">
            
            {/* Top Mode Selector Tabs */}
            <div className="tabs tabs-boxed grid grid-cols-3 p-1 w-full max-w-md">
                <button
                    onClick={() => setActiveTab("classic")}
                    className={`tab text-xs ${activeTab === "classic" ? "tab-active font-bold" : ""}`}
                >
                    🧩 Classic
                </button>
                <button
                    onClick={() => setActiveTab("rush")}
                    className={`tab text-xs ${activeTab === "rush" ? "tab-active font-bold" : ""}`}
                >
                    ⚡ Puzzle Rush
                </button>
                <button
                    onClick={() => setActiveTab("survival")}
                    className={`tab text-xs ${activeTab === "survival" ? "tab-active font-bold" : ""}`}
                >
                    ❤️ Survival
                </button>
            </div>

            <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-8 w-full justify-center">
                
                {/* Left: Interactive Chess Board / Start Panels */}
                <div className="w-full max-w-md bg-base-100 rounded-xl p-4 border border-base-300 shadow-lg flex flex-col justify-center min-h-[400px]">
                    
                    {/* Mode Start Trigger Cards */}
                    {activeTab !== "classic" && !gameActive && !showSummary ? (
                        <div className="text-center space-y-6 py-8">
                            <span className="text-5xl block animate-bounce">
                                {activeTab === "rush" ? "⚡" : "❤️"}
                            </span>
                            <div className="space-y-2">
                                <h3 className="text-xl font-extrabold uppercase tracking-wider">
                                    {activeTab === "rush" ? "Puzzle Rush" : "Puzzle Survival"}
                                </h3>
                                <p className="text-xs text-base-content/60 max-w-xs mx-auto">
                                    {activeTab === "rush"
                                        ? "Solve as many chess puzzles as possible in 3 minutes! 3 strikes and you are out."
                                        : "No timer. Solve puzzles progressively, but be careful: you only have 3 lives!"}
                                </p>
                            </div>
                            <div className="text-xs font-semibold text-base-content/50">
                                Personal High Score: {activeTab === "rush" ? highScoreRush : highScoreSurvival}
                            </div>
                            <button onClick={startGame} className="btn btn-primary w-48 btn-md normal-case">
                                Start Challenge
                            </button>
                        </div>
                    ) : showSummary ? (
                        /* Game Over Summary card */
                        <div className="text-center space-y-6 py-8">
                            <span className="text-5xl block">🏆</span>
                            <div className="space-y-1">
                                <h3 className="text-xl font-extrabold text-error">Challenge Over!</h3>
                                <p className="text-xs text-base-content/60">Here is your summary</p>
                            </div>

                            <div className="bg-base-200 border border-base-300 p-4 rounded-xl max-w-xs mx-auto grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-base-content/50">Puzzles Solved</div>
                                    <div className="text-3xl font-black text-primary">{score}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-base-content/50">High Score</div>
                                    <div className="text-3xl font-black text-accent">
                                        {activeTab === "rush" ? highScoreRush : highScoreSurvival}
                                    </div>
                                </div>
                            </div>

                            <button onClick={startGame} className="btn btn-neutral btn-sm w-44">
                                <IconRefresh size={14} /> Try Again
                            </button>
                        </div>
                    ) : loading ? (
                        <div className="flex flex-col items-center justify-center h-96">
                            <span className="loading loading-spinner loading-lg text-primary"></span>
                            <div className="text-sm mt-3 text-base-content/50">Loading chess tactics...</div>
                        </div>
                    ) : (
                        <div className="relative">
                            <Chessboard
                                position={gameFen}
                                onPieceDrop={makeMove}
                                boardOrientation={boardOrientation}
                                customBoardStyle={{
                                    borderRadius: "8px",
                                    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.2)"
                                }}
                                customDarkSquareStyle={{ backgroundColor: "#4b7399" }}
                                customLightSquareStyle={{ backgroundColor: "#eae9d2" }}
                            />
                        </div>
                    )}
                </div>

                {/* Right: Info Panel & Scoreboards */}
                <div className="w-full max-w-sm card bg-base-100 border border-base-300 shadow-xl p-6 justify-between">
                    <div className="space-y-4">
                        <h2 className="card-title text-xl font-bold flex items-center justify-between border-b border-base-300 pb-2">
                            <span className="flex items-center gap-1.5">
                                <IconTarget className="text-primary" /> 
                                {activeTab === "classic" ? "Tactical Trainer" : activeTab === "rush" ? "Puzzle Rush" : "Survival Mode"}
                            </span>
                            {puzzle && activeTab === "classic" && (
                                <span className="badge badge-neutral text-xs">Rating: {puzzle.rating}</span>
                            )}
                        </h2>

                        {/* Arcade statistics dashboard (Rush / Survival) */}
                        {activeTab !== "classic" && gameActive && (
                            <div className="grid grid-cols-3 gap-2 bg-base-200 border border-base-300 p-3 rounded-xl text-center">
                                <div>
                                    <div className="text-[9px] uppercase font-bold text-base-content/40">Solved</div>
                                    <div className="text-xl font-black text-primary">{score}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] uppercase font-bold text-base-content/40">
                                        {activeTab === "rush" ? "Timer" : "Status"}
                                    </div>
                                    <div className="text-xl font-black text-accent flex items-center justify-center gap-1">
                                        {activeTab === "rush" ? (
                                            <>
                                                <IconHourglass size={14} /> {formatTime(timeLeft)}
                                            </>
                                        ) : (
                                            "Active"
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[9px] uppercase font-bold text-base-content/40">Strikes</div>
                                    <div className="flex gap-0.5 justify-center mt-1">
                                        {[1, 2, 3].map((num) => (
                                            <IconHeart
                                                key={num}
                                                size={14}
                                                className={num <= 3 - strikes ? "text-error fill-error animate-pulse" : "text-base-content/30"}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Status banner */}
                        {(!showSummary && (puzzle || statusMsg)) && (
                            <div className={`alert text-center py-2.5 rounded-lg font-bold text-xs ${
                                status === "passed" ? "alert-success text-success-content bg-success/10 border border-success/20" :
                                status === "failed" ? "alert-error text-error-content bg-error/10 border border-error/20" : "bg-base-200"
                            }`}>
                                {statusMsg}
                            </div>
                        )}

                        {/* Classic rating updates logs */}
                        {activeTab === "classic" && ratingChangeRef.current !== null && (
                            <div className="text-center p-3 rounded-lg bg-base-300 border border-base-200">
                                <div className="text-xs uppercase font-bold text-base-content/50">New Rating</div>
                                <div className="text-2xl font-extrabold flex items-center justify-center gap-2">
                                    <span>{userPuzzleRatingRef.current}</span>
                                    <span className={ratingChangeRef.current >= 0 ? "text-success text-sm" : "text-error text-sm"}>
                                        {ratingChangeRef.current >= 0 ? `+${ratingChangeRef.current}` : ratingChangeRef.current}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Puzzle theme tags */}
                        {puzzle?.theme && !showSummary && (
                            <div>
                                <span className="text-[9px] uppercase font-bold text-base-content/40 block mb-1">Theme Tags</span>
                                <div className="flex gap-1 flex-wrap">
                                    {puzzle.theme.split(",").slice(0, 3).map((tag) => (
                                        <span key={tag} className="badge badge-sm badge-ghost text-[9px] py-1">
                                            🏷️ {tag.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action controls */}
                    <div className="card-actions flex flex-col gap-2 mt-6">
                        {activeTab === "classic" ? (
                            (status === "passed" || status === "failed") ? (
                                <button onClick={loadNewPuzzle} className="btn btn-primary w-full btn-sm normal-case">
                                    Next Puzzle ➡️
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setStatus("failed");
                                        setStatusMsg("Puzzle failed.");
                                        submitResult(false);
                                    }}
                                    className="btn btn-error btn-outline w-full btn-sm normal-case"
                                    disabled={loading}
                                >
                                    Give Up 🏳️
                                </button>
                            )
                        ) : gameActive ? (
                            <button onClick={endGame} className="btn btn-error btn-outline w-full btn-sm normal-case">
                                Quit Challenge 🏳️
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
