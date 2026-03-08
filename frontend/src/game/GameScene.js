import Phaser from "phaser";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#08121d");

    const water = this.add.graphics();
    water.fillGradientStyle(0x0d2a3f, 0x12344f, 0x091a29, 0x050d16, 1);
    water.fillRect(0, 0, width, height);

    this.add
      .text(24, 24, "Phaser Scene", {
        color: "#f6f4ec",
        fontFamily: "Avenir Next, Trebuchet MS, sans-serif",
        fontSize: "26px",
        fontStyle: "600"
      })
      .setAlpha(0.92);

    this.add
      .text(24, 58, "Frontend and backend are separated for App Platform.", {
        color: "#b8f2e6",
        fontFamily: "Avenir Next, Trebuchet MS, sans-serif",
        fontSize: "14px"
      })
      .setAlpha(0.92);

    const island = this.add.ellipse(width * 0.5, height * 0.62, 210, 94, 0xf7a072, 0.9);
    const beacon = this.add.circle(width * 0.5, height * 0.46, 18, 0xffcf56, 1);
    const horizon = this.add.rectangle(width * 0.5, height * 0.82, width * 0.7, 8, 0xb8f2e6, 0.22);

    this.tweens.add({
      targets: [beacon, horizon],
      alpha: { from: 0.45, to: 1 },
      duration: 1800,
      ease: "Sine.easeInOut",
      repeat: -1,
      yoyo: true
    });

    this.input.on("pointerdown", (pointer) => {
      this.tweens.add({
        targets: beacon,
        x: Phaser.Math.Clamp(pointer.x, 30, width - 30),
        y: Phaser.Math.Clamp(pointer.y, 90, height - 70),
        duration: 450,
        ease: "Sine.easeOut"
      });
    });

    this.tweens.add({
      targets: island,
      scaleX: { from: 0.98, to: 1.02 },
      scaleY: { from: 0.98, to: 1.02 },
      duration: 3000,
      ease: "Sine.easeInOut",
      repeat: -1,
      yoyo: true
    });
  }
}
