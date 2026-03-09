import { FONT_FAMILY } from "../weeks/weekUtils";

const BOX_HEIGHT = 100;

export class DialogueBox {
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.scale;

    this.bg = scene.add
      .rectangle(width / 2, height - BOX_HEIGHT / 2 - 8, width - 32, BOX_HEIGHT, 0x0a1622, 0.92)
      .setStrokeStyle(2, 0xb8f2e6, 0.6)
      .setScrollFactor(0)
      .setDepth(100);

    this.label = scene.add
      .text(40, height - BOX_HEIGHT - 2, "", {
        color: "#b8f2e6",
        fontFamily: FONT_FAMILY,
        fontSize: "12px",
        fontStyle: "bold",
      })
      .setScrollFactor(0)
      .setDepth(101);

    this.text = scene.add
      .text(40, height - BOX_HEIGHT + 18, "", {
        color: "#f6f4ec",
        fontFamily: FONT_FAMILY,
        fontSize: "15px",
        wordWrap: { width: width - 80 },
        lineSpacing: 4,
      })
      .setScrollFactor(0)
      .setDepth(101);

    this.hide();
  }

  show(speaker, message) {
    this.label.setText(speaker);
    this.text.setText(message);
    this.bg.setVisible(true);
    this.label.setVisible(true);
    this.text.setVisible(true);
  }

  hide() {
    this.bg.setVisible(false);
    this.label.setVisible(false);
    this.text.setVisible(false);
  }

  destroy() {
    this.bg.destroy();
    this.label.destroy();
    this.text.destroy();
  }
}
