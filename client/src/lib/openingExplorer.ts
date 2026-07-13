const openingBook: Record<string, string> = {
    "e4": "King's Pawn Game",
    "d4": "Queen's Pawn Game",
    "e4 e5": "King's Pawn Game: Open Game",
    "e4 c5": "Sicilian Defense",
    "e4 e6": "French Defense",
    "e4 c6": "Caro-Kann Defense",
    "d4 d5": "Queen's Pawn Game: Closed Game",
    "d4 Nf6": "Indian Defense",
    "d4 d5 c4": "Queen's Gambit",
    "e4 e5 Nf3 Nc6 Bb5": "Ruy Lopez",
    "e4 e5 Nf3 Nc6 Bc4": "Italian Game",
    "e4 e5 Nf3 Nf6": "Petrov's Defense",
    "e4 d5": "Scandinavian Defense",
    "e4 g6": "Modern Defense",
    "e4 Nf6": "Alekhine's Defense",
    "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O": "King's Indian Defense",
    "d4 d5 c4 c6": "Slav Defense",
    "d4 Nf6 c4 e6 Nf3 d5": "Queen's Gambit Declined",
    "d4 Nf6 c4 e6 Nc3 Bb4": "Nimzo-Indian Defense",
    "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6": "Sicilian Defense: Najdorf Variation",
    "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5": "Sicilian Defense: Sveshnikov Variation",
    "e4 e6 d4 d5 Nc3 Bb4": "French Defense: Winawer Variation",
    "e4 e6 d4 d5 e5": "French Defense: Advance Variation",
    "e4 c6 d4 d5 e5": "Caro-Kann Defense: Advance Variation"
};

/**
 * Identifies the chess opening based on a sequence of moves in standard algebraic notation.
 */
export const getOpeningName = (moveHistory: string[]): string | null => {
    const movesJoined = moveHistory.join(" ");
    
    let bestMatch: string | null = null;
    let maxLength = 0;
    
    for (const [sequence, name] of Object.entries(openingBook)) {
        if (movesJoined.startsWith(sequence) && sequence.length > maxLength) {
            bestMatch = name;
            maxLength = sequence.length;
        }
    }
    
    return bestMatch;
};
