"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    IconTrophy,
    IconSkull,
    IconScale,
    IconAnalyze,
    IconRotateClockwise,
    IconSwords,
    IconHome
} from "@tabler/icons-react";
import { playSound, triggerHaptic } from "@/lib/audioEffects";

interface GameResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    winner: "white" | "black" | "draw" | null;
    playerColor: "white" | "black" | "observer";
    reason: string;
    pgn?: string;
    onRematch?: () => void;
}

export default function GameResultModal({
    isOpen,
    onClose,
    winner,
    playerColor,
    reason,
    pgn,
    onRematch
}: GameResultModalProps) {
    const router = useRouter();

    const isDraw = winner === "draw";
    const isObserver = playerColor === "observer";
    const didWin = !isDraw && !isObserver && winner === playerColor;
    const didLose = !isDraw && !isObserver && winner !== playerColor;

    useEffect(() => {
        if (isOpen) {
            if (isDraw) {
                playSound("draw");
                triggerHaptic("gameover");
            } else if (didWin) {
                playSound("win");
                triggerHaptic("gameover");
            } else if (didLose) {
                playSound("loss");
                triggerHaptic("gameover");
            }
        }
    }, [isOpen, winner, playerColor, isDraw, didWin, didLose]);

    if (!isOpen) return null;

    let titleText = "GAME OVER";
    let subText = `Game ended by ${reason}`;
    let themeClass = "text-base-content";
    let iconComponent = <IconSwords className="w-16 h-16 text-primary" />;

    if (isDraw) {
        titleText = "MATCH DRAW";
        subText = `Draw declared via ${reason}`;
        themeClass = "text-slate-400";
        iconComponent = <IconScale className="w-16 h-16 text-slate-400" />;
    } else if (didWin) {
        titleText = "VICTORY";
        subText = `Won by ${reason}`;
        themeClass = "text-emerald-400";
        iconComponent = <IconTrophy className="w-16 h-16 text-emerald-400 animate-bounce" />;
    } else if (didLose) {
        titleText = "DEFEAT";
        subText = `Lost by ${reason}`;
        themeClass = "text-rose-400";
        iconComponent = <IconSkull className="w-16 h-16 text-rose-400 animate-pulse" />;
    } else if (isObserver) {
        titleText = `${winner?.toUpperCase() || "GAME"} CONCLUDED`;
        subText = `Finished by ${reason}`;
        iconComponent = <IconSwords className="w-16 h-16 text-primary" />;
    }

    const handleAnalyze = () => {
        onClose();
        if (pgn) {
            router.push(`/analysis?pgn=${encodeURIComponent(pgn)}`);
        } else {
            router.push("/analysis");
        }
    };

    const handleNewGame = () => {
        onClose();
        router.push("/");
    };

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 animate__animated animate__fadeIn">
            {/* Modal Card Content */}
            <div className="card w-full max-w-sm bg-[#121620] border border-[#1f293d] shadow-2xl p-6 items-center text-center rounded-2xl animate__animated animate__zoomIn">
                
                {/* Result Icon */}
                <div className="p-4 bg-slate-900/60 rounded-full border border-slate-800 mb-4 shadow-inner">
                    {iconComponent}
                </div>

                {/* Outcome texts */}
                <h2 className={`text-2xl font-black mb-1 tracking-wider uppercase ${themeClass}`}>
                    {titleText}
                </h2>
                
                <p className="text-[11px] uppercase font-bold tracking-widest text-slate-400 mb-2">
                    {subText}
                </p>
                
                <p className="text-xs text-slate-400/80 px-2 mb-6">
                    {reason === "checkmate" && "Checkmate delivered! Outstanding tactical calculation."}
                    {reason === "stalemate" && "No legal moves remaining. Draw declared."}
                    {reason === "timeout" && "Clock expired. Match concluded."}
                    {reason === "abandoned" && "Match ended by resignation or disconnection."}
                    {reason === "repetition" && "Threefold position repetition. Draw registered."}
                </p>

                {/* Platform Action Grid */}
                <div className="flex flex-col w-full gap-2.5">
                    <button
                        onClick={handleAnalyze}
                        className="btn btn-sm w-full bg-emerald-600/90 hover:bg-emerald-500 text-white border-0 font-bold gap-2 shadow-lg"
                    >
                        <IconAnalyze className="w-4 h-4" />
                        Analyze Match
                    </button>

                    <div className="grid grid-cols-2 gap-2 w-full">
                        <button
                            onClick={onRematch || handleNewGame}
                            className="btn btn-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 font-semibold gap-1.5"
                        >
                            <IconRotateClockwise className="w-4 h-4 text-emerald-400" />
                            {onRematch ? "Rematch" : "New Match"}
                        </button>

                        <button
                            onClick={handleNewGame}
                            className="btn btn-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 font-semibold gap-1.5"
                        >
                            <IconHome className="w-4 h-4 text-sky-400" />
                            Arena Lobby
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
