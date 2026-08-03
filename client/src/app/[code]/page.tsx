import GameAuthWrapper from "@/components/game/GameAuthWrapper";
import { fetchActiveGame } from "@/lib/game";

export async function generateMetadata({ params }: { params: { code: string } }) {
  const game = await fetchActiveGame(params.code);
  return {
    title: game ? `Match ${game.code} || chessthan` : "Chess Match || chessthan",
    description: `Play or watch online chess matches on chessthan`,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      noarchive: true
    }
  };
}

export default async function Game({ params }: { params: { code: string } }) {
  const activeGame = await fetchActiveGame(params.code);

  const fallbackGame = {
    code: params.code,
    unlisted: false,
    host: { id: "completed", name: "Player" },
    white: { id: "completed_w", name: "White Player" },
    black: { id: "completed_b", name: "Black Player" },
    pgn: "",
    variant: "standard" as const,
    timeControl: "Casual",
    rated: false,
    endReason: "abandoned" as const,
    winner: "draw" as const
  };

  return <GameAuthWrapper initialLobby={activeGame || fallbackGame} />;
}
