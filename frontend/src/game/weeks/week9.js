import Phaser from "phaser";
import { createTitle, createInstructionText, createScoreText, formatCurrency } from "./weekUtils";

const INITIAL_INVESTMENT = 100;
const GROWTH_RATE = 1.15;
const MAX_ROUNDS = 8;

export default {
  key: "week9",
  title: "Week 9: Time Value of Money",

  create(scene, ctx) {
    const { width, height } = scene.scale;
    const { group } = ctx;

    createTitle(scene, group, this.title);
    createInstructionText(scene, group, 'Click "Invest" to grow your money over time!');

    this._score = createScoreText(scene, group, width - 140, 20);
    this._ctx = ctx;
    this._round = 0;
    this._amount = INITIAL_INVESTMENT;

    const cx = width / 2;

    // Tree trunk
    this._trunk = scene.add.rectangle(cx, height - 60, 12, 40, 0x8B6914);
    group.add(this._trunk);

    // Tree canopy (grows)
    this._canopy = scene.add.circle(cx, height - 90, 20, 0x2d8a4e, 0.8);
    group.add(this._canopy);

    // Amount display
    this._amountText = scene.add.text(cx, 80, formatCurrency(this._amount), {
      color: "#56ff9e", fontFamily: "sans-serif", fontSize: "28px", fontStyle: "bold",
    }).setOrigin(0.5);
    group.add(this._amountText);

    this._yearText = scene.add.text(cx, 110, "Year 0", {
      color: "#b8f2e6", fontFamily: "sans-serif", fontSize: "14px",
    }).setOrigin(0.5);
    group.add(this._yearText);

    // Invest button
    this._investBtn = scene.add.text(cx, height - 20, "Invest (Next Year)", {
      color: "#0a1622", fontFamily: "sans-serif", fontSize: "14px", fontStyle: "bold",
      backgroundColor: "#56ff9e", padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    group.add(this._investBtn);

    this._investBtn.on("pointerdown", () => {
      if (this._round >= MAX_ROUNDS) return;

      this._round++;
      this._amount = Math.round(this._amount * GROWTH_RATE);
      this._amountText.setText(formatCurrency(this._amount));
      this._yearText.setText(`Year ${this._round}`);

      // Grow the tree
      const newScale = 1 + this._round * 0.3;
      scene.tweens.add({
        targets: this._canopy,
        scaleX: newScale,
        scaleY: newScale,
        y: height - 90 - this._round * 8,
        duration: 500,
        ease: "Back.easeOut",
      });

      scene.tweens.add({
        targets: this._trunk,
        scaleY: 1 + this._round * 0.2,
        duration: 500,
      });

      // Gold coin particle
      const coin = scene.add.circle(
        cx + Phaser.Math.Between(-30, 30),
        this._canopy.y - 10,
        6, 0xffcf56
      );
      group.add(coin);
      scene.tweens.add({
        targets: coin,
        y: coin.y - 40,
        alpha: 0,
        duration: 800,
        onComplete: () => coin.destroy(),
      });

      this._score.add(10);

      if (this._round >= MAX_ROUNDS) {
        this._investBtn.disableInteractive().setAlpha(0.4);
        ctx.dialogue.show("Mentor", `Your ${formatCurrency(INITIAL_INVESTMENT)} grew to ${formatCurrency(this._amount)}! That's compound growth!`);
        ctx.onComplete({ score: this._score.value });
      }
    });

    ctx.dialogue.show("Mentor", "Money grows over time through compound interest. Watch your tree grow!");
  },

  update() {},

  shutdown() {},
};
