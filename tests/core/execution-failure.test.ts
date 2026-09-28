import { describe, expect, it } from "vitest";
import { execute } from "../../src/core/execution";
import { createStateChangeNotifier } from "../../src/core/notification";
import type { Operation } from "../../src/core/operation";

/**
 * These tests document what execute() does TODAY when an operation
 * throws. They are characterization tests: they pin current behavior so
 * that any future decision about the contract is a deliberate change to
 * a visible test, not an accident. They do not claim the behavior is
 * desirable.
 *
 * Four sub-cases matter, and they are different from each other:
 *   1. throws before touching state
 *   2. a mutate() call completes, then the operation throws
 *   3. the mutator callback itself throws partway through
 *   4. what a later successful operation reveals about an earlier failure
 */

type Items = { items: string[] };

function setup() {
  const state: Items = { items: [] };
  const notifier = createStateChangeNotifier();
  let notifications = 0;
  notifier.subscribe(() => (notifications += 1));

  return {
    state,
    notifier,
    notifications: () => notifications,
    run<Request>(operation: Operation<Request, Items, {}>, request: Request) {
      return execute(operation, request, { state, dependencies: {}, notifier });
    },
  };
}

const throwsBeforeMutating: Operation<void, Items, {}> = () => {
  throw new Error("early");
};

const mutatesThenThrows: Operation<void, Items, {}> = (_request, context) => {
  context.state.mutate((state) => {
    state.items.push("a");
  });
  throw new Error("late");
};

const mutatorThrowsMidway: Operation<void, Items, {}> = (_request, context) => {
  context.state.mutate((state) => {
    state.items.push("a");
    throw new Error("midway");
  });
  return { status: "success" };
};

const addsB: Operation<void, Items, {}> = (_request, context) => {
  context.state.mutate((state) => {
    state.items.push("b");
  });
  return { status: "success" };
};

describe("execute() when an operation throws", () => {
  it("1. throwing before touching state: exception propagates, nothing changed, no notification", () => {
    const host = setup();

    expect(() => host.run(throwsBeforeMutating, undefined)).toThrow("early");

    expect(host.state.items).toEqual([]);
    expect(host.notifications()).toBe(0);
  });

  it("2. mutate() completed, then throw: state changed, exception propagates, NO notification", () => {
    const host = setup();

    expect(() => host.run(mutatesThenThrows, undefined)).toThrow("late");

    expect(host.state.items).toEqual(["a"]);
    expect(host.notifications()).toBe(0);
  });

  it("3. mutator throws partway: state is partially changed, and the change is not even flagged", () => {
    const host = setup();

    expect(() => host.run(mutatorThrowsMidway, undefined)).toThrow("midway");

    expect(host.state.items).toEqual(["a"]);
    expect(host.notifications()).toBe(0);
  });

  it("4. the residue of a failed operation becomes visible on the next successful one", () => {
    const host = setup();
    const seen: string[][] = [];
    host.notifier.subscribe(() => seen.push([...host.state.items]));

    expect(() => host.run(mutatesThenThrows, undefined)).toThrow("late");
    expect(seen).toEqual([]);

    host.run(addsB, undefined);

    // Observers are told about "b", and re-reading shows "a" too:
    // the failed operation's change was retained, silently, until now.
    expect(seen).toEqual([["a", "b"]]);
    expect(host.notifications()).toBe(1);
  });
});