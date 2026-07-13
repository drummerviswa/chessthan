"use client";

import { useState, useEffect } from "react";
import { fetchPublicGames } from "@/lib/game";
import JoinButton from "./JoinButton";

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
        <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/50">
          Public Matches
        </h3>
        <button
          onClick={loadGames}
          className="btn btn-ghost btn-xs normal-case text-primary font-bold"
          disabled={loading}
        >
          {loading ? "Refreshing..." : "🔄 Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-6 bg-base-200 rounded-xl border border-base-300">
          <span className="loading loading-spinner loading-sm text-primary"></span>
        </div>
      ) : games.length === 0 ? (
        <div className="text-center text-[10px] text-base-content/40 py-6 bg-base-200 rounded-xl border border-base-300">
          No public matches available at the moment.
        </div>
      ) : (
        <div className="bg-base-200 max-h-48 overflow-y-auto rounded-xl border border-base-300">
          <table className="table table-compact table-zebra w-full text-[11px]">
            <thead>
              <tr>
                <th className="py-1">Host</th>
                <th className="py-1">Opponent</th>
                <th className="py-1 text-right">Join</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game.code} className="hover">
                  <td className="font-bold py-1 truncate max-w-[100px]">
                    {game.host?.name || "Guest"}
                  </td>
                  <td className="py-1 truncate max-w-[100px]">
                    {(game.host?.id === game.white?.id
                      ? game.black?.name
                      : game.white?.name) || "Waiting..."}
                  </td>
                  <td className="py-1 text-right">
                    <JoinButton code={game.code as string} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
