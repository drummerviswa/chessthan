import { Chess } from "chess.js";
import GameModel, { activeGames } from "../db/models/game.model.js";
import { io } from "../server.js";
export function parseTimeControl(timeControl) {
    if (!timeControl || timeControl.toLowerCase().includes("casual"))
        return null;
    const match = timeControl.match(/(\d+)\s*(?:\+|\||d|:)?\s*(\d+)?/i);
    if (!match)
        return null;
    const baseMin = parseInt(match[1]);
    const incSec = match[2] ? parseInt(match[2]) : 0;
    if (isNaN(baseMin) || baseMin <= 0)
        return null;
    let mode = "constant";
    if (timeControl.includes("d")) {
        mode = "delay";
    }
    else if (incSec > 0) {
        mode = "fischer";
    }
    return {
        timeMs: baseMin * 60 * 1000,
        incrementMs: incSec * 1000,
        mode
    };
}
function startTurnTimer(game, activeSide) {
    if (game.turnTimer) {
        clearTimeout(game.turnTimer);
        game.turnTimer = undefined;
    }
    if (!game.clocks)
        return;
    const timeLeft = activeSide === "w" ? game.clocks.white : game.clocks.black;
    game.turnTimer = Number(setTimeout(async () => {
        await handleTimeoutLoss(game, activeSide);
    }, timeLeft));
}
async function handleTimeoutLoss(game, losingSide) {
    if (game.endReason || game.winner)
        return;
    game.endReason = "abandoned";
    game.winner = losingSide === "w" ? "black" : "white";
    const savedGame = await GameModel.save(game);
    const id = savedGame?.id ?? -1;
    game.id = id;
    const gameOver = {
        reason: "timeout",
        winnerName: game.winner === "white" ? game.white?.name : game.black?.name,
        winnerSide: game.winner,
        id
    };
    io.to(game.code).emit("gameOver", gameOver);
    if (game.timeout)
        clearTimeout(game.timeout);
    if (game.turnTimer)
        clearTimeout(game.turnTimer);
    const idx = activeGames.indexOf(game);
    if (idx !== -1)
        activeGames.splice(idx, 1);
}
// TODO: clean up
export async function joinLobby(gameCode) {
    const game = activeGames.find((g) => g.code === gameCode);
    if (!game)
        return;
    const uId = this.request.session?.user?.id !== undefined ? String(this.request.session.user.id) : "";
    const uName = this.request.session?.user?.name || "";
    const hId = game.host?.id !== undefined ? String(game.host.id) : "";
    const wId = game.white?.id !== undefined ? String(game.white.id) : "";
    const bId = game.black?.id !== undefined ? String(game.black.id) : "";
    // Update host connection state
    if (game.host && uId && hId && uId === hId) {
        game.host.connected = true;
        if (uName)
            game.host.name = uName;
    }
    let matchedPlayer = false;
    // Reconnect to existing white slot
    if (game.white && uId && wId && uId === wId) {
        game.white.connected = true;
        game.white.disconnectedOn = undefined;
        if (uName)
            game.white.name = uName;
        matchedPlayer = true;
    }
    // Reconnect to existing black slot
    if (game.black && uId && bId && uId === bId) {
        game.black.connected = true;
        game.black.disconnectedOn = undefined;
        if (uName)
            game.black.name = uName;
        matchedPlayer = true;
    }
    // New player joining — assign to the empty color slot (opposite of host)
    if (!matchedPlayer) {
        const sessionUser = {
            id: this.request.session.user.id,
            name: uName,
            connected: true
        };
        if (game.white && !game.black && (!wId || wId !== uId)) {
            // White slot taken (by someone else) — assign new player as black
            game.black = sessionUser;
            matchedPlayer = true;
        }
        else if (game.black && !game.white && (!bId || bId !== uId)) {
            // Black slot taken (by someone else) — assign new player as white
            game.white = sessionUser;
            matchedPlayer = true;
        }
        else if (!game.white && !game.black) {
            // No slots taken — assign as white (game host sets their color on create)
            game.white = sessionUser;
            matchedPlayer = true;
        }
        else {
            // Both slots full — add as observer
            if (!game.observers)
                game.observers = [];
            if (!game.observers.some((o) => uId && String(o.id) === uId)) {
                game.observers.push({ id: this.request.session.user.id, name: uName });
            }
        }
    }
    if (this.rooms.size >= 2) {
        await leaveLobby.call(this);
    }
    if (game.timeout) {
        clearTimeout(game.timeout);
        game.timeout = undefined;
    }
    // Initialize clocks when both players are seated
    if (game.white && game.black && !game.clocks) {
        const { parseTimeControl } = await import("./game.socket.js");
        const parsed = parseTimeControl(game.timeControl);
        if (parsed) {
            game.clocks = {
                white: parsed.timeMs,
                black: parsed.timeMs,
                lastMoveTime: Date.now()
            };
        }
    }
    await this.join(gameCode);
    // Tell THIS socket exactly which side they are (read AFTER slot assignment)
    const finalWId = game.white?.id !== undefined ? String(game.white.id) : "";
    const finalBId = game.black?.id !== undefined ? String(game.black.id) : "";
    if (uId && finalWId && uId === finalWId) {
        this.emit("yourSide", "w");
    }
    else if (uId && finalBId && uId === finalBId) {
        this.emit("yourSide", "b");
    }
    else if (game.white && game.black) {
        this.emit("yourSide", "s"); // spectator — both slots filled by others
    }
    io.to(game.code).emit("receivedLatestGame", game);
}
export async function leaveLobby(reason, code) {
    if (this.rooms.size >= 3 && !code) {
        console.log(`leaveLobby: room size is ${this.rooms.size}, aborting...`);
        return;
    }
    const uId = this.request.session?.user?.id !== undefined ? String(this.request.session.user.id) : "";
    const uName = this.request.session?.user?.name ? String(this.request.session.user.name).trim().toLowerCase() : "";
    const game = activeGames.find((g) => g.code === (code || this.rooms.size === 2 ? Array.from(this.rooms)[1] : 0) ||
        (g.black?.connected && (String(g.black.id) === uId || g.black.name?.toLowerCase() === uName)) ||
        (g.white?.connected && (String(g.white.id) === uId || g.white.name?.toLowerCase() === uName)) ||
        g.observers?.find((o) => String(o.id) === uId || o.name?.toLowerCase() === uName));
    if (game) {
        const user = game.observers?.find((o) => String(o.id) === uId || o.name?.toLowerCase() === uName);
        if (user) {
            game.observers?.splice(game.observers?.indexOf(user), 1);
        }
        if (game.black && (String(game.black.id) === uId || game.black.name?.toLowerCase() === uName)) {
            game.black.connected = false;
            game.black.disconnectedOn = Date.now();
        }
        if (game.white && (String(game.white.id) === uId || game.white.name?.toLowerCase() === uName)) {
            game.white.connected = false;
            game.white.disconnectedOn = Date.now();
        }
        // count sockets
        const sockets = await io.in(game.code).fetchSockets();
        if (sockets.length <= 0 || (reason === undefined && sockets.length <= 1)) {
            if (game.timeout)
                clearTimeout(game.timeout);
            let timeout = 1000 * 60; // 1 minute
            if (game.pgn) {
                timeout *= 20; // 20 minutes if game has started
            }
            game.timeout = Number(setTimeout(() => {
                activeGames.splice(activeGames.indexOf(game), 1);
            }, timeout));
        }
        else {
            this.to(game.code).emit("receivedLatestGame", game);
        }
    }
    await this.leave(code || Array.from(this.rooms)[1]);
}
export async function claimAbandoned(type) {
    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);
    if (!game ||
        !game.pgn ||
        !game.white ||
        !game.black ||
        (game.white.id !== this.request.session.user.id &&
            game.black.id !== this.request.session.user.id)) {
        console.log(`claimAbandoned: Invalid game or user is not a player.`);
        return;
    }
    if ((game.white &&
        game.white.id === this.request.session.user.id &&
        (game.black?.connected ||
            Date.now() - game.black?.disconnectedOn < 50000)) ||
        (game.black &&
            game.black.id === this.request.session.user.id &&
            (game.white?.connected || Date.now() - game.white?.disconnectedOn < 50000))) {
        console.log(`claimAbandoned: Invalid claim by ${this.request.session.user.name}. Opponent is still connected or disconnected less than 50 seconds ago.`);
        return;
    }
    game.endReason = "abandoned";
    if (type === "draw") {
        game.winner = "draw";
    }
    else if (game.white && game.white?.id === this.request.session.user.id) {
        game.winner = "white";
    }
    else if (game.black && game.black?.id === this.request.session.user.id) {
        game.winner = "black";
    }
    const savedGame = await GameModel.save(game);
    const id = savedGame?.id ?? -1;
    game.id = id;
    // Check if it is a tournament game
    if (game.tournamentId) {
        const winnerId = game.winner === "draw" ? null : ((game.winner === "white" ? game.white?.id : game.black?.id) ?? null);
        import("../lib/tournamentManager.js").then(({ registerMatchResult }) => {
            registerMatchResult(game.tournamentId, game.code, winnerId, game.winner === "draw");
        }).catch(err => console.error("Claim abandoned tournament register failed:", err));
    }
    const gameOver = {
        reason: game.endReason,
        winnerName: this.request.session.user.name,
        winnerSide: game.winner === "draw" ? undefined : game.winner,
        id
    };
    io.to(game.code).emit("gameOver", gameOver);
    if (game.timeout)
        clearTimeout(game.timeout);
    if (game.turnTimer)
        clearTimeout(game.turnTimer);
    activeGames.splice(activeGames.indexOf(game), 1);
}
export async function claimTimeout() {
    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);
    if (!game || !game.clocks || game.endReason || game.winner)
        return;
    const chess = new Chess();
    if (game.pgn)
        chess.loadPgn(game.pgn);
    else if (game.initialFen)
        chess.load(game.initialFen);
    const activeTurn = chess.turn();
    const elapsed = Date.now() - game.clocks.lastMoveTime;
    const remainingTime = activeTurn === "w" ? game.clocks.white - elapsed : game.clocks.black - elapsed;
    if (remainingTime <= 0) {
        await handleTimeoutLoss(game, activeTurn);
    }
}
// eslint-disable-next-line no-unused-vars
export async function getLatestGame() {
    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);
    if (game)
        this.emit("receivedLatestGame", game);
}
export async function sendMove(m) {
    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);
    if (!game || game.endReason || game.winner)
        return;
    const chess = new Chess();
    if (game.pgn) {
        chess.loadPgn(game.pgn);
    }
    else if (game.initialFen) {
        chess.load(game.initialFen);
    }
    try {
        const prevTurn = chess.turn();
        const uId = this.request.session?.user?.id !== undefined ? String(this.request.session.user.id) : "";
        const uName = this.request.session?.user?.name ? String(this.request.session.user.name).trim().toLowerCase() : "";
        const bId = game.black?.id !== undefined ? String(game.black.id) : "";
        const bName = game.black?.name ? String(game.black.name).trim().toLowerCase() : "";
        const wId = game.white?.id !== undefined ? String(game.white.id) : "";
        const wName = game.white?.name ? String(game.white.name).trim().toLowerCase() : "";
        const hId = game.host?.id !== undefined ? String(game.host.id) : "";
        const hName = game.host?.name ? String(game.host.name).trim().toLowerCase() : "";
        const isWhitePlayer = (uId && wId && uId === wId) || (uName && wName && uName === wName) || (uId && hId && uId === hId && (!game.black || uId === bId));
        const isBlackPlayer = (uId && bId && uId === bId) || (uName && bName && uName === bName) || (uId && hId && uId === hId && (!game.white || uId === wId));
        if (prevTurn === "w" && !isWhitePlayer && game.white) {
            throw new Error("not turn to move");
        }
        if (prevTurn === "b" && !isBlackPlayer && game.black) {
            throw new Error("not turn to move");
        }
        const newMove = chess.move(m);
        if (newMove) {
            game.pgn = chess.pgn();
            // Deduct turn timer & apply increment rules (Fischer / Delay / Constant)
            if (game.clocks) {
                const elapsed = Date.now() - game.clocks.lastMoveTime;
                const parsed = parseTimeControl(game.timeControl);
                const inc = parsed ? parsed.incrementMs : 0;
                const mode = parsed ? parsed.mode : "constant";
                let timeDeducted = elapsed;
                let timeAdded = 0;
                if (mode === "fischer") {
                    timeDeducted = elapsed;
                    timeAdded = inc;
                }
                else if (mode === "delay") {
                    timeDeducted = Math.max(0, elapsed - inc);
                    timeAdded = 0;
                }
                else {
                    timeDeducted = elapsed;
                    timeAdded = 0;
                }
                if (prevTurn === "w") {
                    game.clocks.white = Math.max(0, game.clocks.white - timeDeducted) + timeAdded;
                }
                else {
                    game.clocks.black = Math.max(0, game.clocks.black - timeDeducted) + timeAdded;
                }
                game.clocks.lastMoveTime = Date.now();
                // Broadcast synchronized clocks to room
                io.to(game.code).emit("clockSync", game.clocks);
                // Check for immediate clock timeout
                if ((prevTurn === "w" && game.clocks.white <= 0) || (prevTurn === "b" && game.clocks.black <= 0)) {
                    await handleTimeoutLoss(game, prevTurn);
                    return;
                }
                // Toggle active clock turn timer
                const nextTurn = chess.turn();
                startTurnTimer(game, nextTurn);
            }
            this.to(game.code).emit("receivedMove", m);
            let variantVictory = false;
            if (game.variant === "kingofthehill") {
                const centerSquares = ["d4", "d5", "e4", "e5"];
                if (newMove.piece === "k" && centerSquares.includes(newMove.to)) {
                    game.winner = prevTurn === "w" ? "white" : "black";
                    game.endReason = "checkmate";
                    variantVictory = true;
                }
            }
            if (game.variant === "threecheck" && chess.inCheck()) {
                if (!game.checks)
                    game.checks = { white: 0, black: 0 };
                if (prevTurn === "w") {
                    game.checks.white = (game.checks.white || 0) + 1;
                    if (game.checks.white >= 3) {
                        game.winner = "white";
                        game.endReason = "checkmate";
                        variantVictory = true;
                    }
                }
                else {
                    game.checks.black = (game.checks.black || 0) + 1;
                    if (game.checks.black >= 3) {
                        game.winner = "black";
                        game.endReason = "checkmate";
                        variantVictory = true;
                    }
                }
            }
            if (variantVictory || chess.isGameOver()) {
                let reason = game.endReason;
                if (!variantVictory) {
                    if (chess.isCheckmate())
                        reason = "checkmate";
                    else if (chess.isStalemate())
                        reason = "stalemate";
                    else if (chess.isThreefoldRepetition())
                        reason = "repetition";
                    else if (chess.isInsufficientMaterial())
                        reason = "insufficient";
                    else if (chess.isDraw())
                        reason = "draw";
                }
                const winnerSide = variantVictory ? game.winner : (reason === "checkmate" ? (prevTurn === "w" ? "white" : "black") : undefined);
                const winnerName = winnerSide === "white"
                    ? game.white?.name
                    : winnerSide === "black"
                        ? game.black?.name
                        : undefined;
                if (!variantVictory) {
                    if (reason === "checkmate") {
                        game.winner = winnerSide;
                    }
                    else {
                        game.winner = "draw";
                    }
                    game.endReason = reason;
                }
                const savedGame = await GameModel.save(game);
                const id = savedGame?.id ?? -1;
                game.id = id;
                // Check if it is a tournament game
                if (game.tournamentId) {
                    const winnerId = game.winner === "draw" ? null : ((game.winner === "white" ? game.white?.id : game.black?.id) ?? null);
                    import("../lib/tournamentManager.js").then(({ registerMatchResult }) => {
                        registerMatchResult(game.tournamentId, game.code, winnerId, game.winner === "draw");
                    }).catch(err => console.error("Send move tournament register failed:", err));
                }
                io.to(game.code).emit("gameOver", { reason, winnerName, winnerSide, id });
                if (game.timeout)
                    clearTimeout(game.timeout);
                if (game.turnTimer)
                    clearTimeout(game.turnTimer);
                activeGames.splice(activeGames.indexOf(game), 1);
            }
        }
        else {
            throw new Error("invalid move");
        }
    }
    catch (e) {
        console.log("sendMove error: " + e);
        this.emit("receivedLatestGame", game);
    }
}
// eslint-disable-next-line no-unused-vars
export async function joinAsPlayer() {
    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);
    if (!game)
        return;
    const user = game.observers?.find((o) => o.id === this.request.session.user.id);
    if (!game.white) {
        const sessionUser = {
            id: this.request.session.user.id,
            name: this.request.session.user.name,
            connected: true
        };
        game.white = sessionUser;
        if (user)
            game.observers?.splice(game.observers?.indexOf(user), 1);
        io.to(game.code).emit("userJoinedAsPlayer", {
            name: this.request.session.user.name,
            side: "white"
        });
        game.startedAt = Date.now();
    }
    else if (!game.black) {
        const sessionUser = {
            id: this.request.session.user.id,
            name: this.request.session.user.name,
            connected: true
        };
        game.black = sessionUser;
        if (user)
            game.observers?.splice(game.observers?.indexOf(user), 1);
        io.to(game.code).emit("userJoinedAsPlayer", {
            name: this.request.session.user.name,
            side: "black"
        });
        game.startedAt = Date.now();
    }
    else {
        console.log("joinAsPlayer: attempted to join a game with already 2 players");
    }
    if (game.white && game.black && !game.clocks) {
        const parsed = parseTimeControl(game.timeControl);
        if (parsed) {
            game.clocks = {
                white: parsed.timeMs,
                black: parsed.timeMs,
                lastMoveTime: Date.now()
            };
            startTurnTimer(game, "w");
        }
        game.startedAt = Date.now();
    }
    io.to(game.code).emit("receivedLatestGame", game);
}
export async function chat(message) {
    this.to(Array.from(this.rooms)[1]).emit("chat", {
        author: this.request.session.user,
        message
    });
}
export async function resignMatch() {
    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);
    if (!game || game.endReason || game.winner)
        return;
    const user = this.request.session.user;
    let losingSide = "white";
    if (game.black?.id === user.id)
        losingSide = "black";
    else if (game.white?.id === user.id)
        losingSide = "white";
    else
        return;
    game.endReason = "abandoned";
    game.winner = losingSide === "white" ? "black" : "white";
    const savedGame = await GameModel.save(game);
    const id = savedGame?.id ?? -1;
    game.id = id;
    io.to(game.code).emit("gameOver", {
        reason: "resigned",
        winnerName: game.winner === "white" ? game.white?.name : game.black?.name,
        winnerSide: game.winner,
        id
    });
    if (game.timeout)
        clearTimeout(game.timeout);
    if (game.turnTimer)
        clearTimeout(game.turnTimer);
    const idx = activeGames.indexOf(game);
    if (idx !== -1)
        activeGames.splice(idx, 1);
}
export async function offerDraw() {
    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);
    if (!game || game.endReason || game.winner)
        return;
    this.to(game.code).emit("drawOffered", {
        by: this.request.session.user.name
    });
}
export async function acceptDraw() {
    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);
    if (!game || game.endReason || game.winner)
        return;
    game.endReason = "draw";
    game.winner = "draw";
    const savedGame = await GameModel.save(game);
    const id = savedGame?.id ?? -1;
    game.id = id;
    io.to(game.code).emit("gameOver", {
        reason: "draw",
        winnerName: undefined,
        winnerSide: "draw",
        id
    });
    if (game.timeout)
        clearTimeout(game.timeout);
    if (game.turnTimer)
        clearTimeout(game.turnTimer);
    const idx = activeGames.indexOf(game);
    if (idx !== -1)
        activeGames.splice(idx, 1);
}
export async function abortMatch() {
    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);
    if (!game || game.endReason || game.winner)
        return;
    const chess = new Chess();
    if (game.pgn)
        chess.loadPgn(game.pgn);
    if (chess.history().length > 1)
        return;
    io.to(game.code).emit("gameOver", {
        reason: "aborted",
        winnerName: undefined,
        winnerSide: undefined,
        id: -1
    });
    if (game.timeout)
        clearTimeout(game.timeout);
    if (game.turnTimer)
        clearTimeout(game.turnTimer);
    const idx = activeGames.indexOf(game);
    if (idx !== -1)
        activeGames.splice(idx, 1);
}
