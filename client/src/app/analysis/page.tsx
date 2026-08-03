"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { evaluateBoard } from "@/lib/localEngine";
import { playSound, triggerHaptic } from "@/lib/audioEffects";
import { getOpeningName } from "@/lib/openingExplorer";
import { API_URL } from "@/config";
import {
    IconArrowLeft,
    IconRotateClockwise2,
    IconArrowRight,
    IconInfoCircle,
    IconDownload,
    IconUpload,
    IconBrush,
    IconSparkles,
    IconSettings,
    IconRotateClockwise,
    IconSchool
} from "@tabler/icons-react";

const BOARD_THEMES = [
    { id: "emerald", name: "Emerald Green", dark: "#0e4a3b", light: "#eeeddf" },
    { id: "wood", name: "Walnut Wood", dark: "#b58863", light: "#f0d9b5" },
    { id: "glass", name: "Ice Blue", dark: "#5e81ac", light: "#eceff4" },
    { id: "slate", name: "Slate Dark", dark: "#475569", light: "#cbd5e1" },
    { id: "royal", name: "Royal Purple", dark: "#5b21b6", light: "#ede9fe" }
];

const fetchStockfishCloudLines = async (fen: string): Promise<{ score: number | null, pvs: any[] }> => {
    try {
        const res = await fetch(`https://eval.lichess.org/api?fen=${encodeURIComponent(fen)}`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.pvs) {
                let score: number | null = null;
                if (data.pvs.length > 0) {
                    const bestPv = data.pvs[0];
                    score = bestPv.mate !== undefined ? (bestPv.mate > 0 ? 99 : -99) : (bestPv.cp !== undefined ? bestPv.cp / 100 : 0);
                }
                const formattedPvs = data.pvs.map((pv: any) => ({
                    ...pv,
                    moves: typeof pv.moves === "string" ? pv.moves.split(" ") : (pv.moves || [])
                }));
                return { score, pvs: formattedPvs };
            }
        }
    } catch (err) {
        console.error("Cloud Stockfish Lichess fetch error, trying proxy fallback:", err);
    }

    // Backend proxy fallback
    try {
        const proxyRes = await fetch(`${API_URL}/v1/games/stockfish?fen=${encodeURIComponent(fen)}`);
        if (proxyRes.ok) {
            const data = await proxyRes.json();
            if (data && data.pvs) return data;
        }
    } catch (e) {
        console.error("Stockfish proxy error:", e);
    }

    return { score: null, pvs: [] };
};

const fetchStockfishOnlineLines = async (fen: string): Promise<{ score: number | null, pvs: any[] }> => {
    try {
        const res = await fetch(`https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.success) {
                let score: number | null = null;
                if (data.mate !== null && data.mate !== undefined) {
                    score = data.mate > 0 ? 99 : -99;
                } else if (data.evaluation !== null && data.evaluation !== undefined) {
                    score = data.evaluation;
                }
                
                let moves: string[] = [];
                if (typeof data.data === "string") {
                    const parts = data.data.split(" ");
                    moves = parts.filter((p: string) => p !== "bestmove" && p !== "ponder" && p.length >= 4);
                }

                const pvs = [{
                    cp: score !== null ? Math.round(score * 100) : 0,
                    mate: data.mate ?? undefined,
                    moves
                }];
                return { score, pvs };
            }
        }
    } catch (err) {
        console.error("Cloud Stockfish Online API fetch error, trying proxy fallback:", err);
    }

    // Backend proxy fallback
    try {
        const proxyRes = await fetch(`${API_URL}/v1/games/stockfish?fen=${encodeURIComponent(fen)}`);
        if (proxyRes.ok) {
            const data = await proxyRes.json();
            if (data && data.pvs) return data;
        }
    } catch (e) {
        console.error("Stockfish proxy error:", e);
    }

    return { score: null, pvs: [] };
};

function AnalysisBoardComponent() {
    const [game, setGame] = useState<Chess>(new Chess());
    const [gameFen, setGameFen] = useState(game.fen());
    const [history, setHistory] = useState<any[]>([]);
    const [navIndex, setNavIndex] = useState<number>(-1);
    
    // Evaluation scores
    const [evalScore, setEvalScore] = useState<number>(0);
    const [evalLines, setEvalLines] = useState<any[]>([]);
    const [engineMode, setEngineMode] = useState<"local" | "stockfish" | "stockfish-online">("local");
    const [isCloudLoading, setIsCloudLoading] = useState<boolean>(false);

    const getEngineArrows = () => {
        if (!evalLines || evalLines.length === 0) return [];
        const colors = [
            "rgba(34, 197, 94, 0.8)",  // Green for line #1
            "rgba(56, 189, 248, 0.7)", // Blue for line #2
            "rgba(249, 115, 22, 0.6)"  // Orange for line #3
        ];
        
        return evalLines.slice(0, 3).map((pv, idx) => {
            if (!pv || !pv.moves) return null;
            const movesArr = typeof pv.moves === "string" ? pv.moves.split(" ") : pv.moves;
            if (!Array.isArray(movesArr) || movesArr.length === 0) return null;
            const uciMove = movesArr[0];
            if (typeof uciMove !== "string" || uciMove.length < 4) return null;
            const from = uciMove.slice(0, 2);
            const to = uciMove.slice(2, 4);
            return [from, to, colors[idx]];
        }).filter(Boolean) as [string, string, string][];
    };
    
    // Openings explorer state
    const [currentOpening, setCurrentOpening] = useState<any>(null);

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

    const searchParams = useSearchParams();
    const pgnParam = searchParams.get("pgn");

    // Load PGN from query parameter if present
    useEffect(() => {
        if (pgnParam) {
            try {
                const decodedPgn = decodeURIComponent(pgnParam);
                const temp = new Chess();
                temp.loadPgn(decodedPgn);
                setGame(temp);
                setGameFen(temp.fen());
                setHistory(temp.history({ verbose: true }));
                setNavIndex(temp.history().length - 1);
            } catch (e) {
                console.error("Failed to load PGN from URL param:", e);
            }
        }
    }, [pgnParam]);

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

function generateClientHeuristicExplanation(move: string, g: Chess): string {
    const isCheck = g.inCheck();
    const isMate = g.isCheckmate();
    if (isMate) return `Brilliant checkmate delivery with ${move}! Game over!`;
    if (isCheck) return `The move ${move} delivers direct check, forcing the defending king to respond.`;
    if (move.includes("x")) return `By playing ${move}, you capture material and disrupt defender structure.`;
    if (move.startsWith("N")) return `Developing knight ${move} controls d4/e4/d5/e5 and increases piece coordination.`;
    if (move.startsWith("B")) return `Developing bishop ${move} opens a long diagonal against the opponent's camp.`;
    if (move.startsWith("R") || move.startsWith("O-O")) return `Castling or rook activation ${move} connects rooks and protects king safety.`;
    if (move.startsWith("Q")) return `Queen maneuver ${move} activates the most powerful piece on the board.`;
    return `The move ${move} claims central space and opens lines of development.`;
}

function generateLocalEngineLines(g: Chess): Array<{ cp: number; moves: string[] }> {
    const moves = g.moves({ verbose: true });
    if (moves.length === 0) return [];
    
    const lines = moves.slice(0, 3).map(m => {
        const temp = new Chess(g.fen());
        temp.move(m.san);
        const cp = evaluateBoard(temp);
        const uciMove = m.from + m.to + (m.promotion || "");
        const nextMoves = temp.moves({ verbose: true }).slice(0, 4).map(n => n.from + n.to + (n.promotion || ""));
        return {
            cp: g.turn() === "w" ? cp : -cp,
            moves: [uciMove, ...nextMoves]
        };
    });

    return lines.sort((a, b) => b.cp - a.cp);
}


    // Calculate real-time evaluation score & best lines
    useEffect(() => {
        if (engineMode === "local") {
            const scoreVal = evaluateBoard(game);
            setEvalScore(scoreVal / 100);
            setEvalLines(generateLocalEngineLines(game));
        } else if (engineMode === "stockfish") {
            setIsCloudLoading(true);
            fetchStockfishCloudLines(gameFen).then(({ score, pvs }) => {
                if (score !== null) {
                    setEvalScore(score);
                } else {
                    const scoreVal = evaluateBoard(game);
                    setEvalScore(scoreVal / 100);
                }
                setEvalLines(pvs && pvs.length > 0 ? pvs : generateLocalEngineLines(game));
                setIsCloudLoading(false);
            });
        } else if (engineMode === "stockfish-online") {
            setIsCloudLoading(true);
            fetchStockfishOnlineLines(gameFen).then(({ score, pvs }) => {
                if (score !== null) {
                    setEvalScore(score);
                } else {
                    const scoreVal = evaluateBoard(game);
                    setEvalScore(scoreVal / 100);
                }
                setEvalLines(pvs && pvs.length > 0 ? pvs : generateLocalEngineLines(game));
                setIsCloudLoading(false);
            });
        }
    }, [gameFen, engineMode]);

    // Track active opening book name and statistics
    useEffect(() => {
        const sanHistory = history.slice(0, navIndex + 1).map(h => h.san);
        const match = getOpeningName(sanHistory);
        setCurrentOpening(match);
    }, [navIndex, history]);

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

    // Keyboard Navigation Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: any) => {
            if (
                document.activeElement?.tagName === "INPUT" ||
                document.activeElement?.tagName === "TEXTAREA"
            ) {
                return;
            }

            if (e.key === "ArrowLeft") {
                e.preventDefault();
                navigateHistory(navIndex - 1);
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                navigateHistory(navIndex + 1);
            } else if (e.key === " ") {
                e.preventDefault();
                setBoardOrientation((prev) => prev === "white" ? "black" : "white");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [navIndex, history, boardOrientation]);

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
                if (data.explanation && !data.explanation.includes("Sorry, I could not generate")) {
                    setAiExplanation(data.explanation);
                } else {
                    setAiExplanation(generateClientHeuristicExplanation(lastMove.san, game));
                }
            } else {
                setAiExplanation(generateClientHeuristicExplanation(lastMove.san, game));
            }
        } catch (e) {
            setAiExplanation(history.length ? generateClientHeuristicExplanation(history[history.length - 1].san, game) : "Select a position to analyze.");
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
        <div className="flex flex-col lg:flex-row items-start lg:justify-center gap-8 w-full max-w-5xl p-4">
            
            {/* Left section: Evaluation bar & Chessboard */}
            <div className="w-full max-w-[480px] flex flex-col items-center mx-auto lg:mx-0 shrink-0">
                
                {/* Board header */}
                <div className="w-full flex items-center justify-between bg-base-200 border border-base-300 p-3 rounded-t-xl mb-1 text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                        <span className="badge badge-primary badge-xs">Evaluation</span>
                        {isCloudLoading ? (
                            <span className="loading loading-spinner w-3 h-3 text-primary"></span>
                        ) : (
                            <span>{formattedScore}</span>
                        )}
                    </span>
                    
                    <div className="flex items-center gap-3">
                        {/* Engine Selector */}
                        <div className="flex items-center gap-1">
                            <span className="text-[9px] uppercase font-extrabold text-base-content/50">Engine:</span>
                             <select
                                 className="select select-bordered select-xs text-[9px] font-bold py-0 h-6 min-h-6 rounded-lg bg-base-100"
                                 value={engineMode}
                                 onChange={(e: any) => setEngineMode(e.target.value)}
                             >
                                 <option value="local">🤖 Local Minimax</option>
                                 <option value="stockfish">⚡ Lichess Cloud</option>
                                 <option value="stockfish-online">🌐 Stockfish.online API</option>
                             </select>
                        </div>

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
                </div>

                {/* Eval Bar + Chessboard Row */}
                <div className="w-full flex gap-3 aspect-square mb-1">
                    
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
                            customArrows={getEngineArrows() as any}
                        />
                    </div>
                </div>

                {/* Sub-board controls */}
                <div className="w-full flex items-center justify-between bg-base-200 border border-base-300 rounded-b-xl p-2">
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
            <div className="w-full max-w-sm flex flex-col justify-between gap-4">
                
                {/* Section: Opening Book Explorer */}
                {currentOpening ? (
                    <div className="card bg-base-100 border border-base-300 shadow-xl animate__animated animate__fadeIn shrink-0">
                        <div className="card-body p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/40">Opening Book</span>
                                <span className="badge badge-accent badge-sm font-bold text-[10px] max-w-[200px] truncate">{currentOpening.name}</span>
                            </div>
                            
                            {/* Win-rate bar graph */}
                            <div className="space-y-1.5">
                                <div className="flex h-4 w-full rounded-full overflow-hidden text-[9px] font-bold text-center text-white select-none">
                                    <div className="bg-slate-300 text-slate-800 flex items-center justify-center shrink-0" style={{ width: `${currentOpening.stats.white}%` }}>
                                        {currentOpening.stats.white}% W
                                    </div>
                                    <div className="bg-slate-500 text-slate-100 flex items-center justify-center shrink-0" style={{ width: `${currentOpening.stats.draw}%` }}>
                                        {currentOpening.stats.draw}% D
                                    </div>
                                    <div className="bg-slate-800 text-slate-200 flex items-center justify-center shrink-0" style={{ width: `${currentOpening.stats.black}%` }}>
                                        {currentOpening.stats.black}% B
                                    </div>
                                </div>
                                <div className="text-[9px] text-base-content/50 font-medium">
                                    Master stats for: <span className="font-mono text-[8px] bg-base-200 p-0.5 rounded">{currentOpening.moves}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="card bg-base-100 border border-base-300 shadow-xl shrink-0 p-4 text-[10px] text-center text-base-content/30 font-medium">
                        Play moves on the board to view the Opening Book explorer.
                    </div>
                )}

                {/* Section: Stockfish Engine Lines & Best Move */}
                <div className="card bg-base-100 border border-base-300 shadow-xl animate__animated animate__fadeIn shrink-0">
                    <div className="card-body p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <IconSparkles size={14} className="text-amber-400" /> Best Engine Lines
                            </h3>
                            <span className="badge badge-sm font-mono font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                {formattedScore}
                            </span>
                        </div>

                        {evalLines.length > 0 ? (
                            <div className="space-y-2">
                                {evalLines.slice(0, 3).map((pv, idx) => {
                                    const score = pv.mate !== undefined 
                                        ? `#M${pv.mate}` 
                                        : `${pv.cp > 0 ? "+" : ""}${(pv.cp / 100).toFixed(1)}`;
                                    const moveSequence = pv.moves.slice(0, 6).join(" ");
                                    const colors = ["text-emerald-400", "text-sky-400", "text-amber-400"];
                                    
                                    return (
                                        <div key={idx} className="text-xs flex flex-col bg-base-200/80 p-2.5 rounded-xl border border-base-300 space-y-1">
                                            <div className="flex justify-between items-center font-bold">
                                                <span className={`${colors[idx]} flex items-center gap-1 text-[11px]`}>
                                                    Line #{idx + 1}
                                                </span>
                                                <span className="font-mono text-xs font-black">{score}</span>
                                            </div>
                                            <div className="text-[11px] text-slate-300 font-mono tracking-tight bg-base-100 p-1.5 rounded-lg border border-base-300/50 truncate">
                                                {moveSequence}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-[11px] font-mono text-slate-400 text-center py-2 bg-base-200 rounded-lg">
                                Calculating engine lines...
                            </div>
                        )}
                    </div>
                </div>

                {/* Setup Tools Card */}
                <div className="card bg-base-100 border border-base-300 shadow-xl shrink-0">
                    <div className="card-body p-4 space-y-2">
                        <h2 className="card-title text-xs font-bold flex items-center gap-1.5 mb-1 text-slate-200">
                            <IconSettings size={16} className="text-slate-400" /> Analysis Tools
                        </h2>
                        
                        {/* FEN Paste Form */}
                        <div className="space-y-2">
                            <div>
                                <label className="label label-text py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                                    Load FEN Position
                                </label>
                                <div className="join w-full">
                                    <input
                                        type="text"
                                        placeholder="rnbqkbnr/pppppppp/8/..."
                                        className="input input-bordered input-xs join-item flex-1 text-xs font-mono"
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
                                <label className="label label-text py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider text-slate-400">
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

                            <button onClick={resetAnalysis} className="btn btn-outline btn-xs w-full text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 border-base-300">
                                <IconRotateClockwise size={12} /> Clear Board
                            </button>
                        </div>
                    </div>
                </div>

                {/* AI Coach Assistant Card */}
                <div className="card bg-base-100 border border-base-300 shadow-xl flex-1">
                    <div className="card-body p-4 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between border-b border-base-300 pb-2">
                            <h2 className="card-title text-xs font-bold flex items-center gap-1.5 text-slate-100">
                                <IconSchool size={18} className="text-emerald-400" /> AI Grandmaster Coach
                            </h2>
                            <span className="badge badge-accent badge-xs font-bold uppercase">GEMINI PRO</span>
                        </div>
                        
                        {/* Explanation viewport */}
                        <div className="flex-1 h-36 overflow-y-auto bg-base-200 border border-base-300 rounded-xl p-3 text-xs font-medium leading-relaxed">
                            {aiLoading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-2">
                                    <span className="loading loading-spinner loading-sm text-emerald-400"></span>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black font-mono">Analyzing pawn structures & tactics...</span>
                                </div>
                            ) : aiExplanation ? (
                                <div className="space-y-2 animate__animated animate__fadeIn">
                                    <div className="badge badge-primary badge-xs font-bold">Coach Analysis</div>
                                    <p className="text-slate-200 text-xs whitespace-pre-wrap">{aiExplanation}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center px-4 gap-1">
                                    <IconInfoCircle size={22} className="text-slate-500" />
                                    <span className="text-xs">Make a move and click &apos;Explain Position&apos; to receive grandmaster strategic insights.</span>
                                </div>
                            )}
                        </div>

                        {/* Quick AI Prompts */}
                        <div className="grid grid-cols-2 gap-1.5">
                            <button
                                onClick={explainActivePosition}
                                className="btn btn-outline btn-xs text-[10px] font-bold border-base-300 text-slate-300"
                                disabled={aiLoading}
                            >
                                🎯 Best Plan?
                            </button>
                            <button
                                onClick={explainActivePosition}
                                className="btn btn-outline btn-xs text-[10px] font-bold border-base-300 text-slate-300"
                                disabled={aiLoading}
                            >
                                ⚡ Tactical Threats
                            </button>
                        </div>

                        <button
                            onClick={explainActivePosition}
                            className="btn btn-primary btn-sm w-full font-bold text-xs gap-1.5 shadow-md"
                            disabled={aiLoading}
                        >
                            <IconSparkles size={16} /> Explain Position with AI
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AnalysisPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <span className="loading loading-spinner loading-lg text-primary animate-pulse"></span>
            </div>
        }>
            <AnalysisBoardComponent />
        </Suspense>
    );
}
