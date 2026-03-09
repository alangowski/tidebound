import { Suspense, lazy, useEffect, useState } from "react";

const API_FALLBACK = "/api";
const GameCanvas = lazy(() => import("./components/GameCanvas"));

function normalizeApiBase(rawValue) {
  if (!rawValue) {
    return API_FALLBACK;
  }

  return rawValue.endsWith("/") ? rawValue.slice(0, -1) : rawValue;
}

export default function App() {
  const apiBaseUrl = normalizeApiBase(import.meta.env.VITE_API_BASE_URL);
  const [health, setHealth] = useState({
    state: "loading",
    data: null,
    error: null
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadHealth() {
      try {
        const response = await fetch(`${apiBaseUrl}/health`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Health check failed with ${response.status}`);
        }

        const payload = await response.json();

        setHealth({
          state: "ready",
          data: payload,
          error: null
        });
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        setHealth({
          state: "error",
          data: null,
          error: error.message
        });
      }
    }

    loadHealth();

    return () => controller.abort();
  }, [apiBaseUrl]);

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">React + Phaser + Express</p>
          <h1>Tidebound</h1>
          <p className="lede">
            A DigitalOcean-ready starter layout with a static React client, a
            routed Node API, and a Phaser scene mounted inside the app shell.
          </p>
          <div className="status-row">
            <div className="status-card">
              <span className="status-label">API base</span>
              <code>{apiBaseUrl}</code>
            </div>
            <div className="status-card">
              <span className="status-label">Backend</span>
              {health.state === "loading" && <span>Checking...</span>}
              {health.state === "error" && <span>{health.error}</span>}
              {health.state === "ready" && (
                <span>
                  {health.data.status} on {health.data.service}
                </span>
              )}
            </div>
          </div>
        </div>
        <Suspense fallback={<section className="game-shell">Loading game preview...</section>}>
          <GameCanvas
            mentorChoice="pug"
            onQuestComplete={(data) => console.log("[Tidebound] Quest complete:", data)}
          />
        </Suspense>
      </section>
    </main>
  );
}
