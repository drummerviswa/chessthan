"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { IconSwords } from "@tabler/icons-react";

export default function JoinButton({ code, isFull = false }: { code: string; isFull?: boolean }) {
  const router = useRouter();
  const [isLoading, startTransition] = useTransition();

  function handleJoin() {
    startTransition(() => {
      router.push(`/${code}`);
    });
  }

  return (
    <button
      className={`btn btn-xs font-bold gap-1 px-3 border-0 transition-all ${
        isFull
          ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
          : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
      } ${isLoading ? "loading" : ""}`}
      onClick={handleJoin}
      disabled={isLoading}
    >
      <IconSwords size={12} />
      {isLoading ? "Connecting..." : isFull ? "Spectate" : "Join Match"}
    </button>
  );
}
