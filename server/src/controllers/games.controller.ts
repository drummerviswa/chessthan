import type { Game, User } from "../types_config/index.d.ts";
import type { Request, Response } from "express";
// import { nanoid } from "nanoid";

import GameModel, { activeGames } from "../db/models/game.model.js";
import { generateThematicRoomCode } from "../utils/wordGenerator.js";
import { explainMove, generateGameReview } from "../lib/aiCoach.js";
import { generateChess960Fen } from "../utils/chess960.js";
import { parseTimeControl } from "../socket/game.socket.js";

export const getGames = async (req: Request, res: Response) => {
    try {
        if (!req.query.id && !req.query.userid) {
            // get all active games
            res.status(200).json(activeGames.filter((g) => !g.unlisted && !g.winner));
            return;
        }

        let id, userid;
        if (req.query.id) {
            id = parseInt(req.query.id as string);
        }
        if (req.query.userid) {
            userid = parseInt(req.query.userid as string);
        }

        if (id && !isNaN(id)) {
            // get finished game by id
            const game = await GameModel.findById(id);
            if (!game) {
                res.status(404).end();
            } else {
                res.status(200).json(game);
            }
        } else if (userid && !isNaN(userid)) {
            // get finished games by user id
            const games = await GameModel.findByUserId(userid);
            if (!games) {
                res.status(404).end();
            } else {
                res.status(200).json(games);
            }
        } else {
            res.status(400).end();
        }
    } catch (err: unknown) {
        console.log(err);
        res.status(500).end();
    }
};

export const getActiveGame = async (req: Request, res: Response) => {
    try {
        if (!req.params || !req.params.code) {
            res.status(400).end();
            return;
        }

        const game = activeGames.find((g) => g.code === req.params.code);

        if (!game) {
            res.status(404).end();
        } else {
            res.status(200).json(game);
        }
    } catch (err: unknown) {
        console.log(err);
        res.status(500).end();
    }
};
export const createGame = async (req: Request, res: Response) => {
    try {
        let user: User;
        if (req.body.user && req.body.user.id !== undefined && req.body.user.id !== null) {
            user = {
                id: req.body.user.id,
                name: req.body.user.name || "Player",
                connected: true
            };
            req.session.user = user;
        } else if (req.session.user?.id) {
            user = {
                id: req.session.user.id,
                name: req.session.user.name || "Guest",
                connected: true
            };
        } else {
            const guestId = `guest_${Math.random().toString(36).substring(2, 9)}`;
            const guestName = `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
            user = {
                id: guestId as any,
                name: guestName,
                connected: true
            };
            req.session.user = user;
        }

        const unlisted: boolean = req.body.unlisted ?? false;

        let code = generateThematicRoomCode();
        while (activeGames.some((g) => g.code === code)) {
            code = generateThematicRoomCode();
        }

        const variant: Game["variant"] = req.body.variant || "standard";
        const timeControl = req.body.timeControl || "Casual";
        const rated = req.body.rated ?? false;

        const parsedTC = parseTimeControl(timeControl);

        const game: Game = {
            code,
            unlisted,
            host: user,
            pgn: "",
            variant,
            timeControl,
            rated,
            clocks: parsedTC
                ? {
                      white: parsedTC.timeMs,
                      black: parsedTC.timeMs,
                      lastMoveTime: Date.now()
                  }
                : undefined
        };
        if (variant === "chess960") {
            game.initialFen = generateChess960Fen();
        }
        if (req.body.side === "white") {
            game.white = user;
        } else if (req.body.side === "black") {
            game.black = user;
        } else {
            // random
            if (Math.floor(Math.random() * 2) === 0) {
                game.white = user;
            } else {
                game.black = user;
            }
        }
        activeGames.push(game);

        res.status(201).json({ code: game.code });
    } catch (err: unknown) {
        console.log(err);
        res.status(500).end();
    }
};

export const explainActiveMove = async (req: Request, res: Response) => {
    try {
        const { fenBefore, fenAfter, move, bestMove } = req.body;
        if (!fenBefore || !fenAfter || !move) {
            res.status(400).json({ message: "fenBefore, fenAfter, and move are required" });
            return;
        }

        const explanation = await explainMove(fenBefore, fenAfter, move, bestMove);
        res.status(200).json({ explanation });
    } catch (err: unknown) {
        console.error("explainActiveMove controller error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const reviewFinishedGame = async (req: Request, res: Response) => {
    try {
        const { pgn } = req.body;
        if (!pgn) {
            res.status(400).json({ message: "pgn is required" });
            return;
        }

        const review = await generateGameReview(pgn);
        res.status(200).json({ review });
    } catch (err: unknown) {
        console.error("reviewFinishedGame controller error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getStockfishEval = async (req: Request, res: Response) => {
    try {
        const fen = ((req.query.fen as string) || (req.body && req.body.fen as string) || "").trim();
        if (!fen) {
            res.status(400).json({ message: "fen parameter is required" });
            return;
        }

        // 1. Try Lichess Cloud API
        try {
            const lichessRes = await fetch(`https://eval.lichess.org/api?fen=${encodeURIComponent(fen)}`);
            if (lichessRes.ok) {
                const data = await lichessRes.json();
                if (data && data.pvs) {
                    const pvs = data.pvs.map((pv: any) => ({
                        cp: pv.cp ?? 0,
                        mate: pv.mate ?? undefined,
                        moves: typeof pv.moves === "string" ? pv.moves.split(" ") : (pv.moves || [])
                    }));
                    let score: number | null = null;
                    if (pvs.length > 0) {
                        const bestPv = pvs[0];
                        score = bestPv.mate !== undefined ? (bestPv.mate > 0 ? 99 : -99) : bestPv.cp / 100;
                    }
                    res.status(200).json({ score, pvs });
                    return;
                }
            }
        } catch (e) {
            // fallback to stockfish online
        }

        // 2. Try Stockfish Online API
        try {
            const sfRes = await fetch(`https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}`);
            if (sfRes.ok) {
                const data = await sfRes.json();
                if (data && data.success) {
                    let score: number | null = null;
                    if (data.mate !== null && data.mate !== undefined) {
                        score = data.mate > 0 ? 99 : -99;
                    } else if (data.evaluation !== null && data.evaluation !== undefined) {
                        score = data.evaluation;
                    }

                    let moves: string[] = [];
                    if (typeof data.data === "string") {
                        const parts = data.data.split(" ");
                        moves = parts.filter((p: string) => p !== "bestmove" && p !== "ponder" && p.length >= 4);
                    }

                    const pvs = [{
                        cp: score !== null ? Math.round(score * 100) : 0,
                        mate: data.mate ?? undefined,
                        moves
                    }];
                    res.status(200).json({ score, pvs });
                    return;
                }
            }
        } catch (e) {
            // fallback
        }

        res.status(200).json({ score: null, pvs: [] });
    } catch (err: unknown) {
        console.error("getStockfishEval controller error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

