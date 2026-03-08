import { useEffect, useRef } from "react";
import { createGame } from "../game/createGame";

export default function GameShell() {
  const gameRootRef = useRef(null);

  useEffect(() => {
    if (!gameRootRef.current) {
      return undefined;
    }

    const game = createGame(gameRootRef.current);

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <section className="game-shell" aria-label="Game preview">
      <p className="game-caption">
        Click inside the preview to retarget the beacon.
      </p>
      <div className="game-frame" ref={gameRootRef} />
    </section>
  );
}
