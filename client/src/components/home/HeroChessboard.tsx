"use client";

import { useState, useEffect, useCallback } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerSkipForward,
  IconPlayerSkipBack,
  IconRotateClockwise,
  IconSparkles
} from "@tabler/icons-react";

interface GameSample {
  id: string;
  title: string;
  white: string;
  black: string;
  eco: string;
  moves: string[];
}

const HERO_GAMES: GameSample[] = [
  {
    id: "opera",
    title: "The Opera House Game",
    white: "Paul Morphy",
    black: "Duke Karl / Count Isouard",
    eco: "C41 Philidor Defense",
    moves: [
      "e4", "e5", "Nf3", "d6", "d4", "Bg4", "dxe5", "Bxf3", "Qxf3", "dxe5",
      "Bc4", "Nf6", "Qb3", "Qe7", "Nc3", "c6", "Bg5", "b5", "Nxb5", "cxb5",
      "Bxb5+", "Nbd7", "O-O-O", "Rd8", "Rxd7", "Rxd7", "Rd1", "Qe6", "Bxd7+",
      "Nxd7", "Qb8+", "Nxb8", "Rd8#"
    ]
  },
  {
    id: "immortal",
    title: "The Immortal Game",
    white: "Adolf Anderssen",
    black: "Lionel Kieseritzky",
    eco: "C33 King's Gambit",
    moves: [
      "e4", "e5", "f4", "exf4", "Bc4", "Qh4+", "Kf1", "b5", "Bxb5", "Nf6",
      "Nf3", "Qh6", "d3", "Nh5", "Nh4", "Qg5", "Nf5", "c6", "g4", "Nf6",
      "Rg1", "cxb5", "h4", "Qg6", "h5", "Qg5", "Qf3", "Ng8", "Bxf4", "Qf6",
      "Nc3", "Bc5", "Nd5", "Qxb2", "Bd6", "Bxg1", "e5", "Qxa1+", "Ke2", "Na6",
      "Nxg7+", "Kd8", "Qf6+", "Nxf6", "Be7#"
    ]
  },
  {
    id: "fischer",
    title: "Game of the Century",
    white: "Donald Byrne",
    black: "Bobby Fischer",
    eco: "D92 Gruenfeld Defense",
    moves: [
      "Nf3", "Nf6", "c4", "g6", "Nc3", "Bg7", "d4", "O-O", "Bf4", "d5",
      "Qb3", "dxc4", "Qxc4", "c6", "e4", "Nbd7", "Rd1", "Nb6", "Qc5", "Bg4",
      "Bg5", "Na4", "Qa3", "Nxc3", "bxc3", "Nxe4", "Bxe7", "Qb6", "Bc4", "Nxc3",
      "Bc5", "Rfe8+", "Kf1", "Be6", "Bxb6", "Bxc4+", "Kg1", "Ne2+", "Kf1", "Nxd4+",
      "Kg1", "Ne2+", "Kf1", "Nc3+", "Kg1", "axb6", "Qb4", "Ra4", "Qxb6", "Nxd1",
      "h4", "Rxa2", "Kh2", "Nxf2", "Re1", "Rxe1", "Qd8+", "Bf8", "Nxe1", "Bd5",
      "Nf3", "Ne4", "Qb8", "b5", "h5", "h6", "Ne5", "Kg7", "Kg1", "Bc5+", "Kf1",
      "Ng3+", "Ke1", "Bb4+", "Kd1", "Bb3+", "Kc1", "Ne2+", "Kb1", "Nc3+", "Kc1", "Rc2#"
    ]
  }
];

export default function HeroChessboard() {
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const [moveIndex, setMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [game, setGame] = useState<Chess>(new Chess());
  const [moveOptions, setMoveOptions] = useState<Record<string, { background: string; borderRadius?: string }>>({});
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  const currentGame = HERO_GAMES[selectedGameIndex];

  // Rebuild position up to moveIndex
  const updatePosition = useCallback((targetIndex: number, gameData: GameSample) => {
    const newGame = new Chess();
    for (let i = 0; i < targetIndex && i < gameData.moves.length; i++) {
      try {
        newGame.move(gameData.moves[i]);
      } catch {
        break;
      }
    }
    setGame(newGame);
    setSelectedSquare(null);
    setMoveOptions({});
  }, []);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setMoveIndex((prev) => {
        if (prev >= currentGame.moves.length) {
          // Restart after reaching end
          updatePosition(0, currentGame);
          return 0;
        }
        const next = prev + 1;
        updatePosition(next, currentGame);
        return next;
      });
    }, 1600);

    return () => clearInterval(timer);
  }, [isPlaying, currentGame, updatePosition]);

  // Handle Game Selection
  const handleGameSelect = (index: number) => {
    setSelectedGameIndex(index);
    setMoveIndex(0);
    updatePosition(0, HERO_GAMES[index]);
  };

  // Step Forward
  const handleNext = () => {
    setIsPlaying(false);
    if (moveIndex < currentGame.moves.length) {
      const next = moveIndex + 1;
      setMoveIndex(next);
      updatePosition(next, currentGame);
    }
  };

  // Step Back
  const handlePrev = () => {
    setIsPlaying(false);
    if (moveIndex > 0) {
      const prev = moveIndex - 1;
      setMoveIndex(prev);
      updatePosition(prev, currentGame);
    }
  };

  // Reset
  const handleReset = () => {
    setIsPlaying(false);
    setMoveIndex(0);
    updatePosition(0, currentGame);
  };

  // Interactive move options for visitors
  const getMoveOptions = (square: string) => {
    const moves = game.moves({ square: square as any, verbose: true });
    if (moves.length === 0) {
      setMoveOptions({});
      return;
    }

    const newSquares: Record<string, { background: string; borderRadius?: string }> = {};
    moves.forEach((move) => {
      const targetPiece = game.get(move.to as any);
      newSquares[move.to] = {
        background: targetPiece
          ? "radial-gradient(circle, rgba(239, 68, 68, 0.7) 80%, transparent 80%)"
          : "radial-gradient(circle, rgba(16, 185, 129, 0.75) 28%, transparent 28%)",
        borderRadius: "50%"
      };
    });
    newSquares[square] = {
      background: "rgba(16, 185, 129, 0.4)"
    };
    setMoveOptions(newSquares);
  };

  const onSquareClick = (square: string) => {
    if (selectedSquare === null) {
      setSelectedSquare(square);
      getMoveOptions(square);
      return;
    }

    // Try making user move
    const gameCopy = new Chess(game.fen());
    try {
      const move = gameCopy.move({
        from: selectedSquare,
        to: square,
        promotion: "q"
      });

      if (move) {
        setIsPlaying(false);
        setGame(gameCopy);
        setSelectedSquare(null);
        setMoveOptions({});
        return;
      }
    } catch {
      // Invalid move, re-select
    }

    setSelectedSquare(square);
    getMoveOptions(square);
  };

  const onPieceDrop = (sourceSquare: string, targetSquare: string) => {
    const gameCopy = new Chess(game.fen());
    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q"
      });
      if (move) {
        setIsPlaying(false);
        setGame(gameCopy);
        setSelectedSquare(null);
        setMoveOptions({});
        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto bg-base-200 border border-base-300 rounded-2xl p-4 shadow-xl space-y-3 animate__animated animate__fadeIn">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between bg-base-300/80 px-3 py-2 rounded-xl border border-base-300">
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1">
            <IconSparkles size={12} /> Interactive Showcase
          </span>
          <span className="text-xs font-black text-slate-100 truncate max-w-[200px]">
            {currentGame.title}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono text-slate-400 block font-bold">
            Move {moveIndex}/{currentGame.moves.length}
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {currentGame.moves[moveIndex - 1] || "Start"}
          </span>
        </div>
      </div>

      {/* Board Display */}
      <div className="w-full aspect-square max-w-[320px] rounded-xl overflow-hidden shadow-inner border border-emerald-950/40">
        <Chessboard
          position={game.fen()}
          onSquareClick={onSquareClick}
          onPieceDrop={onPieceDrop}
          customDarkSquareStyle={{ backgroundColor: "#0e4a3b" }}
          customLightSquareStyle={{ backgroundColor: "#eeeddf" }}
          customSquareStyles={moveOptions}
          animationDuration={300}
        />
      </div>

      {/* Game Selector Tabs */}
      <div className="grid grid-cols-3 gap-1 w-full text-[10px] font-bold font-mono">
        {HERO_GAMES.map((g, idx) => (
          <button
            key={g.id}
            onClick={() => handleGameSelect(idx)}
            className={`py-1 px-1.5 rounded-lg border text-center truncate transition-all ${
              selectedGameIndex === idx
                ? "bg-primary text-primary-content border-primary"
                : "bg-base-100 text-slate-400 border-base-300 hover:border-slate-600"
            }`}
          >
            {g.title.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between w-full pt-1 border-t border-base-300">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="btn btn-xs btn-primary font-bold gap-1 normal-case"
          >
            {isPlaying ? <IconPlayerPause size={12} /> : <IconPlayerPlay size={12} />}
            {isPlaying ? "Pause" : "Auto-Play"}
          </button>
          <button
            onClick={handleReset}
            className="btn btn-xs btn-ghost text-slate-400 font-mono"
            title="Reset Game"
          >
            <IconRotateClockwise size={12} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            disabled={moveIndex === 0}
            className="btn btn-xs btn-outline border-base-300 text-slate-300"
          >
            <IconPlayerSkipBack size={12} />
          </button>
          <button
            onClick={handleNext}
            disabled={moveIndex >= currentGame.moves.length}
            className="btn btn-xs btn-outline border-base-300 text-slate-300"
          >
            <IconPlayerSkipForward size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
