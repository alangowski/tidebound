import Phaser from "phaser";
import {
  createTitle,
  createInstructionText,
  createScoreText,
  flashFeedback,
  getSafePlayArea,
} from "./weekUtils";

/**
 * Fourth Character Demo: "Building Momentum"
 *
 * This demo heavily showcases the value of a real physics-enabled player character.
 *
 * Concept:
 * - You control the explorer in a flowing tidepool.
 * - There are several "Habit Orbs" (representing positive actions / good habits).
 * - The orbs drift with the current.
 * - By bumping into them with your explorer (using your body's momentum),
 *   you can push them toward the glowing "Future You" collection zone.
 * - Delivering orbs builds "momentum" (score + visual feedback).
 *
 * Educational angle: Small consistent actions gain power when you keep pushing.
 */
export default {
  key: "demo-push",
  title: "Demo: Building Momentum",

  create(scene, ctx) {
    const { width, height } = scene.scale;
    const { group } = ctx;

    createTitle(scene, group, this.title);
    createInstructionText(scene, group, "Push the habit orbs into the glowing zone. Use Space to Dash for powerful shoves!");

    this._score = createScoreText(scene, group, width - 140, 20);
    this._ctx = ctx;
    this._finished = false;
    this._orbs = [];
    this._delivered = 0;
    this._targetDeliveries = 5;

    const area = getSafePlayArea(scene);

    // Create the controllable explorer
    this._player = ctx.createPlayerCharacter({
      x: area.x + 70,
      y: area.centerY,
      size: 26,
      legendText: "Push orbs • Dash (Space) • E = Grab & Throw!",
    });

    // Support Grab/Throw ability
    this._player.events.on('requestGrab', () => {
      for (const orb of this._orbs) {
        if (orb.getData('delivered') || orb.getData('beingCarried')) continue;
        if (this._player.overlaps(orb)) {
          if (this._player.grab(orb)) {
            orb.setData('beingCarried', true);
            flashFeedback(scene, group, orb.x, orb.y - 18, "Carrying!", "#56cfff");
          }
          break;
        }
      }
    });

    // Goal zone (Future You)
    this._goal = scene.add.ellipse(
      area.x + area.width - 90,
      area.centerY,
      110,
      95,
      0x56ff9e,
      0.18
    ).setStrokeStyle(3, 0x56ff9e, 0.9);
    group.add(this._goal);

    // Inner highlight
    this._goalHighlight = scene.add.ellipse(
      area.x + area.width - 90,
      area.centerY,
      70,
      60,
      0x56ff9e,
      0.35
    );
    group.add(this._goalHighlight);

    scene.tweens.add({
      targets: this._goalHighlight,
      alpha: { from: 0.2, to: 0.55 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
    });

    // Spawn habit orbs
    for (let i = 0; i < 8; i++) {
      const orb = this._createOrb(scene, group, area);
      this._orbs.push(orb);
    }

    ctx.dialogue.show("Mentor", "Good habits have their own momentum. Give them a push in the right direction.");
  },

  _createOrb(scene, group, area) {
    const x = Phaser.Math.Between(area.x + 140, area.x + area.width - 160);
    const y = Phaser.Math.Between(area.y + 35, area.y + area.height - 35);

    const orb = scene.add.circle(x, y, 13, 0xffcf56, 0.9);
    orb.setStrokeStyle(2, 0xffffff, 0.6);

    // Store velocity on the orb itself (simple simulation)
    orb.setData("vx", Phaser.Math.Between(-22, 22));
    orb.setData("vy", Phaser.Math.Between(-14, 14));
    orb.setData("delivered", false);

    group.add(orb);
    return orb;
  },

  update(scene, time, delta) {
    if (this._finished || !this._player) return;

    const dt = delta / 1000;
    const playerPos = this._player.getPosition();
    const playerRadius = 22;

    // Apply gentle current to orbs + player push logic
    for (let i = this._orbs.length - 1; i >= 0; i--) {
      const orb = this._orbs[i];
      if (!orb || orb.getData("delivered")) continue;

      let x = orb.x;
      let y = orb.y;
      let vx = orb.getData("vx");
      let vy = orb.getData("vy");

      // Very light current influence
      vx += Math.sin(time / 1600 + i) * 8 * dt;
      vy += Math.cos(time / 1900 + i * 1.3) * 5 * dt;

      // Apply velocity
      x += vx * dt;
      y += vy * dt;

      // Soft bounds
      const area = getSafePlayArea(scene);
      if (x < area.x + 25) { x = area.x + 25; vx = Math.abs(vx) * 0.6; }
      if (x > area.x + area.width - 25) { x = area.x + area.width - 25; vx = -Math.abs(vx) * 0.6; }
      if (y < area.y + 25) { y = area.y + 25; vy = Math.abs(vy) * 0.6; }
      if (y > area.y + area.height - 25) { y = area.y + area.height - 25; vy = -Math.abs(vy) * 0.6; }

      orb.x = x;
      orb.y = y;
      orb.setData("vx", vx * 0.985);
      orb.setData("vy", vy * 0.985);

      // === Player push logic using the new overlaps helper ===
      if (this._player.overlaps({ x, y, radius: 13 })) {
        this._player.events.emit('push', { x, y, orb });

        // Calculate push direction from player's recent movement
        const body = this._player.body?.body;
        const pushX = body ? body.velocity.x * 0.035 : (playerPos.x - x) * -0.8;
        const pushY = body ? body.velocity.y * 0.035 : (playerPos.y - y) * -0.8;

        // Give the orb a solid shove
        const newVx = vx + pushX;
        const newVy = vy + pushY;

        orb.setData("vx", newVx);
        orb.setData("vy", newVy);

        // Small visual feedback
        scene.tweens.add({
          targets: orb,
          scale: 1.25,
          duration: 80,
          yoyo: true,
        });

        // Check if orb entered the goal zone
        const goalDist = Phaser.Math.Distance.Between(x, y, this._goal.x, this._goal.y);
        if (goalDist < 55) {
          this._deliverOrb(orb, i, scene);
        }
      }
    }
  },

  _deliverOrb(orb, index, scene) {
    orb.setData("delivered", true);

    // If we were carrying this orb, release it
    if (this._player && this._player._carriedObject === orb) {
      this._player.releaseCarried();
    }

    this._delivered++;

    // Nice delivery effect
    scene.tweens.add({
      targets: orb,
      scale: 0.3,
      alpha: 0,
      duration: 280,
      onComplete: () => {
        if (orb.active) orb.destroy();
      },
    });

    this._score.add(25);
    flashFeedback(scene, this._ctx.group, orb.x, orb.y - 18, "Momentum!", "#56ff9e");

    this._orbs.splice(index, 1);

    if (this._delivered >= this._targetDeliveries) {
      this._finish(scene, this._ctx, true);
    }
  },

  _finish(scene, ctx, success) {
    if (this._finished) return;
    this._finished = true;

    if (this._player && this._player.celebrate) {
      this._player.celebrate(1100);
    }

    const msg = success
      ? `Well done! You built real momentum and delivered ${this._delivered} habits.`
      : "Good effort pushing those habits forward.";

    const bestKey = 'tidebound_best_push';
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
    this._player = null;
  },
};