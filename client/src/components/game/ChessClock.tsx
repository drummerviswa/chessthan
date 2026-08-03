"use client";

import { useEffect, useRef } from "react";
import { IconClock, IconAlertTriangle } from "@tabler/icons-react";
import { playSound, triggerHaptic } from "@/lib/audioEffects";

interface ChessClockProps {
  side: "white" | "black";
  playerName: string;
  isPro?: boolean;
  rating?: number;
  timeMs: number;
  isActiveTurn: boolean;
  isGameOver: boolean;
  timeControl?: string;
  materialAdvantage?: number;
}

export default function ChessClock({
  side,
  playerName,
  isPro = false,
  rating = 1500,
  timeMs,
  isActiveTurn,
  isGameOver,
  timeControl = "10+0",
  materialAdvantage = 0
}: ChessClockProps) {
  const previousTimeRef = useRef(timeMs);

  // Format digital time display: mm:ss or mm:ss.ms
  const formatTime = (ms: number) => {
    if (ms <= 0) return "0:00.0";
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;

    if (ms < 10000) {
      const tenths = Math.floor((ms % 1000) / 100);
      return `${mins}:${secs < 10 ? "0" : ""}${secs}.${tenths}`;
    }
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const isLowTime = timeMs < 20000 && timeMs > 0;
  const isCriticalTime = timeMs < 10000 && timeMs > 0;
  const isFlagged = timeMs <= 0;

  // Audio tick trigger for low time
  useEffect(() => {
    if (isActiveTurn && !isGameOver && isCriticalTime) {
      const currentSec = Math.floor(timeMs / 1000);
      const prevSec = Math.floor(previousTimeRef.current / 1000);
      if (currentSec !== prevSec) {
        playSound("lowTime");
        triggerHaptic("lowTime");
      }
    }
    previousTimeRef.current = timeMs;
  }, [timeMs, isActiveTurn, isGameOver, isCriticalTime]);

  const isWhite = side === "white";

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 shadow-lg ${
        isFlagged
          ? "bg-rose-950/80 border-rose-600 text-rose-300 shadow-rose-950/50 ring-2 ring-rose-500/50"
          : isCriticalTime && isActiveTurn
          ? "bg-rose-950 border-rose-500 text-rose-200 animate-pulse ring-2 ring-rose-500/60 shadow-rose-900/40"
          : isLowTime && isActiveTurn
          ? "bg-amber-950/90 border-amber-500 text-amber-200 ring-2 ring-amber-500/40"
          : isActiveTurn
          ? "bg-emerald-950/80 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500/40 shadow-emerald-900/30"
          : "bg-base-200 border-base-300 text-slate-300 opacity-90"
      }`}
    >
      {/* Player Meta Info */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Color Badge Indicator */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm border shadow-inner shrink-0 ${
            isWhite
              ? "bg-slate-100 text-slate-900 border-slate-300"
              : "bg-slate-900 text-slate-100 border-slate-700"
          }`}
        >
          {isWhite ? "⚪" : "⚫"}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-extrabold text-xs truncate tracking-tight">
              {playerName || (isWhite ? "White Player" : "Black Player")}
            </span>
            {isPro && (
              <span className="badge badge-warning badge-xs font-bold text-[9px] px-1 py-0 shadow-sm">
                PRO
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
            <span>{rating} ELO</span>
            <span className="badge badge-ghost badge-xs opacity-70 text-[9px] px-1">{timeControl}</span>
            {materialAdvantage > 0 && (
              <span className="font-bold text-emerald-400">+{materialAdvantage}</span>
            )}
          </div>
        </div>
      </div>

      {/* Digital Timer Clock Box */}
      <div className="flex flex-col items-end shrink-0 pl-3">
        <div
          className={`px-3 py-1 rounded-xl font-mono text-lg font-black tracking-wider flex items-center gap-1.5 shadow-inner border ${
            isFlagged
              ? "bg-rose-900 border-rose-500 text-white animate-bounce"
              : isCriticalTime && isActiveTurn
              ? "bg-rose-900/90 border-rose-500 text-rose-100"
              : isLowTime && isActiveTurn
              ? "bg-amber-900/80 border-amber-400 text-amber-100"
              : isActiveTurn
              ? "bg-emerald-600 border-emerald-400 text-white"
              : "bg-base-300 border-base-300 text-slate-300"
          }`}
        >
          {isActiveTurn && !isGameOver && (
            <IconClock
              size={15}
              className={`shrink-0 ${isLowTime ? "text-rose-400 animate-spin" : "text-emerald-200 animate-pulse"}`}
            />
          )}
          {isFlagged ? "0:00.0" : formatTime(timeMs)}
        </div>

        {/* Turn / Flagged Label */}
        <div className="text-[9px] font-mono font-bold uppercase tracking-widest mt-0.5">
          {isFlagged ? (
            <span className="text-rose-400 flex items-center gap-0.5">
              <IconAlertTriangle size={10} /> FLAGGED
            </span>
          ) : isActiveTurn && !isGameOver ? (
            <span className={isLowTime ? "text-rose-400 animate-pulse" : "text-emerald-400"}>
              {isLowTime ? "TIME TROUBLE!" : "ACTIVE TURN"}
            </span>
          ) : (
            <span className="text-slate-500">WAITING</span>
          )}
        </div>
      </div>
    </div>
  );
}
