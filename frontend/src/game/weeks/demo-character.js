import Phaser from "phaser";
import {
  createTitle,
  createInstructionText,
  createScoreText,
  flashFeedback,
  getSafePlayArea,
  CHARACTER_COLORS,
} from "./weekUtils";

/**
 * Demo / Example Week — "Tidepool Collector"
 *
 * Shows the new animated player character system in action.
 * Educational focus: distinguishing "needs" (good) vs "wants/impulses" (risky).
 *
 * This file is a template. It is registered in weeks/index.js but is not
 * yet selectable from the main UI (you can temporarily set weekId=0 in App.jsx).
 */
const GOOD_ITEMS = [
  { label: "Food", emoji: "🦀", points: 15 },
  { label: "Tools", emoji: "🔧", points: 12 },
  { label: "Shelter", emoji: "🏠", points: 18 },
];

const BAD_ITEMS = [
  { label: "Shiny Toy", emoji: "✨", points: -10 },
  { label: "Candy", emoji: "🍬", points: -8 },
  { label: "Gadget", emoji: "📱", points: -12 },
];

export default {
  key: "demo-character",
  title: "Demo: Tidepool Collector (Character Test)",

  create(scene, ctx) {
    const { width, height } = scene.scale;
    const { group } = ctx;

    createTitle(scene, group, this.title);
    createInstructionText(scene, group, "Move the explorer with arrows/WASD or click. Collect needs 🦀, avoid impulse buys ✨");

    this._score = createScoreText(scene, group, width - 140, 20);
    this._ctx = ctx;
    this._collected = 0;
    this._avoided = 0;
    this._items = [];
    this._spawnTimer = null;

    const area = getSafePlayArea(scene);

    // Control legend is now created automatically by createPlayerCharacter()

    // Create the controllable explorer near the center-left
    this._player = ctx.createPlayerCharacter({
      x: area.x + 60,
      y: area.centerY,
      size: 26,
    });

    // Simple play area boundary visual (subtle)
    this._bounds = scene.add.rectangle(
      area.centerX,
      area.centerY,
      area.width,
      area.height,
      0x0d2a3f,
      0.0
    ).setStrokeStyle(1, 0x56cfff, 0.25);
    group.add(this._bounds);

    // Instructions in dialogue
    ctx.dialogue.show("Mentor", "Explore the tidepool! Good choices help you grow. Impulse buys hurt your score.");

    // Spawn loop
    this._spawnTimer = scene.time.addEvent({
      delay: 1100,
      callback: () => this._spawnItem(scene, ctx, area),
      repeat: 11,
    });

    // Completion check timer (lightweight)
    this._checkTimer = scene.time.addEvent({
      delay: 4200,
      callback: () => this._maybeFinish(scene, ctx),
      repeat: 3,
    });
  },

  _spawnItem(scene, ctx, area) {
    const isGood = Math.random() < 0.65; // bias toward good choices
    const pool = isGood ? GOOD_ITEMS : BAD_ITEMS;
    const data = pool[Math.floor(Math.random() * pool.length)];

    const x = Phaser.Math.Between(area.x + 30, area.x + area.width - 30);
    const y = Phaser.Math.Between(area.y + 20, area.y + area.height - 20);

    const item = scene.add.text(x, y, `${data.emoji} ${data.label}`, {
      color: isGood ? "#56ff9e" : "#ff8c56",
      fontFamily: "sans-serif",
      fontSize: "14px",
      backgroundColor: isGood ? "rgba(30,70,50,0.6)" : "rgba(70,30,30,0.6)",
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5);

    item.setData("good", isGood);
    item.setData("points", data.points);
    item.setData("collected", false);

    // Gentle bobbing motion
    scene.tweens.add({
      targets: item,
      y: y + (isGood ? 6 : -6),
      duration: 900 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    ctx.group.add(item);
    this._items.push(item);
  },

  update(scene, time, delta) {
    if (!this._player || !this._items.length) return;

    const p = this._player.getPosition();
    const playerRadius = 26;

    for (let i = this._items.length - 1; i >= 0; i--) {
      const item = this._items[i];
      if (!item || item.getData("collected")) continue;

      const dist = Phaser.Math.Distance.Between(p.x, p.y, item.x, item.y);
      if (dist < playerRadius + 14) {
        // Collision!
        item.setData("collected", true);

        const good = item.getData("good");
        const pts = item.getData("points");

        if (good) {
          this._score.add(pts);
          this._collected++;
          flashFeedback(scene, this._ctx.group, item.x, item.y - 18, "Good choice!", "#56ff9e");
        } else {
          this._score.add(pts); // negative
          this._avoided++; // we count "avoided" loosely as encounters
          flashFeedback(scene, this._ctx.group, item.x, item.y - 18, "Impulse buy!", "#ff5656");
        }

        // Remove the item
        scene.tweens.killTweensOf(item);
        item.destroy();

        this._items.splice(i, 1);

        // Quick win condition
        if (this._collected >= 5) {
          this._finish(scene, this._ctx, true);
        }
      }
    }
  },

  _maybeFinish(scene, ctx) {
    if (this._finished) return;
    if (this._collected >= 4) {
      this._finish(scene, ctx, true);
    }
  },

  _finish(scene, ctx, success) {
    if (this._finished) return;
    this._finished = true;

    if (this._spawnTimer) this._spawnTimer.remove();
    if (this._checkTimer) this._checkTimer.remove();

    const finalScore = this._score.value;
    const msg = success
      ? `Excellent exploring! You collected ${this._collected} good items.`
      : `Session ended. You collected ${this._collected} needs.`;

    // Fun visual payoff using the new character API
    if (this._player && this._player.celebrate) {
      this._player.celebrate(1100);
    }

    const bestKey = 'tidebound_best_collector';
    const currentBest = parseInt(localStorage.getItem(bestKey) || '0', 10);
    const newBest = Math.max(currentBest, finalScore);

    if (finalScore > currentBest) {
      localStorage.setItem(bestKey, finalScore.toString());
      ctx.dialogue.show("Mentor", `${msg} New personal best! (${finalScore})`);
    } else {
      ctx.dialogue.show("Mentor", `${msg} Your best: ${currentBest}`);
    }

    ctx.onComplete({ score: Math.max(0, finalScore), collected: this._collected, best: newBest });
  },

  shutdown(scene) {
    if (this._spawnTimer) this._spawnTimer.remove();
    if (this._checkTimer) this._checkTimer.remove();

    // Items are cleaned via weekGroup in GameScene
    this._items = [];
    this._player = null;
  },
};