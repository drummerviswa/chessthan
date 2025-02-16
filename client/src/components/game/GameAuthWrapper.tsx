"use client";

import { SessionContext } from "@/context/session";
import type { Game } from "@/types_config/index";
import { useContext } from "react";
import "animate.css"

import GamePage from "./GamePage";

export default function GameAuthWrapper({ initialLobby }: { initialLobby: Game }) {
  const session = useContext(SessionContext);

  if (!session?.user || !session.user?.id) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 animate__animated animate__flipInX">
        <div className="text-2xl font-bold">Loading</div>
        <div className="text-xl">Waiting for authentication...</div>
      </div>
    );
  }

  return <GamePage initialLobby={initialLobby} />;
}
