"use client";

import { useEffect } from "react";
import { playSound, triggerHaptic } from "@/lib/audioEffects";

interface GameResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    winner: "white" | "black" | "draw" | null;
    playerColor: "white" | "black" | "observer";
    reason: string;
}

export default function GameResultModal({ isOpen, onClose, winner, playerColor, reason }: GameResultModalProps) {
    
    // Determine player outcome
    const isDraw = winner === "draw";
    const isObserver = playerColor === "observer";
    const didWin = !isDraw && !isObserver && winner === playerColor;
    const didLose = !isDraw && !isObserver && winner !== playerColor;

    useEffect(() => {
        if (isOpen) {
            // Trigger audio and haptics based on outcome
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

    // Title and theme styling
    let titleText = "GAME OVER";
    let subText = `Game ended by ${reason}`;
    let themeClass = "text-base-content";
    let buttonClass = "btn-neutral";

    if (isDraw) {
        titleText = "🤝 MATCH DRAW";
        subText = `Draw by ${reason}`;
        themeClass = "text-slate-400";
    } else if (didWin) {
        titleText = "🏆 VICTORY!";
        subText = `Won by ${reason}`;
        themeClass = "text-success bg-gradient-to-r from-success to-primary bg-clip-text text-transparent";
        buttonClass = "btn-success text-success-content";
    } else if (didLose) {
        titleText = "💀 DEFEAT";
        subText = `Lost by ${reason}`;
        themeClass = "text-error";
        buttonClass = "btn-error text-error-content";
    } else if (isObserver) {
        titleText = `${winner?.toUpperCase() || "NOBODY"} WINS`;
        subText = `Finished by ${reason}`;
    }

    return (
        <div className="fixed inset-0 bg-base-100/80 backdrop-blur-md flex items-center justify-center z-50 animate__animated animate__fadeIn">
            
            {/* Confetti / Particle Animation container for wins */}
            {didWin && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 rounded-full bg-warning animate-float"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                transform: `scale(${Math.random() * 1.5})`,
                                animationDelay: `${Math.random() * 3}s`,
                                animationDuration: `${3 + Math.random() * 3}s`,
                                opacity: 0.7
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Crying Rain particles for losses */}
            {didLose && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(15)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-0.5 h-4 bg-error/40 animate-rain"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-10px`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${1 + Math.random() * 1.5}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Modal Card content */}
            <div className="card w-full max-w-sm bg-base-200 border border-base-300 shadow-2xl p-6 items-center text-center animate__animated animate__zoomIn">
                
                {/* Custom SVG Animations */}
                <div className="w-32 h-32 mb-6">
                    {didWin && (
                        <svg className="w-full h-full text-warning animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6m0 0l-3-3m3 3l3-3m-6 9h6" strokeLinecap="round" />
                            {/* Star sparkles */}
                            <path d="M5 5l1 1M19 5l-1 1M5 19l1-1M19 19l-1-1" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    )}
                    {didLose && (
                        <svg className="w-full h-full text-error animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
                            <path d="M9 10h.01M15 10h.01M9 16c1-1.5 5-1.5 6 0" strokeLinecap="round" />
                            {/* Tear drops */}
                            <circle cx="8" cy="12" r="1.5" className="fill-info" />
                        </svg>
                    )}
                    {isDraw && (
                        <svg className="w-full h-full text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="8" cy="12" r="6" />
                            <circle cx="16" cy="12" r="6" />
                            {/* Overlapping region representing scales */}
                            <path d="M12 6v12M8 18h8" strokeLinecap="round" />
                        </svg>
                    )}
                    {isObserver && (
                        <svg className="w-full h-full text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v8m-4-4h8" strokeLinecap="round" />
                        </svg>
                    )}
                </div>

                {/* Outcome texts */}
                <h2 className={`text-3xl font-black mb-2 tracking-wider ${themeClass}`}>
                    {titleText}
                </h2>
                
                <p className="text-xs uppercase font-extrabold tracking-widest text-base-content/40 mb-1">
                    {subText}
                </p>
                
                <p className="text-[10px] text-base-content/60 px-4 mb-6">
                    {reason === "checkmate" && "Checkmate delivered! Absolute tactical victory."}
                    {reason === "stalemate" && "No legal moves remaining. A draw is declared."}
                    {reason === "timeout" && "Time ran out on the clock. Game complete."}
                    {reason === "abandoned" && "A player left the game lobby. Match closed."}
                    {reason === "repetition" && "Threefold repetition occurred. Draw registered."}
                </p>

                {/* Return trigger button */}
                <button onClick={onClose} className={`btn btn-sm w-full normal-case font-bold ${buttonClass}`}>
                    Return to Lobby
                </button>
            </div>

            {/* Custom keyframes injected inline */}
            <style jsx global>{`
                @keyframes float {
                    0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                    50% { opacity: 0.8; }
                    100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
                }
                @keyframes rain {
                    0% { transform: translateY(-20px); opacity: 0.7; }
                    100% { transform: translateY(400px); opacity: 0.1; }
                }
                .animate-float {
                    animation: float infinite linear;
                }
                .animate-rain {
                    animation: rain infinite linear;
                }
                .animate-spin-slow {
                    animation: spin 8s infinite linear;
                }
            `}</style>
        </div>
    );
}
