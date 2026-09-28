/**
 * Campaign application layer — persistence format.
 *
 * Host-independent: this file knows nothing about Obsidian, files, or
 * how bytes reach a disk. It only defines what a stored campaign looks
 * like, how to take a snapshot of live state, and how to decide whether
 * data coming back from storage can be trusted.
 *
 * Deliberate choices, all provisional and all easy to change:
 *   - One versioned envelope ({ version, state }), because this
 *     codebase's own state shape changed several times during Stage 1
 *     and stored data will outlive the code that wrote it. No
 *     migrations exist; an unknown version is refused, not guessed at.
 *   - Validation is structural only. It does not check referential
 *     integrity (e.g. a quest assigned to a character that does not
 *     exist). Operations never produce that today, but hand-edited
 *     data could.
 *   - Loaded data is copied field by field into fresh objects. Unknown
 *     extra fields are dropped rather than carried along.
 */

import type { CampaignState } from "./state";
import type { Quest } from "./quest";
import type { Character } from "./character";
import type { Session } from "./session";

export const STORAGE_VERSION = 1;

export type StoredCampaign = {
  version: number;
  state: CampaignState;
};

export type LoadResult =
  | { ok: true; state: CampaignState }
  | { ok: false; reason: string };

export function emptyCampaignState(): CampaignState {
  return { quests: [], characters: [], sessions: [] };
}

/**
 * A deep, independent snapshot of the state, wrapped in the versioned
 * envelope. Independent matters: saving is asynchronous, and the live
 * state may be mutated again before a save actually happens.
 */
export function toStoredCampaign(state: CampaignState): StoredCampaign {
  return {
    version: STORAGE_VERSION,
    state: JSON.parse(JSON.stringify(state)) as CampaignState,
  };
}

// ---- validation -----------------------------------------------------------

class InvalidData extends Error {}

function fail(message: string): never {
  throw new InvalidData(message);
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(`${path} must be an object`);
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    fail(`${path} must be an array`);
  }
  return value;
}

function asString(value: unknown, path: string): string {
  if (typeof value !== "string") {
    fail(`${path} must be a string`);
  }
  return value;
}

function asNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(`${path} must be a finite number`);
  }
  return value;
}

function asStringArray(value: unknown, path: string): string[] {
  return asArray(value, path).map((item, index) =>
    asString(item, `${path}[${index}]`)
  );
}

function parseQuest(raw: unknown, path: string): Quest {
  const record = asRecord(raw, path);
  const status = asString(record.status, `${path}.status`);

  if (status !== "not_started" && status !== "active" && status !== "completed") {
    fail(`${path}.status is not a known status`);
  }

  const quest: Quest = {
    id: asString(record.id, `${path}.id`),
    title: asString(record.title, `${path}.title`),
    status,
    xpReward: asNumber(record.xpReward, `${path}.xpReward`),
  };

  if (record.assignedCharacterId !== undefined) {
    quest.assignedCharacterId = asString(
      record.assignedCharacterId,
      `${path}.assignedCharacterId`
    );
  }

  return quest;
}

function parseCharacter(raw: unknown, path: string): Character {
  const record = asRecord(raw, path);
  return {
    id: asString(record.id, `${path}.id`),
    name: asString(record.name, `${path}.name`),
    xp: asNumber(record.xp, `${path}.xp`),
  };
}

function parseSession(raw: unknown, path: string): Session {
  const record = asRecord(raw, path);
  return {
    id: asString(record.id, `${path}.id`),
    date: asString(record.date, `${path}.date`),
    summary: asString(record.summary, `${path}.summary`),
    characterIds: asStringArray(record.characterIds, `${path}.characterIds`),
    questIds: asStringArray(record.questIds, `${path}.questIds`),
  };
}

/**
 * Decide whether data coming back from storage can be used as campaign
 * state. null/undefined means "nothing has been stored yet" and yields
 * an empty campaign; anything else must be a valid envelope.
 */
export function fromStoredCampaign(data: unknown): LoadResult {
  if (data === null || data === undefined) {
    return { ok: true, state: emptyCampaignState() };
  }

  try {
    const root = asRecord(data, "data");

    if (root.version !== STORAGE_VERSION) {
      fail(
        `unsupported version ${String(root.version)} (expected ${STORAGE_VERSION})`
      );
    }

    const state = asRecord(root.state, "state");

    return {
      ok: true,
      state: {
        quests: asArray(state.quests, "state.quests").map((quest, index) =>
          parseQuest(quest, `state.quests[${index}]`)
        ),
        characters: asArray(state.characters, "state.characters").map(
          (character, index) =>
            parseCharacter(character, `state.characters[${index}]`)
        ),
        sessions: asArray(state.sessions, "state.sessions").map(
          (session, index) => parseSession(session, `state.sessions[${index}]`)
        ),
      },
    };
  } catch (error) {
    if (error instanceof InvalidData) {
      return { ok: false, reason: error.message };
    }
    throw error;
  }
}