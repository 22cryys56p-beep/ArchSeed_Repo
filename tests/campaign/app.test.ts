import { describe, expect, it } from "vitest";
import type { Operation } from "../../src/core/operation";
import { openCampaign, type CampaignStorage } from "../../campaign/src/app";
import { createCharacter } from "../../campaign/src/character";
import { toStoredCampaign } from "../../campaign/src/persistence";
import {
  assignQuest,
  completeQuest,
  createQuest,
  startQuest,
} from "../../campaign/src/quest";
import type {
  CampaignDependencies,
  CampaignState,
} from "../../campaign/src/state";

type FakeBehavior = {
  /** Milliseconds a given save call (1-based) should take. */
  delayFor?: (call: number) => number;
  /** Save calls (1-based) that should fail. */
  failCalls?: number[];
};

function fakeStorage(initial?: unknown, behavior: FakeBehavior = {}) {
  let stored: unknown = initial;
  let calls = 0;
  const saves: unknown[] = [];

  const storage: CampaignStorage = {
    async load() {
      return stored;
    },
    async save(data) {
      const call = ++calls;
      const delay = behavior.delayFor?.(call) ?? 0;
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      if (behavior.failCalls?.includes(call)) {
        throw new Error(`save ${call} failed`);
      }
      stored = data;
      saves.push(data);
    },
  };

  return { storage, saves, current: () => stored, calls: () => calls };
}

async function open(storage: CampaignStorage, onPersistError?: (e: unknown) => void) {
  const result = await openCampaign(storage, { onPersistError });
  if (!result.ok) throw new Error(`open failed: ${result.reason}`);
  return result.app;
}

describe("openCampaign", () => {
  it("opens an empty campaign on first run, without writing anything", async () => {
    const host = fakeStorage(undefined);
    const app = await open(host.storage);

    expect(app.get()).toEqual({ quests: [], characters: [], sessions: [] });
    await app.flush();
    expect(host.calls()).toBe(0);
  });

  it("opens from previously stored data", async () => {
    const seeded: CampaignState = {
      quests: [{ id: "q1", title: "Rescue", status: "active", xpReward: 5 }],
      characters: [],
      sessions: [],
    };
    const host = fakeStorage(toStoredCampaign(seeded));
    const app = await open(host.storage);

    expect(app.get()).toEqual(seeded);
  });

  it("refuses invalid stored data and never writes over it", async () => {
    const corrupt = { version: 1, state: { quests: "nope" } };
    const host = fakeStorage(corrupt);

    const result = await openCampaign(host.storage);

    expect(result).toEqual({
      ok: false,
      reason: "state.quests must be an array",
    });
    expect(host.calls()).toBe(0);
    expect(host.current()).toBe(corrupt);
  });

  it("reports a storage that fails to load instead of throwing", async () => {
    const storage: CampaignStorage = {
      async load() {
        throw new Error("disk unavailable");
      },
      async save() {},
    };

    const result = await openCampaign(storage);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("disk unavailable");
    }
  });
});

describe("persistence through notification", () => {
  it("saves the new state after a successful operation", async () => {
    const host = fakeStorage(undefined);
    const app = await open(host.storage);

    const outcome = app.run(createQuest, { id: "q1", title: "Rescue", xpReward: 10 });
    await app.flush();

    expect(outcome).toEqual({ status: "success" });
    expect(host.calls()).toBe(1);
    expect(host.current()).toEqual(toStoredCampaign(app.get()));
  });

  it("does not save on noop or invalid outcomes", async () => {
    const host = fakeStorage(undefined);
    const app = await open(host.storage);

    app.run(createQuest, { id: "q1", title: "Rescue" });
    app.run(startQuest, { id: "q1" });
    await app.flush();
    const callsAfterSetup = host.calls();

    const noop = app.run(startQuest, { id: "q1" });
    const invalid = app.run(completeQuest, { id: "missing" });
    await app.flush();

    expect(noop).toEqual({ status: "noop" });
    expect(invalid.status).toBe("invalid");
    expect(host.calls()).toBe(callsAfterSetup);
  });

  it("survives a restart: a second app opened on the same storage sees the same campaign", async () => {
    const host = fakeStorage(undefined);
    const first = await open(host.storage);

    first.run(createCharacter, { id: "c1", name: "Alira" });
    first.run(createQuest, { id: "q1", title: "Rescue", xpReward: 50 });
    first.run(assignQuest, { questId: "q1", characterId: "c1" });
    first.run(startQuest, { id: "q1" });
    first.run(completeQuest, { id: "q1" });
    await first.flush();

    const second = await open(host.storage);

    expect(second.get()).toEqual(first.get());
    expect(second.get().characters[0].xp).toBe(50);
    expect(second.get().quests[0].status).toBe("completed");
  });

  it("keeps saves in order even when earlier saves are slower than later ones", async () => {
    const host = fakeStorage(undefined, {
      delayFor: (call) => (call === 1 ? 30 : call === 2 ? 20 : 5),
    });
    const app = await open(host.storage);

    app.run(createQuest, { id: "q1", title: "One" });
    app.run(createQuest, { id: "q2", title: "Two" });
    app.run(createQuest, { id: "q3", title: "Three" });
    await app.flush();

    const questCounts = host.saves.map(
      (saved) => (saved as { state: CampaignState }).state.quests.length
    );
    expect(questCounts).toEqual([1, 2, 3]);
    expect(host.current()).toEqual(toStoredCampaign(app.get()));
  });

  it("reports a failed save, keeps working, and repairs storage on the next save", async () => {
    const errors: unknown[] = [];
    const host = fakeStorage(undefined, { failCalls: [1] });
    const app = await open(host.storage, (error) => errors.push(error));

    const first = app.run(createQuest, { id: "q1", title: "One" });
    await app.flush();

    // The operation itself succeeded; only persistence failed.
    expect(first).toEqual({ status: "success" });
    expect(errors).toHaveLength(1);
    expect(host.saves).toHaveLength(0);

    app.run(createQuest, { id: "q2", title: "Two" });
    await app.flush();

    expect(errors).toHaveLength(1);
    const stored = host.current() as { state: CampaignState };
    expect(stored.state.quests.map((quest) => quest.id)).toEqual(["q1", "q2"]);
  });

  it("keeps saving even if the error handler itself throws", async () => {
    const host = fakeStorage(undefined, { failCalls: [1] });
    const app = await open(host.storage, () => {
      throw new Error("handler blew up");
    });

    app.run(createQuest, { id: "q1", title: "One" });
    await app.flush();
    app.run(createQuest, { id: "q2", title: "Two" });
    await app.flush();

    expect(host.saves).toHaveLength(1);
  });
});

describe("subscribe", () => {
  it("tells subscribers state may have changed, and they can re-read the new state", async () => {
    const host = fakeStorage(undefined);
    const app = await open(host.storage);
    const seen: number[] = [];
    app.subscribe(() => seen.push(app.get().quests.length));

    app.run(createQuest, { id: "q1", title: "One" });
    app.run(createQuest, { id: "q2", title: "Two" });

    expect(seen).toEqual([1, 2]);
  });

  it("stops telling a subscriber once it unsubscribes", async () => {
    const host = fakeStorage(undefined);
    const app = await open(host.storage);
    let calls = 0;
    const unsubscribe = app.subscribe(() => (calls += 1));

    app.run(createQuest, { id: "q1", title: "One" });
    unsubscribe();
    app.run(createQuest, { id: "q2", title: "Two" });

    expect(calls).toBe(1);
  });
});

describe("observed limit: an operation that throws after mutating", () => {
  /**
   * This test documents what happens today. It does not endorse it.
   *
   * ArchSeed's execute() only notifies after the operation returns. If an
   * operation mutates state and then throws, the state has changed but no
   * notification fires, so nothing is persisted. Memory and storage now
   * disagree until some later operation succeeds and saves a full snapshot.
   *
   * Nothing in the Campaign application throws today. This is here because
   * persistence is the first thing that makes the gap matter.
   */
  it("changes memory but never reaches storage", async () => {
    const mutateThenThrow: Operation<void, CampaignState, CampaignDependencies> = (
      _request,
      context
    ) => {
      context.state.mutate((state) => {
        state.quests.push({
          id: "q1",
          title: "Half done",
          status: "not_started",
          xpReward: 0,
        });
      });
      throw new Error("boom");
    };

    const host = fakeStorage(undefined);
    const app = await open(host.storage);

    expect(() => app.run(mutateThenThrow, undefined)).toThrow("boom");
    await app.flush();

    expect(app.get().quests).toHaveLength(1);
    expect(host.calls()).toBe(0);
  });
});