/**
 * Tidebound Character System
 *
 * Exports the PlayerCharacter class and any shared configuration.
 *
 * Current implementation: procedural (no external assets required).
 * Future: will support sprite-sheet driven characters via the same API.
 */

export { PlayerCharacter, default as default } from "./PlayerCharacter.js";

/**
 * Recommended safe play area inset (pixels) from screen edges.
 * Weeks can use this to keep the explorer away from the dialogue box and title.
 */
export const SAFE_INSET = {
  top: 70,
  bottom: 100, // reserve space for dialogue
  left: 40,
  right: 40,
};

/**
 * Base speed recommendations (can be overridden per week).
 */
export const DEFAULT_SPEED = 180;

/**
 * Future sprite configuration hook.
 * When real art is added, weeks can pass:
 *   createPlayerCharacter({ useSprites: true, spriteKey: 'explorer', anims: {...} })
 */
export const SPRITE_CONFIG = {
  placeholderNote: "Replace procedural drawing with sprites when assets are available.",
};