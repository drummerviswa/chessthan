// import { nanoid } from "nanoid";
import GameModel, { activeGames } from "../db/models/game.model.js";
import { generateThematicRoomCode } from "../utils/wordGenerator.js";
import { explainMove, generateGameReview } from "../lib/aiCoach.js";
import { generateChess960Fen } from "../utils/chess960.js";
import { parseTimeControl } from "../socket/game.socket.js";
export const getGames = async (req, res) => {
    try {
        if (!req.query.id && !req.query.userid) {
            // get all active games
            res.status(200).json(activeGames.filter((g) => !g.unlisted && !g.winner));
            return;
        }
        let id, userid;
        if (req.query.id) {
            id = parseInt(req.query.id);
        }
        if (req.query.userid) {
            userid = parseInt(req.query.userid);
        }
        if (id && !isNaN(id)) {
            // get finished game by id
            const game = await GameModel.findById(id);
            if (!game) {
                res.status(404).end();
            }
            else {
                res.status(200).json(game);
            }
        }
        else if (userid && !isNaN(userid)) {
            // get finished games by user id
            const games = await GameModel.findByUserId(userid);
            if (!games) {
                res.status(404).end();
            }
            else {
                res.status(200).json(games);
            }
        }
        else {
            res.status(400).end();
        }
    }
    catch (err) {
        console.log(err);
        res.status(500).end();
    }
};
export const getActiveGame = async (req, res) => {
    try {
        if (!req.params || !req.params.code) {
            res.status(400).end();
            return;
        }
        const game = activeGames.find((g) => g.code === req.params.code);
        if (!game) {
            res.status(404).end();
        }
        else {
            res.status(200).json(game);
        }
    }
    catch (err) {
        console.log(err);
        res.status(500).end();
    }
};
export const createGame = async (req, res) => {
    try {
        if (!req.session.user?.id) {
            const guestId = `guest_${Math.random().toString(36).substring(2, 9)}`;
            const guestName = `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
            req.session.user = {
                id: guestId,
                name: guestName
            };
        }
        const user = {
            id: req.session.user.id,
            name: req.session.user.name || "Guest",
            connected: true
        };
        const unlisted = req.body.unlisted ?? false;
        let code = generateThematicRoomCode();
        while (activeGames.some((g) => g.code === code)) {
            code = generateThematicRoomCode();
        }
        const variant = req.body.variant || "standard";
        const timeControl = req.body.timeControl || "Casual";
        const rated = req.body.rated ?? false;
        const parsedTC = parseTimeControl(timeControl);
        const game = {
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
        }
        else if (req.body.side === "black") {
            game.black = user;
        }
        else {
            // random
            if (Math.floor(Math.random() * 2) === 0) {
                game.white = user;
            }
            else {
                game.black = user;
            }
        }
        activeGames.push(game);
        res.status(201).json({ code: game.code });
    }
    catch (err) {
        console.log(err);
        res.status(500).end();
    }
};
export const explainActiveMove = async (req, res) => {
    try {
        const { fenBefore, fenAfter, move, bestMove } = req.body;
        if (!fenBefore || !fenAfter || !move) {
            res.status(400).json({ message: "fenBefore, fenAfter, and move are required" });
            return;
        }
        const explanation = await explainMove(fenBefore, fenAfter, move, bestMove);
        res.status(200).json({ explanation });
    }
    catch (err) {
        console.error("explainActiveMove controller error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
export const reviewFinishedGame = async (req, res) => {
    try {
        const { pgn } = req.body;
        if (!pgn) {
            res.status(400).json({ message: "pgn is required" });
            return;
        }
        const review = await generateGameReview(pgn);
        res.status(200).json({ review });
    }
    catch (err) {
        console.error("reviewFinishedGame controller error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
