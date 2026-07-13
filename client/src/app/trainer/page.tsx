"use client";

import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { playSound, triggerHaptic } from "@/lib/audioEffects";
import {
    IconInfoCircle,
    IconAward,
    IconBook,
    IconSchool,
    IconCheck
} from "@tabler/icons-react";

interface OpeningTrack {
    id: string;
    name: string;
    description: string;
    moves: string[];
    playerSide: "w" | "b";
    explanation: string[];
}

const OPENING_TRACKS: OpeningTrack[] = [
    {
        id: "ruy_lopez",
        name: "Ruy Lopez (Spanish Opening)",
        description: "Classical opening aiming for active development and long-term center control.",
        playerSide: "w",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
        explanation: [
            "You start by fighting for the center with e4.",
            "Black replies with e5. You attack their pawn with Nf3.",
            "Black defends with Nc6. You develop your bishop to b5 to threaten the knight.",
            "This puts indirect pressure on Black's central defense."
        ]
    },
    {
        id: "sicilian_najdorf",
        name: "Sicilian Defense: Najdorf",
        description: "The sharpest response to e4, fighting for the initiative as Black.",
        playerSide: "b",
        moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"],
        explanation: [
            "White starts with e4. You claim space with c5.",
            "White plays Nf3. You defend d5 with d6.",
            "White opens the center with d4. You trade off pawns with cxd4.",
            "White recaptures with Nxd4. You develop Nf6, eyeing the e4 pawn.",
            "White defends with Nc3. You play a6, the signature move of the Najdorf, preparing counter-attacks."
        ]
    },
    {
        id: "queens_gambit",
        name: "Queen's Gambit Declined",
        description: "A solid, positional response to d4, maintaining structural pawn integrity.",
        playerSide: "w",
        moves: ["d4", "d5", "c4", "e6"],
        explanation: [
            "You open with d4, claiming central space.",
            "Black matches with d5. You challenge their pawn with c4, the Gambit.",
            "Black declines the gambit with e6, keeping their center protected."
        ]
    },
    {
        id: "caro_kann",
        name: "Caro-Kann Defense",
        description: "A highly resilient, defensive layout aiming for a quick d5 push.",
        playerSide: "b",
        moves: ["e4", "c6", "d4", "d5"],
        explanation: [
            "White opens with e4. You support a future d5 push with c6.",
            "White takes the full center with d4. You push d5, challenging their center structure."
        ]
    },
    {
        id: "italian_game",
        name: "Italian Game",
        description: "Develops the bishop to c4 to pressure the weak f7 square.",
        playerSide: "w",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"],
        explanation: [
            "You start with e4.",
            "Black matches with e5. You develop Nf3, attacking the pawn.",
            "Black defends Nc6. You develop Bc4, eyeing the vulnerable f7 square."
        ]
    }
];

export default function OpeningsTrainerPage() {
    const [selectedTrackIdx, setSelectedTrackIdx] = useState<number>(0);
    const [game, setGame] = useState<Chess>(new Chess());
    const [gameFen, setGameFen] = useState<string>(game.fen());
    const [moveIdx, setMoveIdx] = useState<number>(0);
    const [isCompleted, setIsCompleted] = useState<boolean>(false);
    const [warningMsg, setWarningMsg] = useState<string>("");

    const track = OPENING_TRACKS[selectedTrackIdx];
    const playerSide = track.playerSide;

    // Reset game when changing tracks
    useEffect(() => {
        resetTrainer();
    }, [selectedTrackIdx]);

    // Handle computer replies automatically
    useEffect(() => {
        if (moveIdx < track.moves.length && !isCompleted) {
            const nextMoveSan = track.moves[moveIdx];
            const activeColor = moveIdx % 2 === 0 ? "w" : "b";

            // If it is the computer's turn to play the reply
            if (activeColor !== playerSide) {
                const timer = setTimeout(() => {
                    const temp = new Chess(gameFen);
                    const move = temp.move(nextMoveSan);
                    if (move) {
                        setGame(temp);
                        setGameFen(temp.fen());
                        setMoveIdx(prev => prev + 1);
                        playSound("move");
                        triggerHaptic("move");
                        
                        // Check if completed
                        if (moveIdx + 1 >= track.moves.length) {
                            setIsCompleted(true);
                            playSound("win");
                            triggerHaptic("gameover");
                            // Add points to local storage XP
                            if (typeof window !== "undefined") {
                                const currentXp = parseInt(localStorage.getItem("chessthan:xp") || "0");
                                localStorage.setItem("chessthan:xp", (currentXp + 50).toString());
                            }
                        }
                    }
                }, 750);

                return () => clearTimeout(timer);
            }
        }
    }, [moveIdx, gameFen, selectedTrackIdx, isCompleted]);

    const resetTrainer = () => {
        const fresh = new Chess();
        setGame(fresh);
        setGameFen(fresh.fen());
        setMoveIdx(0);
        setIsCompleted(false);
        setWarningMsg("");
    };

    const makeMove = (from: string, to: string): boolean => {
        if (isCompleted) return false;

        const nextMoveSan = track.moves[moveIdx];
        const activeColor = moveIdx % 2 === 0 ? "w" : "b";

        // Check if it is the player's turn
        if (activeColor !== playerSide) return false;

        try {
            const temp = new Chess(gameFen);
            const move = temp.move({
                from,
                to,
                promotion: "q"
            });

            if (move === null) return false;

            // Verify if played move matches the target opening book line
            if (move.san === nextMoveSan || move.lan === nextMoveSan) {
                setGame(temp);
                setGameFen(temp.fen());
                setMoveIdx(prev => prev + 1);
                setWarningMsg("");

                playSound("move");
                triggerHaptic("move");

                // Check if completed
                if (moveIdx + 1 >= track.moves.length) {
                    setIsCompleted(true);
                    playSound("win");
                    triggerHaptic("gameover");
                    if (typeof window !== "undefined") {
                        const currentXp = parseInt(localStorage.getItem("chessthan:xp") || "0");
                        localStorage.setItem("chessthan:xp", (currentXp + 50).toString());
                    }
                }
                return true;
            } else {
                // Wrong move deviation
                setWarningMsg(`Incorrect move! You played ${move.san}. Try following the book line.`);
                playSound("check");
                triggerHaptic("check");
                return false;
            }
        } catch (e) {
            return false;
        }
    };

    const onDrop = (sourceSquare: string, targetSquare: string): boolean => {
        return makeMove(sourceSquare, targetSquare);
    };

    const boardOrientation = playerSide === "w" ? "white" : "black";

    return (
        <div className="flex flex-col lg:flex-row items-stretch gap-8 w-full max-w-5xl justify-center p-4">
            
            {/* Left section: Chessboard */}
            <div className="flex-1 flex flex-col items-center">
                
                {/* Board header */}
                <div className="w-full flex items-center justify-between bg-base-200 border border-base-300 p-3 rounded-t-xl mb-1 text-xs">
                    <span className="font-bold flex items-center gap-1">
                        <span className="badge badge-accent badge-xs">Training</span>
                        {track.name}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-base-content/50">
                        Playing as {playerSide === "w" ? "White" : "Black"}
                    </span>
                </div>

                {/* Chessboard container */}
                <div className="w-full max-w-[460px] h-[460px] shadow-2xl rounded-b-xl overflow-hidden bg-base-100 border border-base-300 relative">
                    <Chessboard
                        position={gameFen}
                        onPieceDrop={onDrop}
                        boardOrientation={boardOrientation}
                        customDarkSquareStyle={{ backgroundColor: "#4b7399" }}
                        customLightSquareStyle={{ backgroundColor: "#eae9d2" }}
                        customBoardStyle={{ borderRadius: "0 0 0.5rem 0.5rem" }}
                        arePiecesDraggable={!isCompleted}
                    />

                    {/* Completion success overlay */}
                    {isCompleted && (
                        <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm animate__animated animate__fadeIn">
                            <IconAward size={64} className="text-warning mb-2 animate__animated animate__bounceIn" />
                            <h3 className="text-xl font-black text-white">Opening Learned!</h3>
                            <p className="text-xs text-slate-300 max-w-xs mt-1">
                                Congratulations! You successfully navigated all correct book moves for the {track.name}.
                            </p>
                            <span className="badge badge-success badge-md font-bold mt-3">+50 XP Awarded</span>
                            
                            <button onClick={resetTrainer} className="btn btn-primary btn-sm font-bold mt-6">
                                🔄 Practice Again
                            </button>
                        </div>
                    )}
                </div>

                {/* Warning message footer */}
                {warningMsg && (
                    <div className="alert alert-warning text-[10px] font-bold py-1.5 px-3 mt-3 w-full max-w-[460px] flex gap-1 justify-center rounded-lg animate__animated animate__headShake">
                        ⚠️ {warningMsg}
                    </div>
                )}
            </div>

            {/* Right section: Tracks list & explanations */}
            <div className="w-full max-w-sm flex flex-col gap-6">
                
                {/* Tracks Selector */}
                <div className="card bg-base-100 border border-base-300 shadow-xl">
                    <div className="card-body p-4">
                        <h2 className="card-title text-xs font-bold flex items-center gap-1.5 mb-2">
                            <IconSchool className="text-primary" /> Training Variations
                        </h2>
                        
                        <div className="space-y-1.5">
                            {OPENING_TRACKS.map((t, idx) => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTrackIdx(idx)}
                                    className={`btn btn-xs w-full justify-start normal-case h-9 min-h-9 px-3 ${
                                        selectedTrackIdx === idx
                                            ? "btn-primary font-bold"
                                            : "btn-ghost text-base-content/75"
                                    }`}
                                >
                                    <IconBook size={14} className="mr-1.5 opacity-60" />
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="text-[10px] font-bold truncate leading-tight">{t.name}</div>
                                        <div className="text-[8px] opacity-70 truncate font-medium">
                                            {t.playerSide === "w" ? "White's side" : "Black's side"} • {t.moves.length} moves
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Guide Explanation Viewport */}
                <div className="card bg-base-100 border border-base-300 shadow-xl flex-1">
                    <div className="card-body p-4 flex flex-col justify-between">
                        <div>
                            <h2 className="card-title text-xs font-bold flex items-center gap-1.5 mb-1">
                                <IconInfoCircle className="text-accent" /> Variation Guide
                            </h2>
                            <p className="text-[10px] text-base-content/50 leading-tight mb-4">
                                Play the correct highlighted book moves. Opponent responses are played automatically.
                            </p>
                        </div>

                        {/* Move by move guide checklist */}
                        <div className="flex-1 bg-base-200 border border-base-300 rounded-xl p-3 text-[10px] font-medium space-y-2.5 overflow-y-auto max-h-56">
                            {track.explanation.map((exp, idx) => {
                                const isCurrent = moveIdx === idx || (moveIdx > idx && idx === track.explanation.length - 1);
                                const isPast = moveIdx > idx;

                                return (
                                    <div
                                        key={idx}
                                        className={`flex items-start gap-2 p-2 rounded-lg border transition-all duration-300 ${
                                            isCurrent
                                                ? "bg-primary/10 border-primary/30 text-base-content"
                                                : isPast
                                                ? "bg-success/5 border-success/15 text-base-content/50"
                                                : "opacity-40 border-transparent text-base-content/40"
                                        }`}
                                    >
                                        <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 text-[8px] font-bold ${
                                            isPast
                                                ? "bg-success text-white"
                                                : "bg-base-300 text-base-content/70"
                                        }`}>
                                            {isPast ? <IconCheck size={8} strokeWidth={4} /> : idx + 1}
                                        </div>
                                        <div className="leading-tight">
                                            <span className="font-bold text-[9px] uppercase mr-1">Move {idx + 1}:</span>
                                            {exp}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={resetTrainer}
                            className="btn btn-outline btn-xs w-full mt-4 font-bold h-7 min-h-7"
                        >
                            🔄 Reset Practice
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
