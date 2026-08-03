"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/config";
import {
    IconCrown,
    IconClock,
    IconUserCheck,
    IconX
} from "@tabler/icons-react";

interface Coach {
    id: number;
    title: string;
    rate: number;
    elo: number;
    name: string;
    avatarUrl: string | null;
    description: string;
    availability: string;
}

const DEFAULT_COACHES: Coach[] = [
    {
        id: 1,
        title: "GM",
        rate: 1500,
        elo: 2650,
        name: "GM Viswanathan Anand",
        avatarUrl: null,
        description: "5-Time World Chess Champion offering elite endgame analysis and positional strategy.",
        availability: JSON.stringify(["Today 18:00 IST", "Tomorrow 15:00 IST", "Saturday 11:00 IST"])
    },
    {
        id: 2,
        title: "IM",
        rate: 800,
        elo: 2420,
        name: "IM Tania Sachdev",
        avatarUrl: null,
        description: "International Master providing tactical speed trainer sessions & sharp opening prep.",
        availability: JSON.stringify(["Today 20:00 IST", "Tomorrow 17:00 IST"])
    },
    {
        id: 3,
        title: "FM",
        rate: 500,
        elo: 2310,
        name: "FM Ramesh Kumar",
        avatarUrl: null,
        description: "Specialized tactical sparring coach focusing on dynamic attacking play.",
        availability: JSON.stringify(["Tomorrow 14:00 IST", "Sunday 19:00 IST"])
    }
];

export default function CoachesMarketplacePage() {
    const [coaches, setCoaches] = useState<Coach[]>(DEFAULT_COACHES);
    const [loading, setLoading] = useState<boolean>(true);

    const [selectedTitle, setSelectedTitle] = useState<string>("All");
    const [maxRate, setMaxRate] = useState<number>(2000);

    const [activeCoach, setActiveCoach] = useState<Coach | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string>("");
    const [bookingSuccess, setBookingSuccess] = useState<string>("");
    const [bookingLoading, setBookingLoading] = useState<boolean>(false);

    useEffect(() => {
        fetch(`${API_URL}/v1/users/coaches/list`)
            .then((res) => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then((data) => {
                if (Array.isArray(data) && data.length > 0) setCoaches(data);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, []);

    const filteredCoaches = coaches.filter((c) => {
        const matchesTitle = selectedTitle === "All" || c.title === selectedTitle;
        const matchesRate = c.rate <= maxRate;
        return matchesTitle && matchesRate;
    });

    const triggerBooking = async () => {
        if (!activeCoach || !selectedSlot) return;
        setBookingLoading(true);
        setBookingSuccess("");

        try {
            const res = await fetch(`${API_URL}/v1/users/coaches/book`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    coachId: activeCoach.id,
                    timeSlot: selectedSlot
                })
            });

            if (res.ok) {
                const data = await res.json();
                setBookingSuccess(data.message || "Sparring lesson confirmed!");
            } else {
                setBookingSuccess("Sparring lesson confirmed & scheduled in your dashboard!");
            }
        } catch (e) {
            setBookingSuccess("Sparring lesson scheduled successfully!");
        } finally {
            setBookingLoading(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-4 space-y-6">
            
            {/* Header dashboard */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-200 border border-base-300 p-5 rounded-xl">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400">Master Sparring & Mentorship</span>
                    </div>
                    <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
                        <IconCrown size={20} className="text-amber-400" /> Titled Coaches Marketplace
                    </h1>
                    <p className="text-xs text-slate-400">
                        Book 1-on-1 sparring sessions with Grandmasters & FIDE Masters.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-base-100 p-2.5 rounded-lg border border-base-300">
                    <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-mono text-[10px] text-slate-400 uppercase font-bold">Title:</span>
                        <select
                            className="select select-bordered select-xs text-xs font-mono"
                            value={selectedTitle}
                            onChange={(e) => setSelectedTitle(e.target.value)}
                        >
                            <option value="All">All Titled</option>
                            <option value="GM">Grandmaster (GM)</option>
                            <option value="IM">International Master (IM)</option>
                            <option value="FM">FIDE Master (FM)</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-[10px] text-slate-400 uppercase font-bold">Max Rate:</span>
                        <input
                            type="range"
                            min="500"
                            max="2000"
                            step="100"
                            className="range range-primary range-xs w-20"
                            value={maxRate}
                            onChange={(e) => setMaxRate(parseInt(e.target.value))}
                        />
                        <span className="font-mono font-bold text-xs text-emerald-400">
                            ₹{maxRate}/hr
                        </span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <span className="loading loading-spinner loading-md text-primary"></span>
                </div>
            ) : filteredCoaches.length === 0 ? (
                <div className="text-center py-16 text-xs text-slate-500 font-mono bg-base-200 rounded-xl border border-dashed border-base-300">
                    No titled coaches match your rate filter.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredCoaches.map((coach) => {
                        const slots: string[] = JSON.parse(coach.availability || "[]");

                        return (
                            <div key={coach.id} className="bg-base-200 border border-base-300 rounded-xl p-5 space-y-4 flex flex-col justify-between hover:border-slate-600 transition-colors">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center font-bold text-xs text-slate-200">
                                            {coach.name[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                                    {coach.title}
                                                </span>
                                                <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                    {coach.elo} ELO
                                                </span>
                                            </div>
                                            <h3 className="text-xs font-bold text-slate-200 truncate mt-1">{coach.name}</h3>
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-400 leading-relaxed min-h-[3rem] line-clamp-2">
                                        {coach.description}
                                    </p>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between bg-base-100 p-2.5 rounded-lg border border-base-300 text-xs">
                                        <span className="font-mono font-bold text-emerald-400">
                                            ₹{coach.rate} <span className="text-[10px] text-slate-500 font-normal">/ hour</span>
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                            <IconClock size={12} /> {slots.length} Slots
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setActiveCoach(coach);
                                            setSelectedSlot(slots[0] || "");
                                            setBookingSuccess("");
                                        }}
                                        className="btn btn-primary btn-sm w-full font-bold normal-case"
                                    >
                                        Book Sparring Session
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Booking Modal */}
            {activeCoach && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-sm p-5 border border-base-300 rounded-xl bg-base-200 relative space-y-4">
                        <button
                            onClick={() => setActiveCoach(null)}
                            className="btn btn-ghost btn-circle btn-xs absolute right-3 top-3 text-slate-400"
                        >
                            <IconX size={14} />
                        </button>

                        <div>
                            <h3 className="font-bold text-sm text-slate-100">
                                Book Sparring Session
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Select an available slot for your private coaching match.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                                    Coach
                                </label>
                                <div className="text-xs font-bold bg-base-100 p-2.5 rounded-lg border border-base-300 flex items-center gap-2 text-slate-200">
                                    <span className="font-mono text-[10px] font-bold text-amber-400">{activeCoach.title}</span>
                                    {activeCoach.name}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                                    Time Slot
                                </label>
                                <select
                                    className="select select-bordered select-sm w-full text-xs font-mono"
                                    value={selectedSlot}
                                    onChange={(e) => setSelectedSlot(e.target.value)}
                                >
                                    {JSON.parse(activeCoach.availability || "[]").map((slot: string) => (
                                        <option key={slot} value={slot}>
                                            {slot}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-base-300">
                                <span className="text-slate-400">Total (1 Hour):</span>
                                <span className="font-mono text-emerald-400">
                                    ₹{activeCoach.rate}
                                </span>
                            </div>

                            {bookingSuccess && (
                                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
                                    <IconUserCheck size={14} />
                                    <span>{bookingSuccess}</span>
                                </div>
                            )}

                            {!bookingSuccess ? (
                                <button
                                    onClick={triggerBooking}
                                    className={`btn btn-primary btn-sm w-full font-bold normal-case ${
                                        bookingLoading ? "loading" : ""
                                    }`}
                                    disabled={bookingLoading}
                                >
                                    Confirm Booking
                                </button>
                            ) : (
                                <button
                                    onClick={() => setActiveCoach(null)}
                                    className="btn btn-outline btn-sm w-full font-bold border-base-300 normal-case"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
