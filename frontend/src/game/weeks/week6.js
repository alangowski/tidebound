import { createTitle, createInstructionText, createScoreText, formatCurrency } from "./weekUtils";

const ITEM_PRICE = 100;
const INTEREST_RATE = 0.1;
const TICK_MS = 1500;

export default {
  key: "week6",
  title: "Week 6: Introduction to Credit",

  create(scene, ctx) {
    const { width, height } = scene.scale;
    const { group } = ctx;

    createTitle(scene, group, this.title);
    createInstructionText(scene, group, "Buy on credit, then pay it back before interest grows too much!");

    this._score = createScoreText(scene, group, width - 140, 20);
    this._ctx = ctx;
    this._debt = 0;
    this._ticking = false;
    this._tickEvent = null;

    const cx = width / 2;

    // Item to buy
    const item = scene.add.text(cx, 100, `New Gadget: ${formatCurrency(ITEM_PRICE)}`, {
      color: "#ffcf56", fontFamily: "sans-serif", fontSize: "16px", fontStyle: "bold",
    }).setOrigin(0.5);
    group.add(item);

    // Debt display
    this._debtText = scene.add.text(cx, height / 2 - 20, "Debt: $0", {
      color: "#f6f4ec", fontFamily: "sans-serif", fontSize: "28px", fontStyle: "bold",
    }).setOrigin(0.5);
    group.add(this._debtText);

    this._interestText = scene.add.text(cx, height / 2 + 20, "", {
      color: "#ff8c56", fontFamily: "sans-serif", fontSize: "13px",
    }).setOrigin(0.5);
    group.add(this._interestText);

    // Buy button
    this._buyBtn = scene.add.text(cx - 80, height - 80, "Buy on Credit", {
      color: "#0a1622", fontFamily: "sans-serif", fontSize: "14px", fontStyle: "bold",
      backgroundColor: "#ff8c56", padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    group.add(this._buyBtn);

    // Pay back button
    this._payBtn = scene.add.text(cx + 80, height - 80, "Pay Back", {
      color: "#0a1622", fontFamily: "sans-serif", fontSize: "14px", fontStyle: "bold",
      backgroundColor: "#56ff9e", padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0.4);
    group.add(this._payBtn);

    this._buyBtn.on("pointerdown", () => {
      if (this._ticking) return;
      this._debt = ITEM_PRICE;
      this._ticking = true;
      this._buyBtn.disableInteractive().setAlpha(0.4);
      this._payBtn.setAlpha(1);
      this._updateDebtDisplay();

      this._tickEvent = scene.time.addEvent({
        delay: TICK_MS,
        loop: true,
        callback: () => {
          this._debt = Math.round(this._debt * (1 + INTEREST_RATE));
          this._updateDebtDisplay();
          this._interestText.setText(`+${Math.round(INTEREST_RATE * 100)}% interest every tick!`);

          // Flash red
          scene.tweens.add({
            targets: this._debtText,
            scaleX: 1.1, scaleY: 1.1,
            duration: 150,
            yoyo: true,
          });
        },
      });

      ctx.dialogue.show("Mentor", "The clock is ticking! Interest is growing. Pay it back quickly!");
    });

    this._payBtn.on("pointerdown", () => {
      if (!this._ticking) return;
      this._ticking = false;
      if (this._tickEvent) this._tickEvent.remove();

      const finalDebt = this._debt;
      const interestPaid = finalDebt - ITEM_PRICE;
      const score = Math.max(0, 100 - interestPaid);

      this._score.add(score);
      this._debtText.setText("PAID!");
      this._debtText.setStyle({ color: "#56ff9e" });
      this._interestText.setText(`You paid ${formatCurrency(interestPaid)} in interest`);
      this._payBtn.disableInteractive().setAlpha(0.4);

      if (interestPaid <= 20) {
        ctx.dialogue.show("Mentor", "Quick payback! You saved money by paying off credit fast.");
      } else {
        ctx.dialogue.show("Mentor", `You paid ${formatCurrency(interestPaid)} in interest. The longer you wait, the more it costs!`);
      }

      ctx.onComplete({ score: this._score.value });
    });

    ctx.dialogue.show("Mentor", "Credit lets you buy now and pay later, but interest makes things cost more!");
  },

  _updateDebtDisplay() {
    this._debtText.setText(`Debt: ${formatCurrency(this._debt)}`);
    const ratio = Math.min(this._debt / (ITEM_PRICE * 2), 1);
    const r = Math.round(86 + ratio * 169);
    const g = Math.round(207 - ratio * 150);
    const b = Math.round(255 - ratio * 169);
    this._debtText.setStyle({ color: `rgb(${r},${g},${b})` });
  },

  update() {},

  shutdown(scene) {
    if (this._tickEvent) this._tickEvent.remove();
  },
};
