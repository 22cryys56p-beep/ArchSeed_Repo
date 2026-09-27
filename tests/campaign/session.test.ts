import { describe, expect, it } from "vitest";
import { execute } from "../../src/core/execution";
import { createStateChangeNotifier } from "../../src/core/notification";
import { createSession } from "../../campaign/src/session";
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
      },
    ]);
    expect(notifications).toBe(1);
  });

  it("rejects a duplicate id as invalid, without notifying", () => {
    const state: CampaignState = {
      quests: [],
      characters: [],
      sessions: [{ id: "s1", date: "2026-09-19", summary: "Existing session" }],
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