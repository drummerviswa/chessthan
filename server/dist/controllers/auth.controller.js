import { hash, verify } from "argon2";
import xss from "xss";
import { activeGames } from "../db/models/game.model.js";
import UserModel from "../db/models/user.model.js";
import { prisma } from "../db/index.js";
import { io } from "../server.js";
import { sendEmail } from "../utils/smtp.js";
import redisClient from "../lib/redis.js";
import { nanoid } from "nanoid";
export const getCurrentSession = async (req, res) => {
    try {
        if (req.session.user) {
            res.status(200).json(req.session.user);
        }
        else {
            res.status(204).end();
        }
    }
    catch (err) {
        console.log(err);
        res.status(500).end();
    }
};
export const guestSession = async (req, res) => {
    try {
        if (req.session.user?.id && typeof req.session.user.id === "number") {
            res.status(403).end();
            return;
        }
        const name = xss(req.body.name);
        const pattern = /^[A-Za-z0-9_.-]+$/;
        if (!pattern.test(name)) {
            res.status(400).end();
            return;
        }
        if (!req.session.user || !req.session.user?.id) {
            // create guest session
            const user = {
                id: req.session.id,
                name
            };
            req.session.user = user;
        }
        else if (typeof req.session.user.id === "string" && req.session.user.name !== name) {
            // update guest name
            req.session.user.name = name;
            const game = activeGames.find((g) => g.white?.id === req.session.user.id ||
                g.black?.id === req.session.user.id ||
                g.observers?.find((o) => o.id === req.session.user.id));
            if (game) {
                if (game.host?.id === req.session.user.id) {
                    game.host.name = name;
                }
                if (game.white?.id === req.session.user.id) {
                    game.white.name = name;
                }
                else if (game.black?.id === req.session.user.id) {
                    game.black.name = name;
                }
                else {
                    const observer = game.observers?.find((o) => o.id === req.session.user.id);
                    if (observer) {
                        observer.name = name;
                    }
                }
                io.to(game.code).emit("receivedLatestGame", game);
            }
        }
        req.session.save(() => {
            res.status(201).json(req.session.user);
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).end();
    }
};
export const logoutSession = async (req, res) => {
    try {
        req.session.destroy(() => {
            res.status(204).end();
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).end();
    }
};
export const registerUser = async (req, res) => {
    try {
        const name = xss(req.body.name || "").trim();
        const email = req.body.email ? xss(req.body.email).trim() : undefined;
        const rawPassword = req.body.password;
        if (!name || !rawPassword) {
            res.status(400).json({ message: "Username and password are required." });
            return;
        }
        const pattern = /^[A-Za-z0-9_]+$/;
        if (!pattern.test(name)) {
            res.status(400).json({ message: "Username can only contain letters, numbers, and underscores." });
            return;
        }
        // Check duplicate username or email
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { name },
                    ...(email ? [{ email }] : [])
                ]
            }
        });
        if (existingUser) {
            const dupl = existingUser.name.toLowerCase() === name.toLowerCase() ? "Username" : "Email";
            res.status(409).json({ message: `${dupl} is already in use.` });
            return;
        }
        const password = await hash(rawPassword);
        const newUser = await UserModel.create({ name, email: email || undefined }, password);
        if (!newUser) {
            res.status(500).json({ message: "Failed to create user account." });
            return;
        }
        req.session.user = newUser;
        req.session.save(() => {
            res.status(201).json(req.session.user);
        });
    }
    catch (err) {
        console.error("registerUser error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
export const loginUser = async (req, res) => {
    try {
        const nameOrEmail = xss(req.body.name || req.body.username || "").trim();
        const password = req.body.password;
        if (!nameOrEmail || !password) {
            res.status(400).json({ message: "Username/Email and password are required." });
            return;
        }
        // Find user by name OR email
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { name: nameOrEmail },
                    { email: nameOrEmail }
                ]
            }
        });
        if (!user || !user.password) {
            res.status(404).json({ message: "Invalid username or password." });
            return;
        }
        const validPassword = await verify(user.password, password);
        if (!validPassword) {
            res.status(401).json({ message: "Invalid username or password." });
            return;
        }
        const sessionUser = {
            id: user.id,
            name: user.name,
            email: user.email || undefined,
            wins: user.wins,
            losses: user.losses,
            draws: user.draws,
            avatarUrl: user.avatarUrl || undefined,
            subscriptionStatus: user.subscriptionStatus || undefined,
            puzzleRating: user.puzzleRating
        };
        req.session.user = sessionUser;
        req.session.save(() => {
            res.status(200).json(sessionUser);
        });
    }
    catch (err) {
        console.error("loginUser error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
export const updateUser = async (req, res) => {
    try {
        if (!req.session.user?.id || typeof req.session.user.id === "string") {
            res.status(403).end();
            return;
        }
        if (!req.body.name && !req.body.email && !req.body.password) {
            res.status(400).end();
            return;
        }
        const name = xss(req.body.name || req.session.user.name);
        const pattern = /^[A-Za-z0-9_.-]+$/;
        if (!pattern.test(name)) {
            res.status(400).end();
            return;
        }
        const email = xss(req.body.email || req.session.user.email);
        const compareEmail = email || name;
        const duplicateUsers = await UserModel.findByNameEmail({ name, email: compareEmail });
        if (duplicateUsers &&
            duplicateUsers.length &&
            duplicateUsers[0].id !== req.session.user.id) {
            const dupl = duplicateUsers[0].name === name ? "Username" : "Email";
            res.status(409).json({ message: `${dupl} is already in use.` });
            return;
        }
        let password = undefined;
        if (req.body.password) {
            password = await hash(req.body.password);
        }
        const updatedUser = await UserModel.update(req.session.user.id, { name, email, password });
        if (!updatedUser) {
            throw new Error("Failed to update user");
        }
        const publicUser = {
            id: updatedUser.id,
            name: updatedUser.name
        };
        const game = activeGames.find((g) => g.white?.id === req.session.user.id ||
            g.black?.id === req.session.user.id ||
            g.observers?.find((o) => o.id === req.session.user.id));
        if (game) {
            if (game.host?.id === req.session.user.id) {
                game.host = publicUser;
            }
            if (game.white && game.white?.id === req.session.user.id) {
                game.white = publicUser;
            }
            else if (game.black && game.black?.id === req.session.user.id) {
                game.black = publicUser;
            }
            else {
                const observer = game.observers?.find((o) => o.id === req.session.user.id);
                if (observer) {
                    observer.id = publicUser.id;
                    observer.name = publicUser.name;
                }
            }
            io.to(game.code).emit("receivedLatestGame", game);
        }
        req.session.user = updatedUser;
        req.session.save(() => {
            res.status(200).json(req.session.user);
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).end();
    }
};
export const oauthSession = async (req, res) => {
    try {
        const name = xss(req.body.name || "").trim();
        const email = xss(req.body.email || "").trim();
        const avatarUrl = xss(req.body.avatarUrl || "").trim();
        const searchEmail = email || `${(name || "player").toLowerCase()}@oauth.chessthan`;
        // Try to find user by email or name
        let dbUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: searchEmail },
                    ...(name ? [{ name }] : [])
                ]
            }
        });
        if (!dbUser) {
            let baseName = name.replace(/[^A-Za-z0-9_.-]/g, "") || "ChessPlayer";
            let uniqueName = baseName;
            let counter = 1;
            while (await prisma.user.findUnique({ where: { name: uniqueName } })) {
                uniqueName = `${baseName}${counter}`;
                counter++;
            }
            dbUser = await prisma.user.create({
                data: {
                    name: uniqueName,
                    email: searchEmail,
                    avatarUrl: avatarUrl || null
                }
            });
        }
        else if (avatarUrl && dbUser.avatarUrl !== avatarUrl) {
            dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: { avatarUrl }
            });
        }
        const sessionUser = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email || undefined,
            wins: dbUser.wins,
            losses: dbUser.losses,
            draws: dbUser.draws,
            avatarUrl: dbUser.avatarUrl || undefined,
            subscriptionStatus: dbUser.subscriptionStatus || undefined,
            puzzleRating: dbUser.puzzleRating
        };
        req.session.user = sessionUser;
        req.session.save(() => {
            res.status(200).json(sessionUser);
        });
    }
    catch (err) {
        console.error("oauthSession error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
export const forgotPassword = async (req, res) => {
    try {
        const email = xss(req.body.email || "");
        if (!email) {
            res.status(400).json({ message: "Email is required." });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            // Return 200 even if email not found to prevent user enumeration attacks
            res.status(200).json({ message: "If an account with that email exists, a password reset link has been sent." });
            return;
        }
        // Generate reset token
        const resetToken = nanoid(32);
        // Save token in Redis with 15 minutes TTL (900 seconds)
        await redisClient.set(`reset_token:${resetToken}`, String(user.id), "EX", 900);
        const resetUrl = `${process.env.CORS_ORIGIN || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;
        const emailContent = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>Reset your Chessthan Password</h2>
            <p>You requested a password reset. Click the button below to set a new password. This link is valid for 15 minutes.</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Reset Password</a>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't request this, you can ignore this email.</p>
        </div>
        `;
        await sendEmail(email, "Reset your Chessthan password", emailContent);
        res.status(200).json({ message: "If an account with that email exists, a password reset link has been sent." });
    }
    catch (err) {
        console.error("forgotPassword error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
export const resetPassword = async (req, res) => {
    try {
        const token = xss(req.body.token || "");
        const password = req.body.password;
        if (!token || !password) {
            res.status(400).json({ message: "Token and password are required." });
            return;
        }
        const userIdStr = await redisClient.get(`reset_token:${token}`);
        if (!userIdStr) {
            res.status(400).json({ message: "Invalid or expired reset token." });
            return;
        }
        const userId = parseInt(userIdStr);
        const hashedPassword = await hash(password);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
        // Delete the token
        await redisClient.del(`reset_token:${token}`);
        res.status(200).json({ message: "Password reset successful. You can now log in." });
    }
    catch (err) {
        console.error("resetPassword error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
