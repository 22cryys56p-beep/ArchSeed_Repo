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