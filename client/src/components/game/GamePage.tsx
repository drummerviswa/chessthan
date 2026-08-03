"use client";
// TODO: restructure, i could use some help with this :>
import celeb from "public/celeb.json";
import check from "public/check.json";

import {
  IconCopy,
} from "@tabler/icons-react";

import type { FormEvent, KeyboardEvent } from "react";

import { SessionContext } from "@/context/session";
import { useContext, useEffect, useReducer, useRef, useState } from "react";

import type { Message } from "@/types";
import type { Game } from "@/types_config/index";

import type { Move, Square } from "chess.js";
import { Chess } from "chess.js";
import type { ClearPremoves } from "react-chessboard";
import { Chessboard } from "react-chessboard";

import { API_URL } from "@/config";
import { io } from "socket.io-client";

import ChessClock from "./ChessClock";
import { lobbyReducer, squareReducer } from "./reducers";
import { initSocket } from "./socketEvents";
import { syncPgn, syncSide } from "./utils";
import "animate.css";
import Lottie from "lottie-react";
import { playSound, triggerHaptic } from "@/lib/audioEffects";
import GameResultModal from "./GameResultModal";
import { evaluateBoard } from "@/lib/localEngine";
import BoardControlPanel from "./BoardControlPanel";

const socket = io(API_URL, { withCredentials: true, autoConnect: false });

export default function GamePage({ initialLobby }: { initialLobby: Game }) {
  const session = useContext(SessionContext);

  const [lobby, updateLobby] = useReducer(lobbyReducer, {
    ...initialLobby,
    actualGame: initialLobby.initialFen ? new Chess(initialLobby.initialFen) : new Chess(),
    side: "s",
  });

  const [clocks, setClocks] = useState<{ white: number; black: number } | null>(null);

  useEffect(() => {
    if (lobby.clocks) {
      setClocks({
        white: lobby.clocks.white,
        black: lobby.clocks.black
      });
    } else {
      setClocks(null);
    }
  }, [lobby.clocks]);

  useEffect(() => {
    if (!lobby.clocks || lobby.winner || lobby.endReason || !lobby.white || !lobby.black) return;

    const interval = setInterval(() => {
      const activeTurn = lobby.actualGame.turn(); // 'w' or 'b'
      const elapsed = Date.now() - lobby.clocks!.lastMoveTime;

      const whiteTime = activeTurn === "w" ? Math.max(0, lobby.clocks!.white - elapsed) : lobby.clocks!.white;
      const blackTime = activeTurn === "b" ? Math.max(0, lobby.clocks!.black - elapsed) : lobby.clocks!.black;

      setClocks({ white: whiteTime, black: blackTime });

      if ((whiteTime <= 0 || blackTime <= 0) && socket.connected) {
        socket.emit("claimTimeout");
      }
    }, 100);

    return () => clearInterval(interval);
  }, [lobby.clocks, lobby.winner, lobby.endReason, lobby.white, lobby.black, lobby.actualGame]);

  const [customSquares, updateCustomSquares] = useReducer(squareReducer, {
    options: {},
    lastMove: {},
    rightClicked: {},
    check: {},
  });

  const [moveFrom, setMoveFrom] = useState<string | Square | null>(null);
  const [boardWidth, setBoardWidth] = useState(480);

  useEffect(() => {
    const updateSize = () => {
      if (typeof window !== "undefined") {
        const padding = window.innerWidth < 640 ? 24 : 64;
        const availableWidth = window.innerWidth - padding;
        const calculated = Math.min(availableWidth, 520);
        setBoardWidth(calculated > 280 ? calculated : 280);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  const chessboardRef = useRef<ClearPremoves>(null);

  const [navFen, setNavFen] = useState<string | null>(null);
  const [navIndex, setNavIndex] = useState<number | null>(null);

  const [playBtnLoading, setPlayBtnLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [boardTheme, setBoardTheme] = useState({ dark: "#0e4a3b", light: "#eeeddf" });

  const [evalScore, setEvalScore] = useState<number>(0);
  // Hide evaluation bar & engine suggestions during ongoing competitive online matches
  const showEval = !!(lobby.endReason || lobby.winner);

  const [premoveQueue, setPremoveQueue] = useState<{ from: string; to: string; promotion?: string }[]>([]);
  const [flipBoard, setFlipBoard] = useState(false);
  const [settings, setSettings] = useState({
    sound: true,
    highlights: true,
    premoves: true
  });

  // Inline confirmation dialog state
  const [confirmModal, setConfirmModal] = useState<{
    type: "resign" | "abort" | null;
  }>({ type: null });

  // Draw offer notification state
  const [drawOfferFrom, setDrawOfferFrom] = useState<string | null>(null);

  const onToggleSetting = (key: "sound" | "highlights" | "premoves") => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const onResign = () => {
    setConfirmModal({ type: "resign" });
  };

  const onOfferDraw = () => {
    socket.emit("offerDraw");
  };

  const onAbort = () => {
    setConfirmModal({ type: "abort" });
  };

  const handleConfirmAction = () => {
    if (confirmModal.type === "resign") socket.emit("resignMatch");
    else if (confirmModal.type === "abort") socket.emit("abortMatch");
    setConfirmModal({ type: null });
  };

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
      } else if (e.key === "Escape") {
        e.preventDefault();
        setPremoveQueue([]);
        if (chessboardRef.current) {
          chessboardRef.current.clearPremoves(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navIndex, lobby.actualGame, navigateMove]);

  // Trigger next premove if it is now our turn
  useEffect(() => {
    if (lobby.side === "s" || lobby.winner || lobby.endReason) return;
    if (lobby.side === lobby.actualGame.turn() && premoveQueue.length > 0) {
      const timer = setTimeout(() => {
        const nextPremove = premoveQueue[0];
        setPremoveQueue((prev) => prev.slice(1));
        
        const move = makeMove(nextPremove);
        if (move) {
          socket.emit("sendMove", nextPremove);
        } else {
          setPremoveQueue([]);
          if (chessboardRef.current) {
            chessboardRef.current.clearPremoves(true);
          }
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [lobby.side, lobby.winner, lobby.endReason, lobby.actualGame, lobby.pgn, premoveQueue, makeMove]);

  useEffect(() => {
    if (!lobby.actualGame) return;
    try {
      const activeFen = navFen || lobby.actualGame.fen();
      const scoreVal = evaluateBoard(new Chess(activeFen));
      setEvalScore(scoreVal / 100);
    } catch (e) {
      // safe fallback
    }
  }, [lobby.pgn, navFen, lobby.actualGame]);

  useEffect(() => {
    if (typeof window !== "undefined") {
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
    }
  }, []);

  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      author: {},
      message: `Have fun by invite your friends to spectate your spectacular game!`,
    },
  ]);

  // Open result modal on game completion
  useEffect(() => {
    if (lobby.winner || lobby.endReason) {
      setShowResultModal(true);
    }
  }, [lobby.winner, lobby.endReason]);

  const chatListRef = useRef<HTMLUListElement>(null);
  const moveListRef = useRef<HTMLDivElement>(null);

  const [abandonSeconds, setAbandonSeconds] = useState(60);
  useEffect(() => {
    if (
      lobby.side === "s" ||
      lobby.endReason ||
      lobby.winner ||
      !lobby.pgn ||
      !lobby.white ||
      !lobby.black ||
      (lobby.white.id !== session?.user?.id &&
        lobby.black.id !== session?.user?.id)
    )
      return;

    let interval: number;
    if (!lobby.white?.connected || !lobby.black?.connected) {
      setAbandonSeconds(60);
      interval = Number(
        setInterval(() => {
          if (
            abandonSeconds === 0 ||
            (lobby.white?.connected && lobby.black?.connected)
          ) {
            clearInterval(interval);
            return;
          }
          setAbandonSeconds((s) => s - 1);
        }, 1000),
      );
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    lobby.black,
    lobby.white,
    lobby.black?.disconnectedOn,
    lobby.white?.disconnectedOn,
  ]);

  useEffect(() => {
    const handleResize = () => {
      const maxHeightBased = Math.floor(window.innerHeight * 0.70);
      let targetWidth = 480;
      if (window.innerWidth >= 1920) targetWidth = 580;
      else if (window.innerWidth >= 1536) targetWidth = 540;
      else if (window.innerWidth >= 768) targetWidth = 480;
      else targetWidth = 330;
      setBoardWidth(Math.min(targetWidth, maxHeightBased));
    };

    // Restore side from localStorage on page refresh (set by yourSide socket event)
    const storedSide = typeof window !== "undefined"
      ? localStorage.getItem(`chessthan:side:${initialLobby.code}`) as "w" | "b" | null
      : null;
    if (storedSide) {
      updateLobby({ type: "setSide", payload: storedSide });
    }

    socket.connect();
    window.addEventListener("resize", handleResize);
    handleResize();

    if (lobby.pgn && lobby.actualGame.pgn() !== lobby.pgn) {
      syncPgn(lobby.pgn, lobby, { updateCustomSquares, setNavFen, setNavIndex });
    }

    initSocket(
      () => session?.user ?? null,
      socket,
      lobby,
      { updateLobby, addMessage, updateCustomSquares, makeMove, setNavFen, setNavIndex, setDrawOfferFrom }
    );

    return () => {
      window.removeEventListener("resize", handleResize);
      socket.removeAllListeners();
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback: re-run syncSide when session resolves (only if server yourSide hasn't set it yet)
  useEffect(() => {
    if (!session?.user || lobby.side !== "s") return;
    syncSide(session.user, undefined, lobby, { updateLobby });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);


  // auto scroll down when new message is added
  useEffect(() => {
    const chatList = chatListRef.current;
    if (!chatList) return;
    chatList.scrollTop = chatList.scrollHeight;
  }, [chatMessages]);

  // auto scroll for moves
  useEffect(() => {
    const activeMoveEl = document.getElementById("activeNavMove");
    const moveList = moveListRef.current;
    if (!activeMoveEl || !moveList) return;
    moveList.scrollTop = activeMoveEl.offsetTop;
  });

  useEffect(() => {
    updateTurnTitle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobby]);

  function updateTurnTitle() {
    if (lobby.side === "s" || !lobby.white?.id || !lobby.black?.id) return;

    if (!lobby.endReason && lobby.side === lobby.actualGame.turn()) {
      document.title = "(Your turn) || chessthan";
    } else {
      document.title = "(Opponent's turn) || chessthan";
    }
  }


  function addMessage(message: Message) {
    setChatMessages((prev) => [...prev, message]);
  }

  function sendChat(message: string) {
    if (!session?.user) return;

    socket.emit("chat", message);
    addMessage({ author: session.user, message });
  }

  function chatKeyUp(e: KeyboardEvent<HTMLInputElement>) {
    e.preventDefault();
    if (e.key === "Enter") {
      const input = e.target as HTMLInputElement;
      if (!input.value || input.value.length == 0) return;
      sendChat(input.value);
      input.value = "";
    }
  }

  function chatClickSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const target = e.target as HTMLFormElement;
    const input = target.elements.namedItem("chatInput") as HTMLInputElement;
    if (!input.value || input.value.length == 0) return;
    sendChat(input.value);
    input.value = "";
  }

  function makeMove(m: { from: string; to: string; promotion?: string }) {
    try {
      const result = lobby.actualGame.move(m);

      if (result) {
        // Trigger sounds & haptics on move play
        if (result.captured) {
          playSound("capture");
          triggerHaptic("capture");
        } else if (lobby.actualGame.inCheck()) {
          playSound("check");
          triggerHaptic("check");
        } else {
          playSound("move");
          triggerHaptic("move");
        }

        setNavFen(null);
        setNavIndex(null);
        updateLobby({
          type: "updateLobby",
          payload: { pgn: lobby.actualGame.pgn() },
        });
        updateTurnTitle();
        let kingSquare = undefined;
        if (lobby.actualGame.inCheck()) {
          const kingPos = lobby.actualGame.board().reduce((acc, row, index) => {
            const squareIndex = row.findIndex(
              (square) =>
                square &&
                square.type === "k" &&
                square.color === lobby.actualGame.turn(),
            );
            return squareIndex >= 0
              ? `${String.fromCharCode(squareIndex + 97)}${8 - index}`
              : acc;
          }, "");
          kingSquare = {
            [kingPos]: {
              background:
                "radial-gradient(circle, rgba(239, 68, 68, 0.6) 100%, transparent 100%)",
              boxShadow: "inset 0 0 16px #ef4444"
            } as any,
          };
        }
        updateCustomSquares({
          lastMove: {
            [result.from]: { background: "rgba(255, 255, 0, 0.3)" },
            [result.to]: { background: "rgba(255, 255, 0, 0.3)" },
          },
          options: {},
          check: kingSquare,
        });
        return true;
      } else {
        throw new Error("Invalid move");
      }
    } catch (err) {
      updateCustomSquares({
        options: {},
      });
      return false;
    }
  }

  function isDraggablePiece({ piece }: { piece: string }) {
    return piece.startsWith(lobby.side) && !lobby.endReason && !lobby.winner;
  }

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    if (lobby.side === "s" || navFen || lobby.endReason || lobby.winner)
      return false;

    // premove
    if (lobby.side !== lobby.actualGame.turn()) {
      if (settings.premoves) {
        const piece = lobby.actualGame.get(sourceSquare);
        if (piece && piece.color === lobby.side) {
          setPremoveQueue((prev) => [
            ...prev,
            { from: sourceSquare, to: targetSquare, promotion: "q" }
          ]);
          return true;
        }
      }
      return false;
    }

    const moveDetails = {
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    };

    const move = makeMove(moveDetails);
    if (!move) return false; // illegal move
    socket.emit("sendMove", moveDetails);
    return true;
  }

  function getMoveOptions(square: Square) {
    const moves = lobby.actualGame.moves({
      square,
      verbose: true,
    }) as Move[];
    if (moves.length === 0) {
      return;
    }

    const newSquares: {
      [square: string]: { background: string; borderRadius?: string };
    } = {};
    moves.forEach((move) => {
      newSquares[move.to] = {
        background:
          lobby.actualGame.get(move.to as Square) &&
          lobby.actualGame.get(move.to as Square)?.color !==
            lobby.actualGame.get(square)?.color
            ? "radial-gradient(circle, rgba(239, 68, 68, 0.4) 80%, transparent 80%)"
            : "radial-gradient(circle, rgba(0, 0, 0, 0.25) 25%, transparent 25%)",
        borderRadius: "50%",
      };
    });
    newSquares[square] = {
      background: "rgba(255, 255, 0, 0.3)",
    };
    updateCustomSquares({ options: newSquares });
  }

  function onPieceDragBegin(_piece: string, sourceSquare: Square) {
    if (
      lobby.side !== lobby.actualGame.turn() ||
      navFen ||
      lobby.endReason ||
      lobby.winner
    )
      return;

    getMoveOptions(sourceSquare);
  }

  function onPieceDragEnd() {
    updateCustomSquares({ options: {} });
  }

  function onSquareClick(square: Square) {
    updateCustomSquares({ rightClicked: {} });
    if (
      lobby.side !== lobby.actualGame.turn() ||
      navFen ||
      lobby.endReason ||
      lobby.winner
    )
      return;

    function resetFirstMove(square: Square) {
      setMoveFrom(square);
      getMoveOptions(square);
    }

    // from square
    if (moveFrom === null) {
      resetFirstMove(square);
      return;
    }

    const moveDetails = {
      from: moveFrom,
      to: square,
      promotion: "q",
    };

    const move = makeMove(moveDetails);
    if (!move) {
      resetFirstMove(square);
    } else {
      setMoveFrom(null);
      socket.emit("sendMove", moveDetails);
    }
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
            : { backgroundColor: colour },
      },
    });
  }

  function clickPlay(e: FormEvent<HTMLButtonElement>) {
    setPlayBtnLoading(true);
    e.preventDefault();
    socket.emit("joinAsPlayer");
  }

  function getPlayerHtml(side: "top" | "bottom") {
    const isTurnBlack = lobby.actualGame.turn() === "b";
    const isTurnWhite = lobby.actualGame.turn() === "w";
    const gameOver = !!(lobby.winner || lobby.endReason);

    const blackHtml = (
      <ChessClock
        side="black"
        playerName={lobby.black?.name || "Waiting for opponent..."}
        rating={1500}
        timeMs={clocks?.black ?? 600000}
        isActiveTurn={isTurnBlack}
        isGameOver={gameOver}
        timeControl={lobby.timeControl}
      />
    );
    const whiteHtml = (
      <ChessClock
        side="white"
        playerName={lobby.white?.name || "Waiting for opponent..."}
        rating={1500}
        timeMs={clocks?.white ?? 600000}
        isActiveTurn={isTurnWhite}
        isGameOver={gameOver}
        timeControl={lobby.timeControl}
      />
    );

    const isUserBlack =
      lobby.side === "b" ||
      (!!(session?.user && lobby.black?.id !== undefined && String(lobby.black.id) === String(session.user.id)));


    if (isUserBlack) {
      return side === "top" ? whiteHtml : blackHtml;
    } else {
      return side === "top" ? blackHtml : whiteHtml;
    }
  }

  function copyInvite() {
    const text = `https://chessthan.vercel.app/${lobby.endReason ? `archive/${lobby.id}` : initialLobby.code}`;
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



  function navigateMove(index: number | null | "prev") {
    const history = lobby.actualGame.history({ verbose: true });

    if (
      index === null ||
      (index !== "prev" && index >= history.length - 1) ||
      !history.length
    ) {
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

    chessboardRef.current?.clearPremoves(false);

    setNavIndex(index);
    setNavFen(history[index].after);
  }

  function getNavMoveSquares() {
    if (navIndex === null) return;
    const history = lobby.actualGame.history({ verbose: true });

    if (!history.length) return;

    return {
      [history[navIndex].from]: { background: "rgba(255, 255, 0, 0.4)" },
      [history[navIndex].to]: { background: "rgba(255, 255, 0, 0.4)" },
    };
  }

  const getPremoveHighlights = () => {
    const styles: { [square: string]: { background: string } } = {};
    premoveQueue.forEach((m) => {
      styles[m.from] = { background: "rgba(249, 115, 22, 0.4)" };
      styles[m.to] = { background: "rgba(249, 115, 22, 0.4)" };
    });
    return styles;
  };

  function claimAbandoned(type: "win" | "draw") {
    if (
      lobby.side === "s" ||
      lobby.endReason ||
      lobby.winner ||
      !lobby.pgn ||
      abandonSeconds > 0 ||
      (lobby.black?.connected && lobby.white?.connected)
    ) {
      return;
    }
    socket.emit("claimAbandoned", type);
  }
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4">
      {(lobby.winner === "black" && lobby?.black?.id === session?.user?.id) ||
      (lobby.winner === "white" && lobby?.white?.id === session?.user?.id) ? (
        <Lottie
          animationData={celeb}
          className="flex justify-center items-center absolute top-0 left-0 w-full h-full z-0"
          loop={true}
        />
      ) : lobby.winner ? (
        <Lottie animationData={check}
          className="flex justify-center items-center absolute top-0 left-0 w-full h-full z-0 opacity-30"
          loop={true} />
      ) : null}

      {/* Inline Confirm Modal for Resign / Abort */}
      {confirmModal.type && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate__animated animate__fadeIn">
          <div className="card bg-base-200 border border-base-300 shadow-2xl p-6 w-full max-w-xs text-center gap-4">
            <h3 className="text-lg font-black">
              {confirmModal.type === "resign" ? "🏳️ Resign Match?" : "⛔ Abort Match?"}
            </h3>
            <p className="text-sm text-base-content/60">
              {confirmModal.type === "resign"
                ? "You will forfeit the game. This action cannot be undone."
                : "The game will be cancelled. Both players must agree or one side must abort before move 2."}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                className="btn btn-sm flex-1 btn-ghost"
                onClick={() => setConfirmModal({ type: null })}
              >
                Cancel
              </button>
              <button
                className={`btn btn-sm flex-1 ${confirmModal.type === "resign" ? "btn-error" : "btn-warning"}`}
                onClick={handleConfirmAction}
              >
                {confirmModal.type === "resign" ? "Resign" : "Abort"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draw Offer Notification */}
      {drawOfferFrom && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate__animated animate__slideInUp">
          <div className="card bg-base-200 border border-base-300 shadow-2xl p-4 flex flex-row items-center gap-4">
            <span className="text-sm font-bold">🤝 <strong>{drawOfferFrom}</strong> offered a draw</span>
            <div className="flex gap-2">
              <button
                className="btn btn-xs btn-success"
                onClick={() => { socket.emit("acceptDraw"); setDrawOfferFrom(null); }}
              >
                Accept
              </button>
              <button
                className="btn btn-xs btn-ghost"
                onClick={() => setDrawOfferFrom(null)}
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex w-full flex-wrap justify-center gap-6 px-4 py-4 lg:gap-10 2xl:gap-16 animate__animated animate__fadeIn">
        <div className="flex items-stretch gap-3 relative h-min animate__animated animate__slideInUp">
          
          {/* Live Evaluation Bar */}
          {showEval && (
            <div 
              className="w-4 bg-slate-300 rounded-lg overflow-hidden flex flex-col relative border border-base-300 shadow-inner shrink-0"
              style={{ height: `${boardWidth}px` }}
            >
              {/* Black advantage (top fill) */}
              <div className="flex-1 bg-neutral-900 transition-all duration-300" />
              
              {/* White advantage (bottom fill) */}
              <div 
                className="bg-white transition-all duration-300"
                style={{ height: `${((Math.max(-8, Math.min(evalScore, 8)) + 8) / 16) * 100}%` }}
              />

              {/* Text label */}
              <span className={`absolute left-0 right-0 text-center font-mono text-[7px] font-bold ${
                evalScore >= 0 ? "bottom-1 text-black" : "top-1 text-white"
              }`}>
                {evalScore > 0 ? `+${evalScore.toFixed(1)}` : evalScore.toFixed(1)}
              </span>
            </div>
          )}

          <div className="relative" style={{ width: `${boardWidth}px`, height: `${boardWidth}px` }}>
            {/* overlay */}
            {(!lobby.white?.id || !lobby.black?.id) && (
              <div className="absolute bottom-0 right-0 top-0 z-10 flex h-full w-full items-center justify-center bg-black bg-opacity-70">
                <div className="bg-base-200 flex w-full items-center justify-center gap-4 px-2 py-4">
                  Waiting for opponent.
                  {session?.user?.id !== lobby.white?.id &&
                    session?.user?.id !== lobby.black?.id && (
                      <button
                        className={
                          "btn btn-secondary" +
                          (playBtnLoading ? " btn-disabled" : "")
                        }
                        onClick={clickPlay}
                      >
                        Play as {lobby.white?.id ? "black" : "white"}
                      </button>
                    )}
                </div>
              </div>
            )}
            <Chessboard
              boardWidth={boardWidth}
              customDarkSquareStyle={{ backgroundColor: boardTheme.dark }}
              customLightSquareStyle={{ backgroundColor: boardTheme.light }}
              position={navFen || lobby.actualGame.fen()}
              boardOrientation={lobby.side === "b" ? (flipBoard ? "white" : "black") : (flipBoard ? "black" : "white")}
              isDraggablePiece={isDraggablePiece}
              onPieceDragBegin={onPieceDragBegin}
              onPieceDragEnd={onPieceDragEnd}
              onPieceDrop={onDrop}
              onSquareClick={onSquareClick}
              onSquareRightClick={onSquareRightClick}
              arePremovesAllowed={!navFen}
              customSquareStyles={{
                ...(navIndex === null
                  ? customSquares.lastMove
                  : getNavMoveSquares()),
                ...(navIndex === null ? customSquares.check : {}),
                ...customSquares.rightClicked,
                ...(navIndex === null ? customSquares.options : {}),
                ...getPremoveHighlights(),
              }}
              ref={chessboardRef}
            />
          </div>
        </div>
        <div className="flex max-w-lg flex-1 flex-col items-center justify-center gap-4 w-full max-h-[380px] md:max-h-none overflow-y-auto md:overflow-visible pr-1 border-t border-slate-800/40 md:border-t-0 pt-2 md:pt-0">
          <div className="mb-auto flex w-full p-2">
            <div className="flex flex-1 flex-col items-center justify-between">
              {getPlayerHtml("top")}
              <div className="my-auto w-full text-sm">vs</div>
              {getPlayerHtml("bottom")}
            </div>

            <div className="flex flex-1 flex-col gap-1">
              <div className="mb-2 flex w-full flex-col items-end gap-1">
                {lobby.endReason ? "Archived link:" : "Invite friends:"}
                <div
                  className={
                    "dropdown dropdown-top dropdown-end" +
                    (copiedLink ? " dropdown-open" : "")
                  }
                >
                  <label
                    tabIndex={0}
                    className="badge badge-md bg-base-300 text-base-content h-8 gap-1 font-mono text-xs sm:h-5 sm:text-sm"
                    onClick={copyInvite}
                  >
                    <IconCopy size={16} />
                    chessthan/
                    {lobby.endReason
                      ? `archive/${lobby.id}`
                      : initialLobby.code}
                  </label>
                  <div
                    tabIndex={0}
                    className="dropdown-content badge badge-neutral text-xs shadow"
                  >
                    copied to clipboard
                  </div>
                </div>
              </div>

              <BoardControlPanel
                history={lobby.actualGame.history({ verbose: true })}
                navIndex={navIndex}
                navigateMove={navigateMove}
                setBoardTheme={setBoardTheme}
                settings={settings}
                onToggleSetting={onToggleSetting}
                onResign={lobby.side !== "s" && !lobby.endReason && !lobby.winner ? onResign : undefined}
                onOfferDraw={lobby.side !== "s" && !lobby.endReason && !lobby.winner ? onOfferDraw : undefined}
                onAbort={lobby.side !== "s" && lobby.actualGame.history().length <= 1 && !lobby.endReason && !lobby.winner ? onAbort : undefined}
                onFlipBoard={() => setFlipBoard((prev) => !prev)}
              />
            </div>
          </div>

          <div className="relative h-60 w-full min-w-fit">
            {(lobby.endReason ||
              (lobby.pgn &&
                lobby.white &&
                session?.user?.id === lobby.white?.id &&
                lobby.black &&
                !lobby.black?.connected) ||
              (lobby.pgn &&
                lobby.black &&
                session?.user?.id === lobby.black?.id &&
                lobby.white &&
                !lobby.white?.connected)) && (
              <div className="bg-neutral absolute w-full rounded-t-lg bg-opacity-95 p-2">
                {lobby.endReason ? (
                  <div>
                    {lobby.endReason === "abandoned"
                      ? lobby.winner === "draw"
                        ? `The game ended in a draw due to abandonment.`
                        : `The game was won by ${lobby.winner} due to abandonment.`
                      : lobby.winner === "draw"
                        ? "The game ended in a draw."
                        : `The game was won by checkmate (${lobby.winner}).`}{" "}
                    <br />
                    You can review the archived game at{" "}
                    <a
                      className="link"
                      href={`/archive/${lobby.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      chessthan/archive/{lobby.id}
                    </a>
                    .
                  </div>
                ) : abandonSeconds > 0 ? (
                  `Your opponent has disconnected. You can claim the win or draw in ${abandonSeconds} second${
                    abandonSeconds > 1 ? "s" : ""
                  }.`
                ) : (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span>Your opponent has disconnected.</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => claimAbandoned("win")}
                        className="btn btn-sm btn-primary"
                      >
                        Claim win
                      </button>
                      <button
                        onClick={() => claimAbandoned("draw")}
                        className="btn btn-sm btn-ghost"
                      >
                        Draw
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="bg-base-300 flex h-full w-full min-w-[64px] flex-col rounded-lg p-4 shadow-sm">
              <ul
                className="mb-4 flex h-full flex-col gap-1 overflow-y-scroll break-words"
                ref={chatListRef}
              >
                {chatMessages.map((m, i) => (
                  <li
                    className={
                      "max-w-[30rem]" +
                      (!m.author.id && m.author.name === "server"
                        ? " bg-base-content text-base-300 p-2"
                        : "")
                    }
                    key={i}
                  >
                    <span>
                      {m.author.id && (
                        <span>
                          <a
                            className={
                              "font-bold" +
                              (typeof m.author.id === "number"
                                ? " text-primary link-hover"
                                : " cursor-default")
                            }
                            href={
                              typeof m.author.id === "number"
                                ? `/user/${m.author.name}`
                                : undefined
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {m.author.name}
                          </a>
                          :{" "}
                        </span>
                      )}
                      <span>{m.message}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <form className="input-group mt-auto" onSubmit={chatClickSend}>
                <input
                  type="text"
                  placeholder="Chat here..."
                  className="input input-bordered flex-grow"
                  name="chatInput"
                  id="chatInput"
                  onKeyUp={chatKeyUp}
                  required
                />
                <button className="btn btn-secondary ml-1" type="submit">
                  Send
                </button>
              </form>
            </div>
          </div>
          {lobby.observers && lobby.observers.length > 0 && (
            <div className="w-full px-2 text-xs md:px-0">
              Spectators: {lobby.observers?.map((o) => o.name).join(", ")}
            </div>
          )}
        </div>
      </div>
      <GameResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        winner={lobby.winner as any}
        playerColor={lobby.side === "w" ? "white" : lobby.side === "b" ? "black" : "observer"}
        reason={lobby.endReason || "agreement"}
        pgn={lobby.pgn}
      />
    </div>
  );
}
