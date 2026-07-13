import pg from "pg";
import { PrismaClient } from "@prisma/client";
// Postgres pool for connect-pg-simple session store
export const db = new pg.Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
    ssl: false
});
// Prisma Client for application-level models and queries
export const prisma = new PrismaClient();
// Backwards-compatible connectivity check for server.ts startup
export const INIT_TABLES = `SELECT 1;`;
