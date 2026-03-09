import { Suspense, lazy, useState } from "react";

const GameCanvas = lazy(() => import("./components/GameCanvas"));

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
          Choose your mentor, pick a week, and explore the tidepools.
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

        <button className="play-btn" onClick={() => setView("playing")}>
          PLAY
        </button>
      </section>
    </main>
  );
}
