import { describe, expect, it } from "vitest";
import { execute } from "../../src/core/execution";
import { createStateChangeNotifier } from "../../src/core/notification";
import type { Operation } from "../../src/core/operation";

type CounterState = {
  count: number;
};

type IncrementRequest = {
  amount: number;
};

type Dependencies = {};

const increment: Operation<
  IncrementRequest,
  CounterState,
  Dependencies
> = (request, context) => {
  if (request.amount === 0) {
    return { status: "noop" };
  }

  context.state.mutate((state) => {
    state.count += request.amount;
  });

  return { status: "success" };
};

describe("execution", () => {
  it("executes an operation against controlled state", () => {
    const state: CounterState = { count: 0 };
    const notifier = createStateChangeNotifier();

    let notifications = 0;

    notifier.subscribe(() => {
      notifications += 1;
    });

    const outcome = execute(
      increment,
      { amount: 1 },
      {
        state,
        dependencies: {},
        notifier,
      }
    );

    expect(outcome).toEqual({ status: "success" });
    expect(state.count).toBe(1);
    expect(notifications).toBe(1);
  });

  it("returns noop without changing state or notifying", () => {
    const state: CounterState = { count: 0 };
    const notifier = createStateChangeNotifier();

    let notifications = 0;

    notifier.subscribe(() => {
      notifications += 1;
    });

    const outcome = execute(
      increment,
      { amount: 0 },
      {
        state,
        dependencies: {},
        notifier,
      }
    );

    expect(outcome).toEqual({ status: "noop" });
    expect(state.count).toBe(0);
    expect(notifications).toBe(0);
  });

  it("does not expose mutation through state observation", () => {
    const state: CounterState = { count: 0 };
    const notifier = createStateChangeNotifier();

    const inspect: Operation<
      IncrementRequest,
      CounterState,
      Dependencies
    > = (_request, context) => {
      const observed = context.state.get();

      expect(observed.count).toBe(0);

      return { status: "success" };
    };

    const outcome = execute(
      inspect,
      { amount: 0 },
      {
        state,
        dependencies: {},
        notifier,
      }
    );

    expect(outcome).toEqual({ status: "success" });
    expect(state.count).toBe(0);
  });
});