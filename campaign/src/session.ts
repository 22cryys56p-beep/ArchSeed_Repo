/**
 * Campaign application layer — Session.
 *
 * Smallest real unit of "record a session": what happened, when.
 * Deliberately not yet linked to quests or characters — nothing has
 * required that link yet, and it shouldn't be added until something
 * does.
 */

import type { Operation } from "../../src/core/operation";
import type { CampaignState, CampaignDependencies } from "./state";

export interface Session {
  id: string;
  date: string;
  summary: string;
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
    });
  });

  return { status: "success" };
};