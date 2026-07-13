import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
    console.warn("GEMINI_API_KEY is not defined. AI move explanations will run in mock mode.");
}

/**
 * Generates a natural-language explanation of a chess move using Gemini
 */
export async function explainMove(
    fenBefore: string,
    fenAfter: string,
    move: string,
    bestMove?: string
): Promise<string> {
    if (!genAI) {
        return `[Mock AI explanation] The move "${move}" was played. It changes the board configuration. To see real explanations, please configure the GEMINI_API_KEY in your server/.env file.`;
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
You are a master chess coach. Explain the following chess move in a friendly, clear, and educational way for a beginner-to-intermediate player.
Do not use raw centipawn numbers (like +1.4 or -0.8). Instead, explain the tactical and positional concepts (e.g. controlling the center, developing pieces, king safety, open files, pawn structure, active outposts, pins, forks).

Move played: ${move}
FEN before move: ${fenBefore}
FEN after move: ${fenAfter}
${bestMove ? `Stockfish suggested best move: ${bestMove}` : ""}

Keep your explanation short and concise (2 to 3 sentences maximum). Explain why the played move was selected, or if a better move was suggested, explain why that suggested move is stronger.
`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text().trim();
    } catch (err: unknown) {
        console.error("Gemini explainMove error:", err);
        return "Sorry, I could not generate an explanation for this move right now. Please try again later.";
    }
}

/**
 * Generates a post-game summary review of the match PGN using Gemini
 */
export async function generateGameReview(pgn: string): Promise<string> {
    if (!genAI) {
        return `[Mock AI Review] This was a spectacular match. White led a strong initiative in the opening, but black created tactical counter-chances in the middlegame. Overall, a highly educational encounter! To enable real AI Game Reviews, please configure your GEMINI_API_KEY in server/.env.`;
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
You are an expert chess commentator. Summarize the following chess game PGN in a short, educational, and engaging paragraph (3 to 4 sentences).
Describe the opening choice, the critical turning point (e.g. key mistake or tactical blow), and how the endgame or final checkmate/resignation played out. Keep it encouraging!

PGN of the game:
${pgn}

Review summary:
`;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (err: unknown) {
        console.error("Gemini generateGameReview error:", err);
        return "The game was fought intensely. Both sides demonstrated strategic ideas, resulting in an exciting battle.";
    }
}
