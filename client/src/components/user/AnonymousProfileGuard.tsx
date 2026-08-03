"use client";

import { useEffect } from "react";
import { IconShieldLock, IconUserPlus, IconLogin, IconTrophy, IconChartLine, IconCrown } from "@tabler/icons-react";
import { signIn } from "next-auth/react";

interface AnonymousProfileGuardProps {
  guestName: string;
}

export default function AnonymousProfileGuard({ guestName }: AnonymousProfileGuardProps) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Clear temporary/anonymous cached data
      localStorage.removeItem("chessthan:guestData");
      localStorage.removeItem("chessthan:anonSession");
      sessionStorage.removeItem("chessthan:tempLobby");
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4 py-8">
      <div className="card w-full max-w-lg bg-[#121620] border border-[#1f293d] shadow-2xl p-6 sm:p-8 text-center rounded-2xl gap-5 animate__animated animate__zoomIn">
        
        {/* Shield Header Icon */}
        <div className="p-4 bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 w-20 h-20 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
          <IconShieldLock className="w-10 h-10 animate-pulse" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">
            Guest Profile Restricted
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Anonymous account (<span className="font-mono text-emerald-400 font-bold">{guestName}</span>)
          </p>
        </div>

        {/* Feature Benefits List */}
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-xl text-left space-y-3 shadow-inner">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider text-center border-b border-slate-800 pb-2">
            Unlock Full Chessthan Experience
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <IconChartLine size={16} className="text-emerald-400 shrink-0" />
              <span>Track ELO & Win Rates</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <IconTrophy size={16} className="text-amber-400 shrink-0" />
              <span>Compete in Leaderboards</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <IconCrown size={16} className="text-purple-400 shrink-0" />
              <span>Unlock PRO Features</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <IconShieldLock size={16} className="text-sky-400 shrink-0" />
              <span>Save Full Game PGN Archives</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-1">
          <button
            onClick={() => signIn()}
            className="btn btn-emerald w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold border-0 gap-2 shadow-lg"
          >
            <IconLogin size={18} />
            Sign In
          </button>
          
          <button
            onClick={() => signIn()}
            className="btn w-full sm:flex-1 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700 font-bold gap-2"
          >
            <IconUserPlus size={18} className="text-emerald-400" />
            Register Account
          </button>
        </div>
      </div>
    </div>
  );
}
