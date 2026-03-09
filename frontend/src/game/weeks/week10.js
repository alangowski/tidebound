import Phaser from "phaser";
import { createTitle, createInstructionText, createScoreText, formatCurrency, flashFeedback } from "./weekUtils";

const ASSETS = [
  { label: "Tech Stock", baseValue: 200, volatility: 0.3, color: 0x56cfff },
  { label: "Bond", baseValue: 100, volatility: 0.05, color: 0x56ff9e },
  { label: "Real Estate", baseValue: 500, volatility: 0.1, color: 0xffcf56 },
  { label: "Crypto Coin", baseValue: 150, volatility: 0.5, color: 0xff8c56 },
];

const PORTFOLIO_SLOTS = 3;

export default {
  key: "week10",
  title: "Week 10: Investing",

  create(scene, ctx) {
    const { width, height } = scene.scale;
    const { group } = ctx;

    createTitle(scene, group, this.title);
    createInstructionText(scene, group, "Drag assets into your portfolio. Prices change over time!");

    this._score = createScoreText(scene, group, width - 140, 20);
    this._ctx = ctx;
    this._portfolio = [];
    this._assetCards = [];
    this._tickEvent = null;

    const slotY = height - 70;

    // Portfolio slots
    for (let i = 0; i < PORTFOLIO_SLOTS; i++) {
      const sx = width * 0.25 + i * (width * 0.25);
      const slot = scene.add.rectangle(sx, slotY, 90, 50, 0x1a2a3a, 0.5)
        .setStrokeStyle(2, 0xb8f2e6, 0.3);
      group.add(slot);
      const label = scene.add.text(sx, slotY + 32, `Slot ${i + 1}`, {
        color: "#b8f2e6", fontFamily: "sans-serif", fontSize: "10px",
      }).setOrigin(0.5);
      group.add(label);
    }

    this._slotBounds = [];
    for (let i = 0; i < PORTFOLIO_SLOTS; i++) {
      const sx = width * 0.25 + i * (width * 0.25);
      this._slotBounds.push(new Phaser.Geom.Rectangle(sx - 45, slotY - 25, 90, 50));
    }

    // Asset cards
    ASSETS.forEach((asset, i) => {
      const x = 50 + i * (width / ASSETS.length);
      const y = 100;

      const card = scene.add.text(x, y, `${asset.label}\n${formatCurrency(asset.baseValue)}`, {
        color: "#f6f4ec", fontFamily: "sans-serif", fontSize: "12px",
        backgroundColor: `#${asset.color.toString(16).padStart(6, "0")}33`,
        padding: { x: 8, y: 6 }, align: "center",
      }).setInteractive({ draggable: true });

      card.setData("asset", { ...asset, currentValue: asset.baseValue });
      card.setData("origX", x);
      card.setData("origY", y);
      group.add(card);
      this._assetCards.push(card);
    });

    this._onDrag = (pointer, obj, dragX, dragY) => {
      if (this._assetCards.includes(obj)) {
        obj.x = dragX;
        obj.y = dragY;
      }
    };

    this._onDragEnd = (pointer, obj) => {
      if (!this._assetCards.includes(obj) || obj.getData("placed")) return;

      const objBounds = obj.getBounds();
      for (let i = 0; i < PORTFOLIO_SLOTS; i++) {
        if (this._portfolio[i]) continue;
        if (Phaser.Geom.Intersects.RectangleToRectangle(objBounds, this._slotBounds[i])) {
          const sx = this._slotBounds[i].x + 45;
          const sy = this._slotBounds[i].y + 25;
          obj.x = sx;
          obj.y = sy;
          obj.setData("placed", true);
          obj.disableInteractive();
          this._portfolio[i] = obj.getData("asset");
          this._score.add(15);
          flashFeedback(scene, group, sx, sy - 30, "Added!");

          if (this._portfolio.filter(Boolean).length >= PORTFOLIO_SLOTS) {
            this._finishInvesting(scene, ctx);
          }
          return;
        }
      }
    };

    scene.input.on("drag", this._onDrag);
    scene.input.on("dragend", this._onDragEnd);

    // Price tick - values change over time
    this._tickEvent = scene.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        this._assetCards.forEach(card => {
          if (card.getData("placed")) return;
          const asset = card.getData("asset");
          const change = (Math.random() - 0.5) * 2 * asset.volatility * asset.baseValue;
          asset.currentValue = Math.max(10, Math.round(asset.currentValue + change));
          card.setText(`${asset.label}\n${formatCurrency(asset.currentValue)}`);
        });
      },
    });

    ctx.dialogue.show("Mentor", "Different investments have different risk levels. Build your portfolio!");
  },

  _finishInvesting(scene, ctx) {
    if (this._tickEvent) this._tickEvent.remove();

    const total = this._portfolio.reduce((s, a) => s + a.currentValue, 0);
    this._score.add(Math.round(total / 10));

    ctx.dialogue.show("Mentor", `Portfolio value: ${formatCurrency(total)}. Diversification helps manage risk!`);
    ctx.onComplete({ score: this._score.value });
  },

  update() {},

  shutdown(scene) {
    if (this._tickEvent) this._tickEvent.remove();
    if (this._onDrag) scene.input.off("drag", this._onDrag);
    if (this._onDragEnd) scene.input.off("dragend", this._onDragEnd);
  },
};
