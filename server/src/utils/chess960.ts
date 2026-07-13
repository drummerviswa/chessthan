/**
 * Generates a valid starting Chess960 (Fischer Random) FEN layout.
 * Constraints:
 * 1. Bishops must be placed on opposite-colored squares.
 * 2. King must be placed on a square between the two Rooks.
 */
export function generateChess960Fen(): string {
    const array: (string | null)[] = Array(8).fill(null);

    // Place dark-squared bishop (index 0, 2, 4, 6)
    const darkSquares = [0, 2, 4, 6];
    const darkPos = darkSquares[Math.floor(Math.random() * darkSquares.length)];
    array[darkPos] = "b";

    // Place light-squared bishop (index 1, 3, 5, 7)
    const lightSquares = [1, 3, 5, 7];
    const lightPos = lightSquares[Math.floor(Math.random() * lightSquares.length)];
    array[lightPos] = "b";

    // Helper to extract empty indices
    const getEmpty = () => array.map((val, idx) => val === null ? idx : null).filter((v): v is number => v !== null);

    // Place Queen
    let empty = getEmpty();
    const queenPos = empty[Math.floor(Math.random() * empty.length)];
    array[queenPos] = "q";

    // Place Knight 1
    empty = getEmpty();
    const knight1Pos = empty[Math.floor(Math.random() * empty.length)];
    array[knight1Pos] = "n";

    // Place Knight 2
    empty = getEmpty();
    const knight2Pos = empty[Math.floor(Math.random() * empty.length)];
    array[knight2Pos] = "n";

    // Place Rooks and King on the remaining 3 empty squares.
    // The King must be placed between the two Rooks (order: Rook, King, Rook).
    empty = getEmpty();
    array[empty[0]] = "r";
    array[empty[1]] = "k";
    array[empty[2]] = "r";

    // Create backrank strings
    const backrankRaw = array.join("");
    const blackBackrank = backrankRaw.toLowerCase();
    const whiteBackrank = backrankRaw.toUpperCase();

    // Standard starting FEN format for Chess960
    return `${blackBackrank}/pppppppp/8/8/8/8/PPPPPPPP/${whiteBackrank} w - - 0 1`;
}
