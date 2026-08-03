"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import {
    IconTrophy,
    IconExternalLink,
    IconDeviceDesktopAnalytics,
    IconSearch,
    IconUser,
    IconCrown
} from "@tabler/icons-react";

interface ClassicMatch {
    id: string;
    title: string;
    players: string;
    date: string;
    category: "World Championship" | "Candidates" | "Romantic Era" | "Blitz & Speed";
    opening: string;
    result: string;
    description: string;
    pgn: string;
}

interface LichessGame {
    id: string;
    createdAt: number;
    speed: string;
    winner?: string;
    players: {
        white: { user?: { name: string }; rating?: number };
        black: { user?: { name: string }; rating?: number };
    };
    opening?: { name: string };
    pgn?: string;
}

const FEATURED_GMS = [
    { name: "Magnus Carlsen", username: "MagnusCarlsen" },
    { name: "Hikaru Nakamura", username: "Hikaru" },
    { name: "Daniel Naroditsky", username: "DanielNaroditsky" },
    { name: "Andrew Tang", username: "penguingim1" },
    { name: "Alireza Firouzja", username: "alireza2003" }
];

const CLASSIC_MATCHES: ClassicMatch[] = [
    {
        id: "opera_house",
        title: "The Opera House Game",
        players: "Paul Morphy vs Duke Karl & Count Isouard",
        date: "1858",
        category: "Romantic Era",
        opening: "Philidor Defense",
        result: "1-0",
        description: "History's most famous demonstration of rapid development, open lines, and tactical checkmate patterns.",
        pgn: "1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#"
    },
    {
        id: "immortal_game",
        title: "The Immortal Game",
        players: "Adolf Anderssen vs Lionel Kieseritzky",
        date: "1851",
        category: "Romantic Era",
        opening: "King's Gambit Accepted",
        result: "1-0",
        description: "A spectacular game of the romantic era, where White sacrifices both rooks and queen to deliver checkmate.",
        pgn: "1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7#"
    },
    {
        id: "game_of_century",
        title: "The Game of the Century",
        players: "Donald Byrne vs Bobby Fischer",
        date: "1956",
        category: "Candidates",
        opening: "Gruenfeld Defense",
        result: "0-1",
        description: "A masterclass in tactical counter-play, featuring a legendary queen sacrifice by 13-year old Bobby Fischer.",
        pgn: "1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h4 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h5 h6 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2#"
    },
    {
        id: "man_vs_machine",
        title: "Man vs Machine (Game 6)",
        players: "Garry Kasparov vs Deep Blue",
        date: "1997",
        category: "World Championship",
        opening: "Caro-Kann Defense",
        result: "1-0",
        description: "The historic match where Deep Blue defeated reigning World Champion Garry Kasparov.",
        pgn: "1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nd7 5. Ng5 Ngf6 6. Bd3 e6 7. N1f3 h6 8. Nxe6 Qe7 9. O-O fxe6 10. Bg6+ Kd8 11. Bf4 b5 12. a4 Bb7 13. Re1 Nd5 14. Bg3 Kc8 15. axb5 cxb5 16. Qd3 Bc6 17. Bf5 exf5 18. Rxe7 Bxe7 19. c4 1-0"
    }
];

export default function ClassicsDatabasePage() {
    const [searchUsername, setSearchUsername] = useState("");
    const [searchedGames, setSearchedGames] = useState<LichessGame[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("All");

    const fetchPlayerGames = async (username: string) => {
        setSearchUsername(username);
        setSearchLoading(true);
        setSearchError(null);
        setSearchedGames([]);

        try {
            const res = await fetch(
                `https://lichess.org/api/games/user/${encodeURIComponent(username.trim())}?max=10&pgnInJson=true`,
                { headers: { Accept: "application/x-ndjson" } }
            );

            if (!res.ok) throw new Error("User not found or has no public games.");

            const rawText = await res.text();
            if (!rawText.trim()) throw new Error("No games found for this player.");

            const lines = rawText.trim().split("\n");
            const parsedGames: LichessGame[] = lines.map((line) => JSON.parse(line));
            setSearchedGames(parsedGames);
        } catch (err: any) {
            setSearchError(err.message || "Failed to fetch player games.");
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (searchUsername.trim()) fetchPlayerGames(searchUsername);
    };

    const filteredClassics = selectedCategory === "All"
        ? CLASSIC_MATCHES
        : CLASSIC_MATCHES.filter(m => m.category === selectedCategory);

    return (
        <div className="w-full max-w-5xl mx-auto p-4 space-y-8">
            
            {/* Header banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-200 border border-base-300 p-6 rounded-xl shadow-sm">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400">Master Collection</span>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
                        <IconTrophy size={22} className="text-amber-400" /> Grandmaster Games Database
                    </h1>
                    <p className="text-xs text-slate-400">
                        Explore categorized historic encounters or study live Grandmaster match history.
                    </p>
                </div>
            </div>

            {/* Quick Player Shortcuts */}
            <div className="space-y-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <IconCrown size={14} className="text-amber-400" /> Featured Grandmasters
                </span>
                <div className="flex flex-wrap gap-2">
                    {FEATURED_GMS.map((gm) => (
                        <button
                            key={gm.username}
                            onClick={() => fetchPlayerGames(gm.username)}
                            className="btn btn-xs btn-outline font-semibold border-base-300 hover:border-primary text-slate-300 normal-case"
                        >
                            {gm.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Live GM Search Section */}
            <div className="bg-base-200 border border-base-300 rounded-xl p-5 space-y-4">
                <div className="space-y-1">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <IconUser size={14} className="text-emerald-400" /> Grandmaster Game Finder
                    </h3>
                    <p className="text-[11px] text-slate-400">
                        Search any active master handle (e.g. <span className="font-mono font-bold text-emerald-400">MagnusCarlsen</span>, <span className="font-mono font-bold text-emerald-400">Hikaru</span>, <span className="font-mono font-bold text-emerald-400">penguingim1</span>)
                    </p>
                </div>

                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Enter player handle..."
                            value={searchUsername}
                            onChange={(e) => setSearchUsername(e.target.value)}
                            className="input input-bordered input-sm w-full pl-8 text-xs font-mono"
                        />
                        <IconSearch size={16} className="absolute left-2.5 top-2.5 text-slate-500" />
                    </div>
                    <button
                        type="submit"
                        disabled={searchLoading}
                        className={`btn btn-sm btn-primary font-bold px-4 ${searchLoading ? "loading" : ""}`}
                    >
                        Search
                    </button>
                </form>

                {searchError && (
                    <div className="text-xs text-error font-bold mt-2">
                        ⚠️ {searchError}
                    </div>
                )}

                {searchedGames.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-80 overflow-y-auto pr-1">
                        {searchedGames.map((game) => {
                            const whiteName = game.players.white.user?.name || "Anonymous";
                            const blackName = game.players.black.user?.name || "Anonymous";
                            const openingName = game.opening?.name || "Standard Game";
                            
                            return (
                                <div key={game.id} className="flex flex-col md:flex-row md:items-center justify-between bg-base-100 border border-base-300 p-3 rounded-lg gap-2 hover:border-emerald-500/50 transition-all">
                                    <div className="space-y-1">
                                        <div className="text-xs font-bold flex items-center gap-1.5">
                                            <span className="font-mono text-slate-200">⚪ {whiteName}</span>
                                            <span className="text-[10px] text-slate-500">vs</span>
                                            <span className="font-mono text-slate-200">⚫ {blackName}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 flex gap-2 font-mono">
                                            <span>📖 {openingName}</span>
                                            <span>•</span>
                                            <span className="capitalize">⚡ {game.speed}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 justify-end">
                                        <Link
                                            href={`/analysis?pgn=${encodeURIComponent(game.pgn || "")}`}
                                            className="btn btn-xs btn-primary font-bold flex items-center gap-1"
                                        >
                                            <IconDeviceDesktopAnalytics size={12} /> Study Game
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Category Filter & Historic Matches */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-base-300 pb-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <IconCrown size={14} className="text-amber-400" /> Historic Master Matches
                    </span>

                    {/* Category Tabs */}
                    <div className="flex flex-wrap gap-1">
                        {["All", "World Championship", "Candidates", "Romantic Era"].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`btn btn-xs font-semibold rounded-lg ${
                                    selectedCategory === cat ? "btn-primary" : "btn-ghost text-slate-400"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredClassics.map((match) => (
                        <div key={match.id} className="card bg-base-200 border border-base-300 hover:border-slate-600 transition-all overflow-hidden p-5 flex flex-col justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        {match.category}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500">{match.date}</span>
                                </div>

                                <h3 className="text-sm font-bold text-slate-100">{match.title}</h3>
                                <div className="text-xs font-semibold text-emerald-400">{match.players}</div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">{match.description}</p>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-base-300 mt-4">
                                <span className="text-[10px] font-mono font-bold text-slate-400">Result: {match.result}</span>
                                <Link
                                    href={`/analysis?pgn=${encodeURIComponent(match.pgn)}`}
                                    className="btn btn-xs btn-primary font-bold flex items-center gap-1"
                                >
                                    <IconDeviceDesktopAnalytics size={12} /> Study Game <IconExternalLink size={10} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
