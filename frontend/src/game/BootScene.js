import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // Shared asset loading goes here.
    //
    // FUTURE (character sprite support):
    // When we add real sprite sheets for the explorer / mentor companion,
    // load them here so they are available to PlayerCharacter.
    //
    // Example:
    //   this.load.spritesheet('explorer', 'assets/characters/explorer.png', {
    //     frameWidth: 48, frameHeight: 48
    //   });
    //
    // PlayerCharacter already accepts `useSprites: true` and spriteKey
    // as a forward-compatible hook.
  }

  create() {
    this.scene.start("GameScene");
  }
}
