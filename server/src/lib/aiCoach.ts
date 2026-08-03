import { GoogleGenerativeAI } from "@google/generative-ai";
import { Chess } from "chess.js";

let genAI: GoogleGenerativeAI | null = null;

if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
    console.warn("GEMINI_API_KEY is not defined. AI move explanations will run with built-in Grandmaster Heuristic engine.");
}

/**
 * Built-in Grandmaster Heuristic Analysis for offline/fallback mode
 */
function generateHeuristicExplanation(fenBefore: string, fenAfter: string, move: string, bestMove?: string): string {
    try {
        const game = new Chess(fenAfter);
        const isCheck = game.inCheck();
        const isMate = game.isCheckmate();
        const turn = game.turn();

        let explanation = "";

        if (isMate) {
            return `Brilliant checkmate delivery with ${move}! The opponent's king has no legal escape squares remaining. Game over!`;
        }

        if (isCheck) {
            explanation += `The move ${move} delivers direct check, forcing the defending king to respond or block. `;
        }

        if (move.includes("x")) {
            explanation += `By playing ${move}, you capture material and disrupt your opponent's defender structure. `;
        } else if (move.startsWith("N")) {
            explanation += `Developing the knight with ${move} improves central control (d4/e4/d5/e5 outposts) and increases tactical mobility. `;
        } else if (move.startsWith("B")) {
            explanation += `Developing the bishop with ${move} opens a long diagonal to pressure key targets in the opponent's camp. `;
        } else if (move.startsWith("R") || move.startsWith("O-O")) {
            explanation += `Castling or rook activation with ${move} connects the rooks, claims open files, and secures king safety behind the pawn shield. `;
        } else if (move.startsWith("Q")) {
            explanation += `Queen maneuver ${move} activates the most powerful piece on the board, threatening multiple tactical avenues. `;
        } else {
            explanation += `The pawn move ${move} claims central space and opens lines of development for your pieces. `;
        }

        if (bestMove && bestMove !== move) {
            explanation += `Engine recommends ${bestMove} as an even stronger line to gain a positional advantage.`;
        } else {
            explanation += `This is a solid, principled choice that maintains strong positional harmony.`;
        }

        return explanation;
    } catch (e) {
        return `The move "${move}" advances piece activity and controls key central squares. Keep building up central pressure and piece coordination!`;
    }
}

/**
 * Generates a natural-language explanation of a chess move using Gemini with Heuristic fallback
 */
export async function explainMove(
    fenBefore: string,
    fenAfter: string,
    move: string,
    bestMove?: string
): Promise<string> {
    if (!genAI) {
        return generateHeuristicExplanation(fenBefore, fenAfter, move, bestMove);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
You are a master chess coach. Explain the following chess move in a friendly, clear, and educational way for a player.
Do not use raw centipawn numbers. Explain the tactical and positional concepts (e.g. controlling the center, developing pieces, king safety, open files, pawn structure, active outposts, pins, forks).

Move played: ${move}
FEN before move: ${fenBefore}
FEN after move: ${fenAfter}
${bestMove ? `Stockfish suggested best move: ${bestMove}` : ""}

Keep your explanation short and concise (2 to 3 sentences maximum).
`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text().trim();
        return text || generateHeuristicExplanation(fenBefore, fenAfter, move, bestMove);
    } catch (err: unknown) {
        console.warn("Gemini API call failed, using Grandmaster Heuristic engine fallback:", err);
        return generateHeuristicExplanation(fenBefore, fenAfter, move, bestMove);
    }
}

/**
 * Generates a post-game summary review of the match PGN using Gemini
 */
export async function generateGameReview(pgn: string): Promise<string> {
    const fallbackText = "An intense tactical encounter! White claimed early central control while Black generated counterplay on the flanks. Both sides displayed fighting spirit throughout the match.";

    if (!genAI) {
        return fallbackText;
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
You are an expert chess commentator. Summarize the following chess game PGN in a short, educational, and engaging paragraph (3 to 4 sentences).
Describe the opening choice, the critical turning point (e.g. key mistake or tactical blow), and how the endgame or final checkmate/resignation played out.

PGN of the game:
${pgn}
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        return text || fallbackText;
    } catch (err: unknown) {
        console.warn("Gemini API call failed, using Game Review fallback:", err);
        return fallbackText;
    }
}
