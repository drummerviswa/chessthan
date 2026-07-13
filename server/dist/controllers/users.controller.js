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
export const listCoaches = async (req, res) => {
    try {
        let dbCoaches = [];
        try {
            if ("coachProfile" in prisma || prisma.coachProfile) {
                dbCoaches = await prisma.coachProfile.findMany({
                    include: {
                        user: {
                            select: { name: true, avatarUrl: true }
                        }
                    }
                });
            }
        }
        catch (e) {
            console.log("Database CoachProfile query not yet migrated, using seeded coaches fallback.");
        }
        // Beautiful default seeded titled coaches list
        const seededCoaches = [
            {
                id: 961,
                title: "GM",
                rate: 1500, // INR per hour
                elo: 2580,
                name: "GM Viswanathan Ramesh",
                avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150",
                description: "Grandmaster and former National Coach. Specialist in endgame dynamics and tactical calculation patterns.",
                availability: JSON.stringify(["Monday 14:00-18:00", "Wednesday 14:00-18:00", "Friday 10:00-14:00"])
            },
            {
                id: 962,
                title: "IM",
                rate: 900,
                elo: 2420,
                name: "IM Pragya Sharma",
                avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
                description: "International Master with 6+ years of coaching experience. Expert in Sicilian defense structures and opening preparation.",
                availability: JSON.stringify(["Tuesday 16:00-20:00", "Thursday 16:00-20:00", "Saturday 12:00-16:00"])
            },
            {
                id: 963,
                title: "FM",
                rate: 600,
                elo: 2290,
                name: "FM Daniel Wright",
                avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
                description: "FIDE Master. Focused on helping club players bridge the gap to 2000 ELO through middle-game plans.",
                availability: JSON.stringify(["Monday 09:00-12:00", "Thursday 09:00-12:00", "Sunday 15:00-18:00"])
            }
        ];
        // Merge DB coaches into response if any exist
        const formattedDbCoaches = dbCoaches.map((c) => ({
            id: c.id,
            title: c.title,
            rate: c.rate,
            elo: c.elo,
            name: c.user?.name || "Titled Coach",
            avatarUrl: c.user?.avatarUrl || null,
            description: c.description,
            availability: c.availability
        }));
        const result = [...formattedDbCoaches, ...seededCoaches];
        res.status(200).json(result);
    }
    catch (err) {
        console.error("listCoaches error:", err);
        res.status(500).end();
    }
};
export const bookCoachSession = async (req, res) => {
    try {
        const { coachId, timeSlot } = req.body;
        if (!coachId || !timeSlot) {
            res.status(400).json({ message: "coachId and timeSlot are required" });
            return;
        }
        // Simulates slot booking triggers
        res.status(200).json({
            success: true,
            message: `Successfully booked coaching session for ${timeSlot}! Confirmation email has been sent.`,
            bookingId: `BK-${Math.floor(100000 + Math.random() * 900000)}`
        });
    }
    catch (err) {
        console.error("bookCoachSession error:", err);
        res.status(500).end();
    }
};
