import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // Shared asset loading goes here
  }

  create() {
    this.scene.start("GameScene");
  }
}
