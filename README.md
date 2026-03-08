# Tidebound

Tidebound is organized as a minimal monorepo for DigitalOcean App Platform. The repo contains a standalone Vite React frontend in `frontend/` and a standalone Express backend in `backend/`, both deployed from the same GitHub repository with a committed app spec in `.do/app.yaml`.

## Project structure

```text
tidebound/
├── .do/app.yaml
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── game/
│   │   └── App.jsx
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   └── server.js
│   ├── .env.example
│   └── package.json
└── .gitignore
```

## Local development

Install dependencies separately for each app:

```bash
cd /Users/alex/github/tidebound/backend
npm install

cd /Users/alex/github/tidebound/frontend
npm install
```

Run the backend on port `8080`:

```bash
cd /Users/alex/github/tidebound/backend
cp .env.example .env
npm run dev
```

Run the frontend on port `5173`:

```bash
cd /Users/alex/github/tidebound/frontend
cp .env.example .env
npm run dev
```

The frontend defaults `VITE_API_BASE_URL` to `/api`. During local development, Vite proxies `/api` requests to `http://localhost:8080`, so the browser and production deployment both use the same relative API path.

## Environment variables

Frontend:

- `VITE_API_BASE_URL`: Optional. Defaults to `/api`.

Backend:

- `PORT`: Optional. Defaults to `8080`.
- `HOST`: Optional. Defaults to `0.0.0.0`.
- `NODE_ENV`: Optional. Defaults to `development`.

## DigitalOcean App Platform

The committed app spec deploys one app with:

- `frontend` as a static site built from `./frontend`
- `backend` as a Node.js service built from `./backend`
- ingress routing for `/api` to the backend with path preservation
- ingress routing for `/` to the frontend static site

Validate the spec:

```bash
cd /Users/alex/github/tidebound
doctl apps propose --spec .do/app.yaml
```

Create the app from the spec:

```bash
cd /Users/alex/github/tidebound
doctl apps create --spec .do/app.yaml
```

After the first deploy, pushes to `main` trigger automatic redeploys because both components have `deploy_on_push: true`.

## Build and smoke test

Build the frontend:

```bash
cd /Users/alex/github/tidebound/frontend
npm run build
```

Start the backend and verify the health endpoint:

```bash
cd /Users/alex/github/tidebound/backend
npm start
curl http://localhost:8080/api/health
```
