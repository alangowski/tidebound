# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tidebound is a React + Phaser 3 game frontend with an Express backend, deployed on DigitalOcean App Platform. Monorepo with independent `frontend/` and `backend/` directories, each with their own `package.json`.

## Commands

### Backend (`cd backend`)
- `npm run dev` — Start with file watching (`node --watch src/server.js`), runs on port 8080
- `npm start` — Production start

### Frontend (`cd frontend`)
- `npm run dev` — Vite dev server on port 5173, proxies `/api/*` to `localhost:8080`
- `npm run build` — Production build to `dist/`
- `npm run preview` — Preview production build

No linting, testing, or type-checking tools are configured.

## Architecture

**Frontend:** React 19 + Vite 7 + Phaser 3. Entry point is `frontend/src/main.jsx` → `App.jsx`. The Phaser game is loaded via `React.lazy` in `GameShell.jsx`. Game scenes live in `frontend/src/game/` (BootScene, GameScene, createGame factory).

**Backend:** Express 5 on Node 22. Entry point is `backend/src/server.js`. Routes are aggregated in `backend/src/routes/index.js`. Config via `backend/src/config/env.js` (dotenv).

**API:** All backend routes are under `/api`. Currently only `GET /api/health`. Frontend uses `VITE_API_BASE_URL` env var (defaults to `/api`). Vite dev server proxies `/api/*` to the backend.

**Deployment:** DigitalOcean App Platform (`.do/app.yaml`). Ingress routes `/api/*` to backend service, `/*` to frontend static site. Both deploy on push.

## Tech Stack

- JavaScript (no TypeScript), JSX for React components
- React 19, Phaser 3.90, Vite 7, Express 5
- CSS (vanilla, dark ocean theme)
- No database currently configured
