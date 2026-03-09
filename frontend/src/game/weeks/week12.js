import Phaser from "phaser";
import { createTitle, createInstructionText, createScoreText, formatCurrency } from "./weekUtils";

const SPEED = 1.5;
const AMPLITUDE = 60;
const NOISE_FACTOR = 0.4;

export default {
  key: "week12",
  title: "Week 12: Crypto - Market Navigator",

  create(scene, ctx) {
    const { width, height } = scene.scale;
    const { group } = ctx;

    createTitle(scene, group, this.title);
    createInstructionText(scene, group, "Press SPACEBAR to cash out before the hacker catches your coin!");

    this._score = createScoreText(scene, group, width - 140, 20);
    this._ctx = ctx;
    this._cashedOut = false;
    this._elapsed = 0;
    this._coinValue = 100;
    this._baseY = height / 2;

    // Price line graphics
    this._lineGfx = scene.add.graphics();
    group.add(this._lineGfx);
    this._priceHistory = [];

    // Coin
    this._coin = scene.add.circle(60, this._baseY, 14, 0xffcf56);
    group.add(this._coin);
    this._coinLabel = scene.add.text(60, this._baseY, "$", {
      color: "#0a1622", fontFamily: "sans-serif", fontSize: "12px", fontStyle: "bold",
    }).setOrigin(0.5);
    group.add(this._coinLabel);

    // Hacker
    this._hacker = scene.add.circle(width + 30, height / 2, 14, 0xff5555);
    group.add(this._hacker);
    const hackerLabel = scene.add.text(width + 30, height / 2, "H", {
      color: "#f6f4ec", fontFamily: "sans-serif", fontSize: "12px", fontStyle: "bold",
    }).setOrigin(0.5);
    group.add(hackerLabel);
    this._hackerLabel = hackerLabel;

    // Hacker approaches from right
    scene.tweens.add({
      targets: [this._hacker, hackerLabel],
      x: 100,
      duration: 12000,
      ease: "Linear",
    });

    // Value display
    this._valueText = scene.add.text(width / 2, 80, formatCurrency(this._coinValue), {
      color: "#ffcf56", fontFamily: "sans-serif", fontSize: "24px", fontStyle: "bold",
    }).setOrigin(0.5);
    group.add(this._valueText);

    // Spacebar listener
    this._spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._spaceKey.on("down", () => {
      if (this._cashedOut) return;
      this._cashOut(scene, ctx);
    });

    // Also allow click to cash out
    this._cashOutBtn = scene.add.text(width / 2, height - 40, "CASH OUT (or press Space)", {
      color: "#0a1622", fontFamily: "sans-serif", fontSize: "13px", fontStyle: "bold",
      backgroundColor: "#56ff9e", padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    group.add(this._cashOutBtn);

    this._cashOutBtn.on("pointerdown", () => {
      if (this._cashedOut) return;
      this._cashOut(scene, ctx);
    });

    ctx.dialogue.show("Mentor", "Crypto is volatile! The price swings wildly. Cash out at the right time!");
  },

  _cashOut(scene, ctx) {
    this._cashedOut = true;
    this._cashOutBtn.disableInteractive().setAlpha(0.4);
    this._score.add(Math.round(this._coinValue / 2));

    scene.tweens.killTweensOf(this._hacker);
    scene.tweens.killTweensOf(this._hackerLabel);

    this._coin.setFillStyle(0x56ff9e);
    this._valueText.setStyle({ color: "#56ff9e" });

    if (this._coinValue >= 200) {
      ctx.dialogue.show("Mentor", `Cashed out at ${formatCurrency(this._coinValue)}! Great timing. But crypto is always risky.`);
    } else if (this._coinValue >= 100) {
      ctx.dialogue.show("Mentor", `Cashed out at ${formatCurrency(this._coinValue)}. Safe play! Remember, crypto can crash anytime.`);
    } else {
      ctx.dialogue.show("Mentor", `Cashed out at ${formatCurrency(this._coinValue)}. The market dipped. Crypto is unpredictable!`);
    }

    ctx.onComplete({ score: this._score.value });
  },

  update(scene, time, delta) {
    if (this._cashedOut) return;

    this._elapsed += delta / 1000;

    // Sine wave + noise for price movement
    const sineY = Math.sin(this._elapsed * SPEED) * AMPLITUDE;
    const noise = (Math.random() - 0.5) * AMPLITUDE * NOISE_FACTOR;
    const y = this._baseY + sineY + noise;

    this._coin.y = y;
    this._coinLabel.y = y;

    // Value changes with position (higher = more valuable)
    this._coinValue = Math.max(10, Math.round(100 + (this._baseY - y) * 2));
    this._valueText.setText(formatCurrency(this._coinValue));

    // Color based on value
    if (this._coinValue >= 150) {
      this._valueText.setStyle({ color: "#56ff9e" });
    } else if (this._coinValue < 80) {
      this._valueText.setStyle({ color: "#ff5656" });
    } else {
      this._valueText.setStyle({ color: "#ffcf56" });
    }

    // Track price history for line
    this._priceHistory.push(y);
    if (this._priceHistory.length > 100) this._priceHistory.shift();

    // Draw price line as scrolling chart
    const { width: sceneW } = scene.scale;
    const chartLeft = 30;
    const chartWidth = sceneW - 60;
    const step = chartWidth / 100;

    this._lineGfx.clear();
    this._lineGfx.lineStyle(2, 0xffcf56, 0.5);
    this._lineGfx.beginPath();
    for (let i = 0; i < this._priceHistory.length; i++) {
      const px = chartLeft + i * step;
      const py = this._priceHistory[i];
      if (i === 0) this._lineGfx.moveTo(px, py);
      else this._lineGfx.lineTo(px, py);
    }
    this._lineGfx.strokePath();

    // Check hacker collision
    const dist = Phaser.Math.Distance.Between(this._coin.x, this._coin.y, this._hacker.x, this._hacker.y);
    if (dist < 28) {
      this._cashedOut = true;
      this._coinValue = 0;
      this._valueText.setText("HACKED!");
      this._valueText.setStyle({ color: "#ff5656" });
      this._coin.setFillStyle(0xff5555);
      this._cashOutBtn.disableInteractive().setAlpha(0.4);
      this._ctx.dialogue.show("Mentor", "The hacker got your coins! In crypto, security risks are real.");
      this._ctx.onComplete({ score: 0 });
    }
  },

  shutdown(scene) {
    if (this._spaceKey) {
      this._spaceKey.off("down");
      scene.input.keyboard.removeKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }
  },
};
