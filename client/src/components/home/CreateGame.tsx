"use client";

import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { SessionContext } from "@/context/session";
import { createGame } from "@/lib/game";
import {
    IconBolt,
    IconFlame,
    IconClock,
    IconHourglassEmpty,
    IconUsers,
    IconLock,
    IconPlus
} from "@tabler/icons-react";

interface TimePreset {
    id: string;
    label: string;
    description: string;
    category: "bullet" | "blitz" | "rapid" | "classical" | "casual";
    icon: any;
}

const TIME_PRESETS: TimePreset[] = [
    { id: "1m", label: "1 min", description: "Bullet", category: "bullet", icon: IconBolt },
    { id: "2+1m", label: "2+1 min", description: "Bullet", category: "bullet", icon: IconBolt },
    { id: "3m", label: "3 min", description: "Blitz", category: "blitz", icon: IconFlame },
    { id: "3+2m", label: "3+2 min", description: "Blitz", category: "blitz", icon: IconFlame },
    { id: "5m", label: "5 min", description: "Blitz", category: "blitz", icon: IconFlame },
    { id: "10m", label: "10 min", description: "Rapid", category: "rapid", icon: IconClock },
    { id: "15+10m", label: "15+10 min", description: "Rapid", category: "rapid", icon: IconClock },
    { id: "30m", label: "30 min", description: "Classical", category: "classical", icon: IconHourglassEmpty },
    { id: "Casual", label: "No Time Limit", description: "Friendly Play", category: "casual", icon: IconUsers }
];

export default function CreateGame() {
    const session = useContext(SessionContext);
    const router = useRouter();

    // Matchmaking configs
    const [selectedTimeId, setSelectedTimeId] = useState<string>("Casual");
    const [isRated, setIsRated] = useState<boolean>(false);
    const [startingSide, setStartingSide] = useState<string>("random");
    const [variant, setVariant] = useState<string>("standard");
    const [isUnlisted, setIsUnlisted] = useState<boolean>(false);

    const [buttonLoading, setButtonLoading] = useState(false);

    const handleCreateGame = async () => {
        if (!session?.user?.id) return;
        setButtonLoading(true);

        const activePreset = TIME_PRESETS.find(p => p.id === selectedTimeId);
        const timeLabel = activePreset ? `${activePreset.description} ${activePreset.label}` : "Casual";

        const game = await createGame(
            startingSide,
            isUnlisted,
            variant,
            timeLabel,
            isRated,
            session?.user || undefined
        );


        if (game) {
            router.push(`/${game.code}`);
        } else {
            setButtonLoading(false);
        }
    };



    return (
        <div className="space-y-6 w-full">
            
            {/* Quick-Pick presets grid */}
            <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-base-content/50 tracking-wider">
                    1. Choose Time Frame
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {TIME_PRESETS.map((preset) => {
                        const Icon = preset.icon;
                        const isSelected = selectedTimeId === preset.id;
                        return (
                            <button
                                key={preset.id}
                                onClick={() => setSelectedTimeId(preset.id)}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200 ${
                                    isSelected
                                        ? "bg-primary border-primary text-primary-content shadow-lg scale-95"
                                        : "bg-base-200 border-base-300 hover:bg-base-300 text-base-content"
                                }`}
                            >
                                <Icon size={14} className={isSelected ? "animate-pulse" : "opacity-60"} />
                                <span className="text-[10px] font-black mt-1 leading-none">{preset.label}</span>
                                <span className={`text-[8px] mt-0.5 opacity-70 leading-none ${isSelected ? "text-primary-content" : "text-base-content/50"}`}>
                                    {preset.description}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Play settings */}
            <div className="grid grid-cols-2 gap-4">
                {/* Method / Rated */}
                <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-base-content/50 tracking-wider">
                        2. Play Method
                    </span>
                    <div className="flex bg-base-200 p-1 rounded-xl border border-base-300">
                        <button
                            onClick={() => setIsRated(false)}
                            className={`flex-1 py-1 rounded-lg text-[9px] font-bold transition-all ${
                                !isRated ? "bg-base-100 text-base-content shadow" : "text-base-content/60"
                            }`}
                        >
                            Casual
                        </button>
                        <button
                            onClick={() => setIsRated(true)}
                            className={`flex-1 py-1 rounded-lg text-[9px] font-bold transition-all ${
                                isRated ? "bg-base-100 text-primary font-black shadow" : "text-base-content/60"
                            }`}
                        >
                            Rated
                        </button>
                    </div>
                </div>

                {/* Color Side */}
                <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-base-content/50 tracking-wider">
                        3. Your Color
                    </span>
                    <select
                        className="select select-bordered select-xs w-full h-8 text-[10px] font-bold rounded-xl"
                        value={startingSide}
                        onChange={(e) => setStartingSide(e.target.value)}
                    >
                        <option value="random">🎲 Random</option>
                        <option value="white">⚪ Play White</option>
                        <option value="black">⚫ Play Black</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Variant Selector */}
                <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-base-content/50 tracking-wider">
                        4. Variant Rules
                    </span>
                    <select
                        className="select select-bordered select-xs w-full h-8 text-[10px] font-bold rounded-xl"
                        value={variant}
                        onChange={(e) => setVariant(e.target.value)}
                    >
                        <option value="standard">Standard Chess</option>
                        <option value="chess960">Chess960 (Fischer)</option>
                        <option value="kingofthehill">King of the Hill</option>
                        <option value="threecheck">3-Check Chess</option>
                    </select>
                </div>

                {/* Visibility Selector */}
                <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-base-content/50 tracking-wider">
                        5. Room Visibility
                    </span>
                    <div className="flex bg-base-200 p-1 rounded-xl border border-base-300">
                        <button
                            onClick={() => setIsUnlisted(false)}
                            className={`flex-grow py-1 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition-all ${
                                !isUnlisted ? "bg-base-100 text-base-content shadow" : "text-base-content/60"
                            }`}
                        >
                            <IconUsers size={10} /> Public
                        </button>
                        <button
                            onClick={() => setIsUnlisted(true)}
                            className={`flex-grow py-1 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition-all ${
                                isUnlisted ? "bg-base-100 text-base-content shadow" : "text-base-content/60"
                            }`}
                        >
                            <IconLock size={10} /> Private
                        </button>
                    </div>
                </div>
            </div>

            {/* Launch Create Button */}
            <button
                onClick={handleCreateGame}
                disabled={buttonLoading || !session?.user?.id}
                className={`btn btn-xs btn-primary font-bold w-full h-9 normal-case text-xs flex items-center gap-1.5 rounded-xl shadow-lg ${
                    buttonLoading ? "loading" : ""
                }`}
            >
                <IconPlus size={14} /> Create Match
            </button>
        </div>
    );
}
