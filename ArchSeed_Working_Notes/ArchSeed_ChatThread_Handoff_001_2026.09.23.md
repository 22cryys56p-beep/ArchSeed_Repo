# ARCHSEED — CHAT THREAD HANDOFF

You are taking over the **ArchSeed** project from a previous ChatGPT thread.

## 1. Project identity

**ArchSeed** = Architectural Seed.

Formal definition:

> Architectural Seed — a reusable, host-independent set of architectural mechanisms from which different applications can be built.

Short definition:

> A reusable, host-independent architectural foundation from which different applications can be built.

ArchSeed is **not an application framework**. It provides reusable architectural mechanisms, not an imposed full application structure.

The current host/sandbox is Obsidian, but ArchSeed must remain host-independent.

Conceptual layering:

```text
Host
  ↓
Adapter
  ↓
Application
  ↓
ArchSeed
```

Obsidian is therefore an adapter/host environment, not the definition of ArchSeed.

---

## 2. Repository authority

Working repository:

`22cryys56p-beep/ArchSeed_Repo`

Original/reference repository:

`22cryys56p-beep/obsidian-app-kernel`

The original repository must remain untouched.

Local working directory:

`Desktop/Projects_Folder/ArchSeed_Repo`

The user uses GitHub Desktop for commits/pushes and CotEditor for manually creating/replacing source files.

**Repository contents are the implementation authority.**

Conversation history is provenance/reasoning only.

Do not assume that something discussed in an earlier conversation exists in the repository. Verify the repository when implementation facts matter.

The user is the final architect/decision-maker.

---

## 3. Preservation record

A detailed preservation record has been created in the repository:

```text
ArchSeed_Working_Notes/
└── ArchSeed_Preservation_Record_2026-09-22.md
```

That document contains the detailed architectural history, decisions, current implementation, tests, tooling, corrections, and unresolved questions from the previous thread.

**Read that document before making architectural assumptions.**

The `ArchSeed_Working_Notes` folder is development history/provenance only. It is not part of the runtime or public API.

---

## 4. Core architectural boundary

Frozen guardrail:

> The Seed contains host-independent mechanisms for representing state, defining and executing controlled actions, resolving outcomes, exposing capabilities, validating contracts, and accepting dependencies through explicit boundaries. Anything that gives those mechanisms knowledge of a particular application’s domain or a particular host belongs outside the Seed.

Negative boundary:

> The Seed provides reusable mechanisms, not application meaning, presentation, persistence, host integration, or an application-wide orchestration model. It does not impose implementation patterns not required by its architectural guarantees.

Core principles:

* simplicity
* explicit ownership
* controlled access
* controlled mutation
* explicit dependencies
* host independence
* deterministic behavior
* meaningful outcomes
* honest failure
* no hidden global ownership
* no service locator
* no giant controller
* no application-specific vocabulary in Seed
* no unnecessary framework
* no imposed application-wide orchestration

---

## 5. Frozen concepts

### State

ArchSeed provides mechanisms for explicit ownership and controlled access to application-defined state.

The application defines the actual state.

ArchSeed does **not** prescribe mutable vs immutable state.

Current state authority:

```ts
export type StateAuthority<State> = {
  get(): Readonly<State>;
  mutate(mutator: (state: State) => void): void;
};
```

Important:

* `get()` provides read access at the TypeScript boundary.
* `mutate()` provides controlled mutation.
* `Readonly<State>` is not deep runtime immutability.
* Do not introduce `DeepReadonly` merely to make the API appear safer.
* Overall state ownership remains outside individual operations.

Frozen architectural principle:

> State observation and state mutation are separate authorities.

### Operation / Action

ArchSeed provides controlled operations against application-defined state.

Applications define their own operations and rules.

Consumers request operations through a controlled boundary rather than directly mutating application state.

ArchSeed does not prescribe whether an operation is represented as a function, object, class, etc.

### Outcome

An explicit result of a controlled operation:

* `success` — requested operation occurred
* `noop` — valid request but no change was needed
* `invalid` — request is not valid under the current contract/context
* `failure` — valid to attempt but could not complete

Current:

```ts
export type Outcome<Details = unknown> =
  | { status: "success"; details?: Details }
  | { status: "noop"; details?: Details }
  | { status: "invalid"; details?: Details }
  | { status: "failure"; details?: Details };
```

Outcome is not the same thing as an exception and is not a second representation of state.

### Capability

A mechanism for exposing whether a controlled operation is currently available.

Capability is distinct from execution.

It is derived from authoritative state/dependency/rule context.

It is optional rather than a mandatory runtime stage.

### Resolution

A separate deterministic decision/calculation step.

It consumes explicit request/context and determines a result without changing state.

Optional.

### Validation

Host-independent, deterministic, non-mutating validation producing an explicit result.

Applications define domain-specific rules.

External context must be explicit.

### Notification

A boundary for observing possible state changes without transferring ownership or mutation authority.

Preferred semantic model:

> State may have changed; observers re-read authoritative state.

Notification is not a second state store and does not prescribe a particular event/synchronization implementation.

### Dependencies

External requirements are supplied through explicit contracts.

ArchSeed declares what an operation needs; application composition supplies it.

No hidden globals.

No service locator.

Execution context is not a generic service container.

### Composition

Application composition assembles the pieces and supplies concrete dependencies.

### Lifecycle

Conceptual lifecycle:

```text
create → own → use → release
```

No hidden global singleton.

The application composition boundary owns the runtime/execution environment.

### Runtime

Do not create a large `KernelRuntime` merely because “runtime” is a useful noun.

Use the smallest structure necessary to satisfy the architectural guarantees.

The runtime/execution boundary should remain small.

The public runtime boundary should provide controlled state observation, controlled operation execution, and state-change subscription.

Do not automatically add public:

```text
validate()
canExecute()
resolve()
```

Those are optional mechanisms, not mandatory runtime methods.

---

## 6. Execution model

Conceptual pipeline:

```text
REQUEST
 ↓
VALIDATION (optional)
 ↓
CAPABILITY (optional)
 ↓
RESOLUTION (optional)
 ↓
ACTION / EXECUTION
 ↓
OUTCOME
 ↓
STATE CHANGE (if any)
 ↓
NOTIFICATION
```

Not every operation requires every stage.

Minimum:

```text
Request → Operation → Outcome → Notification
```

More complex operations may use validation, capability, and/or resolution.

---

## 7. Current implementation

Current core files:

```text
src/core/
├── index.ts
├── operation.ts
├── outcome.ts
├── execution.ts
└── notification.ts
```

Current `src/core/outcome.ts`:

```ts
export type Outcome<Details = unknown> =
  | { status: "success"; details?: Details }
  | { status: "noop"; details?: Details }
  | { status: "invalid"; details?: Details }
  | { status: "failure"; details?: Details };
```

Current `src/core/operation.ts`:

```ts
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
```

Current `src/core/execution.ts`:

```ts
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
```

Important correction already made:

Earlier execution accepted a caller-created `StateAuthority`.

That was architecturally wrong because the boundary did not actually control the authority.

The current implementation correctly creates the `StateAuthority` internally inside `execute()`.

The application supplies:

* application-owned state
* dependencies
* notifier

The execution boundary creates the controlled state authority and owns notification triggering.

---

## 8. Notification implementation

Current `src/core/notification.ts`:

```ts
export type StateChangeListener = () => void;

export type StateChangeNotifier = {
  subscribe(listener: StateChangeListener): () => void;
  notify(): void;
};

export function createStateChangeNotifier(): StateChangeNotifier {
  const listeners = new Set<StateChangeListener>();

  return {
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },

    notify() {
      for (const listener of listeners) {
        listener();
      }
    },
  };
}
```

Important semantic detail:

`changed` in `execute()` means the mutation authority was invoked / state **may** have changed.

It does not perform deep equality detection.

Therefore a mutation callback that technically makes no change can still result in notification.

This is currently accepted unless the architecture later explicitly changes that semantic.

---

## 9. Current core index

Current `src/core/index.ts`:

```ts
export type { Outcome } from "./outcome";
export type { Operation, StateAuthority } from "./operation";
export type { Execution } from "./execution";
export { execute } from "./execution";
```

Notification is currently not re-exported from this index.

Do not change that merely for consistency without first considering whether it is architecturally intended.

---

## 10. Tests

Current test suite:

```text
tests/core/execution.test.ts
tests/core/notification.test.ts
tests/data/record.test.ts
```

Latest known result:

```text
Test Files  3 passed (3)
Tests       10 passed (10)
```

The Vite CJS API deprecation warning is known and non-fatal.

Do not spend time fixing that warning unless it becomes relevant.

---

## 11. Current unresolved architectural question

The next architectural question is:

### Who owns the `StateChangeNotifier` instance?

Current `Execution` is:

```ts
{
  state,
  dependencies,
  notifier
}
```

and `execute()` triggers:

```ts
execution.notifier.notify()
```

The frozen architecture says:

> The execution/runtime boundary owns notification triggering.

What remains unresolved is whether:

1. the execution/runtime boundary should also construct/own the notifier instance,

or

2. the application composition boundary should construct the notifier and supply it to execution, while execution still owns the authority to trigger notification.

**Do not write code yet for this question.**

First reason about the ownership boundary and explain the architectural consequences of each model.

---

## 12. Implementation history that matters

The original generic controller abstraction was intentionally removed.

Deleted:

```text
src/core/controller.ts
tests/core/controller.test.ts
```

Reason: the controller abstraction was too broad and risked becoming an imposed application-wide orchestration model.

The Seed should remain a collection of small reusable mechanisms rather than growing a “god object.”

---

## 13. CC boundary

Command Center and ArchSeed are separate projects.

Command Center architecture was the source material from which ArchSeed was extracted, but CC must not depend on ArchSeed.

CC-specific concepts must not leak into ArchSeed.

Examples of discarded CC vocabulary:

* Project
* ProjectStatus
* CurrentObject
* NavigationDestination
* PagingTarget
* ProjectRecord
* Category
* Obsidian View
* Gateway
* ACP content

ArchSeed must remain usable for unrelated applications.

Example pressure test:

A classic-car restoration application should be able to define its own:

```text
CarRestorationState
installPart
repairEngine
capabilities
resolution
validation
notification
```

without ArchSeed knowing anything about cars.

---

## 14. Working method

The user prefers:

* one step at a time
* start with `Step 1`
* establish fact → take next action → inspect result
* short, direct explanations
* no giant multi-step procedures unless specifically requested
* surface contradictions immediately
* no unnecessary abstraction
* no speculative architecture
* no code until the architectural question is settled
* when code is needed, provide the **complete file** for copy/paste into CotEditor
* never provide “append this fragment” instructions
* do not make repository changes unless explicitly asked
* do not assume AI-generated code is correct
* verify against repository/tests
* GitHub Desktop handles commits/pushes

The user is not a professional coder, so technical reasoning should be rigorous but explained plainly.

---

## 15. Immediate resume point

Do **not** restart the architecture from scratch.

Do **not** redesign ArchSeed.

Do **not** jump into implementation.

Begin by addressing the unresolved question:

> Who should own construction/lifecycle of `StateChangeNotifier`, given that execution owns notification triggering?

Use the existing architecture and preservation record as the starting point.

The goal is to determine the smallest ownership model that preserves:

* explicit ownership
* controlled mutation
* explicit dependencies
* lifecycle clarity
* host independence
* no hidden global state
* no unnecessary runtime abstraction
* notification as observation rather than a second state store

Only after that decision is clear should implementation resume.
