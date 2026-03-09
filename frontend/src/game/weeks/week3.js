import Phaser from "phaser";
import { createTitle, createInstructionText, createScoreText, flashFeedback } from "./weekUtils";

const COIN_TYPES = [
  { label: "$5", type: "checking", color: 0x56cfff },
  { label: "$20", type: "savings", color: 0xffcf56 },
  { label: "$10", type: "checking", color: 0x56cfff },
  { label: "$50", type: "savings", color: 0xffcf56 },
  { label: "$15", type: "checking", color: 0x56cfff },
  { label: "$100", type: "savings", color: 0xffcf56 },
  { label: "$8", type: "checking", color: 0x56cfff },
  { label: "$75", type: "savings", color: 0xffcf56 },
];

export default {
  key: "week3",
  title: "Week 3: Checking vs Savings",

  create(scene, ctx) {
    const { width, height } = scene.scale;
    const { group } = ctx;

    createTitle(scene, group, this.title);
    createInstructionText(scene, group, "Sort coins: small amounts LEFT (checking), large RIGHT (savings)");

    this._score = createScoreText(scene, group, width - 140, 20);
    this._sorted = 0;
    this._ctx = ctx;
    this._spawnTimer = null;
    this._coinIndex = 0;
    this._coins = [];

    // Checking zone (left)
    this._checkZone = scene.add.rectangle(60, height - 40, 100, 60, 0x56cfff, 0.2)
      .setStrokeStyle(2, 0x56cfff, 0.4);
    group.add(this._checkZone);
    const checkLabel = scene.add.text(60, height - 20, "CHECKING", {
      color: "#56cfff", fontFamily: "sans-serif", fontSize: "11px", fontStyle: "bold",
    }).setOrigin(0.5);
    group.add(checkLabel);

    // Savings zone (right)
    this._saveZone = scene.add.rectangle(width - 60, height - 40, 100, 60, 0xffcf56, 0.2)
      .setStrokeStyle(2, 0xffcf56, 0.4);
    group.add(this._saveZone);
    const saveLabel = scene.add.text(width - 60, height - 20, "SAVINGS", {
      color: "#ffcf56", fontFamily: "sans-serif", fontSize: "11px", fontStyle: "bold",
    }).setOrigin(0.5);
    group.add(saveLabel);

    // Register drag listeners once
    this._onDrag = (pointer, obj, dragX, dragY) => {
      if (!obj.getData("type")) return;
      obj.x = dragX;
      obj.y = dragY;
      if (obj._label) {
        obj._label.x = dragX;
        obj._label.y = dragY;
      }
      if (obj.body) obj.body.setGravityY(0);
    };

    this._onDragEnd = (pointer, obj) => {
      if (!obj.getData("type") || obj.getData("sorted")) return;

      const bounds = obj.getBounds();
      const correctType = obj.getData("type");
      const checkBounds = this._checkZone.getBounds();
      const saveBounds = this._saveZone.getBounds();
      let droppedType = null;

      if (Phaser.Geom.Intersects.RectangleToRectangle(bounds, checkBounds)) {
        droppedType = "checking";
      } else if (Phaser.Geom.Intersects.RectangleToRectangle(bounds, saveBounds)) {
        droppedType = "savings";
      }

      if (droppedType === correctType) {
        obj.setData("sorted", true);
        obj.disableInteractive();
        this._score.add(12);
        this._sorted++;
        flashFeedback(scene, ctx.group, obj.x, obj.y - 30, "Correct!");

        if (this._sorted >= COIN_TYPES.length) {
          ctx.dialogue.show("Mentor", "You know where to put your money! Checking for daily use, savings for growth.");
          ctx.onComplete({ score: this._score.value });
        }
      } else if (droppedType) {
        flashFeedback(scene, ctx.group, obj.x, obj.y - 30, "Wrong bin!", "#ff5656");
      }
    };

    scene.input.on("drag", this._onDrag);
    scene.input.on("dragend", this._onDragEnd);

    this._spawnTimer = scene.time.addEvent({
      delay: 1500,
      callback: () => this._spawnCoin(scene, ctx),
      repeat: COIN_TYPES.length - 1,
    });

    ctx.dialogue.show("Mentor", "Checking is for spending money, savings is for growing money. Sort the coins!");
  },

  _spawnCoin(scene, ctx) {
    if (this._coinIndex >= COIN_TYPES.length) return;

    const { width } = scene.scale;
    const coinData = COIN_TYPES[this._coinIndex++];

    const coin = scene.add.circle(
      Phaser.Math.Between(100, width - 100), 80,
      20, coinData.color, 0.9
    ).setInteractive({ draggable: true });
    coin.setData("type", coinData.type);
    ctx.group.add(coin);

    const label = scene.add.text(coin.x, coin.y, coinData.label, {
      color: "#0a1622", fontFamily: "sans-serif", fontSize: "11px", fontStyle: "bold",
    }).setOrigin(0.5);
    ctx.group.add(label);

    scene.physics.add.existing(coin);
    coin.body.setGravityY(40);
    coin.body.setCollideWorldBounds(true);

    coin._label = label;
    this._coins.push({ coin, label });
  },

  update() {
    // Sync labels with coin positions (for physics falling)
    for (const { coin, label } of this._coins) {
      if (coin.active && coin.body) {
        label.x = coin.x;
        label.y = coin.y;
      }
    }
  },

  shutdown(scene) {
    if (this._spawnTimer) this._spawnTimer.remove();
    if (this._onDrag) scene.input.off("drag", this._onDrag);
    if (this._onDragEnd) scene.input.off("dragend", this._onDragEnd);
    this._coins = [];
  },
};
