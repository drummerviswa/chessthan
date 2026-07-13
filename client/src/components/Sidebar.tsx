"use client";

import { useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { SessionContext } from "@/context/session";
import { signOut } from "next-auth/react";
import { logout } from "@/lib/auth";
import {
    IconLayoutDashboard,
    IconPuzzle,
    IconTrophy,
    IconUserCircle,
    IconSettings,
    IconCrown,
    IconLogout,
    IconLogin
} from "@tabler/icons-react";

export default function Sidebar() {
    const session = useContext(SessionContext);
    const pathname = usePathname();

    const isLoggedIn = !!session?.user?.id;
    const isPro = session?.user?.subscriptionStatus === "active";

    const menuItems = [
        {
            label: "Play",
            href: "/",
            icon: IconLayoutDashboard,
            active: pathname === "/"
        },
        {
            label: "Puzzles",
            href: "/puzzles",
            icon: IconPuzzle,
            active: pathname === "/puzzles"
        },
        {
            label: "Leagues",
            href: "/leaderboard",
            icon: IconTrophy,
            active: pathname === "/leaderboard"
        },
        {
            label: "Settings",
            href: "/settings",
            icon: IconSettings,
            active: pathname === "/settings"
        }
    ];

    const handleLogout = async () => {
        await signOut({ redirect: false });
        await logout();
        session?.setUser(null);
    };

    return (
        <>
            {/* Desktop Left Sidebar: Pinned to screen */}
            <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-16 hover:w-64 bg-base-200 border-r border-base-300 text-base-content transition-all duration-300 ease-in-out z-30 group overflow-hidden shadow-xl">
                {/* Logo Area */}
                <div className="flex items-center h-20 px-4 gap-3 border-b border-base-300 overflow-hidden shrink-0">
                    <div className="w-8 h-8 shrink-0 relative animate-pulse">
                        <Image src="/gaming.png" alt="logo" fill className="object-contain" />
                    </div>
                    <span className="font-extrabold text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Chessthan
                    </span>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 py-6 space-y-2 px-2 overflow-y-auto overflow-x-hidden">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 ${
                                    item.active
                                        ? "bg-primary text-primary-content shadow-lg shadow-primary/20"
                                        : "hover:bg-base-300/80"
                                }`}
                            >
                                <Icon size={20} className="shrink-0" />
                                <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Premium / Upgrade card */}
                    {isLoggedIn && !isPro && (
                        <label
                            htmlFor="upgrade-modal"
                            className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-warning/20 text-warning cursor-pointer transition-all duration-200 border border-transparent hover:border-warning/30"
                        >
                            <IconCrown size={20} className="shrink-0 animate-bounce" />
                            <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                Upgrade to Pro
                            </span>
                        </label>
                    )}
                </nav>

                {/* Profile & Footer Menu */}
                <div className="p-2 border-t border-base-300 bg-base-200/80 shrink-0">
                    {isLoggedIn && session?.user ? (
                        <div className="space-y-1">
                            <Link
                                href={`/user/${session.user.name || ""}`}
                                className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-base-300/80 transition-all duration-200"
                            >
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                    {session.user.avatarUrl ? (
                                        <img src={session.user.avatarUrl} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                                    ) : (
                                        <IconUserCircle size={20} className="text-primary" />
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <span className="text-xs font-bold truncate">{session.user.name}</span>
                                    {isPro && <span className="text-[9px] text-primary font-extrabold uppercase tracking-wider">Premium</span>}
                                </div>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-4 w-full px-3 py-3 rounded-xl hover:bg-error/10 text-error transition-all duration-200"
                            >
                                <IconLogout size={20} className="shrink-0" />
                                <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                    Log Out
                                </span>
                            </button>
                        </div>
                    ) : (
                        <label
                            htmlFor="auth-modal"
                            className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-primary/10 text-primary cursor-pointer transition-all duration-200"
                        >
                            <IconLogin size={20} className="shrink-0" />
                            <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                Log In / Sign Up
                            </span>
                        </label>
                    )}
                </div>
            </aside>

            {/* Mobile Bottom Tabbar: Fixed at bottom */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-base-200 border-t border-base-300 flex items-center justify-around z-30 px-2 py-1 shadow-2xl">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex flex-col items-center justify-center flex-1 h-full py-1 rounded-xl transition-all duration-200 ${
                                item.active ? "text-primary font-boldScale" : "text-base-content/60"
                            }`}
                        >
                            <Icon size={20} />
                            <span className="text-[10px] mt-0.5">{item.label}</span>
                        </Link>
                    );
                })}

                {/* Profile / Login selector */}
                {isLoggedIn && session?.user ? (
                    <Link
                        href={`/user/${session.user.name || ""}`}
                        className={`flex flex-col items-center justify-center flex-1 h-full py-1 ${
                            pathname.startsWith("/user/") ? "text-primary font-bold" : "text-base-content/60"
                        }`}
                    >
                        <div className="w-5 h-5 rounded-full overflow-hidden border border-base-content/25 relative flex items-center justify-center">
                            {session.user.avatarUrl ? (
                                <img src={session.user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <IconUserCircle size={16} />
                            )}
                        </div>
                        <span className="text-[10px] mt-0.5">Profile</span>
                    </Link>
                ) : (
                    <label
                        htmlFor="auth-modal"
                        className="flex flex-col items-center justify-center flex-1 h-full py-1 text-base-content/60 cursor-pointer"
                    >
                        <IconLogin size={20} />
                        <span className="text-[10px] mt-0.5">Log In</span>
                    </label>
                )}
            </nav>
        </>
    );
}
