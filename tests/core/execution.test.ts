import { describe, expect, it } from "vitest";
import { execute } from "../../src/core/execution";
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

    const authority = {
      get: () => state,
      mutate: (mutator: (state: CounterState) => void) => {
        mutator(state);
      },
    };

    const outcome = execute(
      increment,
      { amount: 1 },
      {
        state: authority,
        dependencies: {},
      }
    );

    expect(outcome).toEqual({ status: "success" });
    expect(state.count).toBe(1);
  });

  it("returns noop without changing state", () => {
    const state: CounterState = { count: 0 };

    const authority = {
      get: () => state,
      mutate: (mutator: (state: CounterState) => void) => {
        mutator(state);
      },
    };

    const outcome = execute(
      increment,
      { amount: 0 },
      {
        state: authority,
        dependencies: {},
      }
    );

    expect(outcome).toEqual({ status: "noop" });
    expect(state.count).toBe(0);
  });
});
