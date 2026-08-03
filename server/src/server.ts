import cors from "cors";
import "dotenv/config";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import { INIT_TABLES, db } from "./db/index.js";
import session from "./middleware/session.js";
import routes from "./routes/index.js";
import { init as initSocket } from "./socket/index.js";

const allowedOrigins = (
    process.env.CORS_ORIGIN ||
    "http://localhost:3000,http://127.0.0.1:3000,https://chessthan.vercel.app"
)
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""));

const corsConfig = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
            callback(null, true);
        } else {
            callback(new Error(`CORS policy violation: ${origin} not allowed`));
        }
    },
    credentials: true
};

const app = express();
const server = createServer(app);

// database
await db.connect();
db.query(INIT_TABLES, (err) => {
    if (err) {
        console.error("Database table initialization error:", err);
    } else {
        console.log("Tables initialized successfully");
    }
});

// health check routes
app.get(["/health", "/v1/health"], (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// middleware
app.use(cors(corsConfig));
app.use(express.json());
app.set("trust proxy", 1);
app.use(session);
app.use("/v1", routes);

// socket.io
export const io = new Server(server, { cors: corsConfig, pingInterval: 30000, pingTimeout: 50000 });
io.use((socket, next) => {
    session(socket.request as Request, {} as Response, next as NextFunction);
});
io.use((socket, next) => {
    const session = socket.request.session;
    if (session) {
        if (!session.user) {
            const guestId = -Math.floor(100000 + Math.random() * 900000);
            session.user = {
                id: guestId,
                name: `Guest_${Math.floor(1000 + Math.random() * 9000)}`
            };
        }
        next();
    } else {
        console.log("io.use: no session");
        socket.disconnect();
    }
});
initSocket();

const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`chessthan api server listening on :${port}`);
});

// Graceful shutdown handling
const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
        console.log("HTTP server closed.");
        db.end(() => {
            console.log("PostgreSQL connection pool closed.");
            process.exit(0);
        });
    });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
