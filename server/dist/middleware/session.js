import PGSimple from "connect-pg-simple";
import session from "express-session";
import { nanoid } from "nanoid";
import { db } from "../db/index.js";
const PGSession = PGSimple(session);
const sessionMiddleware = session({
    store: new PGSession({ pool: db, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    name: "chessthan",
    proxy: true,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === "production" ? true : false,
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    },
    genid: function () {
        return nanoid(21);
    }
});
export default sessionMiddleware;
