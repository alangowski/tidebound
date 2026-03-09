import Phaser from "phaser";
import { createTitle, createInstructionText, createScoreText, flashFeedback } from "./weekUtils";

const ITEMS = [
  { label: "Lemonade Stand", zone: "short", value: "$50/day" },
  { label: "College Degree", zone: "long", value: "$60k/year" },
  { label: "Babysitting", zone: "short", value: "$15/hour" },
  { label: "Start a Business", zone: "long", value: "$100k+/year" },
  { label: "Mow Lawns", zone: "short", value: "$25/yard" },
  { label: "Learn to Code", zone: "long", value: "$80k/year" },
];

const ZONE_COLORS = { short: 0x56cfff, long: 0xff8c56 };

export default {
  key: "week1",
  title: "Week 1: Time-to-Money",

  create(scene, ctx) {
    const { width, height } = scene.scale;
    const { group } = ctx;

    createTitle(scene, group, this.title);
    createInstructionText(scene, group, "Drag each item to the correct timeline zone");

    this._score = createScoreText(scene, group, width - 140, 20);
    this._placed = 0;
    this._ctx = ctx;

    const zoneY = height - 140;
    const zoneW = width / 2 - 30;

    this._shortZone = scene.add.rectangle(width * 0.25, zoneY, zoneW, 80, ZONE_COLORS.short, 0.18)
      .setStrokeStyle(2, ZONE_COLORS.short, 0.5);
    group.add(this._shortZone);

    const shortLabel = scene.add.text(width * 0.25, zoneY + 48, "SHORT TERM", {
      color: "#56cfff", fontFamily: "sans-serif", fontSize: "12px", fontStyle: "bold",
    }).setOrigin(0.5);
    group.add(shortLabel);

    this._longZone = scene.add.rectangle(width * 0.75, zoneY, zoneW, 80, ZONE_COLORS.long, 0.18)
      .setStrokeStyle(2, ZONE_COLORS.long, 0.5);
    group.add(this._longZone);

    const longLabel = scene.add.text(width * 0.75, zoneY + 48, "LONG TERM", {
      color: "#ff8c56", fontFamily: "sans-serif", fontSize: "12px", fontStyle: "bold",
    }).setOrigin(0.5);
    group.add(longLabel);

    this._items = [];
    const startY = 90;
    const spacing = 38;

    ITEMS.forEach((item, i) => {
      const x = 60 + (i % 3) * (width / 3 - 20);
      const y = startY + Math.floor(i / 3) * spacing;

      const card = scene.add.text(x, y, `${item.label} (${item.value})`, {
        color: "#f6f4ec", fontFamily: "sans-serif", fontSize: "13px",
        backgroundColor: "#1a2a3a", padding: { x: 8, y: 4 },
      }).setInteractive({ draggable: true });

      card.setData("zone", item.zone);
      card.setData("placed", false);
      group.add(card);
      this._items.push(card);
    });

    this._onDrag = (pointer, obj, dragX, dragY) => {
      obj.x = dragX;
      obj.y = dragY;
    };

    this._onDragEnd = (pointer, obj) => {
      if (obj.getData("placed")) return;

      const objBounds = obj.getBounds();
      const shortBounds = this._shortZone.getBounds();
      const longBounds = this._longZone.getBounds();
      const correctZone = obj.getData("zone");

      let droppedZone = null;
      if (Phaser.Geom.Intersects.RectangleToRectangle(objBounds, shortBounds)) {
        droppedZone = "short";
      } else if (Phaser.Geom.Intersects.RectangleToRectangle(objBounds, longBounds)) {
        droppedZone = "long";
      }

      if (droppedZone === correctZone) {
        obj.setData("placed", true);
        obj.disableInteractive();
        obj.setStyle({ backgroundColor: "#0d3a2a" });
        this._score.add(15);
        this._placed++;
        flashFeedback(scene, group, obj.x, obj.y - 20, "Correct!");

        if (this._placed >= ITEMS.length) {
          ctx.dialogue.show("Mentor", "Great job! You understand how time relates to earning money!");
          ctx.onComplete({ score: this._score.value });
        }
      } else if (droppedZone) {
        flashFeedback(scene, group, obj.x, obj.y - 20, "Try again!", "#ff5656");
      }
    };

    scene.input.on("drag", this._onDrag);
    scene.input.on("dragend", this._onDragEnd);

    ctx.dialogue.show("Mentor", "Some ways to earn money are quick, others take longer but pay more. Sort them!");
  },

  update() {},

  shutdown(scene) {
    if (this._onDrag) scene.input.off("drag", this._onDrag);
    if (this._onDragEnd) scene.input.off("dragend", this._onDragEnd);
  },
};
