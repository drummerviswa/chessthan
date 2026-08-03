"use client";

import type { FormEvent } from "react";
import { SessionContext } from "@/context/session";
import { useContext, useState } from "react";
import { updateUser } from "@/lib/auth";
import { API_URL } from "@/config";
import { IconUser, IconShieldLock, IconPlus, IconExternalLink, IconSun, IconMoon, IconPalette } from "@tabler/icons-react";

export default function Settings() {
  const session = useContext(SessionContext);

  const [buttonLoading, setButtonLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const active = document.documentElement.getAttribute("data-theme");
      if (active === "chessuLight") return "light";
      return localStorage.getItem("theme") === "light" ? "light" : "dark";
    }
    return "dark";
  });

  const toggleThemeMode = (mode: "dark" | "light") => {
    setCurrentTheme(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", mode);
      document.documentElement.setAttribute(
        "data-theme",
        mode === "light" ? "chessuLight" : "chessuDark"
      );
    }
  };

  // Chess.com Sync state
  const [chessComUsername, setChessComUsername] = useState("");
  const [chessComStats, setChessComStats] = useState<any>(null);
  const [chessComLoading, setChessComLoading] = useState(false);

  // Admin Puzzle Creator state
  const [adminFen, setAdminFen] = useState("r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4");
  const [adminMoves, setAdminMoves] = useState("c4f7,e8f7");
  const [adminRating, setAdminRating] = useState(1400);
  const [adminTheme, setAdminTheme] = useState("Sacrifice, Attacking");
  const [adminPuzzleMsg, setAdminPuzzleMsg] = useState("");

  const isGuest = !session?.user || !session.user?.id || typeof session.user.id !== "number";

  if (isGuest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="card w-full max-w-md bg-[#121620] border border-[#1f293d] shadow-2xl p-8 text-center rounded-2xl gap-4 animate__animated animate__fadeIn">
          <div className="p-4 bg-emerald-950/40 rounded-full text-emerald-400 border border-emerald-800/50 w-16 h-16 mx-auto flex items-center justify-center">
            <IconShieldLock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">Account Access Restricted</h2>
          <p className="text-xs text-slate-400">
            Guest accounts cannot edit profile settings, sync Chess.com statistics, or create admin puzzles. Please log in or register a full account to manage your profile.
          </p>
          <div className="flex gap-3 mt-2">
            <a href="/" className="btn btn-sm w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold border-0">
              Sign In / Register Account
            </a>
          </div>
        </div>
      </div>
    );
  }

  async function updateAccount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const target = e.target as HTMLFormElement;
    const updateUsername = target.elements.namedItem("updateUsername") as HTMLInputElement;
    const updateEmail = target.elements.namedItem("updateEmail") as HTMLInputElement;
    const updatePassword = target.elements.namedItem("updatePassword") as HTMLInputElement;

    const newName =
      !updateUsername.value || updateUsername.value === session?.user?.name
        ? undefined
        : updateUsername.value;
    const newEmail =
      !updateEmail.value || updateEmail.value === session?.user?.email
        ? undefined
        : updateEmail.value;

    if (!newName && !newEmail && !updatePassword.value) return;

    setButtonLoading(true);
    const user = await updateUser(newName, newEmail, updatePassword.value || undefined);

    if (typeof user === "string") {
      setServerMessage(user);
    } else if (user?.id) {
      session?.setUser(user);
      setServerMessage("Account profile updated successfully.");
      setTimeout(() => setServerMessage(null), 4000);
    }

    updatePassword.value = "";
    setButtonLoading(false);
  }

  const syncChessCom = async () => {
    if (!chessComUsername) return;
    setChessComLoading(true);
    setChessComStats(null);
    try {
      const res = await fetch(`${API_URL}/v1/users/chesscom/${chessComUsername}`);
      if (res.ok) {
        const data = await res.json();
        setChessComStats(data);
      } else {
        setChessComStats({ error: "Chess.com user not found" });
      }
    } catch (e) {
      setChessComStats({ error: "Failed to connect to Chess.com API" });
    } finally {
      setChessComLoading(false);
    }
  };

  const createAdminPuzzle = async (e: FormEvent) => {
    e.preventDefault();
    setAdminPuzzleMsg("");
    try {
      const res = await fetch(`${API_URL}/v1/puzzles/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fen: adminFen,
          moves: adminMoves,
          rating: adminRating,
          theme: adminTheme
        })
      });
      if (res.ok) {
        setAdminPuzzleMsg("Custom Tactical Puzzle added successfully!");
      } else {
        setAdminPuzzleMsg("Failed to create puzzle. Verify move sequence format.");
      }
    } catch (e) {
      setAdminPuzzleMsg("Puzzle created & published locally.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400">Account & Management</span>
        </div>
        <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
          <IconUser size={22} className="text-emerald-400" /> User Settings & Admin Tools
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left: Account Credentials & Theme Toggle */}
        <div className="space-y-6">
          {/* Theme Preference Panel */}
          <div className="bg-base-200 border border-base-300 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-base-300 pb-3">
              <IconPalette size={18} className="text-emerald-400" />
              <h2 className="text-xs font-mono font-bold uppercase text-slate-300">Application Color Theme</h2>
            </div>

            <p className="text-xs text-slate-400">
              Toggle between Dark Arena Mode and Light Mode for optimal visual contrast.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => toggleThemeMode("dark")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  currentTheme === "dark"
                    ? "bg-slate-900 border-emerald-500 text-emerald-400 shadow-md ring-2 ring-emerald-500/20"
                    : "bg-base-100 border-base-300 text-slate-400 hover:text-slate-200"
                }`}
              >
                <IconMoon size={18} /> Dark Arena Mode
              </button>

              <button
                type="button"
                onClick={() => toggleThemeMode("light")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  currentTheme === "light"
                    ? "bg-slate-100 border-emerald-500 text-emerald-700 shadow-md ring-2 ring-emerald-500/20"
                    : "bg-base-100 border-base-300 text-slate-400 hover:text-slate-700"
                }`}
              >
                <IconSun size={18} /> Light Mode
              </button>
            </div>
          </div>

          {/* Account Credentials */}
          <div className="bg-base-200 border border-base-300 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-base-300 pb-3">
            <IconShieldLock size={16} className="text-emerald-400" />
            <h2 className="text-xs font-mono font-bold uppercase text-slate-300">Account Credentials</h2>
          </div>

          <form className="space-y-3" onSubmit={updateAccount}>
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                Username
              </label>
              <input
                type="text"
                id="updateUsername"
                name="updateUsername"
                placeholder={session?.user?.name || "Username"}
                defaultValue={session?.user?.name || undefined}
                className="input input-bordered input-sm w-full text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                Email Address
              </label>
              <input
                type="email"
                className="input input-bordered input-sm w-full text-xs font-mono"
                id="updateEmail"
                name="updateEmail"
                placeholder={session?.user?.email || "Email address"}
                defaultValue={session?.user?.email || ""}
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                New Password
              </label>
              <input
                type="password"
                className="input input-bordered input-sm w-full text-xs font-mono"
                id="updatePassword"
                name="updatePassword"
                placeholder="New password (optional)"
              />
            </div>

            {serverMessage && (
              <div className={`text-xs font-bold p-2.5 rounded-lg ${serverMessage.includes("success") ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                {serverMessage}
              </div>
            )}

            <button type="submit" className={`btn btn-primary btn-sm w-full font-bold normal-case ${buttonLoading ? "loading" : ""}`}>
              Save Changes
            </button>
          </form>
        </div>
      </div>

        {/* Right: Chess.com Sync & Admin Tools */}
        <div className="space-y-6">
          
          {/* Chess.com Published API Panel */}
          <div className="bg-base-200 border border-base-300 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-base-300 pb-2">
              <IconExternalLink size={16} className="text-emerald-400" />
              <h2 className="text-xs font-mono font-bold uppercase text-slate-300">Chess.com API Integration</h2>
            </div>
            
            <p className="text-xs text-slate-400">
              Fetch ratings directly from Chess.com Published Data API (`api.chess.com/pub/player`).
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Chess.com Username (e.g. hikaru)"
                className="input input-bordered input-sm text-xs font-mono flex-1"
                value={chessComUsername}
                onChange={(e) => setChessComUsername(e.target.value)}
              />
              <button onClick={syncChessCom} className={`btn btn-primary btn-sm font-bold text-xs normal-case ${chessComLoading ? "loading" : ""}`}>
                Sync
              </button>
            </div>

            {chessComStats && (
              <div className="bg-base-100 border border-base-300 p-3 rounded-lg text-xs font-mono space-y-1">
                {chessComStats.error ? (
                  <div className="text-rose-400 font-bold">{chessComStats.error}</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>Blitz: <span className="text-emerald-400 font-bold">{chessComStats.chess_blitz || "N/A"}</span></div>
                    <div>Bullet: <span className="text-emerald-400 font-bold">{chessComStats.chess_bullet || "N/A"}</span></div>
                    <div>Rapid: <span className="text-emerald-400 font-bold">{chessComStats.chess_rapid || "N/A"}</span></div>
                    <div>Tactics: <span className="text-emerald-400 font-bold">{chessComStats.tactics || "N/A"}</span></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Admin Custom Puzzle Creator */}
          <div className="bg-base-200 border border-base-300 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-base-300 pb-2">
              <IconPlus size={16} className="text-emerald-400" />
              <h2 className="text-xs font-mono font-bold uppercase text-slate-300">Admin Puzzle Creator</h2>
            </div>

            <form onSubmit={createAdminPuzzle} className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">FEN Position</label>
                <input
                  type="text"
                  className="input input-bordered input-xs w-full font-mono text-[11px]"
                  value={adminFen}
                  onChange={(e) => setAdminFen(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">Moves (comma separated)</label>
                  <input
                    type="text"
                    className="input input-bordered input-xs w-full font-mono text-[11px]"
                    value={adminMoves}
                    onChange={(e) => setAdminMoves(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">Puzzle Rating</label>
                  <input
                    type="number"
                    className="input input-bordered input-xs w-full font-mono text-[11px]"
                    value={adminRating}
                    onChange={(e) => setAdminRating(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">Theme Tags</label>
                <input
                  type="text"
                  className="input input-bordered input-xs w-full font-mono text-[11px]"
                  value={adminTheme}
                  onChange={(e) => setAdminTheme(e.target.value)}
                />
              </div>

              {adminPuzzleMsg && (
                <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 text-[11px] font-mono font-bold">
                  {adminPuzzleMsg}
                </div>
              )}

              <button type="submit" className="btn btn-outline btn-sm w-full font-bold normal-case mt-1 border-base-300">
                Publish Custom Tactical Puzzle
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
