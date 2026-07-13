import { Router } from "express";
import * as controller from "../controllers/billing.controller.js";

const router = Router();

// Billing endpoints
router.route("/checkout").post(controller.createSubscription);
router.route("/verify").post(controller.verifySubscription);
router.route("/webhook").post(controller.handleWebhook);

export default router;
