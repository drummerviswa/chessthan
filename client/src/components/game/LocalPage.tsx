"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { getBestMove } from "@/lib/localEngine";
import { IconRotateClockwise2, IconMessageChatbot } from "@tabler/icons-react";
import VoiceControl from "@/components/game/VoiceControl";
import { playSound, triggerHaptic } from "@/lib/audioEffects";
import GameResultModal from "@/components/game/GameResultModal";

// Bot Personalities configuration
const BOT_PERSONALITIES = [
    {
        id: "beginner",
        name: "Beginner Bot",
        elo: 600,
        desc: "Easy play, friendly feedback.",
        avatar: "🤖",
        depth: 1,
        delay: 600,
        quoteStart: "Hello! Let's have a fun game. Don't worry, I make mistakes too!",
        quotesMove: ["Your turn!", "I hope that was a good move.", "Let's see what you do next.", "Hmm, chess is interesting!"],
        quotesBlunder: ["Oops, did you lose a piece?", "Oh, is that a free pawn?", "Don't worry, keep playing! we all make mistakes."],
        quotesGood: ["Wow, that was a strong move!", "You are playing really well!", "Excellent choice! I need to be careful."]
    },
    {
        id: "trashtalk",
        name: "Trash Talk Bot",
        elo: 1100,
        desc: "Sarcastic banter, basic tactics.",
        avatar: "🤪",
        depth: 2,
        delay: 1000,
        quoteStart: "Prepare to be defeated! I hope you brought a box of tissues.",
        quotesMove: ["Easy move. Next!", "Are you calculating? Because I can't feel it.", "Is this your first time playing chess?", "My grandmother plays faster than this!"],
        quotesBlunder: ["Hahaha, did you sleep during that move?", "Thanks for the free gift!", "Call the police, a queen has been kidnapped!", "That move was... unique. Unique-ly bad!"],
        quotesGood: ["Pff, a lucky guess.", "I let you play that, obviously.", "Fine, not terrible. Don't get cocky though.", "A broken clock is right twice a day."]
    },
    {
        id: "coach",
        name: "Coach Bot",
        elo: 1500,
        desc: "Explains positions, offers takebacks.",
        avatar: "👨‍🏫",
        depth: 2,
        delay: 1200,
        quoteStart: "Welcome! I'm here to play and help you learn. Take your time, there is no rush.",
        quotesMove: ["I'm controlling the center.", "Developing my pieces is key to safety.", "Look out for tactical alignments on the board.", "Think about your pawn structure!"],
        quotesBlunder: ["Notice how that piece was left unprotected. Try to look at the whole board!", "That move weakens your king safety. Remember to keep pawns close.", "Be careful with that piece, it was a bit exposed!"],
        quotesGood: ["Splendid move! You seized the open file.", "Great tactical vision! That was a strong continuation.", "Perfect development of your knight, controlling key squares."]
    },
    {
        id: "tal",
        name: "Tal Style",
        elo: 2400,
        desc: "Highly tactical, sacrifices pieces.",
        avatar: "🔥",
        depth: 3,
        delay: 1400,
        quoteStart: "You must take your opponent into a deep dark forest where 2+2=5, and the path leading out is only wide enough for one.",
        quotesMove: ["I sacrifice my bishop! Solve this!", "Dynamic play is the only way.", "Feel the pressure on your king!", "The attack is everything."],
        quotesBlunder: ["In this forest, you have lost your way.", "A slow move is a dead move in this position.", "Now, my attack is completely unstoppable!"],
        quotesGood: ["Ah, an elegant defense!", "You fight well in the tactical storm.", "Dangerous counterplay! I respect that."]
    },
    {
        id: "magnus",
        name: "Magnus Style",
        elo: 2850,
        desc: "Flawless positional endgames.",
        avatar: "👑",
        depth: 3,
        delay: 1800,
        quoteStart: "Some people think that if their opponent plays a beautiful game, it's okay. I don't. I only want to win.",
        quotesMove: ["Pressuring your weak pawn. Let's see how you defend.", "Step by step, I squeeze your position.", "Let's enter the endgame where technical precision wins.", "Developing small, long-term advantages."],
        quotesBlunder: ["Your structure is permanently damaged. There is no recovery.", "This endgame is technically won for me.", "You gave up the bishop pair, which is fatal in this open board."],
        quotesGood: ["A solid, defensive move. You are holding on.", "You are preventing my squeeze. Impressive.", "Very mature play. We have a battle here."]
    }
];

function LocalPageContent() {
    const searchParams = useSearchParams();
    const botParam = searchParams.get("bot") || "";

    const [mode, setMode] = useState<"passplay" | "bot">("passplay");
    const [selectedBotId, setSelectedBotId] = useState<string>("beginner");
    const [playerColor, setPlayerColor] = useState<"white" | "black" | "random">("white");
    const [autoRotate, setAutoRotate] = useState(true);
    const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white");
    const [game, setGame] = useState<Chess>(new Chess());
    const [gameFen, setGameFen] = useState(game.fen());
    const [moveHistory, setMoveHistory] = useState<string[]>([]);
    const [gameStatus, setGameStatus] = useState<string>("White to move");
    const [isGameOver, setIsGameOver] = useState(false);
    
    // Available Moves Dot indicators & selection states
    const [optionSquares, setOptionSquares] = useState<any>({});
    const [moveFrom, setMoveFrom] = useState<string>("");

    // Game over result modal state
    const [showResultModal, setShowResultModal] = useState(false);
    const [resultReason, setResultReason] = useState("checkmate");
    
    // Bot speech dialogue bubble state
    const [botSpeech, setBotSpeech] = useState<string>("");
    const [isBotThinking, setIsBotThinking] = useState(false);

    const activeBot = BOT_PERSONALITIES.find((b) => b.id === selectedBotId) || BOT_PERSONALITIES[0];

    // Read bot parameters from URL on load
    useEffect(() => {
        if (botParam) {
            const found = BOT_PERSONALITIES.some((b) => b.id === botParam);
            if (found) {
                setMode("bot");
                setSelectedBotId(botParam);
            }
        }
    }, [botParam]);

    // Initialize/Reset Game
    const resetGame = () => {
        const newGame = new Chess();
        setGame(newGame);
        setGameFen(newGame.fen());
        setMoveHistory([]);
        setIsGameOver(false);
        setMoveFrom("");
        setOptionSquares({});
        setShowResultModal(false);
        setGameStatus("White to move");
        
        let initialOrientation: "white" | "black" = "white";
        if (mode === "bot") {
            if (playerColor === "black") {
                initialOrientation = "black";
            } else if (playerColor === "random") {
                initialOrientation = Math.random() < 0.5 ? "white" : "black";
            }
            setBotSpeech(activeBot.quoteStart);
        } else {
            setBotSpeech("");
        }
        setBoardOrientation(initialOrientation);
    };

    // Reset when switching modes or settings
    useEffect(() => {
        resetGame();
    }, [mode, playerColor, selectedBotId]);

    // Handle bot move trigger
    useEffect(() => {
        if (mode === "bot" && !isGameOver) {
            const isBotTurn = 
                (boardOrientation === "white" && game.turn() === "b") ||
                (boardOrientation === "black" && game.turn() === "w");

            if (isBotTurn) {
                setIsBotThinking(true);
                const timer = setTimeout(() => {
                    makeBotMove();
                }, activeBot.delay);
                return () => clearTimeout(timer);
            }
        }
    }, [gameFen, mode, boardOrientation, isGameOver, selectedBotId]);

    // Execute bot calculations
    const makeBotMove = () => {
        setIsBotThinking(false);
        try {
            const bestMove = getBestMove(game.fen(), activeBot.depth);
            if (bestMove) {
                const moveResult = game.move(bestMove);
                
                // Trigger sound and haptics for bot move
                if (moveResult && moveResult.captured) {
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
                setMoveHistory(game.history());
                updateGameStatus();

                // Bot dialogue response heuristics
                if (moveResult && moveResult.captured && ["q", "r", "b", "n"].includes(moveResult.captured)) {
                    const quotes = activeBot.quotesBlunder;
                    setBotSpeech(quotes[Math.floor(Math.random() * quotes.length)]);
                } else if (game.inCheck()) {
                    setBotSpeech("Check!");
                } else {
                    const quotes = activeBot.quotesMove;
                    setBotSpeech(quotes[Math.floor(Math.random() * quotes.length)]);
                }
            }
        } catch (err) {
            console.error("Bot move calculation error:", err);
        }
    };

    // Update game status text
    const updateGameStatus = () => {
        if (game.isGameOver()) {
            setIsGameOver(true);
            let reason = "checkmate";

            if (game.isCheckmate()) {
                const winner = game.turn() === "w" ? "Black" : "White";
                setGameStatus(`🏆 Checkmate! ${winner} wins.`);
                setBotSpeech(game.turn() === "w" ? "Ah! You got me. Well played!" : "Checkmate! Better luck next time.");
                reason = "checkmate";
            } else if (game.isDraw()) {
                setGameStatus("🤝 Game drawn.");
                setBotSpeech("It's a draw. A solid, balanced game.");
                reason = game.isStalemate() ? "stalemate" : game.isThreefoldRepetition() ? "repetition" : "insufficient";
            }
            
            setResultReason(reason);
            setShowResultModal(true);
        } else {
            const turn = game.turn() === "w" ? "White" : "Black";
            setGameStatus(`${turn} to move`);
        }
    };

    // Execute standard move operations (Clicks, Drops, Vocals)
    const makeUserMove = (from: string, to: string): boolean => {
        try {
            const fenBefore = game.fen();
            const userMoveStr = `${from}${to}`;

            const move = game.move({
                from,
                to,
                promotion: "q"
            });

            if (move === null) return false;

            // Trigger Sound and Haptics based on move outcome
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
            setMoveHistory(game.history());
            updateGameStatus();

            if (mode === "bot") {
                const bestEngineMove = getBestMove(fenBefore, activeBot.depth);
                if (bestEngineMove === userMoveStr) {
                    const quotes = activeBot.quotesGood;
                    setBotSpeech(quotes[Math.floor(Math.random() * quotes.length)]);
                }
            }

            if (mode === "passplay" && autoRotate) {
                setBoardOrientation(game.turn() === "w" ? "white" : "black");
            }

            return true;
        } catch (e) {
            return false;
        }
    };

    // Handle drag-and-drop actions
    const onDrop = (sourceSquare: string, targetSquare: string): boolean => {
        if (isGameOver) return false;

        if (mode === "bot") {
            const isBotTurn = 
                (boardOrientation === "white" && game.turn() === "b") ||
                (boardOrientation === "black" && game.turn() === "w");
            if (isBotTurn) return false;
        }

        const success = makeUserMove(sourceSquare, targetSquare);
        if (success) {
            setMoveFrom("");
            setOptionSquares({});
        }
        return success;
    };

    // Calculate legal available move dots to render
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
            background: "rgba(255, 255, 0, 0.3)" // yellow highlight on source square
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

    // Handle Tap-to-Move click interaction
    const onSquareClick = (square: string) => {
        if (isGameOver) return;

        if (mode === "bot") {
            const isBotTurn = 
                (boardOrientation === "white" && game.turn() === "b") ||
                (boardOrientation === "black" && game.turn() === "w");
            if (isBotTurn) return;
        }

        if (moveFrom) {
            // Check if user clicked a valid destination square
            const legalMove = game.moves({ square: moveFrom as any, verbose: true })
                .find(m => m.from === moveFrom && m.to === square);

            if (legalMove) {
                const success = makeUserMove(moveFrom, square);
                if (success) {
                    setMoveFrom("");
                    setOptionSquares({});
                    return;
                }
            }
        }

        // Tap a piece to show its legal moves
        const piece = game.get(square as any);
        if (piece && piece.color === game.turn()) {
            setMoveFrom(square);
            getPossibleMoves(square);
        } else {
            setMoveFrom("");
            setOptionSquares({});
        }
    };

    // Find king square to draw check highlight
    const findKingSquare = (color: "w" | "b") => {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = game.board()[r][c];
                if (piece && piece.type === "k" && piece.color === color) {
                    const cols = ["a", "b", "c", "d", "e", "f", "g", "h"];
                    return `${cols[c]}${8 - r}`;
                }
            }
        }
        return null;
    };

    // Merge move dots & check highlights
    const getBoardStyles = () => {
        const styles = { ...optionSquares };
        if (game.inCheck()) {
            const kingSquare = findKingSquare(game.turn());
            if (kingSquare) {
                styles[kingSquare] = {
                    ...styles[kingSquare],
                    background: "radial-gradient(circle, rgba(239, 68, 68, 0.6) 100%, transparent 100%)",
                    boxShadow: "inset 0 0 16px #ef4444"
                };
            }
        }
        return styles;
    };

    // Handle voice-command moves
    const handleVoiceMove = (moveStr: string): boolean => {
        if (isGameOver) return false;

        if (mode === "bot") {
            const isBotTurn = 
                (boardOrientation === "white" && game.turn() === "b") ||
                (boardOrientation === "black" && game.turn() === "w");
            if (isBotTurn) return false;
        }

        try {
            const fenBefore = game.fen();
            const moveResult = game.move(moveStr);
            if (!moveResult) return false;

            if (moveResult.captured) {
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
            setMoveHistory(game.history());
            updateGameStatus();

            if (mode === "bot") {
                const bestEngineMove = getBestMove(fenBefore, activeBot.depth);
                const userMoveStr = `${moveResult.from}${moveResult.to}`;
                if (bestEngineMove === userMoveStr) {
                    const quotes = activeBot.quotesGood;
                    setBotSpeech(quotes[Math.floor(Math.random() * quotes.length)]);
                }
            }

            if (mode === "passplay" && autoRotate) {
                setBoardOrientation(game.turn() === "w" ? "white" : "black");
            }

            setMoveFrom("");
            setOptionSquares({});
            return true;
        } catch (e) {
            return false;
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 w-full max-w-5xl items-center lg:items-start justify-center p-4">
            
            {/* Left section: Chessboard with Bot Info Card */}
            <div className="w-full max-w-[460px] flex flex-col items-center">
                
                {/* Active Bot Speech Bubble Panel */}
                {mode === "bot" && (
                    <div className="w-full flex items-center gap-3 bg-base-200 border border-base-300 p-3 rounded-t-xl mb-1 shadow">
                        <div className="text-2xl bg-base-100 p-1.5 rounded-full shadow flex items-center justify-center shrink-0">
                            {activeBot.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold flex items-center gap-1.5">
                                <span>{activeBot.name}</span>
                                <span className="badge badge-neutral text-[9px] font-mono">{activeBot.elo} ELO</span>
                                {isBotThinking && (
                                    <span className="loading loading-dots loading-xs text-primary ml-auto"></span>
                                )}
                            </div>
                            {botSpeech && (
                                <div className="chat chat-start mt-1 animate__animated animate__fadeIn">
                                    <div className="chat-bubble chat-bubble-primary text-[10px] py-1 px-3 shadow min-h-0 leading-tight">
                                        {botSpeech}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Game status row */}
                <div className={`w-full bg-base-300 p-2.5 flex items-center justify-between text-xs font-semibold ${
                    mode !== "bot" ? "rounded-t-xl" : ""
                }`}>
                    <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary animate-ping"></span>
                        {gameStatus}
                    </span>
                    <button
                        onClick={() => setBoardOrientation(boardOrientation === "white" ? "black" : "white")}
                        className="btn btn-xs btn-outline flex items-center gap-1 normal-case"
                    >
                        <IconRotateClockwise2 size={14} /> Flip
                    </button>
                </div>

                {/* Chessboard container */}
                <div className="w-full shadow-2xl rounded-b-xl overflow-hidden bg-base-100 border border-base-300">
                    <Chessboard
                        position={gameFen}
                        onPieceDrop={onDrop}
                        onSquareClick={onSquareClick}
                        boardOrientation={boardOrientation}
                        customSquareStyles={getBoardStyles()}
                        customBoardStyle={{
                            borderRadius: "0 0 0.75rem 0.75rem"
                        }}
                        customDarkSquareStyle={{ backgroundColor: "#4b7399" }}
                        customLightSquareStyle={{ backgroundColor: "#eae9d2" }}
                    />
                </div>
            </div>

            {/* Right section: Game Controls & Settings */}
            <div className="card w-full max-w-sm bg-base-100 shadow-xl border border-base-300">
                <div className="card-body p-6">
                    <h2 className="card-title text-xl font-bold flex items-center gap-1.5 mb-2">
                        <IconMessageChatbot className="text-primary" /> Arena Match Play
                    </h2>
                    <p className="text-[10px] text-base-content/60 mb-4">
                        Play same-device matches or challenge custom chess bot personalities. Tap a piece to highlight available moves with dots.
                    </p>

                    {/* Mode Selector tabs */}
                    <div className="tabs tabs-boxed w-full p-1 mb-4">
                        <button
                            onClick={() => setMode("passplay")}
                            className={`tab flex-1 text-xs ${mode === "passplay" ? "tab-active font-bold" : ""}`}
                        >
                            Pass & Play
                        </button>
                        <button
                            onClick={() => setMode("bot")}
                            className={`tab flex-1 text-xs ${mode === "bot" ? "tab-active font-bold" : ""}`}
                        >
                            Vs Computer
                        </button>
                    </div>

                    {/* Pass & Play Settings */}
                    {mode === "passplay" && (
                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label cursor-pointer flex items-center justify-between bg-base-200 p-3 rounded-lg border border-base-300">
                                    <div>
                                        <span className="label-text font-bold text-xs">Auto-Rotate Board</span>
                                        <div className="text-[9px] text-base-content/50">Flips board after every turn</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary checkbox-sm"
                                        checked={autoRotate}
                                        onChange={(e) => setAutoRotate(e.target.checked)}
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Bot Settings */}
                    {mode === "bot" && (
                        <div className="space-y-4">
                            <div>
                                <label className="label label-text py-1 text-xs font-semibold">Select Bot Personality</label>
                                <select
                                    className="select select-bordered select-sm w-full"
                                    value={selectedBotId}
                                    onChange={(e) => setSelectedBotId(e.target.value)}
                                >
                                    {BOT_PERSONALITIES.map((bot) => (
                                        <option key={bot.id} value={bot.id}>
                                            {bot.avatar} {bot.name} ({bot.elo} ELO)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Bot Description Card */}
                            <div className="p-3 bg-base-200 border border-base-300 rounded-xl space-y-1">
                                <div className="text-xs font-bold text-primary flex items-center gap-1">
                                    <span>{activeBot.avatar}</span>
                                    <span>{activeBot.name}</span>
                                </div>
                                <p className="text-[10px] text-base-content/75">{activeBot.desc}</p>
                                <div className="text-[9px] text-base-content/50">
                                    Minimax Depth: {activeBot.depth} | Thinking Delay: {activeBot.delay}ms
                                </div>
                            </div>

                            <div>
                                <label className="label label-text py-1 text-xs font-semibold">Your Side</label>
                                <select
                                    className="select select-bordered select-sm w-full"
                                    value={playerColor}
                                    onChange={(e: any) => setPlayerColor(e.target.value)}
                                >
                                    <option value="white">White</option>
                                    <option value="black">Black</option>
                                    <option value="random">Random</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Move History Log */}
                    <div className="mt-4">
                        <h3 className="font-bold text-xs mb-2 text-base-content/80">Match Moves</h3>
                        <div className="h-28 overflow-y-auto bg-base-200 rounded p-3 text-xs border border-base-300 font-mono">
                            {moveHistory.length === 0 ? (
                                <span className="text-base-content/40 text-[10px]">No moves made yet.</span>
                            ) : (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                                    {moveHistory.map((move, idx) => {
                                        if (idx % 2 === 0) {
                                            return (
                                                <div key={idx} className="flex gap-2">
                                                    <span className="text-base-content/40">{Math.floor(idx / 2) + 1}.</span>
                                                    <span>{move}</span>
                                                </div>
                                            );
                                        }
                                        return <div key={idx} className="pl-6">{move}</div>;
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Voice Controls Widget */}
                    <VoiceControl game={game} onMakeMove={handleVoiceMove} />

                    {/* Reset Controls */}
                    <div className="mt-6">
                        <button onClick={resetGame} className="btn btn-neutral btn-sm w-full">
                            🔄 Restart Game
                        </button>
                    </div>
                </div>
            </div>

            {/* Game Result Confetti Modal */}
            <GameResultModal
                isOpen={showResultModal}
                onClose={() => setShowResultModal(false)}
                winner={game.isDraw() ? "draw" : (game.turn() === "w" ? "black" : "white")}
                playerColor={mode === "bot" ? boardOrientation : (game.turn() === "w" ? "white" : "black")}
                reason={resultReason}
            />
        </div>
    );
}

export default function LocalPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[40vh] w-full">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        }>
            <LocalPageContent />
        </Suspense>
    );
}
