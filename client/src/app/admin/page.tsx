"use client";

import { useState, useContext, FormEvent } from "react";
import { SessionContext } from "@/context/session";
import {
  IconShieldLock,
  IconPuzzle,
  IconRobot,
  IconUsers,
  IconActivity,
  IconPlus,
  IconCheck
} from "@tabler/icons-react";

export default function AdminDashboardPage() {
  const session = useContext(SessionContext);
  const [activeTab, setActiveTab] = useState<"puzzles" | "bots" | "users" | "metrics">("puzzles");

  // Admin Custom Puzzle state
  const [puzzleFen, setPuzzleFen] = useState("r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4");
  const [puzzleMoves, setPuzzleMoves] = useState("c4f7,e8f7");
  const [puzzleRating, setPuzzleRating] = useState(1500);
  const [puzzleTheme, setPuzzleTheme] = useState("Sacrifice, Tactical Attack");
  const [puzzleTitle, setPuzzleTitle] = useState("Bishop Sacrifice Attack");
  const [puzzleMsg, setPuzzleMsg] = useState<string | null>(null);

  // Admin Custom Bot state
  const [botName, setBotName] = useState("Cyber Grandmaster");
  const [botElo, setBotElo] = useState(2600);
  const [botStyle, setBotStyle] = useState("Aggressive Tactical Sacrifice");
  const [botDesc, setBotDesc] = useState("Calculates deep tactical combinations and sacrifices pieces for central attacks.");
  const [botMsg, setBotMsg] = useState<string | null>(null);

  // User Management Search
  const [userSearch, setUserSearch] = useState("");

  // Check admin authorization
  const u = session?.user as any;
  const isAdmin =
    u &&
    (u.role === "admin" ||
      u.isAdmin ||
      u.name?.toLowerCase() === "admin" ||
      u.email?.toLowerCase().includes("admin"));

  if (!session || !session.user || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 animate__animated animate__fadeIn">
        <div className="card w-full max-w-md bg-[#121620] border border-[#1f293d] shadow-2xl p-8 text-center rounded-2xl gap-4">
          <div className="p-4 bg-rose-950/40 rounded-full text-rose-400 border border-rose-800/50 w-16 h-16 mx-auto flex items-center justify-center">
            <IconShieldLock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">Admin Access Restricted</h2>
          <p className="text-xs text-slate-400">
            This dashboard requires Administrator credentials. You are currently logged in as{" "}
            <span className="font-mono text-emerald-400 font-bold">{session?.user?.name || "Guest"}</span>.
          </p>
          <div className="flex gap-3 mt-2">
            <a href="/" className="btn btn-sm w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 font-bold">
              Return to Arena
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Create Puzzle Submission
  const handleCreatePuzzle = (e: FormEvent) => {
    e.preventDefault();
    const newPuzzle = {
      id: `custom_${Date.now()}`,
      fen: puzzleFen,
      moves: puzzleMoves.split(",").map((m) => m.trim()),
      rating: Number(puzzleRating),
      theme: puzzleTheme,
      title: puzzleTitle
    };

    const existing = JSON.parse(localStorage.getItem("chessthan:custom_puzzles") || "[]");
    existing.push(newPuzzle);
    localStorage.setItem("chessthan:custom_puzzles", JSON.stringify(existing));

    setPuzzleMsg(`Puzzle "${puzzleTitle}" successfully published to platform pool!`);
    setTimeout(() => setPuzzleMsg(null), 4000);
  };

  // Create Bot Submission
  const handleCreateBot = (e: FormEvent) => {
    e.preventDefault();
    const newBot = {
      id: `bot_${botName.toLowerCase().replace(/\s+/g, "_")}`,
      name: botName,
      elo: Number(botElo),
      style: botStyle,
      desc: botDesc,
      avatar: "🤖"
    };

    const existing = JSON.parse(localStorage.getItem("chessthan:custom_bots") || "[]");
    existing.push(newBot);
    localStorage.setItem("chessthan:custom_bots", JSON.stringify(existing));

    setBotMsg(`Bot "${botName}" (${botElo} ELO) successfully initialized!`);
    setTimeout(() => setBotMsg(null), 4000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-6 animate__animated animate__fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-200 border border-base-300 p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-rose-400">
              System Control Console
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
            <IconShieldLock size={24} className="text-rose-400" /> Platform Admin Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Publish custom tactical puzzles, create custom AI bots, manage user memberships, and monitor live metrics.
          </p>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="tabs tabs-boxed grid grid-cols-4 p-1 bg-base-200 border border-base-300 rounded-xl">
        <button
          onClick={() => setActiveTab("puzzles")}
          className={`tab flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg ${
            activeTab === "puzzles" ? "tab-active bg-primary text-primary-content" : "text-slate-400"
          }`}
        >
          <IconPuzzle size={16} /> Puzzle Creator
        </button>
        <button
          onClick={() => setActiveTab("bots")}
          className={`tab flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg ${
            activeTab === "bots" ? "tab-active bg-primary text-primary-content" : "text-slate-400"
          }`}
        >
          <IconRobot size={16} /> Bot Builder
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`tab flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg ${
            activeTab === "users" ? "tab-active bg-primary text-primary-content" : "text-slate-400"
          }`}
        >
          <IconUsers size={16} /> User Management
        </button>
        <button
          onClick={() => setActiveTab("metrics")}
          className={`tab flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg ${
            activeTab === "metrics" ? "tab-active bg-primary text-primary-content" : "text-slate-400"
          }`}
        >
          <IconActivity size={16} /> System Metrics
        </button>
      </div>

      {/* Tab 1: Custom Puzzle Creator */}
      {activeTab === "puzzles" && (
        <div className="bg-base-200 border border-base-300 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="space-y-1 border-b border-base-300 pb-3">
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
              <IconPuzzle className="text-emerald-400" size={18} /> Publish Custom Tactical Puzzle
            </h3>
            <p className="text-xs text-slate-400">
              Input a starting FEN position and exact move solution sequence for platform players.
            </p>
          </div>

          {puzzleMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
              <IconCheck size={16} /> {puzzleMsg}
            </div>
          )}

          <form onSubmit={handleCreatePuzzle} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono text-slate-400 font-bold uppercase block mb-1">
                  Puzzle Title
                </label>
                <input
                  type="text"
                  required
                  value={puzzleTitle}
                  onChange={(e) => setPuzzleTitle(e.target.value)}
                  className="input input-bordered input-sm w-full font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 font-bold uppercase block mb-1">
                  Target Rating (ELO)
                </label>
                <input
                  type="number"
                  required
                  value={puzzleRating}
                  onChange={(e) => setPuzzleRating(Number(e.target.value))}
                  className="input input-bordered input-sm w-full font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 font-bold uppercase block mb-1">
                FEN Position
              </label>
              <input
                type="text"
                required
                value={puzzleFen}
                onChange={(e) => setPuzzleFen(e.target.value)}
                className="input input-bordered input-sm w-full font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 font-bold uppercase block mb-1">
                Solution Moves (comma separated SAN format, e.g. c4f7,e8f7)
              </label>
              <input
                type="text"
                required
                value={puzzleMoves}
                onChange={(e) => setPuzzleMoves(e.target.value)}
                className="input input-bordered input-sm w-full font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 font-bold uppercase block mb-1">
                Tactical Theme
              </label>
              <input
                type="text"
                required
                value={puzzleTheme}
                onChange={(e) => setPuzzleTheme(e.target.value)}
                className="input input-bordered input-sm w-full font-mono text-xs"
              />
            </div>

            <button type="submit" className="btn btn-sm btn-primary font-bold gap-1.5 px-6">
              <IconPlus size={16} /> Publish Puzzle to Pool
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Custom Bot Builder */}
      {activeTab === "bots" && (
        <div className="bg-base-200 border border-base-300 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="space-y-1 border-b border-base-300 pb-3">
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
              <IconRobot className="text-sky-400" size={18} /> Admin Custom Bot Creator
            </h3>
            <p className="text-xs text-slate-400">Configure new AI sparring bots with custom ELO ratings and playstyles.</p>
          </div>

          {botMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
              <IconCheck size={16} /> {botMsg}
            </div>
          )}

          <form onSubmit={handleCreateBot} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono text-slate-400 font-bold uppercase block mb-1">
                  Bot Name
                </label>
                <input
                  type="text"
                  required
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  className="input input-bordered input-sm w-full font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 font-bold uppercase block mb-1">
                  Target Rating (ELO)
                </label>
                <input
                  type="number"
                  required
                  value={botElo}
                  onChange={(e) => setBotElo(Number(e.target.value))}
                  className="input input-bordered input-sm w-full font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 font-bold uppercase block mb-1">
                Playstyle Category
              </label>
              <input
                type="text"
                required
                value={botStyle}
                onChange={(e) => setBotStyle(e.target.value)}
                className="input input-bordered input-sm w-full font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 font-bold uppercase block mb-1">
                Description / Personality
              </label>
              <textarea
                required
                rows={2}
                value={botDesc}
                onChange={(e) => setBotDesc(e.target.value)}
                className="textarea textarea-bordered textarea-sm w-full font-mono text-xs"
              />
            </div>

            <button type="submit" className="btn btn-sm btn-primary font-bold gap-1.5 px-6">
              <IconPlus size={16} /> Deploy Custom Bot
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: User Management */}
      {activeTab === "users" && (
        <div className="bg-base-200 border border-base-300 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="space-y-1 border-b border-base-300 pb-3">
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
              <IconUsers className="text-purple-400" size={18} /> User & Membership Controls
            </h3>
            <p className="text-xs text-slate-400">Search users, upgrade subscriptions, and assign roles.</p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search user by handle or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="input input-bordered input-sm flex-grow text-xs font-mono"
            />
            <button className="btn btn-sm btn-primary font-bold">Search</button>
          </div>

          <div className="space-y-2 pt-2">
            <div className="p-4 bg-base-100 border border-base-300 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  {session.user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    {session.user.name}
                    <span className="badge badge-error badge-xs font-bold">ADMIN</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">{session.user.email || "admin@chessthan.com"}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="badge badge-warning badge-xs font-bold px-2 py-0.5">DIAMOND PRO</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: System Metrics */}
      {activeTab === "metrics" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-base-200 border border-base-300 rounded-2xl space-y-1">
            <div className="text-xs font-mono font-bold text-emerald-400 uppercase">Active Games</div>
            <div className="text-3xl font-black text-white">24 Live</div>
            <div className="text-[11px] text-slate-400">Rated, casual & bot matches</div>
          </div>
          <div className="p-5 bg-base-200 border border-base-300 rounded-2xl space-y-1">
            <div className="text-xs font-mono font-bold text-sky-400 uppercase">Puzzle Engine Pool</div>
            <div className="text-3xl font-black text-white">12,450</div>
            <div className="text-[11px] text-slate-400">Tactical problems active</div>
          </div>
          <div className="p-5 bg-base-200 border border-base-300 rounded-2xl space-y-1">
            <div className="text-xs font-mono font-bold text-purple-400 uppercase">Stockfish Engine</div>
            <div className="text-3xl font-black text-white">v16.1 WASM</div>
            <div className="text-[11px] text-slate-400">Online & ready</div>
          </div>
        </div>
      )}
    </div>
  );
}
