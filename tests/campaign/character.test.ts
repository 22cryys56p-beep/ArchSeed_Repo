import { describe, expect, it } from "vitest";
import { execute } from "../../src/core/execution";
import { createStateChangeNotifier } from "../../src/core/notification";
import { createCharacter } from "../../campaign/src/character";
import type { CampaignState } from "../../campaign/src/state";

function emptyCampaign(): CampaignState {
  return { quests: [], characters: [] };
}

describe("createCharacter", () => {
  it("creates a new character", () => {
    const state = emptyCampaign();
    const notifier = createStateChangeNotifier();
    let notifications = 0;
    notifier.subscribe(() => (notifications += 1));

    const outcome = execute(
      createCharacter,
      { id: "c1", name: "Alira" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({ status: "success" });
    expect(state.characters).toEqual([{ id: "c1", name: "Alira" }]);
    expect(notifications).toBe(1);
  });

  it("rejects a duplicate id as invalid, without notifying", () => {
    const state: CampaignState = {
      quests: [],
      characters: [{ id: "c1", name: "Existing" }],
    };
    const notifier = createStateChangeNotifier();
    let notifications = 0;
    notifier.subscribe(() => (notifications += 1));

    const outcome = execute(
      createCharacter,
      { id: "c1", name: "Different name" },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({
      status: "invalid",
      details: { reason: "duplicate_id" },
    });
    expect(state.characters).toHaveLength(1);
    expect(notifications).toBe(0);
  });

  it("rejects a blank name as invalid, without notifying", () => {
    const state = emptyCampaign();
    const notifier = createStateChangeNotifier();
    let notifications = 0;
    notifier.subscribe(() => (notifications += 1));

    const outcome = execute(
      createCharacter,
      { id: "c1", name: "   " },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({
      status: "invalid",
      details: { reason: "missing_name" },
    });
    expect(state.characters).toHaveLength(0);
    expect(notifications).toBe(0);
  });
});