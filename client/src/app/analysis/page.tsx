"use client";

import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { evaluateBoard } from "@/lib/localEngine";
import { playSound, triggerHaptic } from "@/lib/audioEffects";
import { API_URL } from "@/config";
import {
    IconArrowLeft,
    IconArrowRight,
    IconRotateClockwise2,
    IconInfoCircle,
    IconDownload,
    IconUpload,
    IconBrush
} from "@tabler/icons-react";

const BOARD_THEMES = [
    { id: "emerald", name: "Emerald Green", dark: "#4b7399", light: "#eae9d2" },
    { id: "wood", name: "Walnut Wood", dark: "#b58863", light: "#f0d9b5" },
    { id: "glass", name: "Ice Blue", dark: "#5e81ac", light: "#eceff4" },
    { id: "slate", name: "Slate Dark", dark: "#475569", light: "#cbd5e1" },
    { id: "royal", name: "Royal Purple", dark: "#5b21b6", light: "#ede9fe" }
];

export default function AnalysisPage() {
    const [game, setGame] = useState<Chess>(new Chess());
    const [gameFen, setGameFen] = useState(game.fen());
    const [history, setHistory] = useState<any[]>([]);
    const [navIndex, setNavIndex] = useState<number>(-1);
    
    // Evaluation scores
    const [evalScore, setEvalScore] = useState<number>(0);
    
    // Setup inputs
    const [fenInput, setFenInput] = useState<string>("");
    
    // AI Explanations
    const [aiExplanation, setAiExplanation] = useState<string>("");
    const [aiLoading, setAiLoading] = useState<boolean>(false);
    
    // Visual Settings
    const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white");
    const [selectedTheme, setSelectedTheme] = useState(BOARD_THEMES[0]);
    
    // Selection/Dot highlights
    const [optionSquares, setOptionSquares] = useState<any>({});
    const [moveFrom, setMoveFrom] = useState<string>("");

    // Load theme setting from localStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("chessthan:boardTheme");
            if (saved) {
                const found = BOARD_THEMES.find(t => t.id === saved);
                if (found) setSelectedTheme(found);
            }
        }
    }, []);

    // Save theme setting to localStorage
    const handleThemeChange = (themeId: string) => {
        const theme = BOARD_THEMES.find(t => t.id === themeId);
        if (theme) {
            setSelectedTheme(theme);
            localStorage.setItem("chessthan:boardTheme", themeId);
        }
    };

    // Calculate real-time evaluation score
    useEffect(() => {
        const scoreVal = evaluateBoard(game);
        setEvalScore(scoreVal / 100);
    }, [gameFen]);

    // Setup board from FEN input
    const loadFen = () => {
        try {
            game.load(fenInput);
            setGameFen(game.fen());
            setHistory([]);
            setNavIndex(-1);
            setFenInput("");
            setOptionSquares({});
            setMoveFrom("");
            setAiExplanation("");
        } catch (e) {
            alert("Invalid FEN string.");
        }
    };

    // Move handlers
    const makeMove = (from: string, to: string): boolean => {
        try {
            const move = game.move({
                from,
                to,
                promotion: "q"
            });

            if (move === null) return false;

            // Audio & Haptics
            if (move.captured) {
                playSound("capture");
                triggerHaptic("capture");
            } else if (game.inCheck()) {
                playSound("check");
                triggerHaptic("check");
            } else {
                playSound("move");
                triggerHaptic("move");
            }

            setGameFen(game.fen());
            setHistory(game.history({ verbose: true }));
            setNavIndex(game.history().length - 1);
            setAiExplanation("");
            return true;
        } catch (e) {
            return false;
        }
    };

    const onDrop = (sourceSquare: string, targetSquare: string): boolean => {
        const success = makeMove(sourceSquare, targetSquare);
        if (success) {
            setMoveFrom("");
            setOptionSquares({});
        }
        return success;
    };

    // Tap-to-move Available Dots logic
    const getPossibleMoves = (square: string) => {
        const moves = game.moves({
            square: square as any,
            verbose: true
        });
        if (moves.length === 0) {
            setOptionSquares({});
            return false;
        }

        const newSquares: any = {};
        newSquares[square] = {
            background: "rgba(255, 255, 0, 0.3)"
        };

        moves.forEach((move: any) => {
            newSquares[move.to] = {
                background: game.get(move.to)
                    ? "radial-gradient(circle, rgba(239, 68, 68, 0.4) 80%, transparent 80%)"
                    : "radial-gradient(circle, rgba(0, 0, 0, 0.25) 25%, transparent 25%)",
                borderRadius: "50%"
            };
        });

        setOptionSquares(newSquares);
        return true;
    };

    const onSquareClick = (square: string) => {
        if (moveFrom) {
            const legalMove = game.moves({ square: moveFrom as any, verbose: true })
                .find(m => m.from === moveFrom && m.to === square);

            if (legalMove) {
                const success = makeMove(moveFrom, square);
                if (success) {
                    setMoveFrom("");
                    setOptionSquares({});
                    return;
                }
            }
        }

        const piece = game.get(square as any);
        if (piece && piece.color === game.turn()) {
            setMoveFrom(square);
            getPossibleMoves(square);
        } else {
            setMoveFrom("");
            setOptionSquares({});
        }
    };

    // Navigate history steps
    const navigateHistory = (index: number) => {
        if (index < -1 || index >= history.length) return;
        
        const tempGame = new Chess();
        for (let i = 0; i <= index; i++) {
            tempGame.move(history[i].san);
        }
        
        setNavIndex(index);
        setGameFen(tempGame.fen());
        setOptionSquares({});
        setMoveFrom("");
    };

    // Trigger AI coach description
    const explainActivePosition = async () => {
        if (history.length === 0) return;
        
        setAiLoading(true);
        setAiExplanation("");
        try {
            // Explains last played move
            const lastMove = history[history.length - 1];
            
            // Re-traverse FEN before that move
            const prevGame = new Chess();
            for (let i = 0; i < history.length - 1; i++) {
                prevGame.move(history[i].san);
            }
            const fenBefore = prevGame.fen();
            const fenAfter = game.fen();

            const res = await fetch(`${API_URL}/v1/games/explain-move`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fenBefore,
                    fenAfter,
                    move: lastMove.san
                })
            });

            if (res.ok) {
                const data = await res.json();
                setAiExplanation(data.explanation || "No explanation provided.");
            } else {
                setAiExplanation("AI Coach currently busy. Please try again in a moment.");
            }
        } catch (e) {
            setAiExplanation("Failed to connect to AI Coach. Check server status.");
        } finally {
            setAiLoading(false);
        }
    };

    // Reset board
    const resetAnalysis = () => {
        const fresh = new Chess();
        setGame(fresh);
        setGameFen(fresh.fen());
        setHistory([]);
        setNavIndex(-1);
        setOptionSquares({});
        setMoveFrom("");
        setAiExplanation("");
    };

    // Highlight king check
    const findKingSquare = (color: "w" | "b") => {
        const temp = new Chess(gameFen);
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = temp.board()[r][c];
                if (piece && piece.type === "k" && piece.color === color) {
                    const cols = ["a", "b", "c", "d", "e", "f", "g", "h"];
                    return `${cols[c]}${8 - r}`;
                }
            }
        }
        return null;
    };

    const getBoardStyles = () => {
        const styles = { ...optionSquares };
        const temp = new Chess(gameFen);
        if (temp.inCheck()) {
            const kingSquare = findKingSquare(temp.turn());
            if (kingSquare) {
                styles[kingSquare] = {
                    ...styles[kingSquare],
                    background: "radial-gradient(circle, rgba(239, 68, 68, 0.6) 100%, transparent 100%)",
                    boxShadow: "inset 0 0 16px #ef4444"
                } as any;
            }
        }
        return styles;
    };

    // Normalize eval height (between 0% and 100%)
    // score range: -8 (fully black) to +8 (fully white)
    const scoreVal = Math.max(-8, Math.min(evalScore, 8));
    const evalPercent = ((scoreVal + 8) / 16) * 100;
    const formattedScore = evalScore > 0 ? `+${evalScore.toFixed(1)}` : evalScore.toFixed(1);

    return (
        <div className="flex flex-col lg:flex-row items-stretch gap-8 w-full max-w-5xl justify-center p-4">
            
            {/* Left section: Evaluation bar & Chessboard */}
            <div className="flex-1 flex flex-col items-center">
                
                {/* Board header */}
                <div className="w-full flex items-center justify-between bg-base-200 border border-base-300 p-3 rounded-t-xl mb-1 text-xs">
                    <span className="font-bold flex items-center gap-1">
                        <span className="badge badge-primary badge-xs">Evaluation</span>
                        {formattedScore}
                    </span>
                    
                    {/* Theme selector */}
                    <div className="flex items-center gap-1">
                        <IconBrush size={14} className="text-base-content/40" />
                        <select
                            className="select select-ghost select-xs text-[10px] font-bold py-0"
                            value={selectedTheme.id}
                            onChange={(e) => handleThemeChange(e.target.value)}
                        >
                            {BOARD_THEMES.map(theme => (
                                <option key={theme.id} value={theme.id}>
                                    {theme.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Eval Bar + Chessboard Row */}
                <div className="w-full flex gap-3 h-[460px] max-w-[460px] lg:max-w-none">
                    
                    {/* Evaluation Bar */}
                    <div className="w-5 bg-black border border-base-300 rounded-lg overflow-hidden flex flex-col relative h-full shrink-0">
                        {/* White advantages filling from top */}
                        <div
                            className="bg-white transition-all duration-300 ease-out w-full"
                            style={{ height: `${evalPercent}%` }}
                        />
                        <div className="flex-1 bg-black w-full" />
                        
                        {/* Score Indicator Overlay */}
                        <div
                            className={`absolute inset-x-0 text-[9px] font-black text-center select-none py-0.5 ${
                                evalScore >= 0 ? "bottom-2 text-black" : "top-2 text-white"
                            }`}
                        >
                            {Math.abs(evalScore) > 9 ? "M" : Math.abs(evalScore).toFixed(0)}
                        </div>
                    </div>

                    {/* Chessboard */}
                    <div className="flex-1 shadow-2xl rounded-lg overflow-hidden bg-base-100 border border-base-300">
                        <Chessboard
                            position={gameFen}
                            onPieceDrop={onDrop}
                            onSquareClick={onSquareClick}
                            boardOrientation={boardOrientation}
                            customSquareStyles={getBoardStyles()}
                            customDarkSquareStyle={{ backgroundColor: selectedTheme.dark }}
                            customLightSquareStyle={{ backgroundColor: selectedTheme.light }}
                            customBoardStyle={{ borderRadius: "0.5rem" }}
                        />
                    </div>
                </div>

                {/* Sub-board controls */}
                <div className="w-full max-w-[460px] flex items-center justify-between bg-base-200 border border-base-300 rounded-b-xl mt-1 p-2">
                    <div className="flex gap-1">
                        <button
                            onClick={() => navigateHistory(-1)}
                            className="btn btn-ghost btn-xs"
                            disabled={navIndex <= -1}
                        >
                            <IconArrowLeft size={16} /> First
                        </button>
                        <button
                            onClick={() => navigateHistory(navIndex - 1)}
                            className="btn btn-ghost btn-xs"
                            disabled={navIndex <= -1}
                        >
                            Back
                        </button>
                    </div>

                    <button
                        onClick={() => setBoardOrientation(boardOrientation === "white" ? "black" : "white")}
                        className="btn btn-ghost btn-xs gap-1"
                    >
                        <IconRotateClockwise2 size={14} /> Flip
                    </button>

                    <div className="flex gap-1">
                        <button
                            onClick={() => navigateHistory(navIndex + 1)}
                            className="btn btn-ghost btn-xs"
                            disabled={navIndex >= history.length - 1}
                        >
                            Next
                        </button>
                        <button
                            onClick={() => navigateHistory(history.length - 1)}
                            className="btn btn-ghost btn-xs"
                            disabled={navIndex >= history.length - 1}
                        >
                            Last <IconArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Right section: Setup tools & AI Coach */}
            <div className="w-full max-w-sm flex flex-col gap-6">
                
                {/* Setup Tools Card */}
                <div className="card bg-base-100 border border-base-300 shadow-xl">
                    <div className="card-body p-5">
                        <h2 className="card-title text-sm font-bold flex items-center gap-1.5 mb-2">
                            ⚙️ Analysis Tools
                        </h2>
                        
                        {/* FEN Paste Form */}
                        <div className="space-y-3">
                            <div>
                                <label className="label label-text py-0.5 text-[10px] font-semibold uppercase tracking-wider text-base-content/50">
                                    Load FEN Position
                                </label>
                                <div className="join w-full">
                                    <input
                                        type="text"
                                        placeholder="rnbqkbnr/pppppppp/8/..."
                                        className="input input-bordered input-xs join-item flex-1 text-xs"
                                        value={fenInput}
                                        onChange={(e) => setFenInput(e.target.value)}
                                    />
                                    <button onClick={loadFen} className="btn btn-primary btn-xs join-item font-bold">
                                        <IconUpload size={12} /> Load
                                    </button>
                                </div>
                            </div>

                            {/* Export PGN */}
                            <div>
                                <label className="label label-text py-0.5 text-[10px] font-semibold uppercase tracking-wider text-base-content/50">
                                    Export PGN
                                </label>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(game.pgn() || "No moves made.");
                                        alert("PGN history copied to clipboard!");
                                    }}
                                    className="btn btn-neutral btn-xs w-full font-bold flex items-center gap-1"
                                >
                                    <IconDownload size={12} /> Copy PGN History
                                </button>
                            </div>

                            <button onClick={resetAnalysis} className="btn btn-outline btn-xs w-full mt-2 text-error hover:bg-error/20 hover:text-error">
                                🔄 Clear Board
                            </button>
                        </div>
                    </div>
                </div>

                {/* AI Coach Assistant Card */}
                <div className="card bg-base-100 border border-base-300 shadow-xl flex-1">
                    <div className="card-body p-5 flex flex-col">
                        <h2 className="card-title text-sm font-bold flex items-center gap-1.5 mb-2">
                            👨‍🏫 AI Analysis Coach
                        </h2>
                        
                        <div className="text-[10px] text-base-content/60 mb-4">
                            Move pieces on the board, then click the button below to request a detailed strategic breakdown of the position.
                        </div>

                        {/* Explanation viewport */}
                        <div className="flex-1 h-44 overflow-y-auto bg-base-200 border border-base-300 rounded-xl p-3 text-[11px] font-medium leading-relaxed mb-4">
                            {aiLoading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-2">
                                    <span className="loading loading-spinner loading-sm text-primary"></span>
                                    <span className="text-[9px] text-base-content/40 uppercase tracking-widest font-black">AI is thinking...</span>
                                </div>
                            ) : aiExplanation ? (
                                <div className="space-y-2 animate__animated animate__fadeIn">
                                    <div className="badge badge-primary badge-xs">Coach Recommendation</div>
                                    <p className="text-base-content/80">{aiExplanation}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-base-content/30 text-center px-4">
                                    <IconInfoCircle size={28} className="mb-1" />
                                    <span>Make a move and click &apos;Explain Position&apos; to receive coach insights.</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={explainActivePosition}
                            className="btn btn-primary btn-sm w-full font-bold"
                            disabled={history.length === 0 || aiLoading}
                        >
                            💡 Explain Position
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
