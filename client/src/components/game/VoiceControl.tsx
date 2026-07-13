"use client";

import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { IconMicrophone, IconMicrophoneOff, IconVolume, IconVolumeOff } from "@tabler/icons-react";

interface VoiceControlProps {
    game: Chess;
    // eslint-disable-next-line no-unused-vars
    onMakeMove: (move: string) => boolean;
}

export default function VoiceControl({ game, onMakeMove }: VoiceControlProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [statusText, setStatusText] = useState("Voice control offline");
    const [isMuted, setIsMuted] = useState(false);

    // Audio commentary reader
    const speakText = (text: string) => {
        if (isMuted || typeof window === "undefined" || !window.speechSynthesis) return;
        // Cancel active audio to avoid overlapping speech
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
    };

    // Initialize voice recognition
    let recognition: any = null;
    if (typeof window !== "undefined") {
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = "en-US";
        }
    }

    const startListening = () => {
        if (!recognition) {
            setStatusText("Speech API not supported in this browser.");
            return;
        }
        try {
            recognition.start();
            setIsListening(true);
            setStatusText("Listening... Say a move (e.g., 'e4', 'Knight to f3')");
            speakText("Voice control active");
        } catch (e) {
            console.error("Speech recognition start error:", e);
        }
    };

    const stopListening = () => {
        if (recognition) {
            try {
                recognition.stop();
            } catch (e) {
                console.debug(e);
            }
        }
        setIsListening(false);
        setStatusText("Voice control suspended");
        speakText("Voice control suspended");
    };

    // Parse vocal strings to matches inside legal chess moves
    const processSpokenMove = (speechText: string) => {
        const legalMoves = game.moves(); // returns moves in SAN format like ["Nf3", "e4", "O-O"]
        let cleaned = speechText
            .replace(/\bto\b/g, "")
            .replace(/\bthe\b/g, "")
            .replace(/\bmove\b/g, "")
            .replace(/\bplay\b/g, "")
            .trim();

        // Standard replacements for chess pieces
        const pieceReplacements: { [key: string]: string } = {
            "knight": "n",
            "bishop": "b",
            "rook": "r",
            "queen": "q",
            "king": "k",
            "pawn": "",
            "castle king side": "o-o",
            "castle queen side": "o-o-o",
            "castles": "o-o",
            "castle": "o-o"
        };

        // Apply replacements
        for (const [word, replacement] of Object.entries(pieceReplacements)) {
            const regex = new RegExp(`\\b${word}\\b`, "g");
            cleaned = cleaned.replace(regex, replacement);
        }

        // Remove whitespace
        cleaned = cleaned.replace(/\s+/g, "");

        // Phonetic fixups (e.g. "d4" heard as "before" or "see 3" as "c3")
        const phoneticFixes: { [key: string]: string } = {
            "before": "b4",
            "see3": "c3",
            "see6": "c6",
            "d4": "d4",
            "g4": "g4",
            "four": "4",
            "three": "3",
            "six": "6",
            "five": "5"
        };
        for (const [wrong, correct] of Object.entries(phoneticFixes)) {
            cleaned = cleaned.replace(wrong, correct);
        }

        // Find match in legal moves
        let matchedMove = "";
        
        // 1. Try exact match against lowercased legal moves
        const lowerLegal = legalMoves.map(m => m.toLowerCase());
        const exactIdx = lowerLegal.indexOf(cleaned);
        if (exactIdx !== -1) {
            matchedMove = legalMoves[exactIdx];
        }

        // 2. Try matching without check symbols ('+')
        if (!matchedMove) {
            const cleanLegal = lowerLegal.map(m => m.replace("+", "").replace("#", ""));
            const cleanIdx = cleanLegal.indexOf(cleaned.replace("+", "").replace("#", ""));
            if (cleanIdx !== -1) {
                matchedMove = legalMoves[cleanIdx];
            }
        }

        // 3. Fallback: Check if the cleaned speech string is contained in any legal move
        if (!matchedMove) {
            const index = legalMoves.findIndex(m => {
                const cleanM = m.toLowerCase().replace("x", "").replace("+", "").replace("#", "");
                return cleanM === cleaned;
            });
            if (index !== -1) {
                matchedMove = legalMoves[index];
            }
        }

        if (matchedMove) {
            const success = onMakeMove(matchedMove);
            if (success) {
                setStatusText(`Moved: ${matchedMove}`);
                speakText(matchedMove);
            } else {
                setStatusText(`Illegal move in current state: ${matchedMove}`);
                speakText(`Illegal move ${matchedMove}`);
            }
        } else {
            setStatusText(`Could not resolve move: "${speechText}" (parsed as "${cleaned}")`);
            speakText("Could not resolve move");
        }
    };

    useEffect(() => {
        if (!recognition) return;

        recognition.onresult = (event: any) => {
            const currentResultIndex = event.resultIndex;
            const text = event.results[currentResultIndex][0].transcript.trim().toLowerCase();
            setTranscript(text);
            setStatusText(`Heard: "${text}"`);
            processSpokenMove(text);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event);
            if (event.error === "no-speech") {
                setStatusText("No speech detected. Listening...");
            } else {
                setStatusText(`Error: ${event.error}`);
                setIsListening(false);
            }
        };

        recognition.onend = () => {
            // Keep listening if user didn't explicitly stop it
            if (isListening) {
                try {
                    recognition.start();
                } catch (e) {
                    console.debug(e);
                }
            }
        };

        return () => {
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            try {
                recognition.stop();
            } catch (e) {
                console.debug(e);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isListening, game]);

    return (
        <div className="flex flex-col gap-2 p-3 bg-base-200 rounded-xl border border-base-300 shadow-sm mt-3">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-base-content/70 uppercase tracking-wider flex items-center gap-1">
                    🎙️ Voice Commands
                </span>
                <div className="flex items-center gap-1.5">
                    {/* Speech toggle */}
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="btn btn-ghost btn-xs btn-circle text-base-content/60"
                        title={isMuted ? "Unmute Commentator" : "Mute Commentator"}
                    >
                        {isMuted ? <IconVolumeOff size={14} /> : <IconVolume size={14} />}
                    </button>

                    {/* Microphone toggle */}
                    <button
                        onClick={isListening ? stopListening : startListening}
                        className={`btn btn-xs btn-circle ${
                            isListening ? "btn-error text-white animate-pulse" : "btn-neutral"
                        }`}
                        title={isListening ? "Stop Voice Recognition" : "Start Voice Recognition"}
                    >
                        {isListening ? <IconMicrophone size={14} /> : <IconMicrophoneOff size={14} />}
                    </button>
                </div>
            </div>
            <div className="text-[9px] text-base-content/50 font-mono truncate leading-none">
                {statusText}
            </div>
            {transcript && (
                <div className="text-[10px] bg-base-300 px-2 py-0.5 rounded italic truncate text-base-content/80">
                    Heard: &quot;{transcript}&quot;
                </div>
            )}
        </div>
    );
}
