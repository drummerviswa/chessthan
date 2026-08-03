import type { Socket } from "socket.io";

import { io } from "../server.js";
import {
    chat,
    claimAbandoned,
    getLatestGame,
    joinAsPlayer,
    joinLobby,
    leaveLobby,
    sendMove,
    resignMatch,
    offerDraw,
    acceptDraw,
    abortMatch
} from "./game.socket.js";

const socketConnect = (socket: Socket) => {
    const req = socket.request;

    socket.use((__, next) => {
        if (!req.session) {
            next();
            return;
        }
        req.session.reload((err) => {
            if (err) {
                next();
            } else {
                next();
            }
        });
    });

    if (!req.session) {
        (req as any).session = {};
    }
    if (!req.session.user) {
        req.session.user = {
            id: `guest_${socket.id.substring(0, 8)}`,
            name: `Guest_${Math.floor(1000 + Math.random() * 9000)}`
        };
    }

    // Join personal user room to receive direct challenges/notifications
    const userId = req.session.user.id;
    socket.join(`user:${userId}`);

    socket.on("disconnect", leaveLobby);

    socket.on("joinLobby", joinLobby);
    socket.on("leaveLobby", leaveLobby);

    socket.on("getLatestGame", getLatestGame);
    socket.on("sendMove", sendMove);
    socket.on("joinAsPlayer", joinAsPlayer);
    socket.on("chat", chat);
    socket.on("claimAbandoned", claimAbandoned);
    socket.on("resignMatch", resignMatch);
    socket.on("offerDraw", offerDraw);
    socket.on("acceptDraw", acceptDraw);
    socket.on("abortMatch", abortMatch);

    // Geolocation Challenge events
    socket.on("challenge:send", (payload: { challengedId: string | number; gameCode: string }) => {
        io.to(`user:${payload.challengedId}`).emit("challenge:received", {
            host: req.session.user,
            gameCode: payload.gameCode
        });
    });

    socket.on("challenge:accept", (payload: { hostId: string | number; gameCode: string }) => {
        io.to(`user:${payload.hostId}`).emit("challenge:accepted", {
            guest: req.session.user,
            gameCode: payload.gameCode
        });
    });

    // Tournament Socket Events
    socket.on("tournament:join", (payload: { tournamentId: string }) => {
        socket.join(`tournament:${payload.tournamentId}`);
    });

    socket.on("tournament:chat", (payload: { tournamentId: string; message: string }) => {
        const user = req.session.user;
        if (user && user.name) {
            io.to(`tournament:${payload.tournamentId}`).emit("tournament:chat_received", {
                sender: user.name,
                message: payload.message,
                timestamp: Date.now()
            });
        }
    });
};

export const init = () => {
    io.on("connection", socketConnect);
};
