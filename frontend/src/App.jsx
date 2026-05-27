import { Suspense, lazy, useState } from "react";

const GameCanvas = lazy(() => import("./components/GameCanvas"));

function getBestScore(key) {
  const val = localStorage.getItem(key);
  return val ? `Best: ${val}` : '';
}

export default function App() {
  const [view, setView] = useState("title");
  const [mentorChoice, setMentorChoice] = useState("pug");
  const [weekId, setWeekId] = useState(1);

  if (view === "playing") {
    return (
      <div className="game-fullscreen">
        <button className="back-btn" onClick={() => setView("title")}>
          ← Menu
        </button>
        <Suspense fallback={<div className="game-loading">Loading game...</div>}>
          <GameCanvas
            key={`${mentorChoice}-${weekId}`}
            mentorChoice={mentorChoice}
            weekId={weekId}
            onQuestComplete={(data) => console.log("[Tidebound] Quest complete:", data)}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <main className="app-shell">
      <section className="title-card">
        <p className="eyebrow">A Coastal Learning Adventure</p>
        <h1>Tidebound</h1>
        <p className="lede">
          Choose your mentor, pick a week, and explore the tidepools.<br />
          <span className="lede-sub">New: direct control with an animated explorer!</span>
        </p>

        <div className="mentor-select">
          <button
            className={`mentor-btn${mentorChoice === "pug" ? " selected" : ""}`}
            onClick={() => setMentorChoice("pug")}
          >
            🐶 Captain Pug
          </button>
          <button
            className={`mentor-btn${mentorChoice === "fox" ? " selected" : ""}`}
            onClick={() => setMentorChoice("fox")}
          >
            🦊 Professor Fox
          </button>
        </div>

        <div className="week-grid">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
            <button
              key={w}
              className={`week-btn${weekId === w ? " selected" : ""}`}
              onClick={() => setWeekId(w)}
            >
              {w}
            </button>
          ))}
        </div>

        {/* Character system demos */}
        <div className="demo-section">
          <div className="demo-label">
            New: Direct Explorer Control
            <span className="new-badge">NEW</span>
          </div>
          <div className="demo-buttons">
            <div className="demo-btn-wrapper">
              <button
                className={`demo-btn${weekId === "demo" ? " selected" : ""}`}
                onClick={() => setWeekId("demo")}
              >
                🎮 Collector
              </button>
              <div className="demo-best">{getBestScore('tidebound_best_collector')}</div>
            </div>
            <div className="demo-btn-wrapper">
              <button
                className={`demo-btn${weekId === "demo-navigator" ? " selected" : ""}`}
                onClick={() => setWeekId("demo-navigator")}
              >
                🌊 Safe Passage
              </button>
              <div className="demo-best">{getBestScore('tidebound_best_navigator')}</div>
            </div>
            <div className="demo-btn-wrapper">
              <button
                className={`demo-btn${weekId === "demo-currents" ? " selected" : ""}`}
                onClick={() => setWeekId("demo-currents")}
              >
                🌊 Currents
              </button>
              <div className="demo-best">{getBestScore('tidebound_best_currents')}</div>
            </div>
            <div className="demo-btn-wrapper">
              <button
                className={`demo-btn${weekId === "demo-push" ? " selected" : ""}`}
                onClick={() => setWeekId("demo-push")}
              >
                🌊 Build Momentum
              </button>
              <div className="demo-best">{getBestScore('tidebound_best_push')}</div>
            </div>
            <div className="demo-btn-wrapper">
              <button
                className={`demo-btn${weekId === "demo-rush" ? " selected" : ""}`}
                onClick={() => setWeekId("demo-rush")}
              >
                ⚡ Tide Rush
              </button>
              <div className="demo-best">{getBestScore('tidebound_best_rush')}</div>
            </div>
            <div className="demo-btn-wrapper">
              <button
                className={`demo-btn${weekId === "demo-relay" ? " selected" : ""}`}
                onClick={() => setWeekId("demo-relay")}
              >
                🔄 Tide Relay
              </button>
              <div className="demo-best">{getBestScore('tidebound_best_relay')}</div>
            </div>
          </div>
        </div>

        <button className="play-btn" onClick={() => setView("playing")}>
          PLAY
        </button>
      </section>
    </main>
  );
}
