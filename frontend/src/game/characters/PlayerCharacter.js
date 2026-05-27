import Phaser from "phaser";

const COLORS = {
  body: 0x3a7ca5,       // Deep ocean blue for wetsuit/hoodie
  head: 0xf6d5a8,       // Warm skin tone
  accent: 0x56cfff,     // Bright tide cyan
  highlight: 0xb8f2e6,  // Light seafoam
  leg: 0x2a5f7a,
  eye: 0x0a1622,
  mentorPug: 0xffcf56,
  mentorFox: 0xff8c56,
};

/**
 * PlayerCharacter
 * A procedural, animated "kid explorer" avatar for Tidebound weeks.
 * Supports keyboard (arrows + WASD) and pointer click-to-move.
 * Includes a small floating mentor companion visual that echoes the selected mentor.
 *
 * Designed to be sprite-ready: constructor accepts useSprites flag (future).
 *
 * Usage in a week:
 *   const player = ctx.createPlayerCharacter({ x: 200, y: 200, mentorChoice: 'pug' });
 *   // later in week.update:
 *   player.update(time, delta);
 */
export class PlayerCharacter {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {{ mentorChoice?: 'pug'|'fox', size?: number, useSprites?: boolean }} [options]
   */
  constructor(scene, x, y, options = {}) {
    this.scene = scene;
    this.mentorChoice = options.mentorChoice || "pug";
    this.size = options.size || 28;
    this.useSprites = !!options.useSprites; // future hook

    this.speed = 180; // px/sec base speed
    this.baseSpeed = 180;
    this.velocity = { x: 0, y: 0 };

    // Dash state
    this._dashCooldown = 0;
    this._isDashing = false;
    this._dashMultiplier = 2.4;
    this._dashDuration = 220; // ms
    this._dashCooldownTime = 850; // ms

    // Carry/Throw state
    this._carriedObject = null;
    this._carryOffset = { x: 0, y: -18 }; // default carry position relative to player
    this._isCarrying = false;

    // Simple event system for weeks to react to player actions
    this.events = new Phaser.Events.EventEmitter();

    this._input = {
      cursors: null,
      wasd: null,
      pointerDown: false,
      targetX: null,
      targetY: null,
      joystickX: 0,
      joystickY: 0,
    };

    this._animState = "idle"; // idle | walk | interact | celebrate
    this._animTime = 0;
    this._legPhase = 0;

    this._createVisuals(x, y);
    this._setupInput();
  }

  _createVisuals(x, y) {
    const { scene, size } = this;
    const s = size;

    // Main container (all visuals live here)
    this.container = scene.add.container(x, y);
    this.container.setDepth(50); // above most week content, below dialogue

    // === Physics proxy body (small invisible circle for future collisions) ===
    // We keep a separate lightweight body so weeks can do overlap checks easily.
    this.body = scene.add.circle(x, y, s * 0.55, 0x000000, 0.0);
    scene.physics.add.existing(this.body);
    this.body.body.setCollideWorldBounds(true);
    this.body.body.setDamping(true);
    this.body.body.setDrag(800, 800);
    this.body.body.setMaxVelocity(this.speed * 1.4, this.speed * 1.4);

    // Hide the body graphic (we only use it for physics + position source)
    this.body.setVisible(false);

    // === Visual parts (drawn into the container) ===

    // Shadow / ripple under feet
    this._shadow = scene.add.ellipse(0, s * 0.75, s * 1.6, s * 0.45, 0x000000, 0.18);
    this.container.add(this._shadow);

    // Legs (two small rounded shapes that will swing)
    this._legL = scene.add.ellipse(-s * 0.22, s * 0.38, s * 0.32, s * 0.55, COLORS.leg, 0.95);
    this._legR = scene.add.ellipse(s * 0.22, s * 0.38, s * 0.32, s * 0.55, COLORS.leg, 0.95);
    this.container.add([this._legL, this._legR]);

    // Main body (wetsuit / hoodie)
    this._body = scene.add.ellipse(0, 0, s * 0.95, s * 1.05, COLORS.body, 1)
      .setStrokeStyle(2, COLORS.highlight, 0.6);
    this.container.add(this._body);

    // Accent stripe on body
    this._stripe = scene.add.rectangle(0, -s * 0.05, s * 0.9, 5, COLORS.accent, 0.7);
    this.container.add(this._stripe);

    // Head
    this._head = scene.add.ellipse(0, -s * 0.52, s * 0.78, s * 0.78, COLORS.head, 1)
      .setStrokeStyle(2, 0x000000, 0.15);
    this.container.add(this._head);

    // Snorkel / hood detail (cute mask look)
    this._mask = scene.add.ellipse(0, -s * 0.48, s * 0.55, s * 0.32, 0x1a3a4f, 0.85);
    this.container.add(this._mask);

    // Eyes (white + pupil)
    const eyeY = -s * 0.58;
    this._eyeL = scene.add.ellipse(-s * 0.18, eyeY, s * 0.22, s * 0.18, 0xffffff, 1);
    this._eyeR = scene.add.ellipse(s * 0.18, eyeY, s * 0.22, s * 0.18, 0xffffff, 1);
    this.container.add([this._eyeL, this._eyeR]);

    this._pupilL = scene.add.ellipse(-s * 0.16, eyeY, s * 0.1, s * 0.1, COLORS.eye, 1);
    this._pupilR = scene.add.ellipse(s * 0.2, eyeY, s * 0.1, s * 0.1, COLORS.eye, 1);
    this.container.add([this._pupilL, this._pupilR]);

    // Small arm / flipper suggestion (right side, can wave on celebrate)
    this._arm = scene.add.ellipse(s * 0.42, -s * 0.05, s * 0.28, s * 0.55, COLORS.body, 0.9)
      .setStrokeStyle(1, COLORS.highlight, 0.4);
    this.container.add(this._arm);

    // === Mentor companion (small floating shape above-left of head) ===
    const mentorColor = this.mentorChoice === "fox" ? COLORS.mentorFox : COLORS.mentorPug;
    const mentorEmoji = this.mentorChoice === "fox" ? "🦊" : "🐶";

    this._mentorBg = scene.add.circle(-s * 0.85, -s * 1.05, s * 0.32, mentorColor, 0.9)
      .setStrokeStyle(1.5, 0x000000, 0.2);
    this.container.add(this._mentorBg);

    this._mentorLabel = scene.add.text(-s * 0.85, -s * 1.05, mentorEmoji, {
      fontSize: `${Math.round(s * 0.55)}px`,
      align: "center",
    }).setOrigin(0.5);
    this.container.add(this._mentorLabel);

    // Subtle bob offset for mentor (independent of main bob)
    this._mentorBob = 0;
    this._trailTimer = 0;
  }

  _setupInput() {
    const { scene } = this;

    // Keyboard cursors (arrows)
    this._input.cursors = scene.input.keyboard.createCursorKeys();

    // WASD
    this._input.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // Dash key (Space) – created once
    this._dashKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Grab/Throw key (E)
    this._grabKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Surge key (Q)
    this._surgeKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

    // Pointer (click to move) — only when inside the game view
    scene.input.on("pointerdown", (pointer) => {
      // Ignore clicks that land in the dialogue box area
      const { height } = scene.scale;
      const bottomLimit = height - 92;
      if (pointer.y > bottomLimit) return;

      // Check if this is a virtual joystick interaction (bottom-left zone)
      if (this._tryStartJoystick(pointer)) {
        return;
      }

      this._input.pointerDown = true;
      this._input.targetX = pointer.x;
      this._input.targetY = pointer.y;
    });

    // Also support pointer move while held for "drag to steer" feel
    scene.input.on("pointermove", (pointer) => {
      if (this._joystickActive) {
        this._updateJoystick(pointer);
        return;
      }
      if (this._input.pointerDown) {
        this._input.targetX = pointer.x;
        this._input.targetY = pointer.y;
      }
    });

    scene.input.on("pointerup", (pointer) => {
      if (this._joystickActive) {
        this._endJoystick();
      }
      this._input.pointerDown = false;
    });

    // Create virtual joystick graphics (initially hidden)
    this._createVirtualJoystick();

    // Subtle indicator that touch/joystick controls are available
    this._createJoystickHint();

    // On touch devices, make the joystick more discoverable
    this._isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  _createJoystickHint() {
    const scene = this.scene;
    const { width, height } = scene.scale;

    this._joystickHint = scene.add.graphics();
    this._joystickHint.setDepth(180);

    const isTouch = this._isTouchDevice;
    const alpha = isTouch ? 0.55 : 0.35;
    const size = isTouch ? 16 : 11;

    this._joystickHint.setAlpha(alpha);

    // Small pulsing circle in bottom left
    const x = 48;
    const y = height - 48;

    this._joystickHint.fillStyle(0x56cfff, 0.7);
    this._joystickHint.fillCircle(x, y, size);
    this._joystickHint.lineStyle(isTouch ? 3 : 2, 0xb8f2e6, 0.6);
    this._joystickHint.strokeCircle(x, y, size);

    // On touch devices, add a small "tap" label
    if (isTouch) {
      this._joystickHintText = scene.add.text(x + 28, y, "tap for\njoystick", {
        fontSize: "10px",
        color: "#56cfff",
        alpha: 0.7,
      }).setOrigin(0, 0.5);
    }

    // Gentle pulse animation
    scene.tweens.add({
      targets: this._joystickHint,
      alpha: { from: isTouch ? 0.25 : 0.15, to: isTouch ? 0.65 : 0.45 },
      duration: isTouch ? 1200 : 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  _createVirtualJoystick() {
    const scene = this.scene;

    // Joystick base (outer ring)
    this._joystickBase = scene.add.graphics();
    this._joystickBase.setDepth(200);
    this._joystickBase.setVisible(false);

    // Joystick knob (inner movable part)
    this._joystickKnob = scene.add.graphics();
    this._joystickKnob.setDepth(201);
    this._joystickKnob.setVisible(false);

    this._joystickActive = false;
    this._joystickBasePos = { x: 0, y: 0 };
    this._joystickRadius = 42;
  }

  _tryStartJoystick(pointer) {
    const { width, height } = this.scene.scale;
    const joystickZoneSize = 140;

    // Bottom-left corner zone
    if (pointer.x < joystickZoneSize && pointer.y > height - joystickZoneSize) {
      this._joystickActive = true;
      this._joystickBasePos = { x: pointer.x, y: pointer.y };

      this._drawJoystick(pointer.x, pointer.y, 0, 0);
      this._joystickBase.setVisible(true);
      this._joystickKnob.setVisible(true);

      return true;
    }
    return false;
  }

  _updateJoystick(pointer) {
    if (!this._joystickActive) return;

    const dx = pointer.x - this._joystickBasePos.x;
    const dy = pointer.y - this._joystickBasePos.y;
    const dist = Math.hypot(dx, dy);
    const radius = this._joystickRadius;

    let offsetX = dx;
    let offsetY = dy;

    if (dist > radius) {
      const scale = radius / dist;
      offsetX *= scale;
      offsetY *= scale;
    }

    this._drawJoystick(this._joystickBasePos.x, this._joystickBasePos.y, offsetX, offsetY);

    // Store normalized input for velocity calculation
    this._input.joystickX = offsetX / radius;
    this._input.joystickY = offsetY / radius;
  }

  _drawJoystick(baseX, baseY, offsetX, offsetY) {
    const r = this._joystickRadius;

    // Base ring - more visible
    this._joystickBase.clear();
    this._joystickBase.lineStyle(4, 0x56cfff, 0.65);
    this._joystickBase.fillStyle(0x0a1622, 0.55);
    this._joystickBase.strokeCircle(baseX, baseY, r);
    this._joystickBase.fillCircle(baseX, baseY, r * 0.28);

    // Inner subtle guide
    this._joystickBase.lineStyle(1, 0xb8f2e6, 0.3);
    this._joystickBase.strokeCircle(baseX, baseY, r * 0.6);

    // Knob
    const knobX = baseX + offsetX;
    const knobY = baseY + offsetY;
    this._joystickKnob.clear();
    this._joystickKnob.fillStyle(0x56cfff, 0.9);
    this._joystickKnob.fillCircle(knobX, knobY, 18);
    this._joystickKnob.lineStyle(2, 0xffffff, 0.7);
    this._joystickKnob.strokeCircle(knobX, knobY, 18);

    // Small center dot
    this._joystickKnob.fillStyle(0xffffff, 0.8);
    this._joystickKnob.fillCircle(knobX, knobY, 5);
  }

  _endJoystick() {
    this._joystickActive = false;
    this._input.joystickX = 0;
    this._input.joystickY = 0;

    if (this._joystickBase) this._joystickBase.setVisible(false);
    if (this._joystickKnob) this._joystickKnob.setVisible(false);

    // Hide the hint once the player has used the joystick
    if (this._joystickHint) {
      this._joystickHint.setVisible(false);
    }
    if (this._joystickHintText) {
      this._joystickHintText.setVisible(false);
    }
  }

  /**
   * Call every frame from the owning week's update() or GameScene.
   * Handles movement, animation, and input.
   */
  update(time, delta) {
    if (!this.container || !this.body || !this.body.body) return;

    const dt = delta / 1000;
    const speed = this.speed;
    let vx = 0;
    let vy = 0;

    const cursors = this._input.cursors;
    const wasd = this._input.wasd;

    // Keyboard
    if (cursors.left.isDown || wasd.left.isDown) vx -= 1;
    if (cursors.right.isDown || wasd.right.isDown) vx += 1;
    if (cursors.up.isDown || wasd.up.isDown) vy -= 1;
    if (cursors.down.isDown || wasd.down.isDown) vy += 1;

    // Dash input (Space)
    if (Phaser.Input.Keyboard.JustDown(this._dashKey)) {
      this.dash();
    }

    // Grab / Throw toggle (E)
    if (Phaser.Input.Keyboard.JustDown(this._grabKey)) {
      if (this._isCarrying) {
        this.throwCarried(1.0);
      } else {
        // Weeks are responsible for calling grab() when they want the player to pick something up.
        // Here we just emit an event so weeks can respond.
        this.events.emit('requestGrab');
      }
    }

    // Surge (Q) - strong forward push
    if (Phaser.Input.Keyboard.JustDown(this._surgeKey)) {
      this.surge();
    }

    // Hide joystick hint on first keyboard use
    if ((cursors.left.isDown || wasd.left.isDown || cursors.right.isDown || wasd.right.isDown ||
         cursors.up.isDown || wasd.up.isDown || cursors.down.isDown || wasd.down.isDown) &&
        this._joystickHint && this._joystickHint.visible) {
      this._joystickHint.setVisible(false);
    }

    // Virtual joystick (takes precedence if active) with deadzone
    if (this._joystickActive && (this._input.joystickX || this._input.joystickY)) {
      const jx = this._input.joystickX;
      const jy = this._input.joystickY;
      const magnitude = Math.hypot(jx, jy);

      if (magnitude > 0.22) { // deadzone
        vx = jx;
        vy = jy;
      }
    }

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      const len = Math.hypot(vx, vy);
      vx /= len;
      vy /= len;
    }

    // Pointer click-to-move (overrides keyboard if active)
    if (this._input.pointerDown && this._input.targetX != null) {
      const dx = this._input.targetX - this.body.x;
      const dy = this._input.targetY - this.body.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 6) {
        vx = dx / dist;
        vy = dy / dist;
      } else {
        // Arrived
        this._input.pointerDown = false;
        vx = 0;
        vy = 0;
      }
    }

    // Apply to physics body (smooth)
    const targetVx = vx * speed;
    const targetVy = vy * speed;

    this.body.body.setVelocity(
      Phaser.Math.Linear(this.body.body.velocity.x, targetVx, 0.35),
      Phaser.Math.Linear(this.body.body.velocity.y, targetVy, 0.35)
    );

    // Emit movement event for weeks that want to react
    if (Math.abs(targetVx) > 10 || Math.abs(targetVy) > 10) {
      this.events.emit('move', {
        x: this.container.x,
        y: this.container.y,
        vx: this.body.body.velocity.x,
        vy: this.body.body.velocity.y,
      });
    }

    // Sync visual container to body position (the source of truth)
    this.container.x = this.body.x;
    this.container.y = this.body.y;

    // Soft bottom clamp — keep the explorer out of the dialogue box area
    const { height } = this.scene.scale;
    const bottomLimit = height - 92;
    if (this.container.y > bottomLimit) {
      this.container.y = bottomLimit;
      if (this.body && this.body.body) {
        this.body.y = bottomLimit;
        this.body.body.setVelocityY(0);
      }
    }

    // Update animation state
    const moving = Math.abs(this.body.body.velocity.x) > 18 || Math.abs(this.body.body.velocity.y) > 18;
    const newState = moving ? "walk" : "idle";

    if (newState !== this._animState) {
      this._animState = newState;
      this._animTime = 0;
    }

    this._updateAnimations(dt);
    this._updateMentorCompanion(dt);
    this._updateTrail(dt);
    this._updateDash(dt * 1000);
    this._updateCarriedObject(dt);
  }

  _updateDash(deltaMs) {
    if (!this.body || !this.body.body) return;

    // Cooldown
    if (this._dashCooldown > 0) {
      this._dashCooldown = Math.max(0, this._dashCooldown - deltaMs);
    }

    // End dash after duration
    if (this._isDashing) {
      this._dashDurationRemaining = (this._dashDurationRemaining || this._dashDuration) - deltaMs;

      if (this._dashDurationRemaining <= 0) {
        this._isDashing = false;
        this.speed = this.baseSpeed;
        this.body.body.setVelocity(
          this.body.body.velocity.x * 0.6,
          this.body.body.velocity.y * 0.6
        );
        this._dashDurationRemaining = 0;
      }
    }
  }

  _updateCarriedObject(dt) {
    if (!this._isCarrying || !this._carriedObject || !this.container) return;

    const obj = this._carriedObject;
    const angle = this.container.rotation || 0;

    // Calculate desired position (slightly in front of the player)
    const offsetDist = 20;
    const targetX = this.container.x + Math.cos(angle) * offsetDist + this._carryOffset.x;
    const targetY = this.container.y + Math.sin(angle) * offsetDist + this._carryOffset.y;

    // Smooth follow with some spring
    const lerp = 0.32;
    obj.x = Phaser.Math.Linear(obj.x, targetX, lerp);
    obj.y = Phaser.Math.Linear(obj.y, targetY, lerp);

    // Gentle bobbing while carrying
    const bob = Math.sin(this._animTime * 7.5) * 1.8;
    obj.y += bob;

    // Keep arm in carrying pose while holding something
    if (this._arm) {
      this._arm.rotation = Phaser.Math.Linear(this._arm.rotation, -0.65, 0.2);
    }

    // Make carried object look slightly smaller
    if (obj.setScale) {
      const original = obj.getData('originalScale') || 1;
      const targetScale = original * 0.82;
      obj.setScale(Phaser.Math.Linear(obj.scale || 1, targetScale, 0.15));
    }
  }

  _updateTrail(dt) {
    if (!this.body || !this.body.body) return;

    const speed = Math.hypot(this.body.body.velocity.x, this.body.body.velocity.y);
    const threshold = this._isDashing ? 40 : 55;

    if (speed < threshold) return;

    // Very lightweight bubble trail (no real particle system for simplicity)
    if (!this._trailTimer) this._trailTimer = 0;
    const interval = this._isDashing ? 0.035 : 0.07;
    this._trailTimer += dt;

    if (this._trailTimer > interval) {
      this._trailTimer = 0;

      const size = this._isDashing ? 4.5 : 3;
      const alpha = this._isDashing ? 0.55 : 0.35;

      const trail = this.scene.add.circle(
        this.container.x - this.body.body.velocity.x * 0.04,
        this.container.y + 8,
        size,
        0x56cfff,
        alpha
      );
      trail.setDepth(this.container.depth - 1);

      const dur = this._isDashing ? 280 : 380;
      this.scene.tweens.add({
        targets: trail,
        alpha: 0,
        scale: this._isDashing ? 0.2 : 0.3,
        duration: dur,
        onComplete: () => trail.destroy(),
      });
    }
  }

  _updateAnimations(dt) {
    this._animTime += dt;
    const s = this.size;
    const walkCycle = Math.sin(this._animTime * 12) * 0.6; // leg swing speed

    if (this._animState === "walk") {
      // Leg swing
      this._legL.rotation = walkCycle * 0.7;
      this._legR.rotation = -walkCycle * 0.7;

      // Subtle body bob
      const bob = Math.sin(this._animTime * 14) * 1.2;
      this._body.y = bob * 0.3;
      this._head.y = -s * 0.52 + bob * 0.2;

      // Eyes look forward-ish, slight side-to-side with movement
      const velX = this.body.body.velocity.x;
      const look = Phaser.Math.Clamp(velX / 120, -1, 1) * 2.2;
      this._pupilL.x = -s * 0.16 + look;
      this._pupilR.x = s * 0.2 + look;
    } else {
      // Idle — gentle breathing / bob
      const idleBob = Math.sin(this._animTime * 3.2) * 0.8;
      this._legL.rotation = idleBob * 0.04;
      this._legR.rotation = -idleBob * 0.04;
      this._body.y = idleBob * 0.15;
      this._head.y = -s * 0.52 + idleBob * 0.1;

      // Eyes look gently around
      const look = Math.sin(this._animTime * 1.8) * 0.9;
      this._pupilL.x = -s * 0.16 + look;
      this._pupilR.x = s * 0.2 + look * 0.6;
    }

    // Arm gentle sway in walk, bigger flourish on celebrate
    if (this._animState === "walk") {
      this._arm.rotation = Math.sin(this._animTime * 9) * 0.25;
    } else {
      this._arm.rotation = Math.sin(this._animTime * 2.5) * 0.08;
    }

    // Simple facing: tilt the whole character slightly based on horizontal velocity
    const velX = this.body?.body?.velocity?.x || 0;
    const targetRotation = Phaser.Math.Clamp(velX / 280, -0.18, 0.18);
    this.container.rotation = Phaser.Math.Linear(this.container.rotation, targetRotation, 0.12);
  }

  _updateMentorCompanion(dt) {
    // Gentle independent floating bob for the little mentor icon
    this._mentorBob += dt * 4.2;
    const bob = Math.sin(this._mentorBob) * 1.8;
    const s = this.size;

    this._mentorBg.y = -s * 1.05 + bob;
    this._mentorLabel.y = -s * 1.05 + bob;
  }

  /**
   * Public API — weeks call these
   */
  setSpeed(newSpeed) {
    if (typeof newSpeed === "number" && newSpeed > 0) {
      this.baseSpeed = newSpeed;
      if (!this._isDashing) this.speed = newSpeed;
    }
  }

  /**
   * Triggers a short dash in the current movement direction (or forward if stationary).
   * Has a cooldown. Weeks can call this or let the default Space key handle it.
   */
  dash() {
    if (this._dashCooldown > 0 || !this.body || !this.body.body) return;

    const body = this.body.body;
    const vx = body.velocity.x;
    const vy = body.velocity.y;

    let dirX = vx;
    let dirY = vy;

    // If almost stationary, dash forward based on last input direction or facing
    const mag = Math.hypot(dirX, dirY);
    if (mag < 20) {
      // Use current container rotation as facing
      dirX = Math.cos(this.container.rotation || 0);
      dirY = Math.sin(this.container.rotation || 0);
    } else {
      dirX /= mag;
      dirY /= mag;
    }

    const dashSpeed = this.baseSpeed * this._dashMultiplier;
    body.setVelocity(dirX * dashSpeed, dirY * dashSpeed);

    this._isDashing = true;
    this.speed = this.baseSpeed * this._dashMultiplier;
    this._dashCooldown = this._dashCooldownTime;
    this._dashDurationRemaining = this._dashDuration;

    this.events.emit('dash');

    // Stronger visual trail during dash
    this._dashTrailTimer = 0;
  }

  /**
   * Attempts to grab an object to carry.
   * The object should be a Phaser GameObject with x/y (and preferably setData support).
   * Returns true if grab succeeded.
   */
  grab(object) {
    if (this._isCarrying || !object || !this.container) return false;

    // Basic validation
    if (typeof object.x !== 'number' || typeof object.y !== 'number') return false;

    this._carriedObject = object;
    this._isCarrying = true;

    // Store original scale if possible
    if (!object.getData('originalScale')) {
      object.setData('originalScale', object.scale || 1);
    }

    this.events.emit('grab', { object });

    // Slight visual feedback on player - arm in "carrying" pose
    if (this._arm) {
      this.scene.tweens.add({
        targets: this._arm,
        rotation: -0.75,
        duration: 140,
      });
    }

    return true;
  }

  /**
   * Throws the currently carried object with force based on player's velocity + direction.
   */
  throwCarried(strength = 1.0) {
    if (!this._isCarrying || !this._carriedObject) return false;

    const obj = this._carriedObject;
    const body = this.body?.body;

    let vx = (body ? body.velocity.x : 0) * 0.9;
    let vy = (body ? body.velocity.y : 0) * 0.9;

    // If barely moving, throw forward
    if (Math.hypot(vx, vy) < 30) {
      const angle = this.container.rotation || 0;
      vx = Math.cos(angle) * 180 * strength;
      vy = Math.sin(angle) * 180 * strength;
    } else {
      const mag = Math.hypot(vx, vy) || 1;
      vx = (vx / mag) * 220 * strength;
      vy = (vy / mag) * 220 * strength;
    }

    // Apply velocity to the object (simple data-based for now)
    if (obj.setData) {
      obj.setData('vx', (obj.getData('vx') || 0) + vx);
      obj.setData('vy', (obj.getData('vy') || 0) + vy);
    } else {
      // Fallback: direct position nudge + tween
      obj.x += vx * 0.02;
      obj.y += vy * 0.02;
    }

    // Scale back to normal
    const originalScale = obj.getData?.('originalScale') || 1;
    if (obj.setScale) obj.setScale(originalScale);

    this.events.emit('throw', { object: obj, vx, vy });

    // Throw particles (lightweight)
    for (let i = 0; i < 5; i++) {
      const p = this.scene.add.circle(
        this.container.x + (Math.random() - 0.5) * 12,
        this.container.y - 8,
        3,
        0x56cfff,
        0.6
      );
      p.setDepth(this.container.depth + 1);

      const pvx = vx * (0.6 + Math.random() * 0.3);
      const pvy = vy * (0.6 + Math.random() * 0.3) - 40;

      this.scene.tweens.add({
        targets: p,
        x: p.x + pvx * 0.08,
        y: p.y + pvy * 0.08,
        alpha: 0,
        scale: 0.2,
        duration: 280 + Math.random() * 120,
        onComplete: () => p.destroy(),
      });
    }

    // Release
    this._carriedObject = null;
    this._isCarrying = false;

    // Arm animation on throw
    if (this._arm) {
      this.scene.tweens.add({
        targets: this._arm,
        rotation: 0.9,
        duration: 130,
        yoyo: true,
      });
    }

    // Mentor companion excited reaction
    if (this._mentorBg && this._mentorLabel) {
      this.scene.tweens.add({
        targets: [this._mentorBg, this._mentorLabel],
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 120,
        yoyo: true,
      });
    }

    return true;
  }

  /**
   * Drops the currently carried object without throwing it.
   */
  releaseCarried() {
    if (!this._isCarrying) return false;

    const obj = this._carriedObject;
    const originalScale = obj?.getData?.('originalScale') || 1;

    if (obj?.setScale) obj.setScale(originalScale);

    this.events.emit('release', { object: obj });

    this._carriedObject = null;
    this._isCarrying = false;

    return true;
  }

  /**
   * Surge: Releases a strong forward push in a cone, affecting nearby objects.
   * Great for clearing groups of orbs or giving big momentum.
   */
  surge(strength = 1.0) {
    if (!this.container) return;

    const angle = this.container.rotation || 0;
    const pushX = Math.cos(angle);
    const pushY = Math.sin(angle);

    const surgeForce = 280 * strength;
    const coneWidth = Math.PI * 0.6; // ~108 degrees
    const range = 95;

    this.events.emit('surge', { angle, strength });

    // Visual feedback - quick forward "wave"
    const wave = this.scene.add.ellipse(
      this.container.x + pushX * 25,
      this.container.y + pushY * 25,
      18,
      42,
      0x56cfff,
      0.4
    );
    wave.setRotation(angle);
    wave.setDepth(this.container.depth + 1);

    this.scene.tweens.add({
      targets: wave,
      scaleX: 2.8,
      scaleY: 0.6,
      alpha: 0,
      duration: 320,
      onComplete: () => wave.destroy(),
    });

    // Return list of affected objects so weeks can react
    return { pushX, pushY, surgeForce, range, coneWidth };
  }

  setVelocity(vx, vy) {
    if (this.body && this.body.body) {
      this.body.body.setVelocity(vx, vy);
    }
  }

  stop() {
    if (this.body && this.body.body) {
      this.body.body.setVelocity(0, 0);
    }
    this._input.pointerDown = false;
  }

  moveTo(x, y) {
    // Simple direct move (teleport) — useful for setup
    if (this.body && this.body.body) {
      this.body.x = x;
      this.body.y = y;
      this.container.x = x;
      this.container.y = y;
    }
  }

  playAnim(state) {
    if (["idle", "walk", "interact", "celebrate"].includes(state)) {
      this._animState = state;
      this._animTime = 0;
    }
  }

  /**
   * Trigger a fun "success" animation (e.g. when completing a week goal).
   * Weeks can call this on the player returned from createPlayerCharacter.
   */
  celebrate(durationMs = 900) {
    this.playAnim("celebrate");
    this.events.emit('celebrate');
    const s = this.size;

    // Quick arm flourish + head bob
    if (this._arm) {
      this.scene.tweens.add({
        targets: this._arm,
        rotation: { from: -0.8, to: 0.8 },
        duration: 280,
        yoyo: true,
        repeat: 1,
      });
    }

    // Temporary scale pop on the whole container
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 160,
      yoyo: true,
      onComplete: () => {
        if (this.container) {
          this.container.setScale(1);
        }
        // Return to idle after the celebration window
        this.scene.time.delayedCall(durationMs, () => {
          if (this._animState === "celebrate") this.playAnim("idle");
        });
      },
    });
  }

  getPosition() {
    return { x: this.container.x, y: this.container.y };
  }

  getBounds() {
    const s = this.size;
    return new Phaser.Geom.Rectangle(
      this.container.x - s * 0.6,
      this.container.y - s * 0.9,
      s * 1.2,
      s * 1.6
    );
  }

  /**
   * Returns the underlying physics body (if any) for advanced collision work.
   */
  getBody() {
    return this.body?.body || null;
  }

  /**
   * Simple helper: returns true if this character overlaps a given Phaser object
   * (circle, rectangle, sprite, etc.).
   */
  overlaps(target) {
    if (!target || !this.container) return false;

    const b = this.getBounds();
    if (target.getBounds) {
      const tb = target.getBounds();
      return Phaser.Geom.Intersects.RectangleToRectangle(b, tb);
    }

    // Fallback for simple objects with x/y
    if (typeof target.x === 'number' && typeof target.y === 'number') {
      const radius = (target.radius || 12);
      return Phaser.Math.Distance.Between(this.container.x, this.container.y, target.x, target.y) < (this.size * 0.7 + radius);
    }

    return false;
  }

  /**
   * Call when the owning week is shutting down.
   */
  destroy() {
    // Clean up input listeners we attached to the scene
    const scene = this.scene;
    if (scene && scene.input) {
      // We don't have perfect reference to the handlers, so we rely on scene destroy
      // plus explicit removal of keyboard keys if we tracked them.
    }

    if (this._input.cursors) {
      // Cursors are managed by the scene keyboard plugin; safe to leave
    }

    // Destroy visuals
    if (this.container) {
      this.container.destroy(true);
    }
    if (this.body) {
      this.body.destroy();
    }
    if (this._joystickBase) this._joystickBase.destroy();
    if (this._joystickKnob) this._joystickKnob.destroy();
    if (this._joystickHint) this._joystickHint.destroy();
    if (this._joystickHintText) this._joystickHintText.destroy();

    this.container = null;
    this.body = null;
  }
}

export default PlayerCharacter;