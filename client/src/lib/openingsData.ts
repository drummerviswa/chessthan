export interface Opening {
  eco: string;
  name: string;
  family: string;
  moves: string;
  pgn: string;
  description: string;
  whiteWinRate: number;
  drawRate: number;
  blackWinRate: number;
  keyConcepts: string[];
}

export const OPENINGS_DATABASE: Opening[] = [
  // -------------------------------------------------------------
  // A-SERIES: FLANK & UNORTHODOX OPENINGS
  // -------------------------------------------------------------
  {
    eco: "A10",
    name: "English Opening: King's English",
    family: "English Opening",
    moves: "1. c4 e5 2. Nc3 Nf6 3. g3 d5",
    pgn: "1. c4 e5 2. Nc3 Nf6 3. g3 d5 4. cxd5 Nxd5 5. Bg2 Nb6",
    description: "Hypermodern control of d5 from the flank with c4 and Bg2 fianchetto.",
    whiteWinRate: 38,
    drawRate: 38,
    blackWinRate: 24,
    keyConcepts: ["Dark-square control with c4 & Bg2", "Reversed Sicilian dynamics", "Flexible central pawn breaks"]
  },
  {
    eco: "A04",
    name: "Réti Opening: King's Indian Attack",
    family: "Réti Opening",
    moves: "1. Nf3 d5 2. g3 Nf6 3. Bg2 c6 4. O-O Bg4",
    pgn: "1. Nf3 d5 2. g3 Nf6 3. Bg2 c6 4. O-O Bg4 5. d3 Nbd7 6. Nbd2 e5",
    description: "Flexible, non-committal system pioneered by Richard Réti to pressure Black's center from afar.",
    whiteWinRate: 36,
    drawRate: 42,
    blackWinRate: 22,
    keyConcepts: ["Delaying d4 pawn push", "Bg2 diagonal long-range sniper", "Dynamic piece maneuvers"]
  },
  {
    eco: "A02",
    name: "Bird's Opening: Dutch Variation",
    family: "Bird's Opening",
    moves: "1. f4 d5 2. Nf3 Nf6 3. e3 g6",
    pgn: "1. f4 d5 2. Nf3 Nf6 3. e3 g6 4. b3 Bg7 5. Bb2 O-O",
    description: "Pawn push f4 controls e5 and sets up a kingside attack reminiscent of a reversed Dutch Defense.",
    whiteWinRate: 35,
    drawRate: 33,
    blackWinRate: 32,
    keyConcepts: ["e5 square control", "Kingside attack with Ne5 & Rf3-h3", "b3 fianchetto for Bb2"]
  },
  {
    eco: "A57",
    name: "Benko Gambit: Accepted",
    family: "Benoni Defenses",
    moves: "1. d4 Nf6 2. c4 c5 3. d5 b5 4. cxb5 a6",
    pgn: "1. d4 Nf6 2. c4 c5 3. d5 b5 4. cxb5 a6 5. bxa6 Bxa6 6. Nc3 d6 7. g3 g6",
    description: "Black sacrifices a queenside pawn to open the a- and b-files for long-term pressure against White.",
    whiteWinRate: 34,
    drawRate: 38,
    blackWinRate: 28,
    keyConcepts: ["Long-term open a- & b-files", "Bg7 sniper on long diagonal", "Constant queenside pressure"]
  },
  {
    eco: "A80",
    name: "Dutch Defense: Leningrad Variation",
    family: "Dutch Defense",
    moves: "1. d4 f5 2. c4 Nf6 3. g3 g6 4. Bg2 Bg7 5. Nf3 O-O",
    pgn: "1. d4 f5 2. c4 Nf6 3. g3 g6 4. Bg2 Bg7 5. Nf3 O-O 6. O-O d6 7. Nc3 c6",
    description: "Combines the aggression of f5 with the kingside fianchetto of the King's Indian Defense.",
    whiteWinRate: 39,
    drawRate: 31,
    blackWinRate: 30,
    keyConcepts: ["Aggressive e5 pawn break", "Dynamic piece play", "Unbalanced fighting positions"]
  },

  // -------------------------------------------------------------
  // B-SERIES: SEMI-OPEN GAMES (SICILIAN, FRENCH, CARO-KANN)
  // -------------------------------------------------------------
  {
    eco: "B90",
    name: "Sicilian Defense: Najdorf Variation",
    family: "Sicilian Defense",
    moves: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6",
    pgn: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6",
    description: "The sharpest and most popular line of the Sicilian, favored by Fischer and Kasparov.",
    whiteWinRate: 38,
    drawRate: 34,
    blackWinRate: 28,
    keyConcepts: ["Control e5 and d5 squares", "Queenside pawn expansion with b5", "Tactical counter-attack on c-file"]
  },
  {
    eco: "B70",
    name: "Sicilian Defense: Dragon Variation",
    family: "Sicilian Defense",
    moves: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6",
    pgn: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 O-O 8. Qd2 Nc6",
    description: "Named after the dragon-like pawn formation. Features intense opposite-side castling pawn storms.",
    whiteWinRate: 41,
    drawRate: 27,
    blackWinRate: 32,
    keyConcepts: ["Yugoslav Attack with g4, h4, h5", "Bg7 dragon bishop on long diagonal", "Rxc3 exchange sacrifices"]
  },
  {
    eco: "B33",
    name: "Sicilian Defense: Sveshnikov Variation",
    family: "Sicilian Defense",
    moves: "1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5",
    pgn: "1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5 6. Ndb5 d6 7. Bg5 a6 8. Na3 b5",
    description: "Black accepts a backward d6 pawn in exchange for immense piece activity and central space.",
    whiteWinRate: 36,
    drawRate: 38,
    blackWinRate: 26,
    keyConcepts: ["Outpost knight on d5 for White", "Black f5 pawn break", "Rapid piece activity"]
  },
  {
    eco: "B22",
    name: "Sicilian Defense: Alapin Variation",
    family: "Sicilian Defense",
    moves: "1. e4 c5 2. c3 d5 3. exd5 Qxd5 4. d4 Nf6",
    pgn: "1. e4 c5 2. c3 d5 3. exd5 Qxd5 4. d4 Nf6 5. Nf3 Bg4 6. Be2 e6",
    description: "White plays c3 to build a full classical pawn center with d4, avoiding open Sicilian mainlines.",
    whiteWinRate: 35,
    drawRate: 39,
    blackWinRate: 26,
    keyConcepts: ["Classical d4 pawn center", "Isolated Queen Pawn (IQP) structures", "Solid piece development"]
  },
  {
    eco: "C11",
    name: "French Defense: Winawer Variation",
    family: "French Defense",
    moves: "1. e4 e6 2. d4 d5 3. Nc3 Bb4",
    pgn: "1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Qg4",
    description: "An asymmetrical battleground where Black pins Nc3 and attacks White's center with c5.",
    whiteWinRate: 40,
    drawRate: 30,
    blackWinRate: 30,
    keyConcepts: ["Doubled c-pawns for White", "Dark-squared weakness on g7", "Black counterplay against d4"]
  },
  {
    eco: "C02",
    name: "French Defense: Advance Variation",
    family: "French Defense",
    moves: "1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Bd7",
    pgn: "1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Bd7 6. Be2 Qb6",
    description: "White claims e5 space immediately. Black puts relentless pressure on the d4 and b2 pawns.",
    whiteWinRate: 37,
    drawRate: 36,
    blackWinRate: 27,
    keyConcepts: ["Pressure on d4 with Qb6 & Nc6", "f6 pawn lever for Black", "Kingside space claim for White"]
  },
  {
    eco: "B12",
    name: "Caro-Kann Defense: Advance Variation",
    family: "Caro-Kann Defense",
    moves: "1. e4 c6 2. d4 d5 3. e5 Bf5",
    pgn: "1. e4 c6 2. d4 d5 3. e5 Bf5 4. Nf3 e6 5. Be2 c5 6. Be3",
    description: "White gains spatial advantage with e5, while Black develops Bf5 before closing the e6 structure.",
    whiteWinRate: 37,
    drawRate: 35,
    blackWinRate: 28,
    keyConcepts: ["Active light-squared bishop for Black", "c5 pawn lever against d4", "White kingside space claim"]
  },
  {
    eco: "B18",
    name: "Caro-Kann Defense: Classical Variation",
    family: "Caro-Kann Defense",
    moves: "1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Bf5",
    pgn: "1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. h4 h6 7. Nf3 Nd7",
    description: "Ultra-solid opening where Black trades on e4 and develops Bf5 safely before retreating to g6.",
    whiteWinRate: 33,
    drawRate: 45,
    blackWinRate: 22,
    keyConcepts: ["Solid pawn structure", "No weaknesses in Black camp", "White h4-h5 pawn probe"]
  },

  // -------------------------------------------------------------
  // C-SERIES: OPEN GAMES (RUY LOPEZ, ITALIAN, KING'S GAMBIT)
  // -------------------------------------------------------------
  {
    eco: "C65",
    name: "Ruy Lopez: Berlin Defense",
    family: "Ruy Lopez (Spanish Game)",
    moves: "1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Nf5 8. Qxd8+ Kxd8",
    description: "The ultimate endgame wall used by Kramnik to neutralize Kasparov in 2000.",
    whiteWinRate: 32,
    drawRate: 48,
    blackWinRate: 20,
    keyConcepts: ["Endgame structure without queens", "Black bishop pair", "White 4v3 kingside pawn majority"]
  },
  {
    eco: "C89",
    name: "Ruy Lopez: Marshall Attack",
    family: "Ruy Lopez (Spanish Game)",
    moves: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5 9. exd5 Nxd5 10. Nxe5 Nxe5 11. Rxe5 c6",
    description: "A famous pawn sacrifice introduced by Frank Marshall. Black gets a devastating kingside initiative.",
    whiteWinRate: 30,
    drawRate: 50,
    blackWinRate: 20,
    keyConcepts: ["Pawn sacrifice on d5", "Kingside attack with Bd6, Qh4, Ng4", "Forced drawing lines for White"]
  },
  {
    eco: "C50",
    name: "Italian Game: Giuoco Piano",
    family: "Italian Game",
    moves: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 a6 6. O-O d6",
    description: "Classical development controlling f7/f2. The modern Giuoco Pianissimo features slow positional maneuvering.",
    whiteWinRate: 35,
    drawRate: 40,
    blackWinRate: 25,
    keyConcepts: ["c3 and d3 slow setup", "Nbd2-f1-g3 knight maneuver", "a4-a5 queenside probe"]
  },
  {
    eco: "C52",
    name: "Italian Game: Evans Gambit",
    family: "Italian Game",
    moves: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O",
    description: "A romantic b4 pawn sacrifice to build a massive d4/e4 pawn center and rapid attacking lines.",
    whiteWinRate: 42,
    drawRate: 25,
    blackWinRate: 33,
    keyConcepts: ["b4 pawn sacrifice", "Full d4/e4 pawn center", "Attack against uncastled f7 pawn"]
  },
  {
    eco: "C33",
    name: "King's Gambit Accepted: Bishop's Gambit",
    family: "King's Gambit",
    moves: "1. e4 e5 2. f4 exf4 3. Bc4 Qh4+",
    pgn: "1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 d6 5. Nf3 Qh6 6. d4",
    description: "The wild 19th-century attacking opening. White trades the f-pawn for rapid central dominance.",
    whiteWinRate: 40,
    drawRate: 22,
    blackWinRate: 38,
    keyConcepts: ["Kf1 uncastled king safety", "Full central control d4 & e4", "Tactical piece sacrifices"]
  },

  // -------------------------------------------------------------
  // D-SERIES: CLOSED GAMES (QUEEN'S GAMBIT, SLAV, GRUENFELD)
  // -------------------------------------------------------------
  {
    eco: "D37",
    name: "Queen's Gambit Declined: Orthodox Defense",
    family: "Queen's Gambit",
    moves: "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 Be7 5. Bg5 O-O",
    pgn: "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 Be7 5. Bg5 O-O 6. e3 h6 7. Bh4 b6",
    description: "The bedrock of classical chess strategy. Black secures d5 while preparing c5 or e5 pawn breaks.",
    whiteWinRate: 35,
    drawRate: 45,
    blackWinRate: 20,
    keyConcepts: ["Solid central d5 pawn", "Minority attack on b-c files for White", "Freed c8 bishop via b6 or e5"]
  },
  {
    eco: "D15",
    name: "Slav Defense: Three Knights Variation",
    family: "Queen's Gambit",
    moves: "1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4",
    pgn: "1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Bf5",
    description: "Black protects d5 with c6, avoiding blocking the c8 bishop, and captures on c4 for piece activity.",
    whiteWinRate: 36,
    drawRate: 42,
    blackWinRate: 22,
    keyConcepts: ["a4 maneuver to prevent b5", "Outpost for Black bishop on f5", "e4 expansion for White"]
  },
  {
    eco: "D85",
    name: "Grünfeld Defense: Exchange Variation",
    family: "Grünfeld Defense",
    moves: "1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7",
    pgn: "1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Nf3 c5 8. Rb1 O-O",
    description: "Black allows White to construct a massive c3/d4/e4 pawn center, then hypermodernly attacks it with c5 & Bg7.",
    whiteWinRate: 38,
    drawRate: 36,
    blackWinRate: 26,
    keyConcepts: ["White central pawn roller", "Black c5 & Bg7 pressure on d4", "Dynamic counter-attacks"]
  },
  {
    eco: "D02",
    name: "London System: Main Line",
    family: "London System",
    moves: "1. d4 d5 2. Bf4 Nf6 3. e3 c5 4. c3 Nc6 5. Nd2",
    pgn: "1. d4 d5 2. Bf4 Nf6 3. e3 c5 4. c3 Nc6 5. Nd2 e6 6. Ngf3 Bd6",
    description: "Solid, schematic setup where White develops Bf4 early before building a pyramid pawn wall c3-d4-e3.",
    whiteWinRate: 36,
    drawRate: 44,
    blackWinRate: 20,
    keyConcepts: ["Pyramid pawn chain c3-d4-e3", "Active Bf4 dark-squared bishop", "Easy piece placement"]
  },

  // -------------------------------------------------------------
  // E-SERIES: INDIAN DEFENSES (KING'S INDIAN, NIMZO-INDIAN)
  // -------------------------------------------------------------
  {
    eco: "E97",
    name: "King's Indian Defense: Mar del Plata Variation",
    family: "King's Indian Defense",
    moves: "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6",
    pgn: "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. Ne1 Nd7",
    description: "A battle of opposing flanks: White attacks queenside (c5 break), while Black storms kingside (f5 break).",
    whiteWinRate: 39,
    drawRate: 28,
    blackWinRate: 33,
    keyConcepts: ["Black f5-f4 pawn storm", "White c5-c6 queenside breach", "Extreme tactical sharpness"]
  },
  {
    eco: "E20",
    name: "Nimzo-Indian Defense: Rubinstein System",
    family: "Indian Defenses",
    moves: "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4",
    pgn: "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5",
    description: "Black pins Nc3 to prevent White's e4 pawn push, creating structural flexibility.",
    whiteWinRate: 34,
    drawRate: 44,
    blackWinRate: 22,
    keyConcepts: ["Pin on Nc3", "Counterplay against doubled c-pawns", "Solid e6-d5 central wall"]
  },
  {
    eco: "E15",
    name: "Queen's Indian Defense: Fianchetto Variation",
    family: "Indian Defenses",
    moves: "1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Ba6",
    pgn: "1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Ba6 5. b3 Bb4+ 6. Bd2 Be7",
    description: "Black fianchettoes the c8 bishop to b7 or a6 to control e4 and pressure White's long diagonal.",
    whiteWinRate: 33,
    drawRate: 48,
    blackWinRate: 19,
    keyConcepts: ["Bb7 & Ba6 bishop maneuvers", "Control over e4 square", "Solid positional maneuvering"]
  }
];
