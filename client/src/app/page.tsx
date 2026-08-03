"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/config";

import CustomMatchModal from "@/components/home/CustomMatchModal";
import PublicGames from "@/components/home/PublicGames/PublicGames";
import LocationLobby from "@/components/home/LocationLobby";
import HeroChessboard from "@/components/home/HeroChessboard";

import {
    IconSwords,
    IconRobot,
    IconDeviceLaptop,
    IconPlus,
    IconLink,
    IconTarget,
    IconMapPin,
    IconBrain,
    IconFlame,
    IconCrown,
    IconSchool
} from "@tabler/icons-react";

const BOT_PERSONALITIES = [
    { id: "beginner", name: "Beginner Bot", elo: 600, desc: "Easy play, friendly feedback.", icon: <IconRobot size={18} className="text-emerald-400" /> },
    { id: "trashtalk", name: "Trash Talk Bot", elo: 1100, desc: "Sarcastic banter, basic tactics.", icon: <IconBrain size={18} className="text-amber-400" /> },
    { id: "coach", name: "Coach Bot", elo: 1500, desc: "Explains positions, offers takebacks.", icon: <IconSchool size={18} className="text-sky-400" /> },
    { id: "tal", name: "Tal Style", elo: 2400, desc: "Highly tactical, sacrifices pieces.", icon: <IconFlame size={18} className="text-rose-400" /> },
    { id: "magnus", name: "Magnus Style", elo: 2850, desc: "Flawless positional endgames.", icon: <IconCrown size={18} className="text-purple-400" /> }
];

export default function Home() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"online" | "computer" | "local">("online");
    const [quickMatchLoading, setQuickMatchLoading] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Handles quick matchmaking pairings
    const handleQuickMatch = async (timeControl: string) => {
        setQuickMatchLoading(timeControl);
        try {
            // E.g. create a fast unlisted game or search queue
            const side = "random";
            const res = await fetch(`${API_URL}/v1/games`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    unlisted: false,
                    side
                }),
                credentials: "include"
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/${data.code}`);
            }
        } catch (e) {
            console.error("Matchmaking error:", e);
        } finally {
            setQuickMatchLoading(null);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row items-stretch gap-8 w-full max-w-6xl justify-center px-4 py-8 min-h-[85vh]">
            
            {/* Left: Clean Brand & Quick Stats */}
            <div className="flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-3 text-left">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400">Live Arena</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-100 leading-none">
                        Master your game.
                    </h1>
                    <p className="text-sm text-slate-400 max-w-md font-normal leading-relaxed">
                        Compete in real-time online matches, analyze positions with Stockfish & Gemini AI, solve tactical puzzles, and explore grandmaster databases.
                    </p>
                </div>

                {/* Hero Interactive Animated Chessboard */}
                <HeroChessboard />
            </div>

            {/* Right: Unified Minimal Game Lobby */}
            <div className="flex-1 w-full max-w-lg flex flex-col">
                {/* Mode Select Tabs */}
                <div className="tabs tabs-boxed grid grid-cols-3 p-1 mb-3 bg-base-200 border border-base-300 rounded-xl">
                    <button
                        onClick={() => setActiveTab("online")}
                        className={`tab flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg transition-all ${
                            activeTab === "online" ? "tab-active bg-primary text-primary-content" : "text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        <IconSwords size={16} /> Online Lobbies
                    </button>
                    <button
                        onClick={() => setActiveTab("computer")}
                        className={`tab flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg transition-all ${
                            activeTab === "computer" ? "tab-active bg-primary text-primary-content" : "text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        <IconRobot size={16} /> Bot Practice
                    </button>
                    <button
                        onClick={() => setActiveTab("local")}
                        className={`tab flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg transition-all ${
                            activeTab === "local" ? "tab-active bg-primary text-primary-content" : "text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        <IconDeviceLaptop size={16} /> Pass & Play
                    </button>
                </div>

                {/* Main Card Container */}
                <div className="card w-full bg-base-200 border border-base-300 shadow-lg overflow-hidden flex-1 p-5">
                    
                    {/* Tab 1: Play Online */}
                    {activeTab === "online" && (
                        <div className="space-y-5">
                            {/* Quick Play Grid */}
                            <div>
                                <div className="flex items-center justify-between pb-2 mb-2 border-b border-base-300">
                                    <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                        <IconTarget size={14} className="text-primary" /> Quick Pairings
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: "1+0 Bullet", val: "1+0" },
                                        { label: "3+2 Blitz", val: "3+2" },
                                        { label: "10+0 Rapid", val: "10+0" },
                                        { label: "30+0 Classical", val: "30+0" }
                                    ].map((tc) => (
                                        <button
                                            key={tc.label}
                                            onClick={() => handleQuickMatch(tc.val)}
                                            className={`btn btn-outline btn-sm font-semibold normal-case text-xs border-base-300 hover:border-primary ${
                                                quickMatchLoading === tc.val ? "loading" : ""
                                            }`}
                                            disabled={!!quickMatchLoading}
                                        >
                                            {tc.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Create / Join Custom Game */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="btn btn-sm btn-primary font-bold normal-case flex-1 flex items-center justify-center gap-1"
                                >
                                    <IconPlus size={14} /> Custom Room
                                </button>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="btn btn-sm btn-outline font-bold normal-case flex-1 flex items-center justify-center gap-1 border-base-300"
                                >
                                    <IconLink size={14} /> Join Link
                                </button>
                            </div>

                            {/* Live Public Games & Nearby */}
                            <div className="space-y-4 pt-2 border-t border-base-300">
                                <div>
                                    <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2">
                                        <IconMapPin size={14} className="text-emerald-400" /> Play Nearby
                                    </span>
                                    <LocationLobby />
                                </div>
                                <PublicGames />
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Play vs Computer */}
                    {activeTab === "computer" && (
                        <div className="space-y-4">
                            <div className="border-b border-base-300 pb-2">
                                <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-300">Select AI Bot Opponent</h3>
                                <p className="text-[11px] text-slate-500">Practice openings and tactics against specific ELO difficulty tiers</p>
                            </div>

                            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                                {BOT_PERSONALITIES.map((bot) => (
                                    <div
                                        key={bot.id}
                                        className="flex items-center justify-between p-3 bg-base-100 border border-base-300 hover:border-primary/60 rounded-xl transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-base-300 flex items-center justify-center font-bold text-sm">
                                                {bot.icon}
                                            </div>
                                            <div>
                                                <div className="font-bold text-xs flex items-center gap-2">
                                                    <span className="text-slate-200">{bot.name}</span>
                                                    <span className="font-mono text-[10px] text-emerald-400 font-bold">{bot.elo} ELO</span>
                                                </div>
                                                <div className="text-[11px] text-slate-400">{bot.desc}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => router.push(`/local?bot=${bot.id}`)}
                                            className="btn btn-xs btn-primary font-bold"
                                        >
                                            Play
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Local Pass & Play */}
                    {activeTab === "local" && (
                        <div className="space-y-5 flex flex-col justify-center h-full text-center">
                            <div className="py-6 px-4 bg-base-100 rounded-xl border border-base-300">
                                <h4 className="font-bold text-sm text-slate-200">Local Offline Pass & Play</h4>
                                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                                    Play two-player games on a single screen with optional 180° auto-board flip.
                                </p>
                                <button
                                    onClick={() => router.push("/local")}
                                    className="btn btn-primary btn-sm mt-4 font-bold px-6 normal-case"
                                >
                                    Start Local Game
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <CustomMatchModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
