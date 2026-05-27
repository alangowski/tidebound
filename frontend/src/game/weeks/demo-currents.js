import Phaser from "phaser";
import {
  createTitle,
  createInstructionText,
  createScoreText,
  flashFeedback,
  getSafePlayArea,
} from "./weekUtils";

/**
 * Third Character Demo: "Riding the Currents"
 *
 * Focus: Player character + environmental interaction.
 * The tidepool has moving currents that push both the explorer and collectible shells.
 * The player must skillfully intercept valuable shells before they are swept away.
 *
 * Educational angle: Sometimes you have to work *with* external forces
 * (market conditions, life circumstances) rather than against them.
 */
export default {
  key: "demo-currents",
  title: "Demo: Riding the Currents",

  create(scene, ctx) {
    const { width, height } = scene.scale;
    const { group } = ctx;

    createTitle(scene, group, this.title);
    createInstructionText(scene, group, "Fight the currents to catch the drifting shells before they escape!");

    this._score = createScoreText(scene, group, width - 140, 20);
    this._ctx = ctx;
    this._finished = false;
    this._shells = [];
    this._currents = [];
    this._collected = 0;

    const area = getSafePlayArea(scene);

    // Create the player explorer
    this._player = ctx.createPlayerCharacter({
      x: area.centerX - 120,
      y: area.centerY,
      size: 26,
      legendText: "Arrows/WASD or joystick  •  Currents push you — time your moves!",
    });

    // Create several drifting "valuable shells"
    for (let i = 0; i < 7; i++) {
      const shell = this._createShell(scene, group, area);
      this._shells.push(shell);
    }

    // Create subtle current indicators (visual only for now)
    this._createCurrentVisuals(scene, group, area);

    ctx.dialogue.show("Mentor", "The currents are strong today. Don't fight them head-on — work with the flow.");
  },

  _createShell(scene, group, area) {
    const x = Phaser.Math.Between(area.x + 80, area.x + area.width - 80);
    const y = Phaser.Math.Between(area.y + 30, area.y + area.height - 30);

    const shell = scene.add.text(x, y, "🐚", {
      fontSize: "22px",
    }).setOrigin(0.5);

    // Give each shell a gentle drifting velocity
    shell.setData("vx", Phaser.Math.Between(-35, 35));
    shell.setData("vy", Phaser.Math.Between(-20, 20));
    shell.setData("collected", false);

    group.add(shell);
    return shell;
  },

  _createCurrentVisuals(scene, group, area) {
    // Subtle flowing arrows / lines to indicate current direction
    for (let i = 0; i < 4; i++) {
      const y = area.y + 50 + i * (area.height / 5);
      const line = scene.add.graphics();
      line.lineStyle(2, 0x56cfff, 0.25);
      line.beginPath();
      line.moveTo(area.x + 20, y);
      line.lineTo(area.x + area.width - 20, y + Math.sin(i) * 12);
      line.strokePath();
      group.add(line);
    }
  },

  update(scene, time, delta) {
    if (this._finished || !this._player) return;

    const dt = delta / 1000;
    const playerPos = this._player.getPosition();

    // Update drifting shells
    for (let i = this._shells.length - 1; i >= 0; i--) {
      const shell = this._shells[i];
      if (!shell || shell.getData("collected")) continue;

      let x = shell.x + shell.getData("vx") * dt;
      let y = shell.y + shell.getData("vy") * dt;

      // Gentle wrapping / bouncing at edges
      const area = getSafePlayArea(scene);
      if (x < area.x) x = area.x + area.width - 10;
      if (x > area.x + area.width) x = area.x + 10;
      if (y < area.y) y = area.y + area.height - 10;
      if (y > area.y + area.height) y = area.y + 10;

      shell.x = x;
      shell.y = y;

      // Check collection
      const dist = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, x, y);
      if (dist < 30) {
        shell.setData("collected", true);
        shell.setAlpha(0.3);
        this._score.add(18);
        this._collected++;

        flashFeedback(scene, this._ctx.group, x, y - 20, "Caught!", "#56ff9e");

        // Remove after short delay
        scene.time.delayedCall(400, () => {
          if (shell.active) shell.destroy();
        });

        this._shells.splice(i, 1);

        if (this._collected >= 5) {
          this._finish(scene, this._ctx, true);
        }
      }
    }

    // Apply gentle current forces to the player (makes control interesting)
    if (this._player.body && this._player.body.body) {
      const body = this._player.body.body;
      const currentForceX = Math.sin(time / 1800) * 28;
      const currentForceY = Math.cos(time / 2200) * 18;

      body.setVelocity(
        body.velocity.x + currentForceX * dt,
        body.velocity.y + currentForceY * dt
      );
    }
  },

  _finish(scene, ctx, success) {
    if (this._finished) return;
    this._finished = true;

    if (this._player && this._player.celebrate) {
      this._player.celebrate(1000);
    }

    const msg = success
      ? `Excellent! You caught ${this._collected} shells despite the currents.`
      : "The currents were tricky today.";

    const bestKey = 'tidebound_best_currents';
    const currentBest = parseInt(localStorage.getItem(bestKey) || '0', 10);
    const newBest = Math.max(currentBest, this._score.value);

    if (this._score.value > currentBest) {
      localStorage.setItem(bestKey, this._score.value.toString());
      ctx.dialogue.show("Mentor", `${msg} New personal best! (${this._score.value})`);
    } else {
      ctx.dialogue.show("Mentor", `${msg} Your best: ${currentBest}`);
    }

    ctx.onComplete({ score: this._score.value, collected: this._collected, best: newBest });
  },

  shutdown() {
    this._shells = [];
    this._player = null;
  },
};