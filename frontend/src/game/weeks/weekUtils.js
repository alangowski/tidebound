export const FONT_FAMILY = "Avenir Next, Trebuchet MS, sans-serif";

export const MENTORS = {
  pug: { name: "Captain Pug", emoji: "🐶" },
  fox: { name: "Professor Fox", emoji: "🦊" },
};

export function createScoreText(scene, group, x, y, initialScore = 0) {
  const text = scene.add.text(x, y, `Score: ${initialScore}`, {
    color: "#ffcf56",
    fontFamily: FONT_FAMILY,
    fontSize: "18px",
    fontStyle: "bold",
  });
  group.add(text);
  return {
    value: initialScore,
    display: text,
    add(points) {
      this.value += points;
      this.display.setText(`Score: ${this.value}`);
    },
  };
}

export function createTitle(scene, group, title) {
  const { width } = scene.scale;
  const text = scene.add
    .text(width / 2, 20, title, {
      color: "#f6f4ec",
      fontFamily: FONT_FAMILY,
      fontSize: "22px",
      fontStyle: "600",
    })
    .setOrigin(0.5, 0);
  group.add(text);
  return text;
}

export function createInstructionText(scene, group, msg, y) {
  const { width } = scene.scale;
  const text = scene.add
    .text(width / 2, y || 54, msg, {
      color: "#b8f2e6",
      fontFamily: FONT_FAMILY,
      fontSize: "13px",
    })
    .setOrigin(0.5, 0);
  group.add(text);
  return text;
}

export function flashFeedback(scene, group, x, y, message, color = "#56ff9e") {
  const fb = scene.add
    .text(x, y, message, {
      color,
      fontFamily: FONT_FAMILY,
      fontSize: "16px",
      fontStyle: "bold",
    })
    .setOrigin(0.5);
  group.add(fb);
  scene.tweens.add({
    targets: fb,
    alpha: 0,
    y: y - 30,
    duration: 800,
    onComplete: () => fb.destroy(),
  });
}

export function formatCurrency(amount) {
  return `$${amount.toLocaleString()}`;
}
