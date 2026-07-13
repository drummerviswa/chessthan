import { prisma } from "../index.js";
export const activeGames = [];
export const save = async (game) => {
    try {
        const white = {};
        const black = {};
        if (game.white) {
            if (typeof game.white.id === "number") {
                white.id = game.white.id;
            }
            else {
                white.name = game.white.name || undefined;
            }
        }
        if (game.black) {
            if (typeof game.black.id === "number") {
                black.id = game.black.id;
            }
            else {
                black.name = game.black.name || undefined;
            }
        }
        const newGame = await prisma.game.create({
            data: {
                winner: game.winner || null,
                endReason: game.endReason || null,
                pgn: game.pgn || null,
                whiteId: white.id || null,
                whiteName: game.white?.name || null,
                blackId: black.id || null,
                blackName: game.black?.name || null,
                startedAt: new Date(game.startedAt)
            }
        });
        // Update player stats if registered users
        if (white.id || black.id) {
            // Determine game pool based on timeout
            const gameType = game.timeout
                ? (game.timeout <= 180 ? "bullet" : (game.timeout <= 600 ? "blitz" : (game.timeout <= 1800 ? "rapid" : "classical")))
                : "blitz";
            const eloFieldMap = {
                bullet: "eloBullet",
                blitz: "eloBlitz",
                rapid: "eloRapid",
                classical: "eloClassical"
            };
            const eloField = eloFieldMap[gameType];
            // Fetch current ratings
            let whiteElo = 1200;
            let blackElo = 1200;
            if (white.id) {
                const wUser = await prisma.user.findUnique({ where: { id: white.id } });
                if (wUser)
                    whiteElo = wUser[eloField];
            }
            if (black.id) {
                const bUser = await prisma.user.findUnique({ where: { id: black.id } });
                if (bUser)
                    blackElo = bUser[eloField];
            }
            // Expectation scores
            const Ew = 1 / (1 + Math.pow(10, (blackElo - whiteElo) / 400));
            const Eb = 1 / (1 + Math.pow(10, (whiteElo - blackElo) / 400));
            // Actual scores
            let Sw = 0.5;
            let Sb = 0.5;
            if (game.winner === "white") {
                Sw = 1;
                Sb = 0;
            }
            else if (game.winner === "black") {
                Sw = 0;
                Sb = 1;
            }
            // ELO deltas
            const deltaW = Math.round(32 * (Sw - Ew));
            const deltaB = Math.round(32 * (Sb - Eb));
            // 1. Update White Player
            if (white.id) {
                const isDraw = game.winner === "draw";
                const isWin = game.winner === "white";
                const newElo = Math.max(100, whiteElo + deltaW);
                await prisma.user.update({
                    where: { id: white.id },
                    data: {
                        draws: isDraw ? { increment: 1 } : undefined,
                        wins: isWin ? { increment: 1 } : undefined,
                        losses: (!isDraw && !isWin) ? { increment: 1 } : undefined,
                        [eloField]: newElo,
                        xp: {
                            increment: isWin ? 30 : (isDraw ? 15 : 10)
                        }
                    }
                });
                await prisma.eloHistory.create({
                    data: {
                        userId: white.id,
                        gameType,
                        elo: newElo
                    }
                });
            }
            // 2. Update Black Player
            if (black.id) {
                const isDraw = game.winner === "draw";
                const isWin = game.winner === "black";
                const newElo = Math.max(100, blackElo + deltaB);
                await prisma.user.update({
                    where: { id: black.id },
                    data: {
                        draws: isDraw ? { increment: 1 } : undefined,
                        wins: isWin ? { increment: 1 } : undefined,
                        losses: (!isDraw && !isWin) ? { increment: 1 } : undefined,
                        [eloField]: newElo,
                        xp: {
                            increment: isWin ? 30 : (isDraw ? 15 : 10)
                        }
                    }
                });
                await prisma.eloHistory.create({
                    data: {
                        userId: black.id,
                        gameType,
                        elo: newElo
                    }
                });
            }
        }
        return {
            id: newGame.id,
            winner: newGame.winner || undefined,
            endReason: newGame.endReason || undefined,
            pgn: newGame.pgn || undefined,
            white: {
                id: newGame.whiteId || undefined,
                name: newGame.whiteName || undefined
            },
            black: {
                id: newGame.blackId || undefined,
                name: newGame.blackName || undefined
            },
            startedAt: newGame.startedAt.getTime(),
            endedAt: newGame.endedAt?.getTime() || undefined
        };
    }
    catch (err) {
        console.log(err);
        return null;
    }
};
export const findById = async (id) => {
    try {
        const game = await prisma.game.findUnique({
            where: { id },
            include: {
                whitePlayer: true,
                blackPlayer: true
            }
        });
        if (game) {
            return {
                id: game.id,
                winner: game.winner || undefined,
                endReason: game.endReason || undefined,
                pgn: game.pgn || undefined,
                white: {
                    id: game.whiteId || undefined,
                    name: game.whitePlayer?.name || game.whiteName || undefined
                },
                black: {
                    id: game.blackId || undefined,
                    name: game.blackPlayer?.name || game.blackName || undefined
                },
                startedAt: game.startedAt.getTime(),
                endedAt: game.endedAt?.getTime() || undefined
            };
        }
        else
            return null;
    }
    catch (err) {
        console.log(err);
        return null;
    }
};
export const findByUserId = async (id, limit = 10) => {
    if (id === 0) {
        return null;
    }
    try {
        const games = await prisma.game.findMany({
            where: {
                OR: [
                    { whiteId: id },
                    { blackId: id }
                ]
            },
            include: {
                whitePlayer: true,
                blackPlayer: true
            },
            orderBy: {
                id: "desc"
            },
            take: limit
        });
        return games.map((game) => {
            return {
                id: game.id,
                winner: game.winner || undefined,
                endReason: game.endReason || undefined,
                pgn: game.pgn || undefined,
                white: {
                    id: game.whiteId || undefined,
                    name: game.whitePlayer?.name || game.whiteName || undefined
                },
                black: {
                    id: game.blackId || undefined,
                    name: game.blackPlayer?.name || game.blackName || undefined
                },
                startedAt: game.startedAt.getTime(),
                endedAt: game.endedAt?.getTime() || undefined
            };
        });
    }
    catch (err) {
        console.log(err);
        return null;
    }
};
export const remove = async (id) => {
    try {
        const deleted = await prisma.game.delete({
            where: { id }
        });
        return {
            id: deleted.id,
            winner: deleted.winner || undefined,
            endReason: deleted.endReason || undefined,
            pgn: deleted.pgn || undefined,
            white: { id: deleted.whiteId || undefined, name: deleted.whiteName || undefined },
            black: { id: deleted.blackId || undefined, name: deleted.blackName || undefined },
            startedAt: deleted.startedAt.getTime(),
            endedAt: deleted.endedAt?.getTime() || undefined
        };
    }
    catch (err) {
        console.log(err);
        return null;
    }
};
const GameModel = {
    save,
    findById,
    findByUserId,
    remove
};
export default GameModel;
