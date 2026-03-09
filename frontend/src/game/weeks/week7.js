import Phaser from "phaser";
import { createTitle, createInstructionText, createScoreText } from "./weekUtils";

const SCENARIOS = [
  { text: "Pay your bills on time", effect: 40, good: true },
  { text: "Max out your credit card", effect: -50, good: false },
  { text: "Keep old accounts open", effect: 20, good: true },
  { text: "Apply for 5 cards at once", effect: -30, good: false },
  { text: "Pay more than the minimum", effect: 30, good: true },
];

const GAUGE_MIN = 300;
const GAUGE_MAX = 850;

export default {
  key: "week7",
  title: "Week 7: Credit Scores",

  create(scene, ctx) {
    const { width, height } = scene.scale;
    const { group } = ctx;

    createTitle(scene, group, this.title);
    createInstructionText(scene, group, "Make choices and watch your credit score change!");

    this._score = createScoreText(scene, group, width - 140, 20);
    this._ctx = ctx;
    this._creditScore = 600;
    this._scenarioIndex = 0;

    const cx = width / 2;
    const gaugeY = height / 2 - 30;

    // Gauge background (arc segments)
    const gfx = scene.add.graphics();
    group.add(gfx);
    this._gfx = gfx;

    // Red zone
    gfx.fillStyle(0xff5555, 0.4);
    gfx.slice(cx, gaugeY, 80, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(240), false);
    gfx.fillPath();

    // Yellow zone
    gfx.fillStyle(0xffcf56, 0.4);
    gfx.slice(cx, gaugeY, 80, Phaser.Math.DegToRad(240), Phaser.Math.DegToRad(300), false);
    gfx.fillPath();

    // Green zone
    gfx.fillStyle(0x56ff9e, 0.4);
    gfx.slice(cx, gaugeY, 80, Phaser.Math.DegToRad(300), Phaser.Math.DegToRad(360), false);
    gfx.fillPath();

    // Arrow
    this._arrow = scene.add.rectangle(cx, gaugeY, 4, 70, 0xf6f4ec)
      .setOrigin(0.5, 1);
    group.add(this._arrow);
    this._updateArrow();

    // Score number
    this._scoreDisplay = scene.add.text(cx, gaugeY + 20, String(this._creditScore), {
      color: "#f6f4ec", fontFamily: "sans-serif", fontSize: "24px", fontStyle: "bold",
    }).setOrigin(0.5);
    group.add(this._scoreDisplay);

    this._scenarioText = scene.add.text(cx, height - 90, "", {
      color: "#f6f4ec", fontFamily: "sans-serif", fontSize: "14px",
      wordWrap: { width: width - 80 },
    }).setOrigin(0.5);
    group.add(this._scenarioText);

    // Choose button
    this._chooseBtn = scene.add.text(cx, height - 50, "Apply This Choice", {
      color: "#0a1622", fontFamily: "sans-serif", fontSize: "14px", fontStyle: "bold",
      backgroundColor: "#b8f2e6", padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    group.add(this._chooseBtn);

    this._showScenario();

    this._chooseBtn.on("pointerdown", () => {
      const scenario = SCENARIOS[this._scenarioIndex];
      this._creditScore = Phaser.Math.Clamp(this._creditScore + scenario.effect, GAUGE_MIN, GAUGE_MAX);
      this._scoreDisplay.setText(String(this._creditScore));

      scene.tweens.add({
        targets: this._arrow,
        angle: this._getAngle(),
        duration: 600,
        ease: "Sine.easeOut",
      });

      if (scenario.good) {
        this._score.add(20);
        this._scoreDisplay.setStyle({ color: "#56ff9e" });
      } else {
        this._scoreDisplay.setStyle({ color: "#ff5656" });
      }

      scene.time.delayedCall(400, () => {
        this._scoreDisplay.setStyle({ color: "#f6f4ec" });
      });

      this._scenarioIndex++;
      if (this._scenarioIndex >= SCENARIOS.length) {
        this._chooseBtn.disableInteractive().setAlpha(0.4);
        this._scenarioText.setText("All scenarios complete!");

        const finalRating = this._creditScore >= 700 ? "Excellent" : this._creditScore >= 600 ? "Good" : "Needs Work";
        ctx.dialogue.show("Mentor", `Final credit score: ${this._creditScore} (${finalRating}). Good habits build great credit!`);
        ctx.onComplete({ score: this._score.value });
      } else {
        this._showScenario();
      }
    });

    ctx.dialogue.show("Mentor", "Your credit score shows lenders how trustworthy you are. Let's see how choices affect it!");
  },

  _showScenario() {
    const scenario = SCENARIOS[this._scenarioIndex];
    this._scenarioText.setText(`Scenario: "${scenario.text}"`);
  },

  _getAngle() {
    const pct = (this._creditScore - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN);
    return -90 + pct * 180;
  },

  _updateArrow() {
    this._arrow.setAngle(this._getAngle());
  },

  update() {},

  shutdown() {},
};
