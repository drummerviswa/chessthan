import type { Action, CustomSquares, Lobby, Message } from "@/types";
import type { Game, User } from "@/types_config/index";
import type { Dispatch, SetStateAction } from "react";
import type { Socket } from "socket.io-client";

import { syncPgn, syncSide } from "./utils";

export function initSocket(
    user: User,
    socket: Socket,
    lobby: Lobby,
    actions: {
        updateLobby: Dispatch<Action>;
        addMessage: Function;
        updateCustomSquares: Dispatch<Partial<CustomSquares>>;
        makeMove: Function;
        setNavFen: Dispatch<SetStateAction<string | null>>;
        setNavIndex: Dispatch<SetStateAction<number | null>>;
        setDrawOfferFrom?: Dispatch<SetStateAction<string | null>>;
    }
) {
    socket.on("connect", () => {
        socket.emit("joinLobby", lobby.code);
    });
    if (socket.connected) {
        socket.emit("joinLobby", lobby.code);
    }
    // TODO: handle disconnect

    socket.on("chat", (message: Message) => {
        actions.addMessage(message);
    });

    socket.on("receivedLatestGame", (latestGame: Game) => {
        if (latestGame.pgn && latestGame.pgn !== lobby.actualGame.pgn()) {
            syncPgn(latestGame.pgn, lobby, actions);
        }
        actions.updateLobby({ type: "updateLobby", payload: latestGame });

        syncSide(user, latestGame, lobby, actions);
    });

    socket.on("receivedMove", (m: { from: string; to: string; promotion?: string }) => {
        const success = actions.makeMove(m);
        if (!success) {
            socket.emit("getLatestGame");
        }
    });

    socket.on("drawOffered", ({ by }: { by: string }) => {
        if (actions.setDrawOfferFrom) {
            actions.setDrawOfferFrom(by);
        }
    });

    socket.on("userJoinedAsPlayer", ({ name, side }: { name: string; side: "white" | "black" }) => {
        actions.addMessage({
            author: { name: "server" },
            message: `${name} is now playing as ${side}.`
        });
    });

    socket.on("clockSync", (clocks: { white: number; black: number; lastMoveTime: number }) => {
        actions.updateLobby({
            type: "updateLobby",
            payload: { clocks }
        });
    });

    socket.on(
        "gameOver",
        ({
            reason,
            winnerName,
            winnerSide,
            id
        }: {
            reason: Game["endReason"] | "resigned" | "aborted" | "timeout";
            winnerName?: string;
            winnerSide?: "white" | "black" | "draw";
            id: number;
        }) => {
            const m = {
                author: { name: "server" }
            } as Message;

            if (reason === "timeout") {
                m.message = `${winnerName} (${winnerSide}) won on time! Opponent's clock expired.`;
            } else if (reason === "abandoned") {
                if (!winnerSide) {
                    m.message = `${winnerName} has claimed a draw due to abandonment.`;
                } else {
                    m.message = `${winnerName} (${winnerSide}) has claimed the win due to abandonment.`;
                }
            } else if (reason === "checkmate") {
                m.message = `${winnerName} (${winnerSide}) has won by checkmate.`;
            } else if (reason === "resigned") {
                m.message = `${winnerName} (${winnerSide}) has won. Opponent resigned.`;
            } else if (reason === "aborted") {
                m.message = `The game has been aborted.`;
            } else {
                let message = "The game has ended in a draw";
                if (reason === "repetition") {
                    message = message.concat(" due to threefold repetition");
                } else if (reason === "insufficient") {
                    message = message.concat(" due to insufficient material");
                } else if (reason === "stalemate") {
                    message = "The game has been drawn due to stalemate";
                } else if (reason === "draw") {
                    message = "The game has been drawn by mutual agreement";
                }
                m.message = message.concat(".");
            }
            // Normalize server-emitted reason labels to valid endReason values for lobby state
            const normalizedReason = (reason === "resigned" ? "abandoned" : reason === "aborted" ? undefined : reason) as Game["endReason"];
            actions.updateLobby({
                type: "updateLobby",
                payload: { endReason: normalizedReason, winner: winnerSide || "draw", id }
            });
            actions.addMessage(m);
        }
    );
}
