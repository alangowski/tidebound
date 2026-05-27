import Phaser from "phaser";
import {
  createTitle,
  createInstructionText,
  createScoreText,
  flashFeedback,
  getSafePlayArea,
} from "./weekUtils";

/**
 * Second Character Demo Week: "Safe Passage"
 *
 * Focus: Direct character control + timing / risk management.
 * The player must guide the explorer across a dangerous tidepool channel
 * to reach the safe cove on the other side.
 *
 * Hazards: Moving undertow zones (vertical bands that push the player).
 * Educational angle: Sometimes the fastest path isn't the safest.
 *                      Patience and observation matter.
 */
export default {
  key: "demo-navigator",
  title: "Demo: Safe Passage",

  create(scene, ctx) {
    const { width, height } = scene.scale;
    const { group } = ctx;

    createTitle(scene, group, this.title);
    createInstructionText(scene, group, "Guide the explorer to the glowing cove. Avoid the moving undertows!");

    this._score = createScoreText(scene, group, width - 140, 20);
    this._ctx = ctx;
    this._finished = false;
    this._hazards = [];
    this._goal = null;
    this._startTime = Date.now();

    const area = getSafePlayArea(scene);

    // Control legend is now created automatically when using createPlayerCharacter()

    // Create the controllable explorer
    this._player = ctx.createPlayerCharacter({
      x: area.x + 50,
      y: area.centerY,
      size: 24,
    });

    // Goal cove (glowing safe zone on the right)
    const goalX = area.x + area.width - 70;
    const goalY = area.centerY;

    this._goal = scene.add.circle(goalX, goalY, 32, 0x56ff9e, 0.25)
      .setStrokeStyle(3, 0x56ff9e, 0.9);
    group.add(this._goal);

    // Pulsing inner glow
    this._goalInner = scene.add.circle(goalX, goalY, 18, 0x56ff9e, 0.6);
    group.add(this._goalInner);

    scene.tweens.add({
      targets: this._goalInner,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Create moving undertow hazards (vertical bands)
    this._createHazards(scene, group, area);

    ctx.dialogue.show("Mentor", "The current is strong here. Watch the patterns and time your crossing carefully.");
  },

  _createHazards(scene, group, area) {
    const hazardCount = 3;
    const hazardWidth = 28;
    const speedRange = [45, 75];

    for (let i = 0; i < hazardCount; i++) {
      const y = area.y + 40 + i * ((area.height - 80) / (hazardCount - 1));

      const hazard = scene.add.rectangle(
        area.x + 80 + i * 90,
        y,
        hazardWidth,
        70,
        0x3a5f7a,
        0.35
      ).setStrokeStyle(1, 0x56cfff, 0.4);

      group.add(hazard);

      // Give it physics-like behavior via manual movement in update
      hazard.setData("speed", Phaser.Math.Between(...speedRange) * (i % 2 === 0 ? 1 : -1));
      hazard.setData("direction", 1);
      hazard.setData("minX", area.x + 60);
      hazard.setData("maxX", area.x + area.width - 120);

      this._hazards.push(hazard);
    }
  },

  update(scene, time, delta) {
    if (this._finished || !this._player) return;

    const playerPos = this._player.getPosition();
    const dt = delta / 1000;

    // Move hazards back and forth
    for (const hazard of this._hazards) {
      if (!hazard.active) continue;

      let x = hazard.x;
      let speed = hazard.getData("speed");
      const minX = hazard.getData("minX");
      const maxX = hazard.getData("maxX");

      x += speed * dt;

      if (x < minX) {
        x = minX;
        hazard.setData("speed", Math.abs(speed));
      } else if (x > maxX) {
        x = maxX;
        hazard.setData("speed", -Math.abs(speed));
      }

      hazard.x = x;

      // Check collision with player (simple distance + overlap)
      const distX = Math.abs(playerPos.x - hazard.x);
      const distY = Math.abs(playerPos.y - hazard.y);

      if (distX < 32 && distY < 38) {
        // Hit undertow — push the player and deduct points
        const pushDir = playerPos.x > hazard.x ? 1 : -1;
        this._player.setVelocity(220 * pushDir, Phaser.Math.Between(-60, 60));

        flashFeedback(scene, this._ctx.group, playerPos.x, playerPos.y - 25, "Undertow!", "#ff8c56");
        this._score.add(-6);

        // Small cooldown so you don't get spammed
        hazard.setData("speed", hazard.getData("speed") * 0.6);
      }
    }

    // Check if player reached the goal
    const goalDist = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, this._goal.x, this._goal.y);
    if (goalDist < 38) {
      this._finish(scene, this._ctx, true);
    }
  },

  _finish(scene, ctx, success) {
    if (this._finished) return;
    this._finished = true;

    const elapsed = Math.round((Date.now() - this._startTime) / 1000);
    const finalScore = Math.max(0, this._score.value + Math.max(0, 80 - elapsed * 2));

    // Celebrate!
    if (this._player && this._player.celebrate) {
      this._player.celebrate(1200);
    }

    const msg = success
      ? `Well done! You crossed safely in ${elapsed}s.`
      : "You made it across.";

    const bestKey = 'tidebound_best_navigator';
    const currentBest = parseInt(localStorage.getItem(bestKey) || '0', 10);
    const newBest = Math.max(currentBest, finalScore);

    if (finalScore > currentBest) {
      localStorage.setItem(bestKey, finalScore.toString());
      ctx.dialogue.show("Mentor", `${msg} New personal best! (${finalScore})`);
    } else {
      ctx.dialogue.show("Mentor", `${msg} Your best: ${currentBest}`);
    }

    ctx.onComplete({ score: finalScore, time: elapsed, best: newBest });
  },

  shutdown(scene) {
    if (this._hazards) {
      this._hazards.forEach(h => h.destroy());
      this._hazards = [];
    }
    this._player = null;
  },
};