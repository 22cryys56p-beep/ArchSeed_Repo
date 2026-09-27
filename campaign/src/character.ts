/**
 * Campaign application layer — Character.
 *
 * Deliberately minimal: identity plus XP, which is exactly as much as
 * completeQuest granting XP requires. No stats, no inventory, no
 * leveling yet — nothing has needed them.
 */

import type { Operation } from "../../src/core/operation";
import type { CampaignState, CampaignDependencies } from "./state";

export interface Character {
  id: string;
  name: string;
  xp: number;
}

/**
 * Character level, resolved from xp.
 *
 * This is a "Resolution" in the sense the ArchSeed handoff docs use
 * the word (a deterministic calculation, no mutation, no ArchSeed
 * involvement) — but it is worth being precise about what that
 * means here: ArchSeed does not export a Resolution type or any
 * mechanism to wrap this in. There is no import from src/core in
 * this function, because there is nothing there to import. This is
 * a plain pure function, which is apparently the correct minimal
 * answer for "resolution" — or a real gap, depending on whether a
 * future requirement ever needs more than that.
 *
 * Thresholds are a simple placeholder (100 xp per level) — nothing
 * about the actual curve has been requested yet.
 */
export function resolveCharacterLevel(character: Character): number {
  return Math.floor(character.xp / 100) + 1;
}

function findCharacter(
  state: CampaignState,
  id: string
): Character | undefined {
  return state.characters.find((character) => character.id === id);
}

// ---- createCharacter --------------------------------------------------

export type CreateCharacterRequest = {
  id: string;
  name: string;
};

export type CreateCharacterDetails = {
  reason: "duplicate_id" | "missing_name";
};

export const createCharacter: Operation<
  CreateCharacterRequest,
  CampaignState,
  CampaignDependencies,
  CreateCharacterDetails
> = (request, context) => {
  if (request.name.trim().length === 0) {
    return { status: "invalid", details: { reason: "missing_name" } };
  }

  if (findCharacter(context.state.get(), request.id)) {
    return { status: "invalid", details: { reason: "duplicate_id" } };
  }

  context.state.mutate((state) => {
    state.characters.push({ id: request.id, name: request.name, xp: 0 });
  });

  return { status: "success" };
};