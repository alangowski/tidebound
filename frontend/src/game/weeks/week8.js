import Phaser from "phaser";
import { createTitle, createInstructionText, createScoreText, formatCurrency } from "./weekUtils";

const TRACK_LENGTH = 500;
const WORK_CLICKS_NEEDED = 3;
const CREDIT_DEBT = 150;

export default {
  key: "week8",
  title: "Week 8: Saving vs Credit",

  create(scene, ctx) {
    const { width, height } = scene.scale;
    const { group } = ctx;

    createTitle(scene, group, this.title);
    createInstructionText(scene, group, 'Click "Work" to advance your saver. Watch the credit buyer race ahead!');

    this._score = createScoreText(scene, group, width - 140, 20);
    this._ctx = ctx;
    this._workClicks = 0;
    this._saverPos = 0;
    this._creditPos = 0;
    this._finished = false;
    this._timers = [];

    const trackY1 = height / 2 - 30;
    const trackY2 = height / 2 + 30;
    const trackLeft = 70;
    const trackRight = trackLeft + TRACK_LENGTH;

    // Track backgrounds
    const track1 = scene.add.rectangle((trackLeft + trackRight) / 2, trackY1, TRACK_LENGTH, 16, 0x1a2a3a)
      .setStrokeStyle(1, 0x56ff9e, 0.3);
    group.add(track1);
    const track2 = scene.add.rectangle((trackLeft + trackRight) / 2, trackY2, TRACK_LENGTH, 16, 0x1a2a3a)
      .setStrokeStyle(1, 0xff8c56, 0.3);
    group.add(track2);

    // Labels
    const saverLabel = scene.add.text(trackLeft - 60, trackY1, "Saver", {
      color: "#56ff9e", fontFamily: "sans-serif", fontSize: "12px", fontStyle: "bold",
    }).setOrigin(0, 0.5);
    group.add(saverLabel);
    const creditLabel = scene.add.text(trackLeft - 60, trackY2, "Credit", {
      color: "#ff8c56", fontFamily: "sans-serif", fontSize: "12px", fontStyle: "bold",
    }).setOrigin(0, 0.5);
    group.add(creditLabel);

    // Avatars
    this._saver = scene.add.circle(trackLeft, trackY1, 10, 0x56ff9e);
    group.add(this._saver);
    this._credit = scene.add.circle(trackLeft, trackY2, 10, 0xff8c56);
    group.add(this._credit);

    // Debt weight display
    this._debtLabel = scene.add.text(trackLeft, trackY2 + 22, "", {
      color: "#ff5656", fontFamily: "sans-serif", fontSize: "11px",
    });
    group.add(this._debtLabel);

    // Work button
    this._workBtn = scene.add.text(width / 2, height - 60, "Work", {
      color: "#0a1622", fontFamily: "sans-serif", fontSize: "16px", fontStyle: "bold",
      backgroundColor: "#56ff9e", padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    group.add(this._workBtn);

    // Credit buyer races immediately
    this._timers.push(scene.time.delayedCall(500, () => {
      this._creditPos = TRACK_LENGTH;
      scene.tweens.add({
        targets: this._credit,
        x: trackRight,
        duration: 400,
        ease: "Sine.easeOut",
      });
      this._debtLabel.setText(`Debt: ${formatCurrency(CREDIT_DEBT)}`);
      this._debtLabel.x = trackRight - 40;
      ctx.dialogue.show("Mentor", "The credit buyer got the item instantly, but now has debt! Keep working to save up.");
    }));

    this._workBtn.on("pointerdown", () => {
      if (this._finished) return;

      this._workClicks++;
      const progress = Math.min(this._workClicks / WORK_CLICKS_NEEDED, 1);
      const newX = trackLeft + progress * TRACK_LENGTH;

      scene.tweens.add({
        targets: this._saver,
        x: newX,
        duration: 300,
        ease: "Sine.easeOut",
      });

      if (this._workClicks >= WORK_CLICKS_NEEDED) {
        this._finished = true;
        this._workBtn.disableInteractive().setAlpha(0.4);
        this._score.add(80);

        this._timers.push(scene.time.delayedCall(500, () => {
          // Credit avatar gets "heavier"
          scene.tweens.add({
            targets: this._credit,
            scaleX: 1.5, scaleY: 1.5,
            alpha: 0.6,
            duration: 600,
          });

          ctx.dialogue.show("Mentor", `You saved and bought it debt-free! The credit buyer still owes ${formatCurrency(CREDIT_DEBT)}.`);
          ctx.onComplete({ score: this._score.value });
        }));
      }
    });

    ctx.dialogue.show("Mentor", "Let's race! Saving takes time, but credit comes with debt.");
  },

  update() {},

  shutdown() {
    if (this._timers) {
      this._timers.forEach(t => t.remove());
      this._timers = [];
    }
  },
};
