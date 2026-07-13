import { Router } from "express";
import * as controller from "../controllers/location.controller.js";
const router = Router();
// Location lobby routes
router.route("/")
    .post(controller.updateLobby)
    .get(controller.getNearby)
    .delete(controller.removeLobby);
export default router;
