import Phaser from "phaser";
import {
  createTitle,
  createInstructionText,
  createScoreText,
  flashFeedback,
  getSafePlayArea,
} from "./weekUtils";

/**
 * Fifth Character Demo: "Tide Rush"
 *
 * Fast-paced challenge designed to showcase the new Dash ability.
 *
 * - Multiple habit orbs spawn frequently.
 * - They drift away faster than previous demos.
 * - Player must use Dash aggressively to deliver them quickly.
 * - Time pressure + score multiplier for chaining deliveries.
 *
 * Educational angle: Momentum and decisive action matter.
 */
export default {
  key: "demo-rush",
  title: "Demo: Tide Rush",

  create(scene, ctx) {
    const { width, height } = scene.scale;
    const { group } = ctx;

    createTitle(scene, group, this.title);
    createInstructionText(scene, group, "Dash (Space) to push orbs fast! Chain deliveries for bonus points.");

    this._score = createScoreText(scene, group, width - 140, 20);
    this._ctx = ctx;
    this._finished = false;
    this._orbs = [];
    this._delivered = 0;
    this._targetDeliveries = 8;
    this._lastDeliveryTime = 0;
    this._combo = 0;

    const area = getSafePlayArea(scene);

    this._player = ctx.createPlayerCharacter({
      x: area.x + 80,
      y: area.centerY,
      size: 26,
      legendText: "Dash frequently (Space) • Chain quick deliveries for big scores!",
    });

    // Goal zone
    this._goal = scene.add.ellipse(
      area.x + area.width - 85,
      area.centerY,
      100,
      85,
      0x56ff9e,
      0.2
    ).setStrokeStyle(3, 0x56ff9e, 0.95);
    group.add(this._goal);

    this._goalHighlight = scene.add.ellipse(
      area.x + area.width - 85,
      area.centerY,
      60,
      50,
      0x56ff9e,
      0.4
    );
    group.add(this._goalHighlight);

    scene.tweens.add({
      targets: this._goalHighlight,
      alpha: { from: 0.25, to: 0.6 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    // Spawn orbs more frequently
    this._spawnTimer = scene.time.addEvent({
      delay: 1100,
      callback: () => this._spawnOrb(scene, group, area),
      repeat: 20,
    });

    ctx.dialogue.show("Mentor", "Things are moving fast. Use your dash to keep up!");
  },

  _spawnOrb(scene, group, area) {
    if (this._finished) return;

    const x = area.x + 60 + Math.random() * 80;
    const y = area.y + 30 + Math.random() * (area.height - 60);

    const orb = scene.add.circle(x, y, 12, 0xffcf56, 0.95);
    orb.setStrokeStyle(2, 0xffffff, 0.5);

    // Faster drift than previous demos
    orb.setData("vx", Phaser.Math.Between(25, 55));
    orb.setData("vy", Phaser.Math.Between(-18, 18));
    orb.setData("delivered", false);

    group.add(orb);
    this._orbs.push(orb);
  },

  update(scene, time, delta) {
    if (this._finished || !this._player) return;

    const dt = delta / 1000;
    const playerPos = this._player.getPosition();

    for (let i = this._orbs.length - 1; i >= 0; i--) {
      const orb = this._orbs[i];
      if (!orb || orb.getData("delivered")) continue;

      let x = orb.x;
      let y = orb.y;
      let vx = orb.getData("vx");
      let vy = orb.getData("vy");

      x += vx * dt;
      y += vy * dt;

      const area = getSafePlayArea(scene);

      // Bounce off edges
      if (x < area.x + 20) { x = area.x + 20; vx = Math.abs(vx); }
      if (x > area.x + area.width - 20) { x = area.x + area.width - 20; vx = -Math.abs(vx) * 0.8; }
      if (y < area.y + 20) { y = area.y + 20; vy = Math.abs(vy); }
      if (y > area.y + area.height - 20) { y = area.y + area.height - 20; vy = -Math.abs(vy); }

      orb.x = x;
      orb.y = y;
      orb.setData("vx", vx * 0.99);
      orb.setData("vy", vy * 0.99);

      // Player interaction (dash makes this much more effective)
      if (this._player.overlaps({ x, y, radius: 12 })) {
        const body = this._player.getBody();
        const isDashing = this._player._isDashing; // internal but useful for demo

        const pushStrength = isDashing ? 1.65 : 0.9;

        let pushX = (body ? body.velocity.x : 0) * 0.04 * pushStrength;
        let pushY = (body ? body.velocity.y : 0) * 0.04 * pushStrength;

        if (Math.hypot(pushX, pushY) < 12) {
          // fallback if barely moving
          const dx = x - playerPos.x;
          const dy = y - playerPos.y;
          const m = Math.hypot(dx, dy) || 1;
          pushX = (dx / m) * 45 * pushStrength;
          pushY = (dy / m) * 45 * pushStrength;
        }

        orb.setData("vx", orb.getData("vx") + pushX);
        orb.setData("vy", orb.getData("vy") + pushY);

        // Visual pop on hit
        scene.tweens.add({
          targets: orb,
          scale: isDashing ? 1.4 : 1.2,
          duration: 80,
          yoyo: true,
        });

        // Check goal
        const goalDist = Phaser.Math.Distance.Between(x, y, this._goal.x, this._goal.y);
        if (goalDist < 50) {
          this._deliverOrb(orb, i, scene, isDashing);
        }
      }
    }
  },

  _deliverOrb(orb, index, scene, wasDashing) {
    orb.setData("delivered", true);
    this._delivered++;

    const now = Date.now();
    const timeSinceLast = now - this._lastDeliveryTime;

    if (timeSinceLast < 1800) {
      this._combo++;
    } else {
      this._combo = 1;
    }
    this._lastDeliveryTime = now;

    const comboBonus = Math.min(this._combo, 5) * 8;
    const dashBonus = wasDashing ? 12 : 0;
    const points = 22 + comboBonus + dashBonus;

    this._score.add(points);

    const bonusText = this._combo > 1 
      ? `+${comboBonus} combo!` 
      : (wasDashing ? "Nice dash!" : "");

    if (bonusText) {
      flashFeedback(scene, this._ctx.group, orb.x, orb.y - 22, bonusText, "#56ff9e");
    }

    scene.tweens.add({
      targets: orb,
      scale: 0.2,
      alpha: 0,
      duration: 220,
      onComplete: () => orb.destroy(),
    });

    this._orbs.splice(index, 1);

    if (this._delivered >= this._targetDeliveries) {
      this._finish(scene, this._ctx, true);
    }
  },

  _finish(scene, ctx, success) {
    if (this._finished) return;
    this._finished = true;

    if (this._spawnTimer) this._spawnTimer.remove();

    if (this._player && this._player.celebrate) {
      this._player.celebrate(1000);
    }

    const msg = success
      ? `Excellent rush! You delivered ${this._delivered} orbs with style.`
      : "Good effort under pressure.";

    const bestKey = 'tidebound_best_rush';
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
    if (this._spawnTimer) this._spawnTimer.remove();
    this._orbs = [];
    this._player = null;
  },
};