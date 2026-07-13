"use client";

export interface OpeningInfo {
    name: string;
    stats: {
        white: number;
        black: number;
        draw: number;
    };
    moves: string;
}

const OPENINGS_DATABASE: Record<string, Omit<OpeningInfo, "moves">> = {
    "e4": { name: "King's Pawn Game", stats: { white: 39, black: 38, draw: 23 } },
    "d4": { name: "Queen's Pawn Game", stats: { white: 41, black: 36, draw: 23 } },
    "c4": { name: "English Opening", stats: { white: 38, black: 35, draw: 27 } },
    "Nf3": { name: "Réti Opening", stats: { white: 37, black: 33, draw: 30 } },
    "f4": { name: "Bird's Opening", stats: { white: 35, black: 41, draw: 24 } },
    "g3": { name: "Benko Opening", stats: { white: 38, black: 34, draw: 28 } },
    
    // e4 e5 systems
    "e4 e5": { name: "Open Game", stats: { white: 40, black: 36, draw: 24 } },
    "e4 e5 Nf3": { name: "King's Knight Opening", stats: { white: 41, black: 35, draw: 24 } },
    "e4 e5 Nf3 Nc6": { name: "King's Knight: Normal Variation", stats: { white: 41, black: 34, draw: 25 } },
    "e4 e5 Nf3 Nc6 Bb5": { name: "Ruy Lopez (Spanish Opening)", stats: { white: 42, black: 32, draw: 26 } },
    "e4 e5 Nf3 Nc6 Bc4": { name: "Italian Game", stats: { white: 41, black: 35, draw: 24 } },
    "e4 e5 Nf3 Nc6 d4": { name: "Scotch Game", stats: { white: 43, black: 33, draw: 24 } },
    "e4 e5 Nf3 Nf6": { name: "Petrov's Defense", stats: { white: 38, black: 32, draw: 30 } },
    "e4 e5 f4": { name: "King's Gambit", stats: { white: 43, black: 39, draw: 18 } },
    
    // Sicilian
    "e4 c5": { name: "Sicilian Defense", stats: { white: 37, black: 40, draw: 23 } },
    "e4 c5 Nf3": { name: "Sicilian: Open Setup", stats: { white: 38, black: 39, draw: 23 } },
    "e4 c5 Nf3 d6": { name: "Sicilian: Classical Setup", stats: { white: 39, black: 38, draw: 23 } },
    "e4 c5 Nf3 d6 d4": { name: "Sicilian: Main Line", stats: { white: 40, black: 38, draw: 22 } },
    "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6": { name: "Sicilian Defense: Najdorf Variation", stats: { white: 39, black: 41, draw: 20 } },
    "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6": { name: "Sicilian Defense: Dragon Variation", stats: { white: 42, black: 39, draw: 19 } },
    "e4 c5 Nf3 e6": { name: "Sicilian: French Variation", stats: { white: 38, black: 38, draw: 24 } },
    "e4 c5 c3": { name: "Sicilian Defense: Alapin Variation", stats: { white: 39, black: 35, draw: 26 } },
    "e4 c5 Nc3": { name: "Closed Sicilian", stats: { white: 37, black: 38, draw: 25 } },

    // French & Caro-Kann
    "e4 e6": { name: "French Defense", stats: { white: 40, black: 36, draw: 24 } },
    "e4 e6 d4 d5": { name: "French: Normal Variation", stats: { white: 41, black: 35, draw: 24 } },
    "e4 e6 d4 d5 e5": { name: "French Defense: Advance Variation", stats: { white: 40, black: 38, draw: 22 } },
    "e4 c6": { name: "Caro-Kann Defense", stats: { white: 39, black: 35, draw: 26 } },
    "e4 c6 d4 d5": { name: "Caro-Kann: Normal Variation", stats: { white: 40, black: 34, draw: 26 } },
    "e4 c6 d4 d5 e5": { name: "Caro-Kann: Advance Variation", stats: { white: 38, black: 38, draw: 24 } },

    // Queen's Pawn / Gambit
    "d4 d5": { name: "Queen's Pawn Game (Closed)", stats: { white: 41, black: 35, draw: 24 } },
    "d4 d5 c4": { name: "Queen's Gambit", stats: { white: 43, black: 32, draw: 25 } },
    "d4 d5 c4 e6": { name: "Queen's Gambit Declined", stats: { white: 42, black: 30, draw: 28 } },
    "d4 d5 c4 c6": { name: "Slav Defense", stats: { white: 39, black: 32, draw: 29 } },
    "d4 d5 c4 e5": { name: "Albin Countergambit", stats: { white: 44, black: 40, draw: 16 } },
    
    // Indian defenses
    "d4 Nf6": { name: "Indian Defense", stats: { white: 40, black: 36, draw: 24 } },
    "d4 Nf6 c4": { name: "Indian: Main Line", stats: { white: 41, black: 35, draw: 24 } },
    "d4 Nf6 c4 e6": { name: "Indian: French Setup", stats: { white: 41, black: 33, draw: 26 } },
    "d4 Nf6 c4 e6 Nf3 b6": { name: "Queen's Indian Defense", stats: { white: 40, black: 30, draw: 30 } },
    "d4 Nf6 c4 e6 Nc3 Bb4": { name: "Nimzo-Indian Defense", stats: { white: 38, black: 33, draw: 29 } },
    "d4 Nf6 c4 g6": { name: "King's Indian Setup", stats: { white: 42, black: 36, draw: 22 } },
    "d4 Nf6 c4 g6 Nc3 Bg7": { name: "King's Indian Defense", stats: { white: 41, black: 37, draw: 22 } }
};

/**
 * Searches the openings database by joining the move history.
 * Recursively falls back to previous moves if no exact match is found.
 */
export function getOpeningName(history: string[]): OpeningInfo | null {
    if (!history || history.length === 0) return null;

    // Check longer paths first
    for (let len = history.length; len > 0; len--) {
        const path = history.slice(0, len).join(" ");
        const match = OPENINGS_DATABASE[path];
        if (match) {
            return {
                ...match,
                moves: path
            };
        }
    }

    return null;
}
