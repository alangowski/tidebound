import { useEffect, useRef } from "react";
import { createGame } from "../game/createGame";

export default function GameCanvas({ mentorChoice, onQuestComplete, weekId = 1 }) {
  const gameRootRef = useRef(null);

  useEffect(() => {
    if (!gameRootRef.current) {
      return undefined;
    }

    const game = createGame({
      parent: gameRootRef.current,
      mentorChoice,
      onQuestComplete,
      weekId,
    });

    return () => {
      game.destroy(true);
    };
  }, []);

  const isCollectorDemo = weekId === "demo";
  const isNavigatorDemo = weekId === "demo-navigator";
  const isCurrentsDemo = weekId === "demo-currents";
  const isPushDemo = weekId === "demo-push";
  const isRushDemo = weekId === "demo-rush";

  let caption = "Click inside to interact • Some weeks support direct explorer controls";
  if (isCollectorDemo) {
    caption = "Arrow keys / WASD or click to move • Collect needs, avoid impulse buys";
  } else if (isNavigatorDemo) {
    caption = "Guide the explorer to the glowing cove • Avoid the moving undertows";
  } else if (isCurrentsDemo) {
    caption = "Work with the currents — catch drifting shells before they escape";
  } else if (isPushDemo) {
    caption = "Use your body to push habit orbs into the goal zone";
  } else if (isRushDemo) {
    caption = "Dash aggressively (Space) to deliver orbs under pressure!";
  } else if (weekId === "demo-relay") {
    caption = "Carry orbs + use Surge (Q) to clear blockers • Throw into the goal!";
  }

  return (
    <section className="game-shell" aria-label="Game preview">
      <p className="game-caption">{caption}</p>
      <div className="game-frame" ref={gameRootRef} />
    </section>
  );
}
