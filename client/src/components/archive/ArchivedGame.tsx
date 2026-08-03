"use client";

import type { CustomSquares } from "@/types";
import { Game } from "@/types_config/index";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCopy,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
  IconRotateClockwise2
} from "@tabler/icons-react";
import type { Square } from "chess.js";
import { Chess } from "chess.js";
import { useEffect, useReducer, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { API_URL } from "@/config";
import { getOpeningName } from "@/lib/openingExplorer";
import { evaluateBoard } from "@/lib/localEngine";

export default function ArchivedGame({ game }: { game: Game }) {
  const [boardWidth, setBoardWidth] = useState(480);
  const [boardTheme, setBoardTheme] = useState({ dark: "#0e4a3b", light: "#eeeddf" });
  const moveListRef = useRef<HTMLDivElement>(null);
  const [navFen, setNavFen] = useState<string | null>(null);
  const [navIndex, setNavIndex] = useState<number | null>(null);
  const [flipBoard, setFlipBoard] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPgn, setShowPgn] = useState(true);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [gameReview, setGameReview] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  interface MoveAnalysis {
    san: string;
    grade: "brilliant" | "best" | "good" | "inaccuracy" | "mistake" | "blunder";
    evalBefore: number;
    evalAfter: number;
    diff: number;
  }

  const [accuracyResults, setAccuracyResults] = useState<{
    whiteAccuracy: number;
    blackAccuracy: number;
    whiteCounts: { brilliant: number; best: number; good: number; inaccuracy: number; mistake: number; blunder: number };
    blackCounts: { brilliant: number; best: number; good: number; inaccuracy: number; mistake: number; blunder: number };
    movesList: MoveAnalysis[];
  } | null>(null);
  const [analyzingAccuracy, setAnalyzingAccuracy] = useState(false);

  const runAccuracyAnalysis = () => {
    setAnalyzingAccuracy(true);
    setTimeout(() => {
      const history = actualGame.history({ verbose: true });
      const movesList: MoveAnalysis[] = [];
      
      const whiteCounts = { brilliant: 0, best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
      const blackCounts = { brilliant: 0, best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
      
      for (let i = 0; i < history.length; i++) {
        const currentMove = history[i];
        const scoreBefore = evaluateBoard(new Chess(currentMove.before)) / 100;
        const scoreAfter = evaluateBoard(new Chess(currentMove.after)) / 100;
        
        const diff = currentMove.color === "w" ? (scoreAfter - scoreBefore) : (scoreBefore - scoreAfter);
        
        let grade: MoveAnalysis["grade"] = "good";
        if (diff >= 1.0) {
          grade = "brilliant";
        } else if (diff >= -0.05) {
          grade = "best";
        } else if (diff >= -0.2) {
          grade = "good";
        } else if (diff >= -0.5) {
          grade = "inaccuracy";
        } else if (diff >= -1.5) {
          grade = "mistake";
        } else {
          grade = "blunder";
        }
        
        if (currentMove.color === "w") {
          whiteCounts[grade]++;
        } else {
          blackCounts[grade]++;
        }
        
        movesList.push({
          san: currentMove.san,
          grade,
          evalBefore: scoreBefore,
          evalAfter: scoreAfter,
          diff
        });
      }
      
      const getAccuracyScore = (counts: typeof whiteCounts, total: number) => {
        if (total === 0) return 100;
        let points = 0;
        points += (counts.brilliant + counts.best + counts.good) * 100;
        points += counts.inaccuracy * 50;
        points += counts.mistake * 20;
        return Math.round(points / total);
      };
      
      const whiteTotal = Math.ceil(history.length / 2);
      const blackTotal = Math.floor(history.length / 2);
      
      setAccuracyResults({
        whiteAccuracy: getAccuracyScore(whiteCounts, whiteTotal),
        blackAccuracy: getAccuracyScore(blackCounts, blackTotal),
        whiteCounts,
        blackCounts,
        movesList
      });
      setAnalyzingAccuracy(false);
    }, 100);
  };
  const actualGame = new Chess();
  actualGame.loadPgn(game.pgn as string);

  const history = actualGame.history({ verbose: true });
  const movesPlayed = history.slice(0, navIndex === null ? history.length : navIndex + 1).map(m => m.san);
  const currentOpening = getOpeningName(movesPlayed);

  useEffect(() => {
    setAiExplanation(null);
  }, [navIndex]);

  async function getGameReview() {
    setReviewLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/games/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pgn: game.pgn })
      });
      if (res.ok) {
        const data = await res.json();
        setGameReview(data.review);
      } else {
        setGameReview("Failed to load Game Review. Please try again.");
      }
    } catch (err) {
      setGameReview("Failed to connect to review server.");
    } finally {
      setReviewLoading(false);
    }
  }

  async function fetchAiExplanation() {
    if (navIndex === null) return;
    const history = actualGame.history({ verbose: true });
    const currentMove = history[navIndex];

    setAiLoading(true);
    setAiExplanation(null);

    const { getBestMove } = await import("@/lib/localEngine");
    const bestMove = getBestMove(currentMove.before, 2);

    try {
      const res = await fetch(`${API_URL}/v1/games/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fenBefore: currentMove.before,
          fenAfter: currentMove.after,
          move: currentMove.san,
          bestMove: bestMove || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiExplanation(data.explanation);
      } else {
        setAiExplanation("Failed to load explanation from AI. Please try again.");
      }
    } catch (e) {
      console.error(e);
      setAiExplanation("Network error. Could not connect to AI Tutor.");
    } finally {
      setAiLoading(false);
    }
  }

  const [customSquares, updateCustomSquares] = useReducer(
    (squares: CustomSquares, action: Partial<CustomSquares>) => {
      return { ...squares, ...action };
    },
    {
      options: {},
      lastMove: {},
      rightClicked: {},
      check: {}
    }
  );

  function handleResize() {
    const maxHeightBased = Math.floor(window.innerHeight * 0.70);
    let targetWidth = 480;

    if (window.innerWidth >= 1920) {
      targetWidth = 580;
    } else if (window.innerWidth >= 1536) {
      targetWidth = 540;
    } else if (window.innerWidth >= 768) {
      targetWidth = 480;
    } else {
      targetWidth = 330;
    }

    const finalWidth = Math.min(targetWidth, maxHeightBased);
    setBoardWidth(finalWidth);
  }

  // auto scroll for moves
  useEffect(() => {
    const activeMoveEl = document.getElementById("activeNavMove");
    const moveList = moveListRef.current;
    if (!activeMoveEl || !moveList) return;
    moveList.scrollTop = activeMoveEl.offsetTop;
  });

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);

    const savedTheme = localStorage.getItem("chessthan:boardTheme");
    if (savedTheme) {
      const THEMES = [
        { id: "emerald", dark: "#0e4a3b", light: "#eeeddf" },
        { id: "wood", dark: "#b58863", light: "#f0d9b5" },
        { id: "glass", dark: "#5e81ac", light: "#eceff4" },
        { id: "slate", dark: "#475569", light: "#cbd5e1" },
        { id: "royal", dark: "#5b21b6", light: "#ede9fe" }
      ];
      const found = THEMES.find(t => t.id === savedTheme);
      if (found) {
        setBoardTheme({ dark: found.dark, light: found.light });
      }
    }

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Keyboard Navigation Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: any) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigateMove(navIndex === null ? "prev" : navIndex - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigateMove(navIndex === null ? null : navIndex + 1);
      } else if (e.key === " ") {
        e.preventDefault();
        setFlipBoard((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navIndex, actualGame, navigateMove]);

  function copyLink() {
    const text = `https://chessthan.vercel.app/archive/${game.id}`;
    if ("clipboard" in navigator) {
      navigator.clipboard.writeText(text);
    } else {
      document.execCommand("copy", true, text);
    }
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
    }, 5000);
  }

  function onSquareRightClick(square: Square) {
    const colour = "rgba(0, 0, 255, 0.4)";
    updateCustomSquares({
      rightClicked: {
        ...customSquares.rightClicked,
        [square]:
          customSquares.rightClicked[square] &&
          customSquares.rightClicked[square]?.backgroundColor === colour
            ? undefined
            : { backgroundColor: colour }
      }
    });
  }

  function getMoveListHtml() {
    const history = actualGame.history({ verbose: true });
    const movePairs = history
      .slice(history.length / 2)
      .map((_, i) => history.slice((i *= 2), i + 2));

    return movePairs.map((moves, i) => {
      return (
        <tr className="flex w-full items-center gap-1" key={i + 1}>
          <td className="">{i + 1}.</td>
          <td
            className={
              "btn btn-ghost btn-xs h-full w-2/5 font-normal normal-case" +
              ((history.indexOf(moves[0]) === history.length - 1 && navIndex === null) ||
              navIndex === history.indexOf(moves[0])
                ? " btn-active pointer-events-none rounded-none"
                : "")
            }
            id={
              (history.indexOf(moves[0]) === history.length - 1 && navIndex === null) ||
              navIndex === history.indexOf(moves[0])
                ? "activeNavMove"
                : ""
            }
            onClick={() => navigateMove(history.indexOf(moves[0]))}
          >
            {moves[0].san}
          </td>
          {moves[1] && (
            <td
              className={
                "btn btn-ghost btn-xs h-full w-2/5 font-normal normal-case" +
                ((history.indexOf(moves[1]) === history.length - 1 && navIndex === null) ||
                navIndex === history.indexOf(moves[1])
                  ? " btn-active pointer-events-none rounded-none"
                  : "")
              }
              id={
                (history.indexOf(moves[1]) === history.length - 1 && navIndex === null) ||
                navIndex === history.indexOf(moves[1])
                  ? "activeNavMove"
                  : ""
              }
              onClick={() => navigateMove(history.indexOf(moves[1]))}
            >
              {moves[1].san}
            </td>
          )}
        </tr>
      );
    });
  }

  function navigateMove(index: number | null | "prev") {
    const history = actualGame.history({ verbose: true });

    if (index === null || (index !== "prev" && index >= history.length - 1) || !history.length) {
      // last move
      setNavIndex(null);
      setNavFen(null);
      return;
    }

    if (index === "prev") {
      index = history.length - 2;
    } else if (index < 0) {
      index = 0;
    }

    setNavIndex(index);
    setNavFen(history[index].after);
  }

  function getNavMoveSquares() {
    const history = actualGame.history({ verbose: true });

    if (!history.length) return;

    let index = navIndex ?? history.length - 1;

    return {
      [history[index].from]: { background: "rgba(255, 255, 0, 0.4)" },
      [history[index].to]: { background: "rgba(255, 255, 0, 0.4)" }
    };
  }

  function getPlayerHtml(side: "top" | "bottom") {
    const blackHtml = (
      <div className="flex w-full flex-col justify-center">
        <a
          className={
            "font-bold" +
            (typeof game.black?.id === "number" ? " text-primary link-hover" : " cursor-default")
          }
          href={typeof game.black?.id === "number" ? `/user/${game.black?.name}` : undefined}
          target="_blank"
          rel="noopener noreferrer"
        >
          {game.black?.name}
        </a>
        <span className="flex items-center gap-1 text-xs">black</span>
      </div>
    );
    const whiteHtml = (
      <div className="flex w-full flex-col justify-center">
        <a
          className={
            "font-bold" +
            (typeof game.white?.id === "number" ? " text-primary link-hover" : " cursor-default")
          }
          href={typeof game.white?.id === "number" ? `/user/${game.white?.name}` : undefined}
          target="_blank"
          rel="noopener noreferrer"
        >
          {game.white?.name}
        </a>
        <span className="flex items-center gap-1 text-xs">white</span>
      </div>
    );
    if (flipBoard) {
      return side === "top" ? whiteHtml : blackHtml;
    } else {
      return side === "top" ? blackHtml : whiteHtml;
    }
  }

  return (
    <div className="flex w-full flex-wrap justify-center gap-6 px-4 py-4 lg:gap-10 2xl:gap-16">
      <div className="h-min">
        <Chessboard
          boardWidth={boardWidth}
          customDarkSquareStyle={{ backgroundColor: boardTheme.dark }}
          customLightSquareStyle={{ backgroundColor: boardTheme.light }}
          position={navFen || actualGame.fen()}
          boardOrientation={flipBoard ? "black" : "white"}
          isDraggablePiece={() => false}
          onSquareClick={() => updateCustomSquares({ rightClicked: {} })}
          onSquareRightClick={onSquareRightClick}
          customSquareStyles={{
            ...getNavMoveSquares(),
            ...customSquares.rightClicked
          }}
        />
      </div>

      <div className="flex max-w-lg flex-1 flex-col items-center justify-center gap-4">
        <div className="mb-auto flex w-full p-2">
          <div className="flex flex-1 flex-col items-center justify-between">
            {getPlayerHtml("top")}
            <div className="my-auto flex w-full items-center">
              <button className="btn btn-sm gap-1" onClick={() => setFlipBoard(!flipBoard)}>
                <IconRotateClockwise2 size={18} />
                Flip board
              </button>
            </div>
            {getPlayerHtml("bottom")}
          </div>

          <div className="flex flex-1 flex-col gap-1">
            {currentOpening && (
              <div className="badge badge-outline border-primary text-primary font-semibold text-xs py-2.5 px-3 rounded w-full justify-center mb-1">
                📖 {currentOpening.name}
              </div>
            )}
            <div className="mb-2 flex w-full flex-col items-end gap-1">
              Archived link:
              <div
                className={
                  "dropdown dropdown-top dropdown-end" + (copiedLink ? " dropdown-open" : "")
                }
              >
                <label
                  tabIndex={0}
                  className="badge badge-md bg-base-300 text-base-content h-8 gap-1 font-mono text-xs sm:h-5 sm:text-sm"
                  onClick={copyLink}
                >
                  <IconCopy size={16} />
                  chessthan/archive/{game.id}
                </label>
                <div tabIndex={0} className="dropdown-content badge badge-neutral text-xs shadow">
                  copied to clipboard
                </div>
              </div>
            </div>
            <div className="h-32 w-full overflow-y-scroll" ref={moveListRef}>
              <table className="table-compact table w-full">
                <tbody>{getMoveListHtml()}</tbody>
              </table>
            </div>
            <div className="flex h-4 w-full">
              <button
                className={
                  "btn btn-sm flex-grow rounded-r-none" +
                  (navIndex === 0 || actualGame.history().length <= 1 ? " btn-disabled" : "")
                }
                onClick={() => navigateMove(0)}
              >
                <IconPlayerSkipBack size={18} />
              </button>
              <button
                className={
                  "btn btn-sm flex-grow rounded-none" +
                  (navIndex === 0 || actualGame.history().length <= 1 ? " btn-disabled" : "")
                }
                onClick={() => navigateMove(navIndex === null ? "prev" : navIndex - 1)}
              >
                <IconChevronLeft size={18} />
              </button>
              <button
                className={
                  "btn btn-sm flex-grow rounded-none" + (navIndex === null ? " btn-disabled" : "")
                }
                onClick={() => navigateMove(navIndex === null ? null : navIndex + 1)}
              >
                <IconChevronRight size={18} />
              </button>
              <button
                className={
                  "btn btn-sm flex-grow rounded-l-none" + (navIndex === null ? " btn-disabled" : "")
                }
                onClick={() => navigateMove(null)}
              >
                <IconPlayerSkipForward size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* AI Tutor Panel */}
        <div className="card w-full bg-base-300 shadow-sm rounded-lg p-4 border border-base-200">
          <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
            🤖 Chessthan AI Tutor
          </h3>
          {navIndex === null ? (
            <p className="text-xs text-base-content/60">
              Select any move from the list above to get an AI coach explanation.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="text-xs flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  Selected Move: <span className="font-bold text-primary">{actualGame.history({ verbose: true })[navIndex].san}</span>
                  {accuracyResults && accuracyResults.movesList[navIndex] && (
                    <span className={`badge badge-xs uppercase font-extrabold px-1.5 py-0.5 ${
                      accuracyResults.movesList[navIndex].grade === "brilliant" ? "badge-warning" :
                      accuracyResults.movesList[navIndex].grade === "best" ? "badge-success" :
                      accuracyResults.movesList[navIndex].grade === "good" ? "badge-info" :
                      accuracyResults.movesList[navIndex].grade === "inaccuracy" ? "badge-neutral" :
                      accuracyResults.movesList[navIndex].grade === "mistake" ? "badge-error text-error-content" :
                      "bg-rose-600 text-white"
                    }`}>
                      {accuracyResults.movesList[navIndex].grade === "brilliant" ? "🌟 Brilliant" :
                       accuracyResults.movesList[navIndex].grade === "best" ? "✅ Best" :
                       accuracyResults.movesList[navIndex].grade === "good" ? "👍 Good" :
                       accuracyResults.movesList[navIndex].grade === "inaccuracy" ? "⚠️ Inaccuracy" :
                       accuracyResults.movesList[navIndex].grade === "mistake" ? "❌ Mistake" : "🛑 Blunder"}
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-base-content/50">
                  {actualGame.history({ verbose: true })[navIndex].color === "w" ? "White's turn" : "Black's turn"}
                </span>
              </div>
              {aiExplanation ? (
                <div className="p-3 bg-base-100 rounded border border-base-200 text-xs leading-relaxed text-base-content animate__animated animate__fadeIn">
                  {aiExplanation}
                </div>
              ) : (
                <button
                  onClick={fetchAiExplanation}
                  className={`btn btn-xs btn-primary w-full ${aiLoading ? "loading" : ""}`}
                  disabled={aiLoading}
                >
                  Explain Move with AI
                </button>
              )}
            </div>
          )}
        </div>

        <div className="relative h-60 w-full min-w-fit">
          <div className="bg-base-300 flex h-full w-full min-w-[64px] flex-col rounded-lg p-4 shadow-sm">
            {game.endReason === "abandoned"
              ? game.winner === "draw"
                ? "The game ended in a draw due to abandonment."
                : `The game was won by ${game.winner} due to abandonment.`
              : game.winner === "draw"
                ? "The game ended in a draw."
                : `The game was won by checkmate (${game.winner}).`}

            <div className="mt-2 flex items-center justify-end">
              <button
                className={
                  "btn btn-sm rounded-b-none rounded-tr-none normal-case" +
                  (showPgn ? " btn-primary" : "")
                }
                onClick={() => setShowPgn(true)}
              >
                Final PGN
              </button>
              <div className="tooltip" data-tip="Current board position is shown.">
                <button
                  className={
                    "btn btn-sm rounded-b-none rounded-tl-none normal-case" +
                    (showPgn ? "" : " btn-primary")
                  }
                  onClick={() => setShowPgn(false)}
                >
                  Current FEN
                </button>
              </div>
            </div>
            <textarea
              className="textarea h-full rounded-tr-none"
              readOnly
              value={showPgn ? game.pgn : navFen || actualGame.fen()}
              onFocus={(e) => e.target.select()}
            />
          </div>
        </div>

        {/* Move Accuracy review panel */}
        <div className="card w-full bg-base-300 shadow-sm rounded-lg p-4 border border-base-200 mt-1">
          <h3 className="font-bold text-xs uppercase tracking-wider text-base-content/50 mb-2 flex items-center gap-1.5">
            📊 Move Accuracy Review
          </h3>
          {accuracyResults ? (
            <div className="space-y-4 animate__animated animate__fadeIn">
              
              {/* Accuracy scores cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-base-100 p-3 rounded-xl border border-base-200 text-center">
                  <div className="text-[9px] uppercase font-bold text-base-content/50">⚪ White Accuracy</div>
                  <div className="text-2xl font-black text-primary mt-1">{accuracyResults.whiteAccuracy}%</div>
                </div>
                <div className="bg-base-100 p-3 rounded-xl border border-base-200 text-center">
                  <div className="text-[9px] uppercase font-bold text-base-content/50">⚫ Black Accuracy</div>
                  <div className="text-2xl font-black text-accent mt-1">{accuracyResults.blackAccuracy}%</div>
                </div>
              </div>

              {/* Counts table breakdown */}
              <div className="overflow-x-auto bg-base-100 rounded-xl border border-base-200 p-2">
                <table className="table table-compact w-full text-[10px]">
                  <thead>
                    <tr>
                      <th>Move Quality</th>
                      <th className="text-center">White</th>
                      <th className="text-center">Black</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-bold text-warning">🌟 Brilliant</td>
                      <td className="text-center font-bold">{accuracyResults.whiteCounts.brilliant}</td>
                      <td className="text-center font-bold">{accuracyResults.blackCounts.brilliant}</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-success">✅ Best Move</td>
                      <td className="text-center font-bold">{accuracyResults.whiteCounts.best}</td>
                      <td className="text-center font-bold">{accuracyResults.blackCounts.best}</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-info">👍 Good</td>
                      <td className="text-center font-bold">{accuracyResults.whiteCounts.good}</td>
                      <td className="text-center font-bold">{accuracyResults.blackCounts.good}</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-base-content/60">⚠️ Inaccuracy</td>
                      <td className="text-center font-bold">{accuracyResults.whiteCounts.inaccuracy}</td>
                      <td className="text-center font-bold">{accuracyResults.blackCounts.inaccuracy}</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-error">❌ Mistake</td>
                      <td className="text-center font-bold">{accuracyResults.whiteCounts.mistake}</td>
                      <td className="text-center font-bold">{accuracyResults.blackCounts.mistake}</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-rose-600">🛑 Blunder</td>
                      <td className="text-center font-bold">{accuracyResults.whiteCounts.blunder}</td>
                      <td className="text-center font-bold">{accuracyResults.blackCounts.blunder}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          ) : (
            <button
              onClick={runAccuracyAnalysis}
              className={`btn btn-xs btn-primary w-full ${analyzingAccuracy ? "loading animate-pulse" : ""}`}
              disabled={analyzingAccuracy}
            >
              📋 Run Move Accuracy Review
            </button>
          )}
        </div>

        {/* Full Game Summary Card */}
        <div className="card w-full bg-base-300 shadow-sm rounded-lg p-4 border border-base-200 mt-1">
          <h4 className="font-bold text-xs uppercase tracking-wider text-base-content/50 mb-2 flex items-center gap-1.5">
            🏆 AI Full Match Review
          </h4>
          {gameReview ? (
            <p className="text-xs leading-relaxed text-base-content/85 animate__animated animate__fadeIn bg-base-100 p-3 rounded border border-base-200">
              {gameReview}
            </p>
          ) : (
            <button
              onClick={getGameReview}
              className={`btn btn-xs btn-outline btn-primary w-full ${reviewLoading ? "loading" : ""}`}
              disabled={reviewLoading}
            >
              Generate AI Match Analysis
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
