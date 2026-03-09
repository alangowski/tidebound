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

  return (
    <section className="game-shell" aria-label="Game preview">
      <p className="game-caption">Click inside the preview to interact.</p>
      <div className="game-frame" ref={gameRootRef} />
    </section>
  );
}
