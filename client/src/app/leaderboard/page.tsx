"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/config";
import { IconTrophy } from "@tabler/icons-react";

interface Player {
    id: number;
    name: string;
    wins: number;
    losses: number;
    draws: number;
    eloBullet: number;
    eloBlitz: number;
    eloRapid: number;
    eloClassical: number;
    puzzleRating: number;
    division: string;
    xp: number;
    avatarUrl?: string;
}

export default function LeaderboardPage() {
    const [tab, setTab] = useState<"elo" | "leagues">("elo");
    const [eloType, setEloType] = useState<string>("blitz");
    const [division, setDivision] = useState<string>("Bronze");
    
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        try {
            const url = tab === "elo"
                ? `${API_URL}/v1/users/leaderboard/elo?type=${eloType}`
                : `${API_URL}/v1/users/leaderboard/leagues?division=${division}`;
                
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setPlayers(data || []);
            }
        } catch (e) {
            console.error("Error fetching leaderboard:", e);
        } finally {
            setLoading(false);
        }
    }, [tab, eloType, division]);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    return (
        <div className="flex flex-col items-center w-full max-w-4xl px-4 py-6 space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400">Global Standings</span>
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center justify-center gap-2">
                    <IconTrophy size={22} className="text-amber-400" /> Leaderboard & Leagues
                </h1>
                <p className="text-xs text-slate-400">
                    Track top players across rating categories and weekly division leagues
                </p>
            </div>

            {/* Main Tabs */}
            <div className="tabs tabs-boxed grid grid-cols-2 w-full max-w-md p-1 bg-base-200 border border-base-300 rounded-xl">
                <button
                    onClick={() => setTab("elo")}
                    className={`tab text-xs font-bold rounded-lg transition-all ${tab === "elo" ? "tab-active bg-primary text-primary-content" : "text-slate-400"}`}
                >
                    Global ELO Standings
                </button>
                <button
                    onClick={() => setTab("leagues")}
                    className={`tab text-xs font-bold rounded-lg transition-all ${tab === "leagues" ? "tab-active bg-primary text-primary-content" : "text-slate-400"}`}
                >
                    Weekly Division Leagues
                </button>
            </div>

            {/* Filters panel */}
            <div className="flex justify-between items-center w-full">
                <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">
                    {tab === "elo" ? "Category Filter" : "League Tier"}
                </span>
                {tab === "elo" ? (
                    <select
                        className="select select-bordered select-xs text-xs font-mono"
                        value={eloType}
                        onChange={(e) => setEloType(e.target.value)}
                    >
                        <option value="blitz">Blitz</option>
                        <option value="bullet">Bullet</option>
                        <option value="rapid">Rapid</option>
                        <option value="classical">Classical</option>
                        <option value="puzzle">Puzzles</option>
                    </select>
                ) : (
                    <select
                        className="select select-bordered select-xs text-xs font-mono"
                        value={division}
                        onChange={(e) => setDivision(e.target.value)}
                    >
                        <option value="Bronze">Bronze League</option>
                        <option value="Silver">Silver League</option>
                        <option value="Gold">Gold League</option>
                    </select>
                )}
            </div>

            {/* Leaderboard Table Container */}
            <div className="card w-full bg-base-200 border border-base-300 shadow-lg overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <span className="loading loading-spinner loading-md text-primary"></span>
                    </div>
                ) : players.length === 0 ? (
                    <div className="text-center py-16 text-xs text-slate-500 font-mono border border-dashed border-base-300 rounded-xl m-6">
                        No active players in this division bracket. Play games to claim top ranking!
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table w-full text-xs">
                            <thead>
                                <tr className="bg-base-100 border-b border-base-300 text-slate-400 font-mono text-[10px] uppercase">
                                    <th className="w-12 text-center">#</th>
                                    <th>Player</th>
                                    {tab === "elo" ? (
                                        <>
                                            <th className="text-center">ELO Rating</th>
                                            <th className="text-center">Record (W/D/L)</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="text-center">XP Points</th>
                                            <th className="text-center">Division</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {players.map((player, index) => {
                                    const rank = index + 1;
                                    const elo = eloType === "bullet" ? player.eloBullet
                                        : eloType === "rapid" ? player.eloRapid
                                        : eloType === "classical" ? player.eloClassical
                                        : eloType === "puzzle" ? player.puzzleRating
                                        : player.eloBlitz;

                                    return (
                                        <tr key={player.id} className="hover:bg-base-100/50 border-b border-base-300/40">
                                            <td className="text-center font-mono font-bold text-slate-400">
                                                {rank}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 rounded-full bg-base-300 flex items-center justify-center font-bold text-xs text-slate-200 uppercase">
                                                        {player.avatarUrl ? (
                                                            <img src={player.avatarUrl} alt={player.name} className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            player.name[0]
                                                        )}
                                                    </div>
                                                    <a
                                                        href={`/user/${player.name}`}
                                                        className="font-bold text-slate-200 hover:text-emerald-400"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {player.name}
                                                    </a>
                                                </div>
                                            </td>
                                            {tab === "elo" ? (
                                                <>
                                                    <td className="text-center font-mono font-bold text-emerald-400">
                                                        {elo}
                                                    </td>
                                                    <td className="text-center text-slate-400 font-mono">
                                                        <span className="text-emerald-400 font-bold">{player.wins}W</span>
                                                        {" - "}
                                                        <span>{player.draws}D</span>
                                                        {" - "}
                                                        <span className="text-rose-400 font-bold">{player.losses}L</span>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="text-center font-mono font-bold text-emerald-400">
                                                        {player.xp.toLocaleString()} XP
                                                    </td>
                                                    <td className="text-center font-mono font-semibold text-slate-300">
                                                        {player.division}
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
