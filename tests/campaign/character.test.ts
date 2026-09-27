import { describe, expect, it } from "vitest";
import { execute } from "../../src/core/execution";
import { createStateChangeNotifier } from "../../src/core/notification";
import { createCharacter, resolveCharacterLevel } from "../../campaign/src/character";
import type { CampaignState } from "../../campaign/src/state";

function emptyCampaign(): CampaignState {
  return { quests: [], characters: [], sessions: [] };
}

describe("createCharacter", () => {
  it("creates a new character", () => {
    const state = emptyCampaign();
    const notifier = createStateChangeNotifier();
    let notifications = 0;
    notifier.subscribe(() => (notifications += 1));

    const outcome = execute(
      createCharacter,
      { id: "c1", name: "Alira", xp: 0 },
      { state, dependencies: {}, notifier }
    );

    expect(outcome).toEqual({ status: "success" });
    expect(state.characters).toEqual([{ id: "c1", name: "Alira", xp: 0 }]);
    expect(notifications).toBe(1);
  });

  it("rejects a duplicate id as invalid, without notifying", () => {
    const state: CampaignState = {
      quests: [],
      characters: [{ id: "c1", name: "Existing", xp: 0 }],
      sessions: [],
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
describe("resolveCharacterLevel", () => {
  it("is level 1 at zero xp", () => {
    expect(resolveCharacterLevel({ id: "c1", name: "Alira", xp: 0 })).toBe(1);
  });

  it("is level 1 just below the level-2 threshold", () => {
    expect(resolveCharacterLevel({ id: "c1", name: "Alira", xp: 99 })).toBe(1);
  });

  it("is level 2 exactly at the threshold", () => {
    expect(resolveCharacterLevel({ id: "c1", name: "Alira", xp: 100 })).toBe(2);
  });

  it("is level 3 at 200 xp", () => {
    expect(resolveCharacterLevel({ id: "c1", name: "Alira", xp: 200 })).toBe(3);
  });

  it("does not mutate the character it resolves from", () => {
    const character = { id: "c1", name: "Alira", xp: 150 };
    resolveCharacterLevel(character);
    expect(character).toEqual({ id: "c1", name: "Alira", xp: 150 });
  });
});