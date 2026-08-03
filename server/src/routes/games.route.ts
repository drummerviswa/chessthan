import { Router } from "express";

import * as controller from "../controllers/games.controller.js";

const router = Router();

router.route("/").get(controller.getGames).post(controller.createGame);
router.route("/explain").post(controller.explainActiveMove);
router.route("/explain-move").post(controller.explainActiveMove);
router.route("/review").post(controller.reviewFinishedGame);
router.route("/stockfish").get(controller.getStockfishEval).post(controller.getStockfishEval);

router.route("/:code").get(controller.getActiveGame);

export default router;

