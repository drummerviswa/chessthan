import type { Action, CustomSquares, Lobby } from "@/types";
import type { Game, User } from "@/types_config/index";
import type { Dispatch, SetStateAction } from "react";

export const syncPgn = (
    latestPgn: string,
    lobby: Lobby,
    actions: {
        updateCustomSquares: Dispatch<Partial<CustomSquares>>;
        setNavFen: Dispatch<SetStateAction<string | null>>;
        setNavIndex: Dispatch<SetStateAction<number | null>>;
    }
) => {
    actions.setNavFen(null);
    actions.setNavIndex(null);
    lobby.actualGame.loadPgn(latestPgn as string);

    const lastMove = lobby.actualGame.history({ verbose: true }).pop();

    let lastMoveSquares = undefined;
    let kingSquare = undefined;
    if (lastMove) {
        lastMoveSquares = {
            [lastMove.from]: { background: "rgba(255, 255, 0, 0.4)" },
            [lastMove.to]: { background: "rgba(255, 255, 0, 0.4)" }
        };
    }
    if (lobby.actualGame.inCheck()) {
        const kingPos = lobby.actualGame.board().reduce((acc, row, index) => {
            const squareIndex = row.findIndex(
                (square) =>
                    square && square.type === "k" && square.color === lobby.actualGame.turn()
            );
            return squareIndex >= 0 ? `${String.fromCharCode(squareIndex + 97)}${8 - index}` : acc;
        }, "");
        kingSquare = {
            [kingPos]: {
                background: "radial-gradient(red, rgba(255,0,0,.4), transparent 70%)",
                borderRadius: "50%"
            }
        };
    }
    actions.updateCustomSquares({
        lastMove: lastMoveSquares,
        check: kingSquare
    });
};

export const syncSide = (
    user: User,
    game: Game | undefined,
    lobby: Lobby,
    actions: { updateLobby: Dispatch<Action> }
) => {
    if (!game) game = lobby;

    const uId = user?.id !== undefined ? String(user.id) : undefined;
    const uName = user?.name ? String(user.name).trim().toLowerCase() : undefined;

    const bId = game.black?.id !== undefined ? String(game.black.id) : undefined;
    const bName = game.black?.name ? String(game.black.name).trim().toLowerCase() : undefined;

    const wId = game.white?.id !== undefined ? String(game.white.id) : undefined;
    const wName = game.white?.name ? String(game.white.name).trim().toLowerCase() : undefined;

    const isWhiteUser = (uId && wId && uId === wId) || (uName && wName && uName === wName);
    const isBlackUser = (uId && bId && uId === bId) || (uName && bName && uName === bName);

    // 1. Direct match on Black
    if (isBlackUser) {
        if (lobby.side !== "b") actions.updateLobby({ type: "setSide", payload: "b" });
        return;
    }

    // 2. Direct match on White
    if (isWhiteUser) {
        if (lobby.side !== "w") actions.updateLobby({ type: "setSide", payload: "w" });
        return;
    }

    // 3. Opponent auto-joining open slot:
    // If game has White but no Black, and user is not White -> user claims Black ("b")
    if (game.white && !game.black && !isWhiteUser) {
        if (lobby.side !== "b") actions.updateLobby({ type: "setSide", payload: "b" });
        return;
    }

    // If game has Black but no White, and user is not Black -> user claims White ("w")
    if (game.black && !game.white && !isBlackUser) {
        if (lobby.side !== "w") actions.updateLobby({ type: "setSide", payload: "w" });
        return;
    }

    // 4. Spectator if room is full with 2 distinct players
    if (game.white && game.black && !isWhiteUser && !isBlackUser) {
        if (lobby.side !== "s") actions.updateLobby({ type: "setSide", payload: "s" });
    }
};
