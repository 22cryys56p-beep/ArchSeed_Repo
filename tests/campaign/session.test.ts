import { describe, expect, it } from "vitest";
import { execute } from "../../src/core/execution";
import { createStateChangeNotifier } from "../../src/core/notification";
import {
  createSession,
  recordCharacterInSession,
  recordQuestInSession,
} from "../../campaign/src/session";
import type { CampaignState } from "../../campaign/src/state";

function emptyCampaign(): CampaignState {
  return { quests: [], characters: [], sessions: [] };
}

describe("createSession", () => {
  it("creates a new session", () => {
    const state = emptyCampaign();
    const notifier = createStateChangeNotifier();
    let notifications = 0;
    notifier.subscribe(() => (notifications += 1));

    const outcome = execute(
      createSession,
      { id: "s1", date: "2026-09-26", summary: "The party reached the harbor town." },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({ status: "success" });
    expect(state.sessions).toEqual([
      {
        id: "s1",
        date: "2026-09-26",
        summary: "The party reached the harbor town.",
        characterIds: [],
        questIds: [],
      },
    ]);
    expect(notifications).toBe(1);
  });

  it("rejects a duplicate id as invalid, without notifying", () => {
    const state: CampaignState = {
      quests: [],
      characters: [],
      sessions: [
        {
          id: "s1",
          date: "2026-09-19",
          summary: "Existing session",
          characterIds: [],
          questIds: [],
        },
      ],
    };
    const notifier = createStateChangeNotifier();
    let notifications = 0;
    notifier.subscribe(() => (notifications += 1));

    const outcome = execute(
      createSession,
      { id: "s1", date: "2026-09-26", summary: "Different summary" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({
      status: "invalid",
      details: { reason: "duplicate_id" },
    });
    expect(state.sessions).toHaveLength(1);
    expect(notifications).toBe(0);
  });

  it("rejects a blank date as invalid, without notifying", () => {
    const state = emptyCampaign();
    const notifier = createStateChangeNotifier();
    let notifications = 0;
    notifier.subscribe(() => (notifications += 1));

    const outcome = execute(
      createSession,
      { id: "s1", date: "   ", summary: "Something happened" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({
      status: "invalid",
      details: { reason: "missing_date" },
    });
    expect(state.sessions).toHaveLength(0);
    expect(notifications).toBe(0);
  });

  it("rejects a blank summary as invalid, without notifying", () => {
    const state = emptyCampaign();
    const notifier = createStateChangeNotifier();
    let notifications = 0;
    notifier.subscribe(() => (notifications += 1));

    const outcome = execute(
      createSession,
      { id: "s1", date: "2026-09-26", summary: "   " },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({
      status: "invalid",
      details: { reason: "missing_summary" },
    });
    expect(state.sessions).toHaveLength(0);
    expect(notifications).toBe(0);
  });
});
describe("recordCharacterInSession", () => {
  it("adds an existing character to the session", () => {
    const state: CampaignState = {
      quests: [],
      characters: [{ id: "c1", name: "Alira", xp: 0 }],
      sessions: [
        {
          id: "s1",
          date: "2026-09-26",
          summary: "The party reached the harbor town.",
          characterIds: [],
          questIds: [],
        },
      ],
    };
    const notifier = createStateChangeNotifier();
    let notifications = 0;
    notifier.subscribe(() => (notifications += 1));

    const outcome = execute(
      recordCharacterInSession,
      { sessionId: "s1", characterId: "c1" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({ status: "success" });
    expect(state.sessions[0].characterIds).toEqual(["c1"]);
    expect(notifications).toBe(1);
  });

  it("adds a second character alongside the first", () => {
    const state: CampaignState = {
      quests: [],
      characters: [
        { id: "c1", name: "Alira", xp: 0 },
        { id: "c2", name: "Borin", xp: 0 },
      ],
      sessions: [
        {
          id: "s1",
          date: "2026-09-26",
          summary: "The party reached the harbor town.",
          characterIds: ["c1"],
          questIds: [],
        },
      ],
    };
    const notifier = createStateChangeNotifier();

    const outcome = execute(
      recordCharacterInSession,
      { sessionId: "s1", characterId: "c2" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({ status: "success" });
    expect(state.sessions[0].characterIds).toEqual(["c1", "c2"]);
  });

  it("returns noop when the character is already recorded, without notifying", () => {
    const state: CampaignState = {
      quests: [],
      characters: [{ id: "c1", name: "Alira", xp: 0 }],
      sessions: [
        {
          id: "s1",
          date: "2026-09-26",
          summary: "The party reached the harbor town.",
          characterIds: ["c1"],
          questIds: [],
        },
      ],
    };
    const notifier = createStateChangeNotifier();
    let notifications = 0;
    notifier.subscribe(() => (notifications += 1));

    const outcome = execute(
      recordCharacterInSession,
      { sessionId: "s1", characterId: "c1" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({ status: "noop" });
    expect(state.sessions[0].characterIds).toEqual(["c1"]);
    expect(notifications).toBe(0);
  });

  it("rejects a session that does not exist", () => {
    const state: CampaignState = {
      quests: [],
      characters: [{ id: "c1", name: "Alira", xp: 0 }],
      sessions: [],
    };
    const notifier = createStateChangeNotifier();

    const outcome = execute(
      recordCharacterInSession,
      { sessionId: "missing", characterId: "c1" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({
      status: "invalid",
      details: { reason: "session_not_found" },
    });
  });

  it("rejects a character that does not exist", () => {
    const state: CampaignState = {
      quests: [],
      characters: [],
      sessions: [
        {
          id: "s1",
          date: "2026-09-26",
          summary: "The party reached the harbor town.",
          characterIds: [],
          questIds: [],
        },
      ],
    };
    const notifier = createStateChangeNotifier();

    const outcome = execute(
      recordCharacterInSession,
      { sessionId: "s1", characterId: "missing" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({
      status: "invalid",
      details: { reason: "character_not_found" },
    });
  });
});

describe("recordQuestInSession", () => {
  it("adds an existing quest to the session", () => {
    const state: CampaignState = {
      quests: [
        { id: "q1", title: "Rescue the merchant", status: "active", xpReward: 0 },
      ],
      characters: [],
      sessions: [
        {
          id: "s1",
          date: "2026-09-26",
          summary: "The party reached the harbor town.",
          characterIds: [],
          questIds: [],
        },
      ],
    };
    const notifier = createStateChangeNotifier();
    let notifications = 0;
    notifier.subscribe(() => (notifications += 1));

    const outcome = execute(
      recordQuestInSession,
      { sessionId: "s1", questId: "q1" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({ status: "success" });
    expect(state.sessions[0].questIds).toEqual(["q1"]);
    expect(notifications).toBe(1);
  });

  it("returns noop when the quest is already recorded, without notifying", () => {
    const state: CampaignState = {
      quests: [
        { id: "q1", title: "Rescue the merchant", status: "active", xpReward: 0 },
      ],
      characters: [],
      sessions: [
        {
          id: "s1",
          date: "2026-09-26",
          summary: "The party reached the harbor town.",
          characterIds: [],
          questIds: ["q1"],
        },
      ],
    };
    const notifier = createStateChangeNotifier();
    let notifications = 0;
    notifier.subscribe(() => (notifications += 1));

    const outcome = execute(
      recordQuestInSession,
      { sessionId: "s1", questId: "q1" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({ status: "noop" });
    expect(state.sessions[0].questIds).toEqual(["q1"]);
    expect(notifications).toBe(0);
  });

  it("rejects a session that does not exist", () => {
    const state: CampaignState = {
      quests: [
        { id: "q1", title: "Rescue the merchant", status: "active", xpReward: 0 },
      ],
      characters: [],
      sessions: [],
    };
    const notifier = createStateChangeNotifier();

    const outcome = execute(
      recordQuestInSession,
      { sessionId: "missing", questId: "q1" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({
      status: "invalid",
      details: { reason: "session_not_found" },
    });
  });

  it("rejects a quest that does not exist", () => {
    const state: CampaignState = {
      quests: [],
      characters: [],
      sessions: [
        {
          id: "s1",
          date: "2026-09-26",
          summary: "The party reached the harbor town.",
          characterIds: [],
          questIds: [],
        },
      ],
    };
    const notifier = createStateChangeNotifier();

    const outcome = execute(
      recordQuestInSession,
      { sessionId: "s1", questId: "missing" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({
      status: "invalid",
      details: { reason: "quest_not_found" },
    });
  });
});