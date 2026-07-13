import { Router } from "express";

import * as controller from "../controllers/auth.controller.js";

const router = Router();

router.route("/").get(controller.getCurrentSession).patch(controller.updateUser);

// create or update guest sessions
router.route("/guest").post(controller.guestSession);

router.route("/logout").post(controller.logoutSession);

router.route("/register").post(controller.registerUser);
router.route("/login").post(controller.loginUser);
router.route("/oauth").post(controller.oauthSession);
router.route("/forgot-password").post(controller.forgotPassword);
router.route("/reset-password").post(controller.resetPassword);

export default router;
