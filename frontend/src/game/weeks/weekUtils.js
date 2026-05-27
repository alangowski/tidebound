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

/* ============================================================
   Character / Player Helpers (new in character system)
   ============================================================ */

/**
 * Returns a safe rectangular play area that avoids the fixed dialogue box
 * and screen edges. Weeks using player characters should keep the explorer
 * roughly inside this area.
 */
export function getSafePlayArea(scene) {
  const { width, height } = scene.scale;
  return {
    x: 50,
    y: 75,
    width: width - 100,
    height: height - 160, // leaves room for dialogue + title
    centerX: width / 2,
    centerY: height / 2 - 20,
  };
}

/**
 * Creates a small, dismissible or persistent control legend for weeks
 * that use the player character. Add the returned text objects to your week group
 * so they are cleaned up automatically on week change.
 */
export function createControlLegend(scene, group, text = "Arrow keys / WASD  •  Click or tap to move") {
  const { width } = scene.scale;
  const legend = scene.add.text(width / 2, 52, text, {
    color: "#7fb3d3",
    fontFamily: FONT_FAMILY,
    fontSize: "12px",
    align: "center",
  }).setOrigin(0.5, 0);
  group.add(legend);
  return legend;
}

/**
 * Simple color palette tokens useful when drawing custom character-related
 * elements inside weeks (e.g. collectibles that match the explorer).
 */
export const CHARACTER_COLORS = {
  body: 0x3a7ca5,
  accent: 0x56cfff,
  highlight: 0xb8f2e6,
  skin: 0xf6d5a8,
};

/**
 * Shows a temporary "How to Control" reminder that fades out after a few seconds.
 * Useful for character-based demos.
 */
export function showBriefControlHint(scene, group, text = "Arrows/WASD + Click  •  Space = Dash  •  E = Grab/Throw  •  Q = Surge") {
  const { width } = scene.scale;

  const hint = scene.add.text(width / 2, 78, text, {
    color: "#b8f2e6",
    fontFamily: FONT_FAMILY,
    fontSize: "13px",
    align: "center",
    backgroundColor: "rgba(10, 22, 34, 0.75)",
    padding: { x: 14, y: 5 },
  }).setOrigin(0.5);

  group.add(hint);

  // Fade out after 7 seconds
  scene.time.delayedCall(7000, () => {
    if (hint.active) {
      scene.tweens.add({
        targets: hint,
        alpha: 0,
        duration: 600,
        onComplete: () => hint.destroy(),
      });
    }
  });

  return hint;
}
