import xss from "xss";
import { prisma } from "../db/index.js";
export const getUserProfile = async (req, res) => {
    try {
        const name = xss(req.params.name);
        const user = await prisma.user.findUnique({
            where: { name },
            include: {
                eloHistory: {
                    orderBy: { recordedAt: "asc" }
                }
            }
        });
        if (!user) {
            res.status(404).end();
            return;
        }
        // Fetch recent games using Prisma
        const recentGames = await prisma.game.findMany({
            where: {
                OR: [
                    { whiteId: user.id },
                    { blackId: user.id }
                ]
            },
            orderBy: { endedAt: "desc" },
            take: 20,
            include: {
                whitePlayer: {
                    select: { id: true, name: true }
                },
                blackPlayer: {
                    select: { id: true, name: true }
                }
            }
        });
        // Format games to match legacy response layout
        const formattedGames = recentGames.map((g) => ({
            id: g.id,
            winner: g.winner,
            endReason: g.endReason,
            pgn: g.pgn,
            startedAt: g.startedAt.getTime(),
            endedAt: g.endedAt.getTime(),
            white: g.whitePlayer ? { id: g.whitePlayer.id, name: g.whitePlayer.name } : { name: g.whiteName || "Guest" },
            black: g.blackPlayer ? { id: g.blackPlayer.id, name: g.blackPlayer.name } : { name: g.blackName || "Guest" }
        }));
        res.status(200).json({
            id: user.id,
            name: user.name,
            wins: user.wins,
            losses: user.losses,
            draws: user.draws,
            eloBullet: user.eloBullet,
            eloBlitz: user.eloBlitz,
            eloRapid: user.eloRapid,
            eloClassical: user.eloClassical,
            puzzleRating: user.puzzleRating,
            division: user.division,
            xp: user.xp,
            avatarUrl: user.avatarUrl,
            subscriptionStatus: user.subscriptionStatus,
            eloHistory: user.eloHistory.map((h) => ({
                id: h.id,
                gameType: h.gameType,
                elo: h.elo,
                recordedAt: h.recordedAt.getTime()
            })),
            recentGames: formattedGames
        });
    }
    catch (err) {
        console.error("getUserProfile error:", err);
        res.status(500).end();
    }
};
export const getEloLeaderboard = async (req, res) => {
    try {
        const type = xss(req.query.type || "blitz");
        let orderBy = {};
        if (type === "bullet")
            orderBy = { eloBullet: "desc" };
        else if (type === "rapid")
            orderBy = { eloRapid: "desc" };
        else if (type === "classical")
            orderBy = { eloClassical: "desc" };
        else if (type === "puzzle")
            orderBy = { puzzleRating: "desc" };
        else
            orderBy = { eloBlitz: "desc" };
        const players = await prisma.user.findMany({
            orderBy,
            take: 20,
            select: {
                id: true,
                name: true,
                wins: true,
                losses: true,
                draws: true,
                eloBullet: true,
                eloBlitz: true,
                eloRapid: true,
                eloClassical: true,
                puzzleRating: true,
                division: true,
                xp: true,
                avatarUrl: true
            }
        });
        res.status(200).json(players);
    }
    catch (err) {
        console.error("getEloLeaderboard error:", err);
        res.status(500).end();
    }
};
export const getLeagueLeaderboard = async (req, res) => {
    try {
        const division = xss(req.query.division || "Bronze");
        const players = await prisma.user.findMany({
            where: { division },
            orderBy: { xp: "desc" },
            take: 30,
            select: {
                id: true,
                name: true,
                wins: true,
                losses: true,
                draws: true,
                eloBlitz: true,
                division: true,
                xp: true,
                avatarUrl: true
            }
        });
        res.status(200).json(players);
    }
    catch (err) {
        console.error("getLeagueLeaderboard error:", err);
        res.status(500).end();
    }
};
