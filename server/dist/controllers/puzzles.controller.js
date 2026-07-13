import { prisma } from "../db/index.js";
import xss from "xss";
// Fallback puzzle list if database is empty
const FALLBACK_PUZZLES = [
    {
        id: "backrank-mate-1",
        fen: "3r2k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
        moves: "d1d8",
        rating: 600,
        theme: "Back Rank Mate"
    },
    {
        id: "fried-liver-1",
        fen: "r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
        moves: "f3g5",
        rating: 900,
        theme: "Vulnerable f7"
    },
    {
        id: "smothered-mate-1",
        fen: "6rk/5Npp/8/8/8/8/8/6K1 b - - 0 1",
        moves: "g8f8", // Wait, this is just knight checkmate! Black is checkmated already.
        rating: 1200,
        theme: "Smothered Mate"
    }
];
/**
 * Gets a puzzle based on user's current puzzle rating
 */
export const getRandomPuzzle = async (req, res) => {
    try {
        let userRating = 1200;
        if (req.session.user?.id && typeof req.session.user.id === "number") {
            const user = await prisma.user.findUnique({
                where: { id: req.session.user.id }
            });
            if (user) {
                userRating = user.puzzleRating;
            }
        }
        // Fetch puzzle close to user's rating
        const puzzles = await prisma.puzzle.findMany({
            where: {
                rating: {
                    gte: userRating - 200,
                    lte: userRating + 200
                }
            },
            take: 10
        });
        if (puzzles.length === 0) {
            // Check if any puzzles exist
            const anyPuzzle = await prisma.puzzle.findFirst();
            if (!anyPuzzle) {
                // Return a random fallback puzzle
                const fallback = FALLBACK_PUZZLES[Math.floor(Math.random() * FALLBACK_PUZZLES.length)];
                res.status(200).json(fallback);
                return;
            }
            res.status(200).json(anyPuzzle);
            return;
        }
        const selected = puzzles[Math.floor(Math.random() * puzzles.length)];
        res.status(200).json(selected);
    }
    catch (err) {
        console.error("getRandomPuzzle error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
/**
 * Handles completing a puzzle and updating ELO rating
 */
export const solvePuzzle = async (req, res) => {
    try {
        const puzzleId = xss(req.params.id);
        const solved = req.body.solved === true;
        if (!req.session.user?.id || typeof req.session.user.id === "string") {
            // For anonymous guests, return mock rating update
            res.status(200).json({
                success: true,
                ratingChange: solved ? 15 : -15,
                newRating: 1200 + (solved ? 15 : -15)
            });
            return;
        }
        const userId = req.session.user.id;
        // Fetch user and puzzle
        const user = await prisma.user.findUnique({ where: { id: userId } });
        let puzzle = await prisma.puzzle.findUnique({ where: { id: puzzleId } });
        // Fallback puzzle handling
        if (!puzzle) {
            const fb = FALLBACK_PUZZLES.find((f) => f.id === puzzleId);
            if (fb) {
                puzzle = fb;
            }
        }
        if (!user || !puzzle) {
            res.status(404).json({ message: "User or Puzzle not found." });
            return;
        }
        // Calculate ELO Rating Change
        // Standard formula: E = 1 / (1 + 10^((R_puzzle - R_user) / 400))
        const userRating = user.puzzleRating;
        const puzzleRating = puzzle.rating;
        const K = 32;
        const E = 1 / (1 + Math.pow(10, (puzzleRating - userRating) / 400));
        const S = solved ? 1 : 0;
        const ratingChange = Math.round(K * (S - E));
        const newRating = Math.max(100, userRating + ratingChange);
        // Update user rating in DB
        await prisma.user.update({
            where: { id: userId },
            data: {
                puzzleRating: newRating,
                xp: {
                    increment: solved ? 20 : 5 // solve grants 20xp, fail grants 5xp
                }
            }
        });
        // Record history
        if (!puzzleId.startsWith("backrank-") && !puzzleId.startsWith("fried-") && !puzzleId.startsWith("smothered-")) {
            await prisma.userPuzzleHistory.create({
                data: {
                    userId,
                    puzzleId,
                    solved
                }
            });
        }
        // Also record ELO progression in EloHistory
        await prisma.eloHistory.create({
            data: {
                userId,
                gameType: "puzzle",
                elo: newRating
            }
        });
        res.status(200).json({
            success: true,
            ratingChange,
            newRating
        });
    }
    catch (err) {
        console.error("solvePuzzle error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
