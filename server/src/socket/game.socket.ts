import type { Game } from "../types_config/index.d.ts";
import { Chess } from "chess.js";
import type { DisconnectReason, Socket } from "socket.io";

import GameModel, { activeGames } from "../db/models/game.model.js";
import { io } from "../server.js";

export function parseTimeControl(timeControl: string | undefined): { timeMs: number; incrementMs: number; mode: "fischer" | "delay" | "constant" } | null {
    if (!timeControl || timeControl.toLowerCase().includes("casual")) return null;
    const match = timeControl.match(/(\d+)\s*(?:\+|\||d|:)?\s*(\d+)?/i);
    if (!match) return null;
    const baseMin = parseInt(match[1]);
    const incSec = match[2] ? parseInt(match[2]) : 0;
    if (isNaN(baseMin) || baseMin <= 0) return null;

    let mode: "fischer" | "delay" | "constant" = "constant";
    if (timeControl.includes("d")) {
        mode = "delay";
    } else if (incSec > 0) {
        mode = "fischer";
    }

    return {
        timeMs: baseMin * 60 * 1000,
        incrementMs: incSec * 1000,
        mode
    };
}

function startTurnTimer(game: Game, activeSide: "w" | "b") {
    if (game.turnTimer) {
        clearTimeout(game.turnTimer);
        game.turnTimer = undefined;
    }
    if (!game.clocks) return;

    const timeLeft = activeSide === "w" ? game.clocks.white : game.clocks.black;
    game.turnTimer = Number(
        setTimeout(async () => {
            await handleTimeoutLoss(game, activeSide);
        }, timeLeft)
    );
}

async function handleTimeoutLoss(game: Game, losingSide: "w" | "b") {
    if (game.endReason || game.winner) return;

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

    io.to(game.code as string).emit("gameOver", gameOver);

    if (game.timeout) clearTimeout(game.timeout);
    if (game.turnTimer) clearTimeout(game.turnTimer);
    
    const idx = activeGames.indexOf(game);
    if (idx !== -1) activeGames.splice(idx, 1);
}

// TODO: clean up

export async function joinLobby(this: Socket, gameCode: string) {
    const game = activeGames.find((g) => g.code === gameCode);
    if (!game) return;

    const uId = this.request.session?.user?.id !== undefined ? String(this.request.session.user.id) : "";
    const uName = this.request.session?.user?.name ? String(this.request.session.user.name).trim().toLowerCase() : "";

    const hId = game.host?.id !== undefined ? String(game.host.id) : "";
    const hName = game.host?.name ? String(game.host.name).trim().toLowerCase() : "";

    const wId = game.white?.id !== undefined ? String(game.white.id) : "";
    const wName = game.white?.name ? String(game.white.name).trim().toLowerCase() : "";

    const bId = game.black?.id !== undefined ? String(game.black.id) : "";
    const bName = game.black?.name ? String(game.black.name).trim().toLowerCase() : "";

    if (game.host && ((uId && hId && uId === hId) || (uName && hName && uName === hName))) {
        game.host.connected = true;
        if (this.request.session.user.name) game.host.name = this.request.session.user.name;
    }

    let matchedPlayer = false;
    if (game.white && ((uId && wId && uId === wId) || (uName && wName && uName === wName))) {
        game.white.connected = true;
        game.white.disconnectedOn = undefined;
        if (this.request.session.user.name) game.white.name = this.request.session.user.name;
        matchedPlayer = true;
    }
    if (game.black && ((uId && bId && uId === bId) || (uName && bName && uName === bName))) {
        game.black.connected = true;
        game.black.disconnectedOn = undefined;
        if (this.request.session.user.name) game.black.name = this.request.session.user.name;
        matchedPlayer = true;
    }
    
    // Auto-pair incoming opponent to the open side slot
    if (!matchedPlayer) {
        if (game.white && !game.black) {
            game.black = {
                id: this.request.session.user.id,
                name: this.request.session.user.name,
                connected: true
            };
            matchedPlayer = true;
        } else if (game.black && !game.white) {
            game.white = {
                id: this.request.session.user.id,
                name: this.request.session.user.name,
                connected: true
            };
            matchedPlayer = true;
        } else if (!game.white && !game.black) {
            game.white = {
                id: this.request.session.user.id,
                name: this.request.session.user.name,
                connected: true
            };
            matchedPlayer = true;
        } else {
            if (!game.observers) game.observers = [];
            const user = {
                id: this.request.session.user.id,
                name: this.request.session.user.name
            };
            if (!game.observers.some((o) => String(o.id) === uId || o.name === user.name)) {
                game.observers.push(user);
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

    await this.join(gameCode);
    io.to(game.code as string).emit("receivedLatestGame", game);
}

export async function leaveLobby(this: Socket, reason?: DisconnectReason, code?: string) {
    if (this.rooms.size >= 3 && !code) {
        console.log(`leaveLobby: room size is ${this.rooms.size}, aborting...`);
        return;
    }
    const uId = this.request.session?.user?.id !== undefined ? String(this.request.session.user.id) : "";
    const uName = this.request.session?.user?.name ? String(this.request.session.user.name).trim().toLowerCase() : "";

    const game = activeGames.find(
        (g) =>
            g.code === (code || this.rooms.size === 2 ? Array.from(this.rooms)[1] : 0) ||
            (g.black?.connected && (String(g.black.id) === uId || g.black.name?.toLowerCase() === uName)) ||
            (g.white?.connected && (String(g.white.id) === uId || g.white.name?.toLowerCase() === uName)) ||
            g.observers?.find((o) => String(o.id) === uId || o.name?.toLowerCase() === uName)
    );

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
        const sockets = await io.in(game.code as string).fetchSockets();

        if (sockets.length <= 0 || (reason === undefined && sockets.length <= 1)) {
            if (game.timeout) clearTimeout(game.timeout);

            let timeout = 1000 * 60; // 1 minute
            if (game.pgn) {
                timeout *= 20; // 20 minutes if game has started
            }
            game.timeout = Number(
                setTimeout(() => {
                    activeGames.splice(activeGames.indexOf(game), 1);
                }, timeout)
            );
        } else {
            this.to(game.code as string).emit("receivedLatestGame", game);
        }
    }
    await this.leave(code || Array.from(this.rooms)[1]);
}

export async function claimAbandoned(this: Socket, type: "win" | "draw") {
    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);
    if (
        !game ||
        !game.pgn ||
        !game.white ||
        !game.black ||
        (game.white.id !== this.request.session.user.id &&
            game.black.id !== this.request.session.user.id)
    ) {
        console.log(`claimAbandoned: Invalid game or user is not a player.`);
        return;
    }

    if (
        (game.white &&
            game.white.id === this.request.session.user.id &&
            (game.black?.connected ||
                Date.now() - (game.black?.disconnectedOn as number) < 50000)) ||
        (game.black &&
            game.black.id === this.request.session.user.id &&
            (game.white?.connected || Date.now() - (game.white?.disconnectedOn as number) < 50000))
    ) {
        console.log(
            `claimAbandoned: Invalid claim by ${this.request.session.user.name}. Opponent is still connected or disconnected less than 50 seconds ago.`
        );
        return;
    }

    game.endReason = "abandoned";

    if (type === "draw") {
        game.winner = "draw";
    } else if (game.white && game.white?.id === this.request.session.user.id) {
        game.winner = "white";
    } else if (game.black && game.black?.id === this.request.session.user.id) {
        game.winner = "black";
    }

    const savedGame = await GameModel.save(game);
    const id = savedGame?.id ?? -1;
    game.id = id;

    // Check if it is a tournament game
    if ((game as any).tournamentId) {
        const winnerId = game.winner === "draw" ? null : ((game.winner === "white" ? game.white?.id : game.black?.id) ?? null);
        import("../lib/tournamentManager.js").then(({ registerMatchResult }) => {
            registerMatchResult((game as any).tournamentId, game.code as string, winnerId, game.winner === "draw");
        }).catch(err => console.error("Claim abandoned tournament register failed:", err));
    }

    const gameOver = {
        reason: game.endReason,
        winnerName: this.request.session.user.name,
        winnerSide: game.winner === "draw" ? undefined : game.winner,
        id
    };

    io.to(game.code as string).emit("gameOver", gameOver);

    if (game.timeout) clearTimeout(game.timeout);
    if (game.turnTimer) clearTimeout(game.turnTimer);
    activeGames.splice(activeGames.indexOf(game), 1);
}

// eslint-disable-next-line no-unused-vars
export async function getLatestGame(this: Socket) {
    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);
    if (game) this.emit("receivedLatestGame", game);
}

export async function sendMove(this: Socket, m: { from: string; to: string; promotion?: string }) {
    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);
    if (!game || game.endReason || game.winner) return;
    const chess = new Chess();
    if (game.pgn) {
        chess.loadPgn(game.pgn);
    } else if (game.initialFen) {
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
                } else if (mode === "delay") {
                    timeDeducted = Math.max(0, elapsed - inc);
                    timeAdded = 0;
                } else {
                    timeDeducted = elapsed;
                    timeAdded = 0;
                }

                if (prevTurn === "w") {
                    game.clocks.white = Math.max(0, game.clocks.white - timeDeducted) + timeAdded;
                } else {
                    game.clocks.black = Math.max(0, game.clocks.black - timeDeducted) + timeAdded;
                }
                game.clocks.lastMoveTime = Date.now();
                
                // Broadcast synchronized clocks to room
                io.to(game.code as string).emit("clockSync", game.clocks);

                // Check for immediate clock timeout
                if ((prevTurn === "w" && game.clocks.white <= 0) || (prevTurn === "b" && game.clocks.black <= 0)) {
                    await handleTimeoutLoss(game, prevTurn);
                    return;
                }

                // Toggle active clock turn timer
                const nextTurn = chess.turn();
                startTurnTimer(game, nextTurn);
            }
            
            this.to(game.code as string).emit("receivedMove", m);

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
                if (!game.checks) game.checks = { white: 0, black: 0 };
                if (prevTurn === "w") {
                    game.checks.white = (game.checks.white || 0) + 1;
                    if (game.checks.white >= 3) {
                        game.winner = "white";
                        game.endReason = "checkmate";
                        variantVictory = true;
                    }
                } else {
                    game.checks.black = (game.checks.black || 0) + 1;
                    if (game.checks.black >= 3) {
                        game.winner = "black";
                        game.endReason = "checkmate";
                        variantVictory = true;
                    }
                }
            }

            if (variantVictory || chess.isGameOver()) {
                let reason: Game["endReason"] = game.endReason;
                if (!variantVictory) {
                    if (chess.isCheckmate()) reason = "checkmate";
                    else if (chess.isStalemate()) reason = "stalemate";
                    else if (chess.isThreefoldRepetition()) reason = "repetition";
                    else if (chess.isInsufficientMaterial()) reason = "insufficient";
                    else if (chess.isDraw()) reason = "draw";
                }

                const winnerSide =
                    variantVictory ? game.winner : (reason === "checkmate" ? (prevTurn === "w" ? "white" : "black") : undefined);
                const winnerName =
                    winnerSide === "white"
                        ? game.white?.name
                        : winnerSide === "black"
                            ? game.black?.name
                            : undefined;

                if (!variantVictory) {
                    if (reason === "checkmate") {
                        game.winner = winnerSide;
                    } else {
                        game.winner = "draw";
                    }
                    game.endReason = reason;
                }

                const savedGame = await GameModel.save(game);
                const id = savedGame?.id ?? -1;
                game.id = id;

                // Check if it is a tournament game
                if ((game as any).tournamentId) {
                    const winnerId = game.winner === "draw" ? null : ((game.winner === "white" ? game.white?.id : game.black?.id) ?? null);
                    import("../lib/tournamentManager.js").then(({ registerMatchResult }) => {
                        registerMatchResult((game as any).tournamentId, game.code as string, winnerId, game.winner === "draw");
                    }).catch(err => console.error("Send move tournament register failed:", err));
                }

                io.to(game.code as string).emit("gameOver", { reason, winnerName, winnerSide, id });

                if (game.timeout) clearTimeout(game.timeout);
                if (game.turnTimer) clearTimeout(game.turnTimer);
                activeGames.splice(activeGames.indexOf(game), 1);
            }
        } else {
            throw new Error("invalid move");
        }
    } catch (e) {
        console.log("sendMove error: " + e);
        this.emit("receivedLatestGame", game);
    }
}

// eslint-disable-next-line no-unused-vars
export async function joinAsPlayer(this: Socket) {
    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);
    if (!game) return;
    const user = game.observers?.find((o) => o.id === this.request.session.user.id);
    if (!game.white) {
        const sessionUser = {
            id: this.request.session.user.id,
            name: this.request.session.user.name,
            connected: true
        };
        game.white = sessionUser;
        if (user) game.observers?.splice(game.observers?.indexOf(user), 1);
        io.to(game.code as string).emit("userJoinedAsPlayer", {
            name: this.request.session.user.name,
            side: "white"
        });
        game.startedAt = Date.now();
    } else if (!game.black) {
        const sessionUser = {
            id: this.request.session.user.id,
            name: this.request.session.user.name,
            connected: true
        };
        game.black = sessionUser;
        if (user) game.observers?.splice(game.observers?.indexOf(user), 1);
        io.to(game.code as string).emit("userJoinedAsPlayer", {
            name: this.request.session.user.name,
            side: "black"
        });
        game.startedAt = Date.now();
    } else {
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

    io.to(game.code as string).emit("receivedLatestGame", game);
}

export async function chat(this: Socket, message: string) {
    this.to(Array.from(this.rooms)[1]).emit("chat", {
        author: this.request.session.user,
        message
    });
}

export async function resignMatch(this: Socket) {
    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);
    if (!game || game.endReason || game.winner) return;

    const user = this.request.session.user;
    let losingSide: "white" | "black" = "white";
    if (game.black?.id === user.id) losingSide = "black";
    else if (game.white?.id === user.id) losingSide = "white";
    else return;

    game.endReason = "abandoned";
    game.winner = losingSide === "white" ? "black" : "white";

    const savedGame = await GameModel.save(game);
    const id = savedGame?.id ?? -1;
    game.id = id;

    io.to(game.code as string).emit("gameOver", {
        reason: "resigned",
        winnerName: game.winner === "white" ? game.white?.name : game.black?.name,
        winnerSide: game.winner,
        id
    });

    if (game.timeout) clearTimeout(game.timeout);
    if (game.turnTimer) clearTimeout(game.turnTimer);
    const idx = activeGames.indexOf(game);
    if (idx !== -1) activeGames.splice(idx, 1);
}

export async function offerDraw(this: Socket) {
    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);
    if (!game || game.endReason || game.winner) return;
    this.to(game.code as string).emit("drawOffered", {
        by: this.request.session.user.name
    });
}

export async function acceptDraw(this: Socket) {
    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);
    if (!game || game.endReason || game.winner) return;

    game.endReason = "draw";
    game.winner = "draw";

    const savedGame = await GameModel.save(game);
    const id = savedGame?.id ?? -1;
    game.id = id;

    io.to(game.code as string).emit("gameOver", {
        reason: "draw",
        winnerName: undefined,
        winnerSide: "draw",
        id
    });

    if (game.timeout) clearTimeout(game.timeout);
    if (game.turnTimer) clearTimeout(game.turnTimer);
    const idx = activeGames.indexOf(game);
    if (idx !== -1) activeGames.splice(idx, 1);
}

export async function abortMatch(this: Socket) {
    const game = activeGames.find((g) => g.code === Array.from(this.rooms)[1]);
    if (!game || game.endReason || game.winner) return;

    const chess = new Chess();
    if (game.pgn) chess.loadPgn(game.pgn);
    if (chess.history().length > 1) return;

    io.to(game.code as string).emit("gameOver", {
        reason: "aborted",
        winnerName: undefined,
        winnerSide: undefined,
        id: -1
    });

    if (game.timeout) clearTimeout(game.timeout);
    if (game.turnTimer) clearTimeout(game.turnTimer);
    const idx = activeGames.indexOf(game);
    if (idx !== -1) activeGames.splice(idx, 1);
}
