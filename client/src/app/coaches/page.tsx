"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/config";
import {
    IconCrown,
    IconCurrencyRupee,
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
    availability: string; // JSON string
}

export default function CoachesMarketplacePage() {
    const [coaches, setCoaches] = useState<Coach[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    // Filter states
    const [selectedTitle, setSelectedTitle] = useState<string>("All");
    const [maxRate, setMaxRate] = useState<number>(2000);

    // Booking modal states
    const [activeCoach, setActiveCoach] = useState<Coach | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string>("");
    const [bookingSuccess, setBookingSuccess] = useState<string>("");
    const [bookingLoading, setBookingLoading] = useState<boolean>(false);

    useEffect(() => {
        fetch(`${API_URL}/v1/users/coaches/list`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch coaches");
                return res.json();
            })
            .then((data) => {
                setCoaches(data);
                setLoading(false);
            })
            .catch(() => {
                setError("Could not load titled coaches list.");
                setLoading(false);
            });
    }, []);

    // Filter logic
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
                setBookingSuccess(data.message);
            } else {
                setBookingSuccess("Failed to book session. Slot may have been taken.");
            }
        } catch (e) {
            setBookingSuccess("Failed to connect to booking server.");
        } finally {
            setBookingLoading(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-4 space-y-6">
            
            {/* Header dashboard */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-200 border border-base-300 p-6 rounded-2xl shadow">
                <div className="space-y-1">
                    <h1 className="text-xl font-black flex items-center gap-2">
                        <IconCrown className="text-warning animate-pulse" /> Titled Coaches Marketplace
                    </h1>
                    <p className="text-xs text-base-content/60">
                        Book hourly 1-on-1 sparring sessions with verified Grandmasters and International Masters.
                    </p>
                </div>

                {/* Filters card */}
                <div className="flex flex-wrap items-center gap-3 bg-base-100 p-3 rounded-xl border border-base-300">
                    {/* Title filter */}
                    <div className="flex items-center gap-1 text-xs">
                        <span className="font-bold text-base-content/50 uppercase text-[9px]">Title:</span>
                        <select
                            className="select select-bordered select-xs font-semibold py-0 text-[10px]"
                            value={selectedTitle}
                            onChange={(e) => setSelectedTitle(e.target.value)}
                        >
                            <option value="All">All Titled</option>
                            <option value="GM">Grandmasters (GM)</option>
                            <option value="IM">International Masters (IM)</option>
                            <option value="FM">FIDE Masters (FM)</option>
                        </select>
                    </div>

                    {/* Budget filter */}
                    <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-bold text-base-content/50 uppercase text-[9px]">Max Rate:</span>
                        <input
                            type="range"
                            min="500"
                            max="2000"
                            step="100"
                            className="range range-primary range-xs w-24"
                            value={maxRate}
                            onChange={(e) => setMaxRate(parseInt(e.target.value))}
                        />
                        <span className="font-mono font-bold text-[10px] bg-base-200 px-1.5 py-0.5 rounded">
                            ₹{maxRate}/hr
                        </span>
                    </div>
                </div>
            </div>

            {/* List/Grid View */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2">
                    <span className="loading loading-spinner loading-md text-primary"></span>
                    <span className="text-[10px] font-black text-base-content/40 uppercase tracking-widest">Finding Coaches...</span>
                </div>
            ) : error ? (
                <div className="alert alert-error text-xs rounded-xl shadow">{error}</div>
            ) : filteredCoaches.length === 0 ? (
                <div className="text-center py-20 text-base-content/40 text-xs bg-base-100 rounded-2xl border border-dashed border-base-300">
                    No coaches match your selected filters. Try expanding your search options.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate__animated animate__fadeIn">
                    {filteredCoaches.map((coach) => {
                        const slots: string[] = JSON.parse(coach.availability || "[]");

                        return (
                            <div key={coach.id} className="card bg-base-100 border border-base-300 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                                
                                {/* Coach Card Body */}
                                <div className="card-body p-5 space-y-4">
                                    {/* Avatar & Title Row */}
                                    <div className="flex items-center gap-3">
                                        <div className="avatar">
                                            <div className="w-12 h-12 rounded-full border border-base-300 shadow">
                                                <img
                                                    src={coach.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                                                    alt={coach.name}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1">
                                                <span className="badge badge-warning badge-xs font-black text-[9px] px-1.5 py-0.5">{coach.title}</span>
                                                <span className="text-[10px] font-mono bg-base-200 px-1.5 rounded font-bold">{coach.elo} ELO</span>
                                            </div>
                                            <h3 className="text-xs font-bold text-base-content truncate mt-0.5">{coach.name}</h3>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-[10px] text-base-content/75 leading-relaxed h-12 overflow-hidden">
                                        {coach.description}
                                    </p>

                                    {/* Details & Rates */}
                                    <div className="flex items-center justify-between bg-base-200 p-2.5 rounded-xl border border-base-300 text-xs">
                                        <span className="flex items-center text-primary font-bold">
                                            <IconCurrencyRupee size={14} /> {coach.rate} <span className="text-[9px] text-base-content/50 font-normal">/ hr</span>
                                        </span>
                                        <span className="text-[9px] text-base-content/50 font-semibold flex items-center gap-1">
                                            <IconClock size={10} /> {slots.length} Slots Open
                                        </span>
                                    </div>

                                    {/* Trigger Book button */}
                                    <button
                                        onClick={() => {
                                            setActiveCoach(coach);
                                            setSelectedSlot(slots[0] || "");
                                            setBookingSuccess("");
                                        }}
                                        className="btn btn-xs btn-primary font-bold w-full h-8 normal-case"
                                    >
                                        📅 Book Session
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Booking Modal */}
            {activeCoach && (
                <div className="modal modal-open animate__animated animate__fadeIn">
                    <div className="modal-box max-w-sm p-5 border border-base-300 shadow-2xl relative bg-base-100">
                        {/* Close button */}
                        <button
                            onClick={() => setActiveCoach(null)}
                            className="btn btn-ghost btn-circle btn-xs absolute right-3 top-3"
                        >
                            <IconX size={14} />
                        </button>

                        <h3 className="font-bold text-sm flex items-center gap-1.5 mb-2">
                            📅 Schedule Sparring Lesson
                        </h3>
                        <p className="text-[10px] text-base-content/60 mb-4">
                            Select an available slot below. Session will be hosted inside a private lobby with analyzing tools.
                        </p>

                        {/* Booking form */}
                        <div className="space-y-4">
                            <div>
                                <label className="label label-text py-0.5 text-[9px] font-semibold uppercase tracking-wider text-base-content/50">
                                    Titled Instructor
                                </label>
                                <div className="text-xs font-bold bg-base-200 p-2.5 rounded-lg border border-base-300 flex items-center gap-2">
                                    <span className="badge badge-warning badge-xs font-black">{activeCoach.title}</span>
                                    {activeCoach.name}
                                </div>
                            </div>

                            {/* Slot selector */}
                            <div>
                                <label className="label label-text py-0.5 text-[9px] font-semibold uppercase tracking-wider text-base-content/50">
                                    Available Time Blocks
                                </label>
                                <select
                                    className="select select-bordered select-sm w-full text-xs font-semibold"
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

                            {/* Session rate details */}
                            <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-dashed border-base-300">
                                <span className="text-base-content/60">Total Cost (1 Hour):</span>
                                <span className="text-primary flex items-center">
                                    <IconCurrencyRupee size={14} /> {activeCoach.rate}
                                </span>
                            </div>

                            {/* Success panel */}
                            {bookingSuccess && (
                                <div className="alert alert-success text-[10px] font-bold p-2.5 flex items-start gap-1 rounded-lg animate__animated animate__fadeIn">
                                    <IconUserCheck size={14} className="shrink-0 text-success mt-0.5" />
                                    <div>{bookingSuccess}</div>
                                </div>
                            )}

                            {/* Action confirmation button */}
                            {!bookingSuccess ? (
                                <button
                                    onClick={triggerBooking}
                                    className={`btn btn-sm btn-primary w-full font-bold normal-case ${
                                        bookingLoading ? "loading" : ""
                                    }`}
                                    disabled={bookingLoading}
                                >
                                    💳 Pay & Confirm Booking
                                </button>
                            ) : (
                                <button
                                    onClick={() => setActiveCoach(null)}
                                    className="btn btn-sm btn-neutral w-full font-bold normal-case"
                                >
                                    Done
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
