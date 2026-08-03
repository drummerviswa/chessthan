import pg from "pg";
import { PrismaClient } from "@prisma/client";
const connectionString = process.env.DATABASE_URL;
const poolConfig = connectionString
    ? {
        connectionString,
        ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
            ? false
            : { rejectUnauthorized: false }
    }
    : {
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
        ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false
    };
// Postgres pool for connect-pg-simple session store and raw queries
export const db = new pg.Pool(poolConfig);
// Prisma Client for application-level models and queries
export const prisma = new PrismaClient();
// Backwards-compatible connectivity check for server.ts startup
export const INIT_TABLES = `SELECT 1;`;
