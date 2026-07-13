import { io } from "../server.js";
export const activeTournaments = new Map();
// Generates simple room codes
function generateGameCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
export const createTournament = (name, type, timeControl, roundsOrDuration) => {
    const id = Math.random().toString(36).substring(2, 10).toUpperCase();
    const tournament = {
        id,
        name,
        type,
        status: "upcoming",
        timeControl,
        participants: new Map(),
        matches: [],
        currentRound: 0,
        roundsTotal: type === "swiss" ? roundsOrDuration : 0,
        durationMinutes: type === "arena" ? roundsOrDuration : 0
    };
    activeTournaments.set(id, tournament);
    return tournament;
};
export const joinTournament = (tournamentId, userId, userName) => {
    const t = activeTournaments.get(tournamentId);
    if (!t || t.status !== "upcoming")
        return false;
    if (!t.participants.has(userId)) {
        t.participants.set(userId, {
            id: userId,
            name: userName,
            score: 0,
            playedAgainst: [],
            streak: 0,
            isWaiting: true
        });
        broadcastLobbyUpdate(t);
    }
    return true;
};
export const startTournament = (tournamentId) => {
    const t = activeTournaments.get(tournamentId);
    if (!t || t.status !== "upcoming")
        return false;
    t.status = "active";
    t.startedAt = Date.now();
    if (t.type === "swiss") {
        t.currentRound = 1;
        generateSwissRound(t);
    }
    else {
        t.endsAt = Date.now() + t.durationMinutes * 60 * 1000;
        // Start continuous Arena matchmaking loops
        triggerArenaPairings(t);
    }
    io.to(`tournament:${t.id}`).emit("tournament:started", {
        id: t.id,
        name: t.name,
        type: t.type
    });
    broadcastLobbyUpdate(t);
    return true;
};
// 1. Swiss pairing Algorithm
const generateSwissRound = (t) => {
    const players = Array.from(t.participants.values()).sort((a, b) => b.score - a.score);
    const paired = new Set();
    const roundMatches = [];
    for (let i = 0; i < players.length; i++) {
        const p1 = players[i];
        if (paired.has(p1.id))
            continue;
        let opponent = null;
        // Try to match with similar score players they haven't faced yet
        for (let j = i + 1; j < players.length; j++) {
            const p2 = players[j];
            if (paired.has(p2.id))
                continue;
            if (!p1.playedAgainst.includes(p2.id)) {
                opponent = p2;
                break;
            }
        }
        // Fallback: match with first unpaired player
        if (!opponent) {
            for (let j = i + 1; j < players.length; j++) {
                const p2 = players[j];
                if (!paired.has(p2.id)) {
                    opponent = p2;
                    break;
                }
            }
        }
        if (opponent) {
            paired.add(p1.id);
            paired.add(opponent.id);
            p1.isWaiting = false;
            opponent.isWaiting = false;
            p1.playedAgainst.push(opponent.id);
            opponent.playedAgainst.push(p1.id);
            const gameCode = generateGameCode();
            // Register game in memory activeGames array
            import("../db/models/game.model.js").then(({ activeGames }) => {
                activeGames.push({
                    code: gameCode,
                    unlisted: true,
                    pgn: "",
                    host: { id: p1.id, name: p1.name, connected: false },
                    white: { id: p1.id, name: p1.name, connected: false },
                    black: { id: opponent.id, name: opponent.name, connected: false },
                    tournamentId: t.id
                });
            }).catch(err => console.error("Swiss push failed:", err));
            const match = {
                gameCode,
                player1: p1,
                player2: opponent,
                status: "pending"
            };
            roundMatches.push(match);
            t.matches.push(match);
            // Direct players to their game boards
            io.to(`user:${p1.id}`).emit("tournament:round_start", { gameCode, side: "white" });
            io.to(`user:${opponent.id}`).emit("tournament:round_start", { gameCode, side: "black" });
        }
        else {
            // Player gets a bye (+1 point)
            paired.add(p1.id);
            p1.score += 1;
            io.to(`user:${p1.id}`).emit("tournament:bye", { score: p1.score });
        }
    }
};
// 2. Arena Pairing Loop
export const triggerArenaPairings = (t) => {
    if (t.status !== "active")
        return;
    if (t.endsAt && Date.now() > t.endsAt) {
        completeTournament(t);
        return;
    }
    const waiting = Array.from(t.participants.values()).filter(p => p.isWaiting);
    // Sort waiting players slightly randomly or by ELO/Score proximity
    waiting.sort((a, b) => b.score - a.score);
    while (waiting.length >= 2) {
        const p1 = waiting.shift();
        const p2 = waiting.shift();
        p1.isWaiting = false;
        p2.isWaiting = false;
        const gameCode = generateGameCode();
        // Register game in memory activeGames array
        import("../db/models/game.model.js").then(({ activeGames }) => {
            activeGames.push({
                code: gameCode,
                unlisted: true,
                pgn: "",
                host: { id: p1.id, name: p1.name, connected: false },
                white: { id: p1.id, name: p1.name, connected: false },
                black: { id: p2.id, name: p2.name, connected: false },
                tournamentId: t.id
            });
        }).catch(err => console.error("Arena push failed:", err));
        const match = {
            gameCode,
            player1: p1,
            player2: p2,
            status: "pending"
        };
        t.matches.push(match);
        io.to(`user:${p1.id}`).emit("tournament:round_start", { gameCode, side: "white" });
        io.to(`user:${p2.id}`).emit("tournament:round_start", { gameCode, side: "black" });
    }
};
// Registers game completions
export const registerMatchResult = (tournamentId, gameCode, winnerId, isDraw = false) => {
    const t = activeTournaments.get(tournamentId);
    if (!t || t.status !== "active")
        return;
    const match = t.matches.find(m => m.gameCode === gameCode && m.status !== "completed");
    if (!match)
        return;
    match.status = "completed";
    match.winnerId = winnerId;
    const p1 = t.participants.get(match.player1.id);
    const p2 = t.participants.get(match.player2.id);
    if (p1 && p2) {
        p1.isWaiting = true;
        p2.isWaiting = true;
        if (isDraw) {
            p1.score += 1;
            p2.score += 1;
            p1.streak = 0;
            p2.streak = 0;
        }
        else if (winnerId !== null) {
            const winner = winnerId === p1.id ? p1 : p2;
            const loser = winnerId === p1.id ? p2 : p1;
            winner.streak += 1;
            loser.streak = 0;
            // Score calculation (Streak bonus: Chess.com Arena style)
            if (t.type === "arena") {
                winner.score += winner.streak >= 3 ? 4 : 2;
            }
            else {
                winner.score += 1; // Standard Swiss score (+1)
            }
        }
    }
    broadcastLobbyUpdate(t);
    if (t.type === "arena") {
        // Trigger pairings for returning players
        triggerArenaPairings(t);
    }
    else {
        // Swiss: Check if all matches in this round are completed
        const activeMatches = t.matches.filter(m => m.status !== "completed");
        if (activeMatches.length === 0) {
            if (t.currentRound >= t.roundsTotal) {
                completeTournament(t);
            }
            else {
                t.currentRound += 1;
                generateSwissRound(t);
            }
        }
    }
};
const completeTournament = (t) => {
    t.status = "completed";
    const standings = Array.from(t.participants.values()).sort((a, b) => b.score - a.score);
    io.to(`tournament:${t.id}`).emit("tournament:completed", {
        standings: standings.map(p => ({ name: p.name, score: p.score }))
    });
};
const broadcastLobbyUpdate = (t) => {
    const list = Array.from(t.participants.values()).map(p => ({
        id: p.id,
        name: p.name,
        score: p.score,
        isWaiting: p.isWaiting
    }));
    io.to(`tournament:${t.id}`).emit("tournament:lobby_update", {
        id: t.id,
        name: t.name,
        status: t.status,
        type: t.type,
        currentRound: t.currentRound,
        roundsTotal: t.roundsTotal,
        participants: list
    });
};
