import { describe, expect, it } from "vitest";
import {
  STORAGE_VERSION,
  emptyCampaignState,
  fromStoredCampaign,
  toStoredCampaign,
} from "../../campaign/src/persistence";
import type { CampaignState } from "../../campaign/src/state";

function populatedCampaign(): CampaignState {
  return {
    quests: [
      {
        id: "q1",
        title: "Rescue the merchant",
        status: "active",
        assignedCharacterId: "c1",
        xpReward: 50,
      },
      { id: "q2", title: "Find the map", status: "not_started", xpReward: 0 },
    ],
    characters: [{ id: "c1", name: "Alira", xp: 60 }],
    sessions: [
      {
        id: "s1",
        date: "2026-09-26",
        summary: "The party reached the harbor town.",
        characterIds: ["c1"],
        questIds: ["q1"],
      },
    ],
  };
}

describe("toStoredCampaign", () => {
  it("wraps the state in a versioned envelope", () => {
    const stored = toStoredCampaign(populatedCampaign());

    expect(stored.version).toBe(STORAGE_VERSION);
    expect(stored.state).toEqual(populatedCampaign());
  });

  it("returns a snapshot that later mutation of the live state cannot change", () => {
    const state = populatedCampaign();
    const stored = toStoredCampaign(state);

    state.quests[0].status = "completed";
    state.characters.push({ id: "c2", name: "Borin", xp: 0 });

    expect(stored.state.quests[0].status).toBe("active");
    expect(stored.state.characters).toHaveLength(1);
  });
});

describe("fromStoredCampaign", () => {
  it("round-trips a populated campaign exactly", () => {
    const original = populatedCampaign();
    const result = fromStoredCampaign(toStoredCampaign(original));

    expect(result).toEqual({ ok: true, state: original });
  });

  it("treats null and undefined as nothing stored yet", () => {
    expect(fromStoredCampaign(null)).toEqual({
      ok: true,
      state: emptyCampaignState(),
    });
    expect(fromStoredCampaign(undefined)).toEqual({
      ok: true,
      state: emptyCampaignState(),
    });
  });

  it("does not alias the object it was given", () => {
    const stored = toStoredCampaign(populatedCampaign());
    const result = fromStoredCampaign(stored);

    if (!result.ok) throw new Error("expected ok");
    result.state.quests[0].status = "completed";

    expect(stored.state.quests[0].status).toBe("active");
  });

  it("refuses data that is not an object", () => {
    const result = fromStoredCampaign("hello");
    expect(result).toEqual({ ok: false, reason: "data must be an object" });
  });

  it("refuses an unknown version rather than guessing", () => {
    const result = fromStoredCampaign({ version: 99, state: {} });
    expect(result).toEqual({
      ok: false,
      reason: `unsupported version 99 (expected ${STORAGE_VERSION})`,
    });
  });

  it("refuses an object with no version, such as unrelated plugin data", () => {
    const result = fromStoredCampaign({ someSetting: true });
    expect(result.ok).toBe(false);
  });

  it("names the exact field when a quest status is unknown", () => {
    const stored = toStoredCampaign(populatedCampaign());
    (stored.state.quests[1] as { status: string }).status = "abandoned";

    expect(fromStoredCampaign(stored)).toEqual({
      ok: false,
      reason: "state.quests[1].status is not a known status",
    });
  });

  it("names the exact field when a number has the wrong type", () => {
    const stored = toStoredCampaign(populatedCampaign());
    (stored.state.characters[0] as { xp: unknown }).xp = "60";

    expect(fromStoredCampaign(stored)).toEqual({
      ok: false,
      reason: "state.characters[0].xp must be a finite number",
    });
  });

  it("refuses a session whose id lists contain non-strings", () => {
    const stored = toStoredCampaign(populatedCampaign());
    (stored.state.sessions[0] as { characterIds: unknown[] }).characterIds = [
      "c1",
      7,
    ];

    expect(fromStoredCampaign(stored)).toEqual({
      ok: false,
      reason: "state.sessions[0].characterIds[1] must be a string",
    });
  });

  it("refuses a missing collection", () => {
    const stored = toStoredCampaign(populatedCampaign());
    delete (stored.state as { sessions?: unknown }).sessions;

    expect(fromStoredCampaign(stored)).toEqual({
      ok: false,
      reason: "state.sessions must be an array",
    });
  });
});