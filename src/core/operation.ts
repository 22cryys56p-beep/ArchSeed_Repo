import type { Outcome } from "./outcome";

export type StateAuthority<State> = {
  get(): Readonly<State>;
  mutate(mutator: (state: State) => void): void;
};

export type Operation<
  Request,
  State,
  Dependencies,
  Details = unknown
> = (
  request: Request,
  context: {
    state: StateAuthority<State>;
    dependencies: Dependencies;
  }
) => Outcome<Details>;