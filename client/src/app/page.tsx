"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { API_URL } from "@/config";

import CreateGame from "@/components/home/CreateGame";
import JoinGame from "@/components/home/JoinGame";
import PublicGames from "@/components/home/PublicGames/PublicGames";
import LocationLobby from "@/components/home/LocationLobby";

import {
    IconSwords,
    IconRobot,
    IconDeviceLaptop,
    IconPlus,
    IconLink,
    IconTarget,
    IconMapPin
} from "@tabler/icons-react";

const BOT_PERSONALITIES = [
    { id: "beginner", name: "Beginner Bot", elo: 600, desc: "Easy play, friendly feedback.", avatar: "🤖" },
    { id: "trashtalk", name: "Trash Talk Bot", elo: 1100, desc: "Sarcastic banter, basic tactics.", avatar: "🤪" },
    { id: "coach", name: "Coach Bot", elo: 1500, desc: "Explains positions, offers takebacks.", avatar: "👨‍🏫" },
    { id: "tal", name: "Tal Style", elo: 2400, desc: "Highly tactical, sacrifices pieces.", avatar: "🔥" },
    { id: "magnus", name: "Magnus Style", elo: 2850, desc: "Flawless positional endgames.", avatar: "👑" }
];

export default function Home() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"online" | "computer" | "local">("online");
    const [quickMatchLoading, setQuickMatchLoading] = useState<string | null>(null);

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
        <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-8 w-full max-w-5xl justify-center px-4 py-6 min-h-[80vh]">
            
            {/* Left: Branding & Welcome Banner */}
            <div className="flex-1 flex flex-col justify-center items-center lg:items-start text-center lg:text-left space-y-6">
                <div className="space-y-2">
                    <span className="badge badge-primary font-bold uppercase tracking-wider text-[10px]">Chessthan Arena</span>
                    <h2 className="text-3xl md:text-5xl font-black leading-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Play Chess. <br />Learn with AI.
                    </h2>
                    <p className="text-sm text-base-content/70 max-w-md">
                        Join geographical matching radars, solve tactical puzzles, challenge bot GMs, and consult our Generative AI tutor.
                    </p>
                </div>
                <div className="relative w-80 h-80 animate__animated animate__jackInTheBox hidden md:block">
                    <Image
                        src="/chess.svg"
                        alt="Chess Illustration"
                        fill
                        className="object-contain filter drop-shadow-2xl"
                    />
                </div>
            </div>

            {/* Right: Unified Game Configurator Lobby */}
            <div className="flex-1 w-full max-w-md flex flex-col">
                {/* Mode Select Tabs */}
                <div className="tabs tabs-boxed grid grid-cols-3 p-1 mb-4">
                    <button
                        onClick={() => setActiveTab("online")}
                        className={`tab flex items-center justify-center gap-1.5 text-xs ${activeTab === "online" ? "tab-active font-bold" : ""}`}
                    >
                        <IconSwords size={16} /> Online
                    </button>
                    <button
                        onClick={() => setActiveTab("computer")}
                        className={`tab flex items-center justify-center gap-1.5 text-xs ${activeTab === "computer" ? "tab-active font-bold" : ""}`}
                    >
                        <IconRobot size={16} /> Vs Bot
                    </button>
                    <button
                        onClick={() => setActiveTab("local")}
                        className={`tab flex items-center justify-center gap-1.5 text-xs ${activeTab === "local" ? "tab-active font-bold" : ""}`}
                    >
                        <IconDeviceLaptop size={16} /> Local
                    </button>
                </div>

                {/* Tab content containers */}
                <div className="card w-full bg-base-100 border border-base-300 shadow-xl overflow-hidden flex-1 p-6">
                    
                    {/* Tab 1: Play Online */}
                    {activeTab === "online" && (
                        <div className="space-y-6">
                            {/* Section 1: Quick Play */}
                            <div>
                                <div className="border-b border-base-300 pb-1.5 mb-3">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-base-content/40 flex items-center gap-1.5">
                                        <IconTarget size={14} className="text-primary" /> Quick Play
                                    </h3>
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
                                            className={`btn btn-outline btn-sm normal-case flex items-center justify-center text-xs ${
                                                quickMatchLoading === tc.val ? "loading" : ""
                                            }`}
                                            disabled={!!quickMatchLoading}
                                        >
                                            {tc.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Section 2: Play Nearby */}
                            <div>
                                <div className="border-b border-base-300 pb-1.5 mb-3">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-base-content/40 flex items-center gap-1.5">
                                        <IconMapPin size={14} className="text-accent" /> Play Nearby Matches
                                    </h3>
                                </div>
                                <LocationLobby />
                            </div>

                            {/* Section 3: Create/Join Custom Match */}
                            <div>
                                <div className="border-b border-base-300 pb-1.5 mb-3">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-base-content/40 flex items-center gap-1.5">
                                        <IconSwords size={14} className="text-secondary" /> Custom Match Lobby
                                    </h3>
                                </div>
                                <div className="flex gap-4 mb-4">
                                    <div className="flex-1">
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 mb-2 flex items-center gap-1">
                                            <IconPlus size={12} /> Create Match
                                        </h4>
                                        <CreateGame />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-base-content/50 mb-2 flex items-center gap-1">
                                            <IconLink size={12} /> Join Code
                                        </h4>
                                        <JoinGame />
                                    </div>
                                </div>
                                <PublicGames />
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Play vs Computer (Personalities grid) */}
                    {activeTab === "computer" && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-bold mb-1">🤖 Choose Bot Personality</h3>
                                <p className="text-[10px] text-base-content/60">
                                    Practice opening prep or tactics against custom personalities
                                </p>
                            </div>

                            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                                {BOT_PERSONALITIES.map((bot) => (
                                    <div
                                        key={bot.id}
                                        className="flex items-center justify-between p-3 bg-base-200 border border-base-300 hover:border-primary/50 rounded-xl transition-all duration-200"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{bot.avatar}</span>
                                            <div>
                                                <div className="font-bold text-xs flex items-center gap-1.5">
                                                    <span>{bot.name}</span>
                                                    <span className="badge badge-xs badge-neutral text-[9px] font-mono">{bot.elo} ELO</span>
                                                </div>
                                                <div className="text-[10px] text-base-content/60">{bot.desc}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => router.push(`/local?bot=${bot.id}`)}
                                            className="btn btn-xs btn-primary font-semibold"
                                        >
                                            Challenge
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Play Local same-device */}
                    {activeTab === "local" && (
                        <div className="space-y-5 flex flex-col justify-center h-full">
                            <div className="text-center py-4 bg-base-200 rounded-xl border border-base-300">
                                <span className="text-3xl">👥</span>
                                <h4 className="font-bold text-sm mt-2">Pass & Play</h4>
                                <p className="text-[10px] text-base-content/60 px-4 mt-1">
                                    Play face-to-face with a friend on the same screen. Optional 180° auto-rotate feature.
                                </p>
                                <button
                                    onClick={() => router.push("/local")}
                                    className="btn btn-primary btn-sm mt-4 w-40 normal-case"
                                >
                                    Start Local Game
                                </button>
                            </div>

                            <div className="alert alert-info text-xs py-2 px-3 rounded text-info-content bg-info/10 border border-info/20">
                                <span>💡 <b>Tip:</b> Offline mode works even when disconnected from the internet! All offline game results are saved locally.</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
