import CopyLink from "@/components/user/CopyLink";
import { fetchProfileData } from "@/lib/user";
import EloProgressGraph from "@/components/user/EloProgressGraph";
import StatsDashboard from "@/components/user/StatsDashboard";
import {
  IconCrown,
  IconShield,
  IconTrophy,
  IconBolt,
  IconSwords,
  IconClock,
  IconHourglass,
  IconPuzzle
} from "@tabler/icons-react";

export async function generateMetadata({ params }: { params: { name: string } }) {
  const data = await fetchProfileData(params.name);
  return {
    title: data ? `${data.name} || chessthan` : "Player Profile || chessthan",
    description: data ? `${data.name}'s profile on chessthan` : "Player Profile on chessthan",
    robots: {
      index: true,
      follow: false,
      nocache: true
    }
  };
}

import AnonymousProfileGuard from "@/components/user/AnonymousProfileGuard";

export default async function Profile({ params }: { params: { name: string } }) {
  const data = await fetchProfileData(params.name);
  const isGuestProfile = !data || params.name.startsWith("Guest_") || params.name.startsWith("guest_") || params.name.toLowerCase().includes("guest");

  if (isGuestProfile) {
    return <AnonymousProfileGuard guestName={params.name} />;
  }

  // League badge icon
  let LeagueIcon = IconShield;
  let leagueColor = "text-slate-400";
  if (data.division === "Silver") {
    LeagueIcon = IconTrophy;
    leagueColor = "text-slate-300";
  } else if (data.division === "Gold") {
    LeagueIcon = IconTrophy;
    leagueColor = "text-amber-400";
  } else if (data.division === "Champion") {
    LeagueIcon = IconCrown;
    leagueColor = "text-purple-400";
  }

  return (
    <div className="mt-8 flex w-full flex-col gap-8 animate__animated animate__fadeIn">
      
      {/* Premium Profile Header Card */}
      <div className="bg-base-200 border border-base-300 p-6 rounded-2xl shadow flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* User Info Block */}
        <div className="flex items-center gap-4">
          <div className="avatar">
            <div className="w-16 h-16 rounded-full border-2 border-primary/50 shadow relative overflow-hidden bg-primary/10 flex items-center justify-center">
              {data.avatarUrl ? (
                <img src={data.avatarUrl || undefined} alt={data.name || "User"} className="object-cover w-full h-full" />
              ) : (
                <span className="text-2xl font-black text-primary">{data.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              {data.name}
              {data.subscriptionStatus === "active" && (
                <span className="badge badge-warning badge-xs font-black px-1.5 py-0.5 flex items-center gap-1">
                  <IconCrown size={10} /> PRO
                </span>
              )}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-base-content/60 font-bold">
              <span className={`flex items-center gap-1 ${leagueColor}`}>
                <LeagueIcon size={14} /> {data.division} Division
              </span>
              <span>•</span>
              <span>{data.xp || 0} XP</span>
            </div>
            {/* XP progress bar */}
            <div className="w-40 bg-base-300 h-2 rounded-full overflow-hidden mt-1.5 border border-base-300">
              <div 
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${Math.min(100, ((data.xp || 0) % 1000) / 10)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Win/Loss Record */}
        <div className="flex gap-6 bg-base-100 px-6 py-3 rounded-xl border border-base-300 text-xs">
          <div className="flex flex-col items-center">
            <span className="font-bold text-success">Wins</span>
            <span className="text-lg font-black">{data.wins}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-base-content/50">Draws</span>
            <span className="text-lg font-black">{data.draws}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-error">Losses</span>
            <span className="text-lg font-black">{data.losses}</span>
          </div>
        </div>
        
        <CopyLink name={data.name as string} />
      </div>

      {/* Ratings Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Bullet card */}
        <div className="card bg-base-200 border border-base-300 shadow hover:shadow-lg transition-all duration-200 p-4 flex flex-col items-center justify-center text-center">
          <IconBolt className="w-6 h-6 text-amber-400 mb-1" />
          <span className="text-[10px] uppercase font-bold text-base-content/50">Bullet</span>
          <span className="text-lg font-black mt-0.5">{data.eloBullet}</span>
        </div>

        {/* Blitz card */}
        <div className="card bg-base-200 border border-base-300 shadow hover:shadow-lg transition-all duration-200 p-4 flex flex-col items-center justify-center text-center">
          <IconSwords className="w-6 h-6 text-emerald-400 mb-1" />
          <span className="text-[10px] uppercase font-bold text-base-content/50">Blitz</span>
          <span className="text-lg font-black mt-0.5">{data.eloBlitz}</span>
        </div>

        {/* Rapid card */}
        <div className="card bg-base-200 border border-base-300 shadow hover:shadow-lg transition-all duration-200 p-4 flex flex-col items-center justify-center text-center">
          <IconClock className="w-6 h-6 text-sky-400 mb-1" />
          <span className="text-[10px] uppercase font-bold text-base-content/50">Rapid</span>
          <span className="text-lg font-black mt-0.5">{data.eloRapid}</span>
        </div>

        {/* Classical card */}
        <div className="card bg-base-200 border border-base-300 shadow hover:shadow-lg transition-all duration-200 p-4 flex flex-col items-center justify-center text-center">
          <IconHourglass className="w-6 h-6 text-purple-400 mb-1" />
          <span className="text-[10px] uppercase font-bold text-base-content/50">Classical</span>
          <span className="text-lg font-black mt-0.5">{data.eloClassical}</span>
        </div>

        {/* Puzzles card */}
        <div className="card bg-base-200 border border-base-300 shadow hover:shadow-lg transition-all duration-200 p-4 flex flex-col items-center justify-center text-center">
          <IconPuzzle className="w-6 h-6 text-rose-400 mb-1" />
          <span className="text-[10px] uppercase font-bold text-base-content/50">Puzzles</span>
          <span className="text-lg font-black mt-0.5">{data.puzzleRating}</span>
        </div>

      </div>

      {/* ELO Rating Progression Line Graph */}
      <EloProgressGraph eloHistory={(data as any).eloHistory || []} />

      {/* Recharts Performance Stats Dashboard */}
      <StatsDashboard
        recentGames={data.recentGames}
        userName={data.name as string}
        wins={data.wins as number}
        losses={data.losses as number}
        draws={data.draws as number}
      />

      <div>
        <h2 className="mb-1 text-lg font-bold">Recent games</h2>
        <ul className="bg-base-300 flex h-[60vh] flex-col gap-1 overflow-y-scroll rounded-lg">
          {data.recentGames.map((game) => {
            let endReason = game.endReason as string;
            if (endReason === "repetition") {
              endReason = "threefold repetition";
            } else if (endReason === "insufficient") {
              endReason = "insufficient material";
            }

            return (
              <li
                key={game.id}
                className="border-base-100 flex flex-wrap items-center justify-between gap-8 border-b-2 p-3"
              >
                <div className="flex w-72 justify-between">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1 text-sm">
                      White
                      {game.winner === "white" && (
                        <span className="badge badge-xs badge-success">winner</span>
                      )}
                    </span>
                    <a
                      className={
                        "font-bold" +
                        (typeof game.white?.id === "number"
                          ? " text-primary link-hover"
                          : " cursor-default")
                      }
                      href={
                        typeof game.white?.id === "number" && game.white?.id !== data.id
                          ? `/user/${game.white?.name}`
                          : undefined
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {game.white?.name}
                    </a>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="flex items-center gap-1 text-sm">
                      {game.winner === "black" && (
                        <span className="badge badge-xs badge-success">winner</span>
                      )}
                      Black
                    </span>
                    <a
                      className={
                        "font-bold" +
                        (typeof game.black?.id === "number"
                          ? " text-primary link-hover"
                          : " cursor-default")
                      }
                      href={
                        typeof game.black?.id === "number" && game.black?.id !== data.id
                          ? `/user/${game.black?.name}`
                          : undefined
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {game.black?.name}
                    </a>
                  </div>
                </div>

                <div className="flex-grow text-end text-xs">{endReason}</div>

                <div className="flex flex-grow flex-col text-end">
                  <span className="text-xs">
                    Started
                    <span className="font-bold">
                      {" "}
                      {new Date(game.startedAt as number).toLocaleString()}
                    </span>
                  </span>
                  <span className="text-xs">
                    Ended
                    <span className="font-bold">
                      {" "}
                      {new Date(game.endedAt as number).toLocaleString()}
                    </span>
                  </span>
                </div>

                <a
                  className="btn btn-ghost flex-grow"
                  href={`/archive/${game.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Review game
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
