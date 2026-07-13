import { Router } from "express";
import * as controller from "../controllers/puzzles.controller.js";

const router = Router();

router.route("/random").get(controller.getRandomPuzzle);
router.route("/:id/solve").post(controller.solvePuzzle);

export default router;
