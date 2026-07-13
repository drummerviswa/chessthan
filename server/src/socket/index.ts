import type { Socket } from "socket.io";

import { io } from "../server.js";
import {
    chat,
    claimAbandoned,
    getLatestGame,
    joinAsPlayer,
    joinLobby,
    leaveLobby,
    sendMove
} from "./game.socket.js";

const socketConnect = (socket: Socket) => {
    const req = socket.request;

    socket.use((__, next) => {
        req.session.reload((err) => {
            if (err) {
                socket.disconnect();
            } else {
                next();
            }
        });
    });

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
