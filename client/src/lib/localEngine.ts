import { Chess } from "chess.js";

// Piece value weights
const PIECE_VALUES: Record<string, number> = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
};

// Positional evaluation tables (from White's perspective)
const PAWN_TABLE = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_TABLE = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_TABLE = [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
];

const ROOK_TABLE = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
];

const QUEEN_TABLE = [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  5,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
];

const KING_MIDDLE_TABLE = [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [20, 30, 10,  0,  0, 10, 30, 20]
];

// Evaluate the board state relative to turn
export function evaluateBoard(chess: Chess): number {
    let totalEvaluation = 0;
    const board = chess.board();

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece) {
                const type = piece.type;
                const color = piece.color;
                let value = PIECE_VALUES[type];

                // Positional modifications
                let tableVal = 0;
                // Standard tables are white-oriented, flip row for black
                const row = color === "w" ? r : 7 - r;

                switch (type) {
                    case "p":
                        tableVal = PAWN_TABLE[row][c];
                        break;
                    case "n":
                        tableVal = KNIGHT_TABLE[row][c];
                        break;
                    case "b":
                        tableVal = BISHOP_TABLE[row][c];
                        break;
                    case "r":
                        tableVal = ROOK_TABLE[row][c];
                        break;
                    case "q":
                        tableVal = QUEEN_TABLE[row][c];
                        break;
                    case "k":
                        tableVal = KING_MIDDLE_TABLE[row][c];
                        break;
                }

                const score = value + tableVal;
                if (color === "w") {
                    totalEvaluation += score;
                } else {
                    totalEvaluation -= score;
                }
            }
        }
    }

    return totalEvaluation;
}

// Minimax with Alpha-Beta Pruning
function minimax(
    chess: Chess,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean
): { score: number; move: string | null } {
    if (depth === 0 || chess.isGameOver()) {
        return { score: evaluateBoard(chess), move: null };
    }

    const moves = chess.moves({ verbose: true });
    // Sort moves to optimize alpha-beta pruning (captures first)
    moves.sort((a, b) => {
        const scoreA = a.captured ? PIECE_VALUES[a.captured] : 0;
        const scoreB = b.captured ? PIECE_VALUES[b.captured] : 0;
        return scoreB - scoreA;
    });

    let bestMove: string | null = null;

    if (isMaximizing) {
        let maxScore = -Infinity;
        for (const move of moves) {
            chess.move({ from: move.from, to: move.to, promotion: move.promotion });
            const { score } = minimax(chess, depth - 1, alpha, beta, false);
            chess.undo();

            if (score > maxScore) {
                maxScore = score;
                bestMove = move.san;
            }
            alpha = Math.max(alpha, score);
            if (beta <= alpha) {
                break; // Beta cutoff
            }
        }
        return { score: maxScore, move: bestMove };
    } else {
        let minScore = Infinity;
        for (const move of moves) {
            chess.move({ from: move.from, to: move.to, promotion: move.promotion });
            const { score } = minimax(chess, depth - 1, alpha, beta, true);
            chess.undo();

            if (score < minScore) {
                minScore = score;
                bestMove = move.san;
            }
            beta = Math.min(beta, score);
            if (beta <= alpha) {
                break; // Alpha cutoff
            }
        }
        return { score: minScore, move: bestMove };
    }
}

/**
 * Calculates the best move using minimax for a given difficulty depth (1 = easy, 3 = medium, 4 = hard)
 */
export function getBestMove(fen: string, difficulty: number = 3): string | null {
    const chess = new Chess(fen);
    const turn = chess.turn();
    const depth = Math.max(1, Math.min(difficulty, 4));
    
    const { move } = minimax(chess, depth, -Infinity, Infinity, turn === "w");
    return move;
}
