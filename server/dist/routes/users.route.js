import { Router } from "express";
import * as controller from "../controllers/users.controller.js";
const router = Router();
router.route("/leaderboard/elo").get(controller.getEloLeaderboard);
router.route("/leaderboard/leagues").get(controller.getLeagueLeaderboard);
router.route("/:name").get(controller.getUserProfile);
export default router;
