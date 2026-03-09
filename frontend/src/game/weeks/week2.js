import { createTitle, createInstructionText, createScoreText, flashFeedback, formatCurrency } from "./weekUtils";

const CHOICES = [
  { a: { label: "New Skateboard", cost: 120 }, b: { label: "Concert Tickets", cost: 120 } },
  { a: { label: "Save for Trip", cost: 300 }, b: { label: "New Phone Case", cost: 300 } },
  { a: { label: "Video Game", cost: 60 }, b: { label: "Art Supplies", cost: 60 } },
];

export default {
  key: "week2",
  title: "Week 2: Opportunity Cost",

  create(scene, ctx) {
    const { width, height } = scene.scale;
    const { group } = ctx;

    createTitle(scene, group, this.title);
    createInstructionText(scene, group, "Click the item you want -- watch what you give up!");

    this._score = createScoreText(scene, group, width - 140, 20);
    this._round = 0;
    this._ctx = ctx;
    this._pendingTimer = null;
    this._cardA = null;
    this._cardB = null;
    this._vsText = null;

    this._showRound(scene, ctx);
    ctx.dialogue.show("Mentor", "Every choice has a cost: what you didn't pick. Choose wisely!");
  },

  _showRound(scene, ctx) {
    const { width, height } = scene.scale;
    const { group } = ctx;

    if (this._cardA) { group.remove(this._cardA, true, true); this._cardA = null; }
    if (this._cardB) { group.remove(this._cardB, true, true); this._cardB = null; }
    if (this._vsText) { group.remove(this._vsText, true, true); this._vsText = null; }

    if (this._round >= CHOICES.length) {
      ctx.dialogue.show("Mentor", `Done! Every choice means giving something up. That's opportunity cost.`);
      ctx.onComplete({ score: this._score.value });
      return;
    }

    const choice = CHOICES[this._round];
    const cardStyle = {
      color: "#f6f4ec", fontFamily: "sans-serif", fontSize: "16px",
      backgroundColor: "#1a2a3a", padding: { x: 16, y: 12 },
      align: "center",
    };

    const cy = height / 2;

    this._cardA = scene.add.text(width * 0.25, cy, `${choice.a.label}\n${formatCurrency(choice.a.cost)}`, cardStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    group.add(this._cardA);

    this._vsText = scene.add.text(width * 0.5, cy, "VS", {
      color: "#ffcf56", fontFamily: "sans-serif", fontSize: "20px", fontStyle: "bold",
    }).setOrigin(0.5);
    group.add(this._vsText);

    this._cardB = scene.add.text(width * 0.75, cy, `${choice.b.label}\n${formatCurrency(choice.b.cost)}`, cardStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    group.add(this._cardB);

    const handleChoice = (chosen, other, label) => {
      chosen.disableInteractive();
      other.disableInteractive();

      scene.tweens.add({
        targets: chosen,
        scaleX: 1.15, scaleY: 1.15,
        duration: 300,
        yoyo: true,
      });

      scene.tweens.add({
        targets: other,
        alpha: 0,
        duration: 600,
        onComplete: () => {
          flashFeedback(scene, group, other.x, other.y, `Lost: ${label}`, "#ff8c56");
        },
      });

      this._score.add(10);
      this._round++;
      this._pendingTimer = scene.time.delayedCall(1200, () => this._showRound(scene, ctx));
    };

    this._cardA.on("pointerdown", () => handleChoice(this._cardA, this._cardB, choice.b.label));
    this._cardB.on("pointerdown", () => handleChoice(this._cardB, this._cardA, choice.a.label));
  },

  update() {},

  shutdown(scene) {
    if (this._pendingTimer) this._pendingTimer.remove();
  },
};
