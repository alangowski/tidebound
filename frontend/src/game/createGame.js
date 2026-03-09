import Phaser from "phaser";
import { BootScene } from "./BootScene";
import { GameScene } from "./GameScene";

export function createGame({ parent, mentorChoice, onQuestComplete, weekId = 1 }) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#08121d",
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 640,
      height: 400
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },
    scene: [BootScene, GameScene],
    render: {
      antialias: true,
      pixelArt: false
    }
  });

  game.registry.set("mentorChoice", mentorChoice);
  game.registry.set("onQuestComplete", onQuestComplete);
  game.registry.set("weekId", weekId);

  return game;
}
