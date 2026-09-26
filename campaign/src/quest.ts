/**
 * Campaign application layer — Quest.
 *
 * This is application code, not ArchSeed. It imports ArchSeed's core
 * mechanisms (Operation, Outcome) but knows nothing about Obsidian and
 * nothing about any other application.
 *
 * Now includes one relationship — a quest can be assigned to a
 * character — added because assignQuest is the smallest real slice
 * that forces an answer on identity/relationships, not because a
 * relationship model was designed in advance.
 *
 * Deliberately excluded still (not because they're unimportant, but
 * because nothing yet requires them):
 *   - sessions, XP, levels
 *   - persistence
 *   - identity beyond a plain string id supplied by the caller
 *   - un-assigning a quest (nothing has needed it yet)
 */

import type { Operation } from "../../src/core/operation";
import type { CampaignState, CampaignDependencies } from "./state";

// Re-exported so existing imports of CampaignState/CampaignDependencies
// from this module keep working now that they live in state.ts.
export type { CampaignState, CampaignDependencies } from "./state";

export type QuestStatus = "not_started" | "active" | "completed";

export interface Quest {
  id: string;
  title: string;
  status: QuestStatus;
  assignedCharacterId?: string;
}

function findQuest(state: CampaignState, id: string): Quest | undefined {
  return state.quests.find((quest) => quest.id === id);
}

// ---- createQuest ----------------------------------------------------

export type CreateQuestRequest = {
  id: string;
  title: string;
};

export type CreateQuestDetails = {
  reason: "duplicate_id" | "missing_title";
};

export const createQuest: Operation<
  CreateQuestRequest,
  CampaignState,
  CampaignDependencies,
  CreateQuestDetails
> = (request, context) => {
  if (request.title.trim().length === 0) {
    return { status: "invalid", details: { reason: "missing_title" } };
  }

  if (findQuest(context.state.get(), request.id)) {
    return { status: "invalid", details: { reason: "duplicate_id" } };
  }

  context.state.mutate((state) => {
    state.quests.push({
      id: request.id,
      title: request.title,
      status: "not_started",
    });
  });

  return { status: "success" };
};

// ---- startQuest -------------------------------------------------------

export type StartQuestRequest = {
  id: string;
};

export type StartQuestDetails = {
  reason: "not_found" | "already_completed";
};

export const startQuest: Operation<
  StartQuestRequest,
  CampaignState,
  CampaignDependencies,
  StartQuestDetails
> = (request, context) => {
  const quest = findQuest(context.state.get(), request.id);

  if (!quest) {
    return { status: "invalid", details: { reason: "not_found" } };
  }

  if (quest.status === "completed") {
    return { status: "invalid", details: { reason: "already_completed" } };
  }

  if (quest.status === "active") {
    return { status: "noop" };
  }

  context.state.mutate((state) => {
    const target = findQuest(state, request.id);
    if (target) {
      target.status = "active";
    }
  });

  return { status: "success" };
};

// ---- completeQuest ------------------------------------------------------

export type CompleteQuestRequest = {
  id: string;
};

export type CompleteQuestDetails = {
  reason: "not_found" | "not_started";
};

export const completeQuest: Operation<
  CompleteQuestRequest,
  CampaignState,
  CampaignDependencies,
  CompleteQuestDetails
> = (request, context) => {
  const quest = findQuest(context.state.get(), request.id);

  if (!quest) {
    return { status: "invalid", details: { reason: "not_found" } };
  }

  if (quest.status === "not_started") {
    return { status: "invalid", details: { reason: "not_started" } };
  }

  if (quest.status === "completed") {
    return { status: "noop" };
  }

  context.state.mutate((state) => {
    const target = findQuest(state, request.id);
    if (target) {
      target.status = "completed";
    }
  });

  return { status: "success" };
};

// ---- assignQuest --------------------------------------------------------

export type AssignQuestRequest = {
  questId: string;
  characterId: string;
};

export type AssignQuestDetails = {
  reason: "quest_not_found" | "character_not_found";
};

export const assignQuest: Operation<
  AssignQuestRequest,
  CampaignState,
  CampaignDependencies,
  AssignQuestDetails
> = (request, context) => {
  const state = context.state.get();
  const quest = findQuest(state, request.questId);

  if (!quest) {
    return { status: "invalid", details: { reason: "quest_not_found" } };
  }

  const characterExists = state.characters.some(
    (character) => character.id === request.characterId
  );

  if (!characterExists) {
    return { status: "invalid", details: { reason: "character_not_found" } };
  }

  if (quest.assignedCharacterId === request.characterId) {
    return { status: "noop" };
  }

  context.state.mutate((s) => {
    const target = findQuest(s, request.questId);
    if (target) {
      target.assignedCharacterId = request.characterId;
    }
  });

  return { status: "success" };
};