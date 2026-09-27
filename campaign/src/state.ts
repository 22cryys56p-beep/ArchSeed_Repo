/**
 * Campaign application layer — shared state shape.
 *
 * Pulled into its own module because more than one entity type
 * (Quest, Character) needs to share the same CampaignState, and
 * quest.ts / character.ts each need to reference CampaignState
 * without needing to import each other's module.
 */

import type { Quest } from "./quest";
import type { Character } from "./character";
import type { Session } from "./session";

export type CampaignState = {
  quests: Quest[];
  characters: Character[];
  sessions: Session[];
};

// No external dependencies needed yet.
export type CampaignDependencies = {};