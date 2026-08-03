"use client";

import { useState } from "react";
import CreateGame from "./CreateGame";
import JoinGame from "./JoinGame";
import { IconPlus, IconLink, IconX } from "@tabler/icons-react";

interface CustomMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomMatchModal({ isOpen, onClose }: CustomMatchModalProps) {
  const [tab, setTab] = useState<"create" | "join">("create");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate__animated animate__fadeIn">
      <div className="relative w-full max-w-md bg-base-200 border border-base-300 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate__animated animate__zoomIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn btn-circle btn-xs btn-ghost text-base-content/60 hover:text-base-content"
        >
          <IconX size={16} />
        </button>

        {/* Title */}
        <div className="text-center">
          <h3 className="text-lg font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Custom Match Arena
          </h3>
          <p className="text-[10px] text-base-content/50">
            Set custom rule sheets or enter active game join codes
          </p>
        </div>

        {/* Tab Selection */}
        <div className="tabs tabs-boxed grid grid-cols-2 p-1 bg-base-300/40">
          <button
            onClick={() => setTab("create")}
            className={`tab tab-sm font-bold gap-1 ${tab === "create" ? "tab-active" : ""}`}
          >
            <IconPlus size={14} /> Create Match
          </button>
          <button
            onClick={() => setTab("join")}
            className={`tab tab-sm font-bold gap-1 ${tab === "join" ? "tab-active" : ""}`}
          >
            <IconLink size={14} /> Enter Invite
          </button>
        </div>

        {/* Content */}
        <div className="pt-2">
          {tab === "create" ? <CreateGame /> : (
            <div className="bg-base-100 p-4 border border-base-300 rounded-xl shadow-inner space-y-4">
              <h4 className="text-xs font-bold">Join Existing Match</h4>
              <p className="text-[10px] text-base-content/60 leading-relaxed">
                Paste the invite URL or game room code (e.g. <span className="font-mono text-primary">opera-house-morphy</span>) to join a friend&apos;s room.
              </p>
              <JoinGame />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
