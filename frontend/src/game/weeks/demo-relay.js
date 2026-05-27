import Phaser from "phaser";
import {
  createTitle,
  createInstructionText,
  createScoreText,
  flashFeedback,
  getSafePlayArea,
} from "./weekUtils";

/**
 * Sixth Character Demo: "Tide Relay"
 *
 * Designed to showcase Carry + Throw + Surge working together.
 *
 * - Some orbs are in "hard to reach" spots behind blockers.
 * - Player must carry orbs through safe paths.
 * - Use Surge (Q) to clear groups of drifting hazards.
 * - Throwing carried orbs into the goal gives high score.
 */
export default {
  key: "demo-relay",
  title: "Demo: Tide Relay",

  create(scene, ctx) {
    const { width, height } = scene.scale;
    const { group } = ctx;

    createTitle(scene, group, this.title);
    createInstructionText(scene, group, "Carry (E) orbs through the path • Use Surge (Q) to clear blockers • Throw into the goal!");

    this._score = createScoreText(scene, group, width - 140, 20);
    this._ctx = ctx;
    this._finished = false;
    this._orbs = [];
    this._blockers = [];
    this._delivered = 0;
    this._targetDeliveries = 6;

    const area = getSafePlayArea(scene);

    this._player = ctx.createPlayerCharacter({
      x: area.x + 55,
      y: area.centerY - 40,
      size: 26,
      legendText: "E = Grab/Throw  •  Q = Surge (clear blockers)  •  Carry orbs to safety!",
    });

    // Goal zone (higher reward for carried+thrown orbs)
    this._goal = scene.add.ellipse(
      area.x + area.width - 80,
      area.centerY,
      95,
      80,
      0x56ff9e,
      0.22
    ).setStrokeStyle(3, 0x56ff9e, 0.95);
    group.add(this._goal);

    // Create some "blocker" orbs that drift and can be surged away
    for (let i = 0; i < 5; i++) {
      const blocker = this._createBlocker(scene, group, area, i);
      this._blockers.push(blocker);
    }

    // Spawn a few normal orbs that are awkward to push directly
    for (let i = 0; i < 4; i++) {
      const orb = this._createOrb(scene, group, area);
      this._orbs.push(orb);
    }

    ctx.dialogue.show("Mentor", "Some paths are blocked. Carry what you can and clear the rest with your surge!");
  },

  _createOrb(scene, group, area) {
    const x = area.x + 90 + Math.random() * 60;
    const y = area.y + 35 + Math.random() * (area.height - 70);

    const orb = scene.add.circle(x, y, 13, 0xffcf56, 0.95);
    orb.setStrokeStyle(2, 0xffffff, 0.5);
    orb.setData("vx", Phaser.Math.Between(18, 35));
    orb.setData("vy", Phaser.Math.Between(-12, 12));
    orb.setData("delivered", false);

    group.add(orb);
    return orb;
  },

  _createBlocker(scene, group, area, index) {
    const x = area.x + 160 + index * 55;
    const y = area.y + 45 + (index % 3) * 38;

    const blocker = scene.add.circle(x, y, 11, 0x3a5f7a, 0.7);
    blocker.setStrokeStyle(1, 0x56cfff, 0.4);
    blocker.setData("vx", Phaser.Math.Between(22, 38));
    blocker.setData("vy", Phaser.Math.Between(-8, 8));

    group.add(blocker);
    return blocker;
  },

  update(scene, time, delta) {
    if (this._finished || !this._player) return;

    const dt = delta / 1000;

    // Update blockers (they can be surged away)
    for (const b of this._blockers) {
      if (!b.active) continue;
      b.x += b.getData("vx") * dt;
      b.y += b.getData("vy") * dt;
    }

    // Update normal orbs
    for (let i = this._orbs.length - 1; i >= 0; i--) {
      const orb = this._orbs[i];
      if (!orb || orb.getData("delivered")) continue;

      orb.x += orb.getData("vx") * dt;
      orb.y += orb.getData("vy") * dt;

      // Simple boundary
      const area = getSafePlayArea(scene);
      if (orb.x < area.x + 20) orb.setData("vx", Math.abs(orb.getData("vx")));
      if (orb.x > area.x + area.width - 20) orb.setData("vx", -Math.abs(orb.getData("vx")));

      // Check delivery
      const goalDist = Phaser.Math.Distance.Between(orb.x, orb.y, this._goal.x, this._goal.y);
      if (goalDist < 48) {
        this._deliverOrb(orb, i, scene, false);
      }
    }
  },

  // Called from PlayerCharacter surge event if the week listens
  applySurge(pushData) {
    const { pushX, pushY, surgeForce, range, coneWidth } = pushData;
    const playerPos = this._player.getPosition();

    // Push blockers
    for (const b of this._blockers) {
      if (!b.active) continue;
      const dx = b.x - playerPos.x;
      const dy = b.y - playerPos.y;
      const dist = Math.hypot(dx, dy);
      if (dist > range) continue;

      const angleTo = Math.atan2(dy, dx);
      const angleDiff = Math.abs(angleTo - (this._player.container.rotation || 0));
      if (angleDiff > coneWidth / 2) continue;

      const force = (surgeForce * (1 - dist / range)) * 0.8;
      b.setData("vx", b.getData("vx") + pushX * force);
      b.setData("vy", b.getData("vy") + pushY * force);
    }
  },

  _deliverOrb(orb, index, scene, wasCarried) {
    orb.setData("delivered", true);
    this._delivered++;

    const points = wasCarried ? 45 : 25; // bonus for carrying + throwing

    scene.tweens.add({
      targets: orb,
      scale: 0.2,
      alpha: 0,
      duration: 220,
      onComplete: () => orb.destroy(),
    });

    this._score.add(points);
    flashFeedback(scene, this._ctx.group, orb.x, orb.y - 18, wasCarried ? "Great throw!" : "Delivered!", "#56ff9e");

    this._orbs.splice(index, 1);

    if (this._delivered >= this._targetDeliveries) {
      this._finish(scene, this._ctx, true);
    }
  },

  _finish(scene, ctx, success) {
    if (this._finished) return;
    this._finished = true;

    if (this._player && this._player.celebrate) {
      this._player.celebrate(900);
    }

    ctx.dialogue.show("Mentor", success 
      ? "Excellent relay work! Carrying + surging is powerful." 
      : "Good work coordinating your tools.");
    const bestKey = 'tidebound_best_relay';
    const currentBest = parseInt(localStorage.getItem(bestKey) || '0', 10);
    const newBest = Math.max(currentBest, this._score.value);

    if (this._score.value > currentBest) {
      localStorage.setItem(bestKey, this._score.value.toString());
      ctx.dialogue.show("Mentor", `${msg} New personal best! (${this._score.value})`);
    } else {
      ctx.dialogue.show("Mentor", `${msg} Your best: ${currentBest}`);
    }

    ctx.onComplete({ score: this._score.value, delivered: this._delivered, best: newBest });
  },

  shutdown() {
    this._orbs = [];
    this._blockers = [];
    this._player = null;
  },
};