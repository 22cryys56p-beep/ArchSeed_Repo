/**
 * Campaign application layer — Session.
 *
 * A session now records what actually happened: which characters
 * were there, which quests it touched, plus the date/summary.
 *
 * This is a different shape than assignQuest's relationship —
 * assignQuest was one quest to at most one character (a single
 * optional field); a session can touch several quests and several
 * characters (array membership), so recordCharacterInSession and
 * recordQuestInSession add to a list rather than replace a single
 * value.
 */

import type { Operation } from "../../src/core/operation";
import type { CampaignState, CampaignDependencies } from "./state";

export interface Session {
  id: string;
  date: string;
  summary: string;
  characterIds: string[];
  questIds: string[];
}

function findSession(
  state: CampaignState,
  id: string
): Session | undefined {
  return state.sessions.find((session) => session.id === id);
}

// ---- createSession ------------------------------------------------------

export type CreateSessionRequest = {
  id: string;
  date: string;
  summary: string;
};

export type CreateSessionDetails = {
  reason: "duplicate_id" | "missing_date" | "missing_summary";
};

export const createSession: Operation<
  CreateSessionRequest,
  CampaignState,
  CampaignDependencies,
  CreateSessionDetails
> = (request, context) => {
  if (request.date.trim().length === 0) {
    return { status: "invalid", details: { reason: "missing_date" } };
  }

  if (request.summary.trim().length === 0) {
    return { status: "invalid", details: { reason: "missing_summary" } };
  }

  if (findSession(context.state.get(), request.id)) {
    return { status: "invalid", details: { reason: "duplicate_id" } };
  }

  context.state.mutate((state) => {
    state.sessions.push({
      id: request.id,
      date: request.date,
      summary: request.summary,
      characterIds: [],
      questIds: [],
    });
  });

  return { status: "success" };
};

// ---- recordCharacterInSession --------------------------------------------

export type RecordCharacterInSessionRequest = {
  sessionId: string;
  characterId: string;
};

export type RecordCharacterInSessionDetails = {
  reason: "session_not_found" | "character_not_found";
};

export const recordCharacterInSession: Operation<
  RecordCharacterInSessionRequest,
  CampaignState,
  CampaignDependencies,
  RecordCharacterInSessionDetails
> = (request, context) => {
  const state = context.state.get();
  const session = findSession(state, request.sessionId);

  if (!session) {
    return { status: "invalid", details: { reason: "session_not_found" } };
  }

  const characterExists = state.characters.some(
    (character) => character.id === request.characterId
  );

  if (!characterExists) {
    return { status: "invalid", details: { reason: "character_not_found" } };
  }

  if (session.characterIds.includes(request.characterId)) {
    return { status: "noop" };
  }

  context.state.mutate((s) => {
    const target = findSession(s, request.sessionId);
    if (target) {
      target.characterIds.push(request.characterId);
    }
  });

  return { status: "success" };
};

// ---- recordQuestInSession -------------------------------------------------

export type RecordQuestInSessionRequest = {
  sessionId: string;
  questId: string;
};

export type RecordQuestInSessionDetails = {
  reason: "session_not_found" | "quest_not_found";
};

export const recordQuestInSession: Operation<
  RecordQuestInSessionRequest,
  CampaignState,
  CampaignDependencies,
  RecordQuestInSessionDetails
> = (request, context) => {
  const state = context.state.get();
  const session = findSession(state, request.sessionId);

  if (!session) {
    return { status: "invalid", details: { reason: "session_not_found" } };
  }

  const questExists = state.quests.some(
    (quest) => quest.id === request.questId
  );

  if (!questExists) {
    return { status: "invalid", details: { reason: "quest_not_found" } };
  }

  if (session.questIds.includes(request.questId)) {
    return { status: "noop" };
  }

  context.state.mutate((s) => {
    const target = findSession(s, request.sessionId);
    if (target) {
      target.questIds.push(request.questId);
    }
  });

  return { status: "success" };
};