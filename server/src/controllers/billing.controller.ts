import type { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { prisma } from "../db/index.js";

const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder_key_id";
const key_secret = process.env.RAZORPAY_KEY_SECRET || "placeholder_key_secret";
const webhook_secret = process.env.RAZORPAY_WEBHOOK_SECRET || "placeholder_webhook_secret";

// Initialize Razorpay client
const razorpay = new Razorpay({
    key_id,
    key_secret
});

const DEFAULT_PLAN_ID = process.env.RAZORPAY_PLAN_ID || "plan_PremiumMonthly_Mock";

/**
 * Creates a Razorpay subscription for the user
 */
export const createSubscription = async (req: Request, res: Response) => {
    try {
        if (!req.session.user?.id || typeof req.session.user.id === "string") {
            res.status(401).json({ message: "Unauthorized. Please register to upgrade." });
            return;
        }

        const userId = req.session.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            res.status(404).json({ message: "User not found." });
            return;
        }

        // Mock Razorpay client behavior if using placeholders in local development
        if (key_id.includes("placeholder")) {
            console.log("Mocking Razorpay subscription creation...");
            const mockSubId = `sub_mock_${crypto.randomBytes(8).toString("hex")}`;
            
            await prisma.user.update({
                where: { id: userId },
                data: {
                    subscriptionId: mockSubId,
                    subscriptionStatus: "pending"
                }
            });

            res.status(201).json({
                subscriptionId: mockSubId,
                key: key_id,
                mock: true
            });
            return;
        }

        // Create actual subscription with Razorpay
        const subscription = await razorpay.subscriptions.create({
            plan_id: DEFAULT_PLAN_ID,
            total_count: 12, // 12 cycles (e.g. monthly)
            quantity: 1,
            customer_notify: 1
        });

        // Store subscription ID in database
        await prisma.user.update({
            where: { id: userId },
            data: {
                subscriptionId: subscription.id,
                subscriptionStatus: "pending"
            }
        });

        res.status(201).json({
            subscriptionId: subscription.id,
            key: key_id,
            mock: false
        });
    } catch (err: any) {
        console.error("createSubscription error:", err);
        res.status(500).json({ message: err.message || "Failed to create subscription." });
    }
};

/**
 * Verifies client-side Razorpay signatures (invoked by client callback handler)
 */
export const verifySubscription = async (req: Request, res: Response) => {
    try {
        if (!req.session.user?.id || typeof req.session.user.id === "string") {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const userId = req.session.user.id;
        const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;

        if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
            res.status(400).json({ message: "Missing required signature fields." });
            return;
        }

        // Handle verification for mock mode
        if (razorpay_subscription_id.startsWith("sub_mock_")) {
            console.log("Bypassing verification: running in Mock Billing Mode.");
            
            await prisma.user.update({
                where: { id: userId },
                data: {
                    subscriptionStatus: "active"
                }
            });

            res.status(200).json({ success: true, message: "Subscription activated successfully (Mock)." });
            return;
        }

        // Generate expected signature
        const expectedSignature = crypto
            .createHmac("sha256", key_secret)
            .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            res.status(400).json({ success: false, message: "Payment signature verification failed." });
            return;
        }

        // Update database status to active
        await prisma.user.update({
            where: { id: userId },
            data: {
                subscriptionStatus: "active"
            }
        });

        res.status(200).json({ success: true, message: "Subscription activated successfully." });
    } catch (err: unknown) {
        console.error("verifySubscription error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Handles webhook notifications from Razorpay (cancellations, renewals, halts)
 */
export const handleWebhook = async (req: Request, res: Response) => {
    try {
        const bodyStr = JSON.stringify(req.body);
        const signature = req.headers["x-razorpay-signature"] as string;

        if (!signature) {
            res.status(400).end();
            return;
        }

        // Validate webhook signature
        const expectedSignature = crypto
            .createHmac("sha256", webhook_secret)
            .update(bodyStr)
            .digest("hex");

        if (expectedSignature !== signature) {
            console.warn("Invalid webhook signature received from Razorpay.");
            res.status(400).end();
            return;
        }

        const event = req.body.event;
        const payload = req.body.payload;

        console.log(`Razorpay webhook event received: ${event}`);

        if (event === "subscription.charged") {
            const subId = payload.subscription.entity.id;
            const customerId = payload.subscription.entity.customer_id;
            
            // Mark user status active
            await prisma.user.updateMany({
                where: { subscriptionId: subId },
                data: {
                    subscriptionStatus: "active",
                    razorpayCustomerId: customerId
                }
            });
        } else if (event === "subscription.cancelled" || event === "subscription.halted") {
            const subId = payload.subscription.entity.id;

            await prisma.user.updateMany({
                where: { subscriptionId: subId },
                data: {
                    subscriptionStatus: "cancelled"
                }
            });
        }

        res.status(200).end();
    } catch (err: unknown) {
        console.error("handleWebhook error:", err);
        res.status(500).end();
    }
};
