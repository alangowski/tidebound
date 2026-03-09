import { createTitle, createInstructionText, createScoreText, formatCurrency } from "./weekUtils";

const PAYCHECK = 1000;
const TAX_RATE = 0.2;

const PUBLIC_SERVICES = [
  { label: "Roads", color: 0x56cfff },
  { label: "Schools", color: 0xffcf56 },
  { label: "Parks", color: 0x56ff9e },
  { label: "Fire Dept", color: 0xff8c56 },
];

export default {
  key: "week5",
  title: "Week 5: Taxes",

  create(scene, ctx) {
    const { width, height } = scene.scale;
    const { group } = ctx;

    createTitle(scene, group, this.title);
    createInstructionText(scene, group, "Click the paycheck to see how taxes work");

    this._score = createScoreText(scene, group, width - 140, 20);
    this._ctx = ctx;
    this._taxed = false;
    this._timers = [];

    const cx = width / 2;
    const cy = height / 2 - 20;

    // Paycheck rectangle
    this._paycheck = scene.add.rectangle(cx, cy, 200, 100, 0x56ff9e, 0.8)
      .setStrokeStyle(2, 0x56ff9e);
    group.add(this._paycheck);

    this._paycheckLabel = scene.add.text(cx, cy - 12, formatCurrency(PAYCHECK), {
      color: "#0a1622", fontFamily: "sans-serif", fontSize: "22px", fontStyle: "bold",
    }).setOrigin(0.5);
    group.add(this._paycheckLabel);

    this._paycheckSub = scene.add.text(cx, cy + 14, "Your Paycheck", {
      color: "#0a1622", fontFamily: "sans-serif", fontSize: "12px",
    }).setOrigin(0.5);
    group.add(this._paycheckSub);

    // Tax Monster button
    this._taxBtn = scene.add.text(cx, cy + 80, "Tax Monster!", {
      color: "#f6f4ec", fontFamily: "sans-serif", fontSize: "14px", fontStyle: "bold",
      backgroundColor: "#cc3333", padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    group.add(this._taxBtn);

    this._taxBtn.on("pointerdown", () => {
      if (this._taxed) return;
      this._taxed = true;
      this._taxBtn.disableInteractive();
      this._taxBtn.setStyle({ backgroundColor: "#663333" });

      const taxAmount = PAYCHECK * TAX_RATE;
      const netPay = PAYCHECK - taxAmount;

      // Shrink paycheck
      scene.tweens.add({
        targets: this._paycheck,
        scaleX: 0.8,
        scaleY: 0.8,
        duration: 500,
        ease: "Sine.easeOut",
      });

      this._paycheckLabel.setText(formatCurrency(netPay));

      // Tax portion
      const taxRect = scene.add.rectangle(cx, cy - 80, 200 * TAX_RATE, 30, 0xcc3333, 0.7)
        .setStrokeStyle(1, 0xff5555);
      group.add(taxRect);

      const taxLabel = scene.add.text(cx, cy - 80, `Tax: ${formatCurrency(taxAmount)}`, {
        color: "#f6f4ec", fontFamily: "sans-serif", fontSize: "12px",
      }).setOrigin(0.5);
      group.add(taxLabel);

      // Spawn public service icons
      PUBLIC_SERVICES.forEach((svc, i) => {
        const sx = width * 0.15 + i * (width * 0.22);
        const sy = height - 70;

        this._timers.push(scene.time.delayedCall(400 + i * 300, () => {
          const icon = scene.add.circle(sx, sy, 18, svc.color, 0.8);
          group.add(icon);
          icon.setScale(0);
          scene.tweens.add({
            targets: icon,
            scaleX: 1, scaleY: 1,
            duration: 400,
            ease: "Back.easeOut",
          });

          const label = scene.add.text(sx, sy + 28, svc.label, {
            color: "#b8f2e6", fontFamily: "sans-serif", fontSize: "11px",
          }).setOrigin(0.5);
          group.add(label);
        }));
      });

      this._score.add(50);

      this._timers.push(scene.time.delayedCall(1800, () => {
        ctx.dialogue.show("Mentor", "Taxes pay for services everyone uses: roads, schools, parks, and more!");
        ctx.onComplete({ score: this._score.value });
      }));
    });

    ctx.dialogue.show("Mentor", `You earned ${formatCurrency(PAYCHECK)}. But first, the Tax Monster takes a bite!`);
  },

  update() {},

  shutdown() {
    if (this._timers) {
      this._timers.forEach(t => t.remove());
      this._timers = [];
    }
  },
};
