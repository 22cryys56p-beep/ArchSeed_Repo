import type { Operation, StateAuthority } from "./operation";
import type { Outcome } from "./outcome";

export type Execution<State, Dependencies> = {
  state: StateAuthority<State>;
  dependencies: Dependencies;
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
  return operation(request, execution);
}
