import type { Operation, StateAuthority } from "./operation";
import type { Outcome } from "./outcome";
import type { StateChangeNotifier } from "./notification";

export type Execution<State, Dependencies> = {
  state: State;
  dependencies: Dependencies;
  notifier: StateChangeNotifier;
};

export function execute<
  Request,
  State,
  Dependencies,
  Details = unknown
>(
  operation: Operation<Request, State, Dependencies, Details>,
  request: Request,
  execution: Execution<State, Dependencies>
): Outcome<Details> {
  let changed = false;

  const stateAuthority: StateAuthority<State> = {
    get() {
      return execution.state;
    },

    mutate(mutator) {
      mutator(execution.state);
      changed = true;
    },
  };

  const context = {
    state: stateAuthority,
    dependencies: execution.dependencies,
  };

  const outcome = operation(request, context);

  if (changed) {
    execution.notifier.notify();
  }

  return outcome;
}