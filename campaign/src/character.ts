/**
 * Campaign application layer — Character.
 *
 * Deliberately minimal: just enough identity for a quest to be
 * assigned to someone. No stats, no XP, no inventory — nothing here
 * yet requires them.
 */

import type { Operation } from "../../src/core/operation";
import type { CampaignState, CampaignDependencies } from "./state";

export interface Character {
  id: string;
  name: string;
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

export const createCharacter: Operation
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
    state.characters.push({ id: request.id, name: request.name });
  });

  return { status: "success" };
};