"use client";

import { useState, useEffect } from "react";
import { fetchPublicGames } from "@/lib/game";
import JoinButton from "./JoinButton";
import { IconRotateClockwise, IconSwords } from "@tabler/icons-react";

export default function PublicGames() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGames = async () => {
    setLoading(true);
    try {
      const data = await fetchPublicGames();
      setGames(data || []);
    } catch (e) {
      console.error("Error loading public games:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  return (
    <div className="flex flex-col items-stretch w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <IconSwords size={14} className="text-emerald-400" /> Public Arena Lobbies
        </h3>
        <button
          onClick={loadGames}
          className="btn btn-ghost btn-xs normal-case text-emerald-400 font-bold gap-1"
          disabled={loading}
        >
          <IconRotateClockwise size={12} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-6 bg-base-200 rounded-xl border border-base-300">
          <span className="loading loading-spinner loading-sm text-primary"></span>
        </div>
      ) : games.length === 0 ? (
        <div className="text-center text-xs text-slate-400 py-6 bg-base-200 rounded-xl border border-base-300 font-mono">
          No public lobbies open right now. Create a room to start!
        </div>
      ) : (
        <div className="bg-base-200 max-h-56 overflow-y-auto rounded-xl border border-base-300">
          <table className="table table-compact w-full text-xs">
            <thead>
              <tr className="border-b border-base-300 text-slate-400">
                <th className="py-2">Host</th>
                <th className="py-2">Opponent</th>
                <th className="py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => {
                const opponentName =
                  (game.host?.id === game.white?.id
                    ? game.black?.name
                    : game.white?.name) || "Waiting for opponent...";
                const isFull = !!(game.white && game.black);

                return (
                  <tr key={game.code} className="hover:bg-base-300/50 border-b border-base-300/40">
                    <td className="font-bold py-2 truncate max-w-[110px] text-slate-200">
                      {game.host?.name || "Guest"}
                    </td>
                    <td className="py-2 truncate max-w-[110px] text-slate-400">
                      {opponentName}
                    </td>
                    <td className="py-2 text-right">
                      <JoinButton code={game.code as string} isFull={isFull} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
