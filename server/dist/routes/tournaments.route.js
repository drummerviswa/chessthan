import { Router } from "express";
import * as controller from "../controllers/tournaments.controller.js";
const router = Router();
router.route("/").post(controller.createTournamentEndpoint);
router.route("/:id/join").post(controller.joinTournamentEndpoint);
router.route("/:id/start").post(controller.startTournamentEndpoint);
router.route("/:id").get(controller.getTournamentStatusEndpoint);
export default router;
