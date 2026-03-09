import Phaser from "phaser";
import { DialogueBox } from "./ui/DialogueBox";
import weekLoaders from "./weeks/index";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.ready = false;
    this.activeWeek = null;
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#08121d");

    const water = this.add.graphics();
    water.fillGradientStyle(0x0d2a3f, 0x12344f, 0x091a29, 0x050d16, 1);
    water.fillRect(0, 0, width, height);

    this.dialogue = new DialogueBox(this, this.registry.get("mentorChoice"));
    this.weekGroup = this.add.group();

    const weekId = this.registry.get("weekId") || 1;
    this.loadWeek(weekId);
  }

  async loadWeek(weekId) {
    this.ready = false;

    if (this.activeWeek) {
      this.activeWeek.shutdown(this);
      this.activeWeek = null;
    }
    this.weekGroup.clear(true, true);
    this.dialogue.hide();

    const loader = weekLoaders[weekId];
    if (!loader) {
      this.dialogue.show("System", `Week ${weekId} is not available yet.`);
      return;
    }

    try {
      const mod = await loader();
      const week = mod.default;

      const ctx = {
        dialogue: this.dialogue,
        group: this.weekGroup,
        mentorChoice: this.registry.get("mentorChoice"),
        onComplete: (result) => {
          const cb = this.registry.get("onQuestComplete");
          if (cb) cb({ week: weekId, ...result });
        },
      };

      week.create(this, ctx);
      this.activeWeek = week;
      this.ready = true;
    } catch (err) {
      console.error(`[Tidebound] Failed to load week ${weekId}:`, err);
      this.dialogue.show("System", `Error loading week ${weekId}.`);
    }
  }

  update(time, delta) {
    if (this.ready && this.activeWeek && this.activeWeek.update) {
      this.activeWeek.update(this, time, delta);
    }
  }

  shutdown() {
    if (this.activeWeek) {
      this.activeWeek.shutdown(this);
      this.activeWeek = null;
    }
    if (this.dialogue) {
      this.dialogue.destroy();
    }
  }
}
