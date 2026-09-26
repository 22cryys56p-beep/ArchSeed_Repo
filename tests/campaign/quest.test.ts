import { describe, expect, it } from "vitest";
import { execute } from "../../src/core/execution";
import { createStateChangeNotifier } from "../../src/core/notification";
import {
  assignQuest,
  completeQuest,
  createQuest,
  startQuest,
  type CampaignState,
} from "../../campaign/src/quest";

function emptyCampaign(): CampaignState {
  return { quests: [], characters: [] };
}

describe("createQuest", () => {
  it("creates a new quest as not_started", () => {
    const state = emptyCampaign();
    const notifier = createStateChangeNotifier();
    let notifications = 0;
    notifier.subscribe(() => (notifications += 1));

    const outcome = execute(
      createQuest,
      { id: "q1", title: "Rescue the merchant" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({ status: "success" });
    expect(state.quests).toEqual([
      { id: "q1", title: "Rescue the merchant", status: "not_started" },
    ]);
    expect(notifications).toBe(1);
  });

  it("rejects a duplicate id as invalid, without notifying", () => {
    const state: CampaignState = {
      quests: [{ id: "q1", title: "Existing", status: "not_started" }],
      characters: [],
    };
    const notifier = createStateChangeNotifier();
    let notifications = 0;
    notifier.subscribe(() => (notifications += 1));

    const outcome = execute(
      createQuest,
      { id: "q1", title: "Different title" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({
      status: "invalid",
      details: { reason: "duplicate_id" },
    });
    expect(state.quests).toHaveLength(1);
    expect(notifications).toBe(0);
  });

  it("rejects a blank title as invalid, without notifying", () => {
    const state = emptyCampaign();
    const notifier = createStateChangeNotifier();
    let notifications = 0;
    notifier.subscribe(() => (notifications += 1));

    const outcome = execute(
      createQuest,
      { id: "q1", title: "   " },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({
      status: "invalid",
      details: { reason: "missing_title" },
    });
    expect(state.quests).toHaveLength(0);
    expect(notifications).toBe(0);
  });
});

describe("startQuest", () => {
  it("moves a not_started quest to active", () => {
    const state: CampaignState = {
      quests: [{ id: "q1", title: "Rescue the merchant", status: "not_started" }],
      characters: [],
    };
    const notifier = createStateChangeNotifier();
    let notifications = 0;
    notifier.subscribe(() => (notifications += 1));

    const outcome = execute(
      startQuest,
      { id: "q1" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({ status: "success" });
    expect(state.quests[0].status).toBe("active");
    expect(notifications).toBe(1);
  });

  it("returns noop for an already-active quest, without notifying", () => {
    const state: CampaignState = {
      quests: [{ id: "q1", title: "Rescue the merchant", status: "active" }],
      characters: [],
    };
    const notifier = createStateChangeNotifier();
    let notifications = 0;
    notifier.subscribe(() => (notifications += 1));

    const outcome = execute(
      startQuest,
      { id: "q1" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({ status: "noop" });
    expect(state.quests[0].status).toBe("active");
    expect(notifications).toBe(0);
  });

  it("rejects starting an already-completed quest as invalid", () => {
    const state: CampaignState = {
      quests: [{ id: "q1", title: "Rescue the merchant", status: "completed" }],
      characters: [],
    };
    const notifier = createStateChangeNotifier();

    const outcome = execute(
      startQuest,
      { id: "q1" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({
      status: "invalid",
      details: { reason: "already_completed" },
    });
    expect(state.quests[0].status).toBe("completed");
  });

  it("rejects starting a quest that does not exist", () => {
    const state = emptyCampaign();
    const notifier = createStateChangeNotifier();

    const outcome = execute(
      startQuest,
      { id: "missing" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({
      status: "invalid",
      details: { reason: "not_found" },
    });
  });
});

describe("completeQuest", () => {
  it("moves an active quest to completed", () => {
    const state: CampaignState = {
      quests: [{ id: "q1", title: "Rescue the merchant", status: "active" }],
      characters: [],
    };
    const notifier = createStateChangeNotifier();
    let notifications = 0;
    notifier.subscribe(() => (notifications += 1));

    const outcome = execute(
      completeQuest,
      { id: "q1" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({ status: "success" });
    expect(state.quests[0].status).toBe("completed");
    expect(notifications).toBe(1);
  });

  it("returns noop for an already-completed quest, without notifying", () => {
    const state: CampaignState = {
      quests: [{ id: "q1", title: "Rescue the merchant", status: "completed" }],
      characters: [],
    };
    const notifier = createStateChangeNotifier();
    let notifications = 0;
    notifier.subscribe(() => (notifications += 1));

    const outcome = execute(
      completeQuest,
      { id: "q1" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({ status: "noop" });
    expect(notifications).toBe(0);
  });

  it("rejects completing a quest that was never started", () => {
    const state: CampaignState = {
      quests: [{ id: "q1", title: "Rescue the merchant", status: "not_started" }],
      characters: [],
    };
    const notifier = createStateChangeNotifier();

    const outcome = execute(
      completeQuest,
      { id: "q1" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({
      status: "invalid",
      details: { reason: "not_started" },
    });
    expect(state.quests[0].status).toBe("not_started");
  });

  it("rejects completing a quest that does not exist", () => {
    const state = emptyCampaign();
    const notifier = createStateChangeNotifier();

    const outcome = execute(
      completeQuest,
      { id: "missing" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({
      status: "invalid",
      details: { reason: "not_found" },
    });
  });
});

describe("assignQuest", () => {
  it("assigns a quest to an existing character", () => {
    const state: CampaignState = {
      quests: [{ id: "q1", title: "Rescue the merchant", status: "not_started" }],
      characters: [{ id: "c1", name: "Alira" }],
    };
    const notifier = createStateChangeNotifier();
    let notifications = 0;
    notifier.subscribe(() => (notifications += 1));

    const outcome = execute(
      assignQuest,
      { questId: "q1", characterId: "c1" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({ status: "success" });
    expect(state.quests[0].assignedCharacterId).toBe("c1");
    expect(notifications).toBe(1);
  });

  it("returns noop when already assigned to that character, without notifying", () => {
    const state: CampaignState = {
      quests: [
        {
          id: "q1",
          title: "Rescue the merchant",
          status: "not_started",
          assignedCharacterId: "c1",
        },
      ],
      characters: [{ id: "c1", name: "Alira" }],
    };
    const notifier = createStateChangeNotifier();
    let notifications = 0;
    notifier.subscribe(() => (notifications += 1));

    const outcome = execute(
      assignQuest,
      { questId: "q1", characterId: "c1" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({ status: "noop" });
    expect(notifications).toBe(0);
  });

  it("reassigns a quest already assigned to a different character", () => {
    const state: CampaignState = {
      quests: [
        {
          id: "q1",
          title: "Rescue the merchant",
          status: "not_started",
          assignedCharacterId: "c1",
        },
      ],
      characters: [
        { id: "c1", name: "Alira" },
        { id: "c2", name: "Borin" },
      ],
    };
    const notifier = createStateChangeNotifier();

    const outcome = execute(
      assignQuest,
      { questId: "q1", characterId: "c2" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({ status: "success" });
    expect(state.quests[0].assignedCharacterId).toBe("c2");
  });

  it("rejects assigning a quest that does not exist", () => {
    const state: CampaignState = {
      quests: [],
      characters: [{ id: "c1", name: "Alira" }],
    };
    const notifier = createStateChangeNotifier();

    const outcome = execute(
      assignQuest,
      { questId: "missing", characterId: "c1" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({
      status: "invalid",
      details: { reason: "quest_not_found" },
    });
  });

  it("rejects assigning to a character that does not exist", () => {
    const state: CampaignState = {
      quests: [{ id: "q1", title: "Rescue the merchant", status: "not_started" }],
      characters: [],
    };
    const notifier = createStateChangeNotifier();

    const outcome = execute(
      assignQuest,
      { questId: "q1", characterId: "missing" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({
      status: "invalid",
      details: { reason: "character_not_found" },
    });
  });
});