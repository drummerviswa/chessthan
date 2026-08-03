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

    // Use strict ID matching only — names are not unique enough (guests share patterns)
    const uId = user?.id !== undefined ? String(user.id) : "";

    const bId = game.black?.id !== undefined ? String(game.black.id) : "";
    const wId = game.white?.id !== undefined ? String(game.white.id) : "";

    const isWhiteUser = !!(uId && wId && uId === wId);
    const isBlackUser = !!(uId && bId && uId === bId);

    // 1. Direct ID match on White
    if (isWhiteUser) {
        if (lobby.side !== "w") actions.updateLobby({ type: "setSide", payload: "w" });
        return;
    }

    // 2. Direct ID match on Black
    if (isBlackUser) {
        if (lobby.side !== "b") actions.updateLobby({ type: "setSide", payload: "b" });
        return;
    }

    // 3. No ID match found — decide based on which slot is empty
    // (handles the case where game was just paired and server hasn't echoed the final state yet)
    if (game.white && !game.black) {
        // White slot taken by someone else → we must be black
        if (lobby.side !== "b") actions.updateLobby({ type: "setSide", payload: "b" });
        return;
    }

    if (game.black && !game.white) {
        // Black slot taken by someone else → we must be white
        if (lobby.side !== "w") actions.updateLobby({ type: "setSide", payload: "w" });
        return;
    }

    // 4. Both slots taken and neither matches → spectator
    if (game.white && game.black) {
        if (lobby.side !== "s") actions.updateLobby({ type: "setSide", payload: "s" });
        return;
    }

    // 5. No slots taken yet → spectator/waiting
    if (lobby.side !== "s") actions.updateLobby({ type: "setSide", payload: "s" });
};

