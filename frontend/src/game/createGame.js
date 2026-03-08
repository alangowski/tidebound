import Phaser from "phaser";
import { BootScene } from "./BootScene";
import { GameScene } from "./GameScene";

export function createGame(parent) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#08121d",
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 640,
      height: 400
    },
    scene: [BootScene, GameScene],
    render: {
      antialias: true,
      pixelArt: false
    }
  });
}
