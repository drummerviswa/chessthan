import pg from "pg";
export const db = new pg.Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 29016,
    ssl: {
        rejectUnauthorized: false
    }
});
export const INIT_TABLES = /* sql */ `
    CREATE TABLE IF NOT EXISTS "user" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(128) UNIQUE NOT NULL,
        email VARCHAR(128),
        password TEXT,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        draws INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS "game" (
        id SERIAL PRIMARY KEY,
        winner VARCHAR(5),
        end_reason VARCHAR(16),
        pgn TEXT,
        white_id INT REFERENCES "user",
        white_name VARCHAR(32),
        black_id INT REFERENCES "user",
        black_name VARCHAR(32),
        started_at TIMESTAMP NOT NULL,
        ended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;
