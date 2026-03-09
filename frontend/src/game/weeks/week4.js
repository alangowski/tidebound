import Phaser from "phaser";
import { createTitle, createInstructionText, formatCurrency } from "./weekUtils";

const CATEGORIES = [
  { label: "Needs", color: "#56cfff", pct: 50 },
  { label: "Wants", color: "#ff8c56", pct: 30 },
  { label: "Savings", color: "#56ff9e", pct: 20 },
];

const INCOME = 1000;

export default {
  key: "week4",
  title: "Week 4: Budgeting",

  create(scene, ctx) {
    const { width, height } = scene.scale;
    const { group } = ctx;

    createTitle(scene, group, this.title);
    createInstructionText(scene, group, `Monthly income: ${formatCurrency(INCOME)}. Drag sliders to budget.`);

    this._sliders = [];
    this._ctx = ctx;
    const sliderY = 110;
    const sliderW = width - 120;
    const sliderLeft = 60;

    CATEGORIES.forEach((cat, i) => {
      const y = sliderY + i * 80;

      const label = scene.add.text(sliderLeft, y - 18, `${cat.label}: ${cat.pct}% (${formatCurrency(INCOME * cat.pct / 100)})`, {
        color: cat.color, fontFamily: "sans-serif", fontSize: "14px", fontStyle: "bold",
      });
      group.add(label);

      // Track
      const track = scene.add.rectangle(sliderLeft + sliderW / 2, y + 10, sliderW, 8, 0x1a2a3a)
        .setStrokeStyle(1, 0x334455);
      group.add(track);

      // Handle
      const handleX = sliderLeft + (cat.pct / 100) * sliderW;
      const handle = scene.add.circle(handleX, y + 10, 14, parseInt(cat.color.replace("#", "0x")), 0.9)
        .setInteractive({ draggable: true, useHandCursor: true });
      group.add(handle);

      this._sliders.push({ cat, label, handle, track, pct: cat.pct });
    });

    // Submit button
    this._submitBtn = scene.add.text(width / 2, height - 60, "Submit Budget", {
      color: "#0a1622", fontFamily: "sans-serif", fontSize: "16px", fontStyle: "bold",
      backgroundColor: "#56ff9e", padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    group.add(this._submitBtn);

    this._totalText = scene.add.text(width / 2, height - 100, "Total: 100%", {
      color: "#f6f4ec", fontFamily: "sans-serif", fontSize: "14px",
    }).setOrigin(0.5);
    group.add(this._totalText);

    this._onDrag = (pointer, obj, dragX) => {
      const slider = this._sliders.find(s => s.handle === obj);
      if (!slider) return;

      const clampedX = Phaser.Math.Clamp(dragX, sliderLeft, sliderLeft + sliderW);
      obj.x = clampedX;

      const pct = Math.round(((clampedX - sliderLeft) / sliderW) * 100);
      slider.pct = pct;
      slider.label.setText(`${slider.cat.label}: ${pct}% (${formatCurrency(INCOME * pct / 100)})`);

      const total = this._sliders.reduce((sum, s) => sum + s.pct, 0);
      this._totalText.setText(`Total: ${total}%`);
      this._totalText.setStyle({ color: total === 100 ? "#56ff9e" : "#ff5656" });
    };
    scene.input.on("drag", this._onDrag);

    this._submitBtn.on("pointerdown", () => {
      const total = this._sliders.reduce((sum, s) => sum + s.pct, 0);
      if (total !== 100) {
        ctx.dialogue.show("Mentor", "Your budget must add up to 100%! Adjust the sliders.");
        return;
      }

      const needs = this._sliders[0].pct;
      const wants = this._sliders[1].pct;
      const savings = this._sliders[2].pct;

      let score = 0;
      if (needs >= 40 && needs <= 60) score += 30;
      if (wants >= 20 && wants <= 35) score += 30;
      if (savings >= 15 && savings <= 30) score += 40;

      if (score >= 80) {
        ctx.dialogue.show("Mentor", "Excellent budget! The 50/30/20 rule is a great guideline.");
      } else {
        ctx.dialogue.show("Mentor", `Not bad! Try to aim for roughly 50% needs, 30% wants, 20% savings.`);
      }

      ctx.onComplete({ score });
    });

    ctx.dialogue.show("Mentor", "A good budget follows the 50/30/20 rule. Try to allocate wisely!");
  },

  update() {},

  shutdown(scene) {
    if (this._onDrag) scene.input.off("drag", this._onDrag);
  },
};
