import Phaser from "phaser";
import { createTitle, createInstructionText, createScoreText, formatCurrency } from "./weekUtils";

const BUDGET = 1000;
const OPTIONS = [
  { label: "Savings Account", risk: 0.05, color: 0x56ff9e },
  { label: "Index Fund", risk: 0.2, color: 0x56cfff },
  { label: "Individual Stock", risk: 0.5, color: 0xffcf56 },
  { label: "Crypto", risk: 0.8, color: 0xff8c56 },
];

export default {
  key: "week11",
  title: "Week 11: Risk Tolerance",

  create(scene, ctx) {
    const { width, height } = scene.scale;
    const { group } = ctx;

    createTitle(scene, group, this.title);
    createInstructionText(scene, group, `You have ${formatCurrency(BUDGET)}. Allocate, then roll the dice!`);

    this._score = createScoreText(scene, group, width - 140, 20);
    this._ctx = ctx;
    this._allocations = [0, 0, 0, 0];
    this._remaining = BUDGET;

    // Allocation buttons
    this._labels = [];
    this._amountTexts = [];

    OPTIONS.forEach((opt, i) => {
      const y = 90 + i * 55;

      const label = scene.add.text(20, y, opt.label, {
        color: `#${opt.color.toString(16).padStart(6, "0")}`,
        fontFamily: "sans-serif", fontSize: "13px", fontStyle: "bold",
      });
      group.add(label);
      this._labels.push(label);

      const addBtn = scene.add.text(180, y, "+$100", {
        color: "#0a1622", fontFamily: "sans-serif", fontSize: "12px", fontStyle: "bold",
        backgroundColor: "#b8f2e6", padding: { x: 8, y: 4 },
      }).setInteractive({ useHandCursor: true });
      group.add(addBtn);

      const amtText = scene.add.text(260, y, "$0", {
        color: "#f6f4ec", fontFamily: "sans-serif", fontSize: "14px",
      });
      group.add(amtText);
      this._amountTexts.push(amtText);

      addBtn.on("pointerdown", () => {
        if (this._remaining < 100) return;
        this._allocations[i] += 100;
        this._remaining -= 100;
        amtText.setText(formatCurrency(this._allocations[i]));
        this._remainText.setText(`Remaining: ${formatCurrency(this._remaining)}`);
      });
    });

    this._remainText = scene.add.text(width / 2, height / 2 + 40, `Remaining: ${formatCurrency(BUDGET)}`, {
      color: "#f6f4ec", fontFamily: "sans-serif", fontSize: "14px",
    }).setOrigin(0.5);
    group.add(this._remainText);

    // Roll button
    this._rollBtn = scene.add.text(width / 2, height - 60, "Roll the Dice!", {
      color: "#0a1622", fontFamily: "sans-serif", fontSize: "16px", fontStyle: "bold",
      backgroundColor: "#ffcf56", padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    group.add(this._rollBtn);

    this._resultText = scene.add.text(width / 2, height - 110, "", {
      color: "#f6f4ec", fontFamily: "sans-serif", fontSize: "13px",
      wordWrap: { width: width - 60 }, align: "center",
    }).setOrigin(0.5);
    group.add(this._resultText);

    this._rollBtn.on("pointerdown", () => {
      if (this._remaining > 0) {
        ctx.dialogue.show("Mentor", "Allocate all your money first!");
        return;
      }

      this._rollBtn.disableInteractive().setAlpha(0.4);
      let totalReturn = 0;
      const results = [];

      OPTIONS.forEach((opt, i) => {
        const allocated = this._allocations[i];
        if (allocated === 0) return;

        const roll = Phaser.Math.Between(1, 6);
        const multiplier = roll >= 4 ? 1 + opt.risk : 1 - opt.risk;
        const result = Math.round(allocated * multiplier);
        totalReturn += result;
        results.push(`${opt.label}: ${formatCurrency(allocated)} -> ${formatCurrency(result)} (rolled ${roll})`);
      });

      this._resultText.setText(results.join("\n"));
      this._score.add(Math.round(totalReturn / 10));

      const profit = totalReturn - BUDGET;
      if (profit > 0) {
        ctx.dialogue.show("Mentor", `You made ${formatCurrency(profit)} profit! Higher risk can mean higher reward.`);
      } else {
        ctx.dialogue.show("Mentor", `You lost ${formatCurrency(Math.abs(profit))}. Risk means you can lose money too.`);
      }

      ctx.onComplete({ score: this._score.value });
    });

    ctx.dialogue.show("Mentor", "Risk and reward go together. How will you allocate your money?");
  },

  update() {},

  shutdown() {},
};
