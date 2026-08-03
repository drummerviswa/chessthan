# 🚀 Chessthan Platform Production Deployment Guide

This guide details step-by-step instructions for deploying the **Chessthan** platform to **Vercel** (Frontend) and **Render** (Backend API & WebSockets).

---

## 🌐 Target Domain Configuration

- **Frontend Application**: `https://chessthan.vercel.app`
- **Backend API & WebSockets**: `https://chessthan.onrender.com`

---

## 1. ⚡ Deploying Frontend to Vercel

1. **Connect Repository**: Push your code to GitHub/GitLab and import the project into your Vercel Dashboard.
2. **Framework Preset**: Next.js (Automatic Detection)
3. **Root Directory**: `client`
4. **Build Command**: `pnpm --filter client build` (or default `next build`)
5. **Environment Variables**:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://chessthan.onrender.com` | Live Express/Socket.io Backend Endpoint |
| `NEXT_PUBLIC_APP_URL` | `https://chessthan.vercel.app` | Production Frontend App URL |
| `NEXTAUTH_URL` | `https://chessthan.vercel.app` | NextAuth Redirect Root |
| `NEXTAUTH_SECRET` | `[generate-random-secret]` | NextAuth Session Encryption Key |

---

## 2. 🖥️ Deploying Backend to Render

1. **Create Web Service**: In Render Dashboard, click **New +** -> **Web Service** and connect your repository.
2. **Root Directory**: `server`
3. **Runtime**: `Node`
4. **Build Command**: `pnpm --filter server build` (or `npm run build`)
5. **Start Command**: `node dist/server.js`
6. **Environment Variables**:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `5000` | Server listening port |
| `CORS_ORIGIN` | `https://chessthan.vercel.app` | Allowed CORS frontend origins |
| `POSTGRES_USER` | `[your-db-user]` | Managed PostgreSQL Username |
| `POSTGRES_PASSWORD` | `[your-db-password]` | Managed PostgreSQL Password |
| `POSTGRES_DB` | `chessthan` | PostgreSQL Database Name |
| `POSTGRES_HOST` | `[your-db-host]` | Managed Database Host (e.g. Render Postgres / Supabase) |
| `SESSION_SECRET` | `[random-session-secret]` | Express Session Secret |

---

## 3. 🐳 Docker & Containerized Hosting (Alternative)

If deploying via Docker / VPS (DigitalOcean, AWS EC2, Railway):

```bash
# Build and run client, server, and PostgreSQL database with Docker Compose
docker-compose up -d --build
```

---

## 4. 🐙 Git Commit & Push Instructions

Execute the following commands in your terminal to commit and push all recent platform features and deployment configurations:

```bash
git add .
git commit -m "feat: complete platform production release with admin dashboard, ECO openings, theme engine & deployment configuration"
git push origin main
```
