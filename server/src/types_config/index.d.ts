export interface Game {
    id?: number;
    pgn?: string;
    white?: User;
    black?: User;
    winner?: "white" | "black" | "draw";
    endReason?: "draw" | "checkmate" | "stalemate" | "repetition" | "insufficient" | "abandoned";
    host?: User;
    code?: string;
    unlisted?: boolean;
    timeout?: number;
    observers?: User[];
    startedAt?: number;
    endedAt?: number;
    variant?: "standard" | "kingofthehill" | "threecheck" | "chess960";
    initialFen?: string;
    checks?: { white: number; black: number };
    timeControl?: string;
    rated?: boolean;
    clocks?: { white: number; black: number; lastMoveTime: number };
    turnTimer?: any;
}

export interface User {
    id?: number | string; // string for guest IDs
    name?: string | null;
    email?: string;
    wins?: number;
    losses?: number;
    draws?: number;
    subscriptionStatus?: string;
    puzzleRating?: number;
    division?: string;
    xp?: number;
    avatarUrl?: string;
    eloBullet?: number;
    eloBlitz?: number;
    eloRapid?: number;
    eloClassical?: number;

    // mainly for players, not spectators
    connected?: boolean;
    disconnectedOn?: number;
}
