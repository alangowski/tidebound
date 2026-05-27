import Phaser from "phaser";
import { DialogueBox } from "./ui/DialogueBox";
import weekLoaders from "./weeks/index";
import { PlayerCharacter } from "./characters/PlayerCharacter.js";
import { createControlLegend, showBriefControlHint } from "./weeks/weekUtils.js";

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

    // Dedicated tracking for player-controlled characters (opt-in by weeks)
    this.players = [];

    const weekId = this.registry.get("weekId") || 1;
    this.loadWeek(weekId);
  }

  async loadWeek(weekId) {
    this.ready = false;

    if (this.activeWeek) {
      this.activeWeek.shutdown(this);
      this.activeWeek = null;
    }

    // Clean up any player characters from the previous week
    if (this.players && this.players.length > 0) {
      this.players.forEach((p) => p.destroy && p.destroy());
      this.players = [];
    }

    // Clean up auto-generated character legend
    if (this._characterLegend) {
      this._characterLegend.destroy();
      this._characterLegend = null;
    }

    this._controlHintShown = false;

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
        /**
         * Opt-in API for weeks that want a player-controlled animated character.
         * Returns a PlayerCharacter instance. The week is responsible for calling
         * player.update(time, delta) if it overrides the default delegation,
         * and must clean up via shutdown (though GameScene also cleans on week change).
         */
        createPlayerCharacter: (options = {}) => {
          const player = new PlayerCharacter(this, options.x ?? 120, options.y ?? 160, {
            mentorChoice: this.registry.get("mentorChoice"),
            ...options,
          });
          if (!this.players) this.players = [];
          this.players.push(player);

          // Automatically add a control legend the first time a player character is created
          if (!this._characterLegend) {
            const legendText = options.legendText || "Arrows/WASD  •  Click  •  Space = Dash  •  E = Grab/Throw  •  Q = Surge  •  Joystick bottom-left";
            this._characterLegend = createControlLegend(this, this.weekGroup, legendText);
          }

          // Show a brief "How to Control" reminder for demo weeks
          const weekId = this.registry.get("weekId");
          if (!this._controlHintShown && typeof weekId === 'string' && weekId.startsWith('demo-')) {
            showBriefControlHint(this, this.weekGroup);
            this._controlHintShown = true;
          }

          return player;
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

    // Drive any active player characters (they handle their own input + animation)
    if (this.players && this.players.length > 0) {
      for (const player of this.players) {
        if (player && player.update) {
          player.update(time, delta);
        }
      }
    }
  }

  shutdown() {
    if (this.activeWeek) {
      this.activeWeek.shutdown(this);
      this.activeWeek = null;
    }

    // Destroy any remaining player characters
    if (this.players && this.players.length > 0) {
      this.players.forEach((p) => p.destroy && p.destroy());
      this.players = [];
    }

    if (this._characterLegend) {
      this._characterLegend.destroy();
      this._characterLegend = null;
    }

    if (this.dialogue) {
      this.dialogue.destroy();
    }
  }
}
