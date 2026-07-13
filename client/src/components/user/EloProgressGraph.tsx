"use client";

import { useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

interface HistoryItem {
    id: number;
    gameType: string;
    elo: number;
    recordedAt: number;
}

interface EloProgressGraphProps {
    eloHistory: HistoryItem[];
}

export default function EloProgressGraph({ eloHistory }: EloProgressGraphProps) {
    const [selectedType, setSelectedType] = useState<string>("blitz");

    // Filter and format data for selected game pool
    const chartData = eloHistory
        .filter((item) => item.gameType === selectedType)
        .map((item) => ({
            rating: item.elo,
            date: new Date(item.recordedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric"
            })
        }));

    return (
        <div className="card w-full bg-base-100 border border-base-300 shadow-lg p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold">📈 ELO Rating Progression</h3>
                    <p className="text-xs text-base-content/60">
                        Visual rating timeline over recent matches
                    </p>
                </div>
                <div>
                    <select
                        className="select select-bordered select-sm"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        <option value="blitz">⚡ Blitz</option>
                        <option value="bullet">Bullet</option>
                        <option value="rapid">⏱️ Rapid</option>
                        <option value="classical">🏰 Classical</option>
                        <option value="puzzle">🧩 Puzzles</option>
                    </select>
                </div>
            </div>

            {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-64 border border-dashed border-base-300 rounded-lg text-xs text-base-content/40">
                    No rating data logged yet. Play online ranked games or complete puzzles!
                </div>
            ) : (
                <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10 }}
                                stroke="#888888"
                            />
                            <YAxis
                                domain={["dataMin - 50", "dataMax + 50"]}
                                tick={{ fontSize: 10 }}
                                stroke="#888888"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--b1))",
                                    borderColor: "hsl(var(--bc) / 0.1)",
                                    fontSize: "11px",
                                    borderRadius: "8px"
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="rating"
                                name="ELO Rating"
                                stroke="#0070f3"
                                strokeWidth={2.5}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
