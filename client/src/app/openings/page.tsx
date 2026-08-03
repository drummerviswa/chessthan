"use client";

import { useState } from "react";
import Link from "next/link";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { OPENINGS_DATABASE, Opening } from "@/lib/openingsData";
import {
  IconBook,
  IconSearch,
  IconDeviceDesktopAnalytics,
  IconRobot,
  IconPlayerSkipBack,
  IconChevronLeft,
  IconChevronRight,
  IconPlayerSkipForward,
  IconCheck,
  IconCopy,
  IconSparkles
} from "@tabler/icons-react";

export default function OpeningsExplorerPage() {
  const [selectedOpening, setSelectedOpening] = useState<Opening>(OPENINGS_DATABASE[0]);
  const [selectedFamily, setSelectedFamily] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [moveIndex, setMoveIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Extract families
  const families = ["All", ...Array.from(new Set(OPENINGS_DATABASE.map((o) => o.family)))];

  // Filter openings
  const filteredOpenings = OPENINGS_DATABASE.filter((op) => {
    const matchesFamily = selectedFamily === "All" || op.family === selectedFamily;
    const matchesQuery =
      op.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.eco.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.moves.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFamily && matchesQuery;
  });

  // Build position up to moveIndex for selected opening
  const buildGameForOpening = (op: Opening, idx: number) => {
    const g = new Chess();
    const movesList = op.moves.replace(/\d+\.\s*/g, "").trim().split(/\s+/);
    for (let i = 0; i < idx && i < movesList.length; i++) {
      try {
        g.move(movesList[i]);
      } catch {
        break;
      }
    }
    return g;
  };

  const currentMovesList = selectedOpening.moves.replace(/\d+\.\s*/g, "").trim().split(/\s+/);
  const currentGame = buildGameForOpening(selectedOpening, moveIndex);

  const handleSelectOpening = (op: Opening) => {
    setSelectedOpening(op);
    setMoveIndex(0);
  };

  const handleCopyPgn = () => {
    navigator.clipboard.writeText(selectedOpening.pgn);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6 animate__animated animate__fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-200 border border-base-300 p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400">
              PGN Mentor Database
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
            <IconBook size={24} className="text-emerald-400" /> Master Openings Explorer
          </h1>
          <p className="text-xs text-slate-400">
            Study ECO theory, master win rates, strategic plans, and step through move variations.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/analysis?pgn=${encodeURIComponent(selectedOpening.pgn)}`}
            className="btn btn-sm btn-primary font-bold gap-1.5"
          >
            <IconDeviceDesktopAnalytics size={16} /> Analyze Lines
          </Link>
          <Link
            href="/local"
            className="btn btn-sm btn-outline border-base-300 text-slate-200 font-bold gap-1.5"
          >
            <IconRobot size={16} /> Practice vs Bot
          </Link>
        </div>
      </div>

      {/* Main Grid: Left Board & Details, Right Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Col: Interactive Board & Stats (5 cols) */}
        <div className="lg:col-span-5 bg-base-200 border border-base-300 rounded-2xl p-5 space-y-5 shadow-lg">
          {/* Active Opening Title */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ECO {selectedOpening.eco}
              </span>
              <span className="text-[10px] font-mono text-slate-400">{selectedOpening.family}</span>
            </div>
            <h2 className="text-lg font-black text-slate-100">{selectedOpening.name}</h2>
            <p className="text-xs font-mono text-emerald-400 font-semibold">{selectedOpening.moves}</p>
          </div>

          {/* Board */}
          <div className="w-full aspect-square max-w-[340px] mx-auto rounded-xl overflow-hidden shadow-inner border border-emerald-950/50">
            <Chessboard
              position={currentGame.fen()}
              customDarkSquareStyle={{ backgroundColor: "#0e4a3b" }}
              customLightSquareStyle={{ backgroundColor: "#eeeddf" }}
              animationDuration={250}
              arePiecesDraggable={false}
            />
          </div>

          {/* Move Stepper Controls */}
          <div className="flex items-center justify-between bg-base-100 border border-base-300 p-2 rounded-xl">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMoveIndex(0)}
                disabled={moveIndex === 0}
                className="btn btn-xs btn-ghost text-slate-400"
              >
                <IconPlayerSkipBack size={14} />
              </button>
              <button
                onClick={() => setMoveIndex((prev) => Math.max(0, prev - 1))}
                disabled={moveIndex === 0}
                className="btn btn-xs btn-ghost text-slate-400"
              >
                <IconChevronLeft size={14} />
              </button>
              <button
                onClick={() => setMoveIndex((prev) => Math.min(currentMovesList.length, prev + 1))}
                disabled={moveIndex >= currentMovesList.length}
                className="btn btn-xs btn-ghost text-slate-400"
              >
                <IconChevronRight size={14} />
              </button>
              <button
                onClick={() => setMoveIndex(currentMovesList.length)}
                disabled={moveIndex >= currentMovesList.length}
                className="btn btn-xs btn-ghost text-slate-400"
              >
                <IconPlayerSkipForward size={14} />
              </button>
            </div>

            <span className="text-[11px] font-mono font-bold text-slate-400">
              Ply {moveIndex} / {currentMovesList.length}
            </span>

            <button
              onClick={handleCopyPgn}
              className="btn btn-xs btn-outline border-base-300 text-slate-300 font-bold gap-1"
            >
              {copied ? <IconCheck size={12} className="text-emerald-400" /> : <IconCopy size={12} />}
              {copied ? "Copied" : "Copy PGN"}
            </button>
          </div>

          {/* Master Win Rates Bar */}
          <div className="space-y-1.5 pt-2 border-t border-base-300">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold">
              <span className="text-slate-200">White Win {selectedOpening.whiteWinRate}%</span>
              <span className="text-slate-400">Draw {selectedOpening.drawRate}%</span>
              <span className="text-slate-300">Black Win {selectedOpening.blackWinRate}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-base-300">
              <div
                style={{ width: `${selectedOpening.whiteWinRate}%` }}
                className="bg-slate-200 h-full"
                title={`White Win ${selectedOpening.whiteWinRate}%`}
              />
              <div
                style={{ width: `${selectedOpening.drawRate}%` }}
                className="bg-slate-500 h-full"
                title={`Draw ${selectedOpening.drawRate}%`}
              />
              <div
                style={{ width: `${selectedOpening.blackWinRate}%` }}
                className="bg-emerald-600 h-full"
                title={`Black Win ${selectedOpening.blackWinRate}%`}
              />
            </div>
          </div>

          {/* Key Strategic Concepts */}
          <div className="space-y-2 pt-2 border-t border-base-300">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <IconSparkles size={14} /> Key Strategic Plans
            </span>
            <ul className="space-y-1">
              {selectedOpening.keyConcepts.map((concept, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{concept}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Col: Directory List & Search (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-base-200 border border-base-300 p-4 rounded-2xl space-y-3 shadow-sm">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by opening name, ECO code (e.g. B90), or move sequence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered input-sm w-full pl-9 text-xs font-mono"
              />
              <IconSearch size={16} className="absolute left-3 top-2.5 text-slate-500" />
            </div>

            {/* Family Category Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {families.map((fam) => (
                <button
                  key={fam}
                  onClick={() => setSelectedFamily(fam)}
                  className={`btn btn-xs rounded-lg font-semibold ${
                    selectedFamily === fam ? "btn-primary" : "btn-ghost text-slate-400"
                  }`}
                >
                  {fam}
                </button>
              ))}
            </div>
          </div>

          {/* Opening Cards Directory */}
          <div className="space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
            {filteredOpenings.map((op) => {
              const isSelected = selectedOpening.eco === op.eco;
              return (
                <div
                  key={op.eco}
                  onClick={() => handleSelectOpening(op)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-primary/10 border-primary shadow-md"
                      : "bg-base-200 border-base-300 hover:border-slate-600"
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-base-300 text-emerald-400">
                        {op.eco}
                      </span>
                      <span className="text-xs font-bold text-slate-200">{op.name}</span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400">{op.moves}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{op.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 bg-base-300 px-2 py-1 rounded font-bold">
                      {op.whiteWinRate}% W
                    </span>
                    <button className="btn btn-xs btn-primary font-bold">Explore</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
