# ArchSeed — Preservation Record

**Project:** Architectural Seed
**Nickname:** ArchSeed
**Repository:** `22cryys56p-beep/ArchSeed_Repo`
**Branch:** `main`
**Local path:** `Desktop/Projects_Folder/ArchSeed_Repo`
**Status:** Active side project
**Relationship to Command Center:** Independent; ArchSeed is NOT a Command Center component.

---

# 1. Purpose and Origin

ArchSeed is a separate architectural foundation project.

The original conceptual work came from architectural mechanisms developed elsewhere and proven through use. The intent is to extract the reusable architectural mechanisms themselves rather than reproduce any particular application's domain model.

The conceptual chain is:

**earlier architectural infrastructure → proven mechanisms → reusable patterns → extracted reusable foundation**

Obsidian is currently only a sandbox/host for experimentation.

ArchSeed must not become dependent on Command Center.

The intended future relationship is:

```text
Host
  ↓
Adapter
  ↓
Application
  ↓
ArchSeed
```

Possible hosts include Obsidian, a web application, a standalone application, or other environments.

---

# 2. Formal Definition

## Formal

> **Architectural Seed — a reusable, host-independent set of architectural mechanisms from which different applications can be built.**

## Short

> **A reusable, host-independent architectural foundation from which different applications can be built.**

## Guardrail

> **ArchSeed is not an application framework. It provides reusable architectural mechanisms, not an imposed full app structure.**

---

# 3. Core Boundary

The frozen architectural boundary is:

> ArchSeed provides reusable mechanisms for representing state, defining and executing controlled actions, resolving outcomes, exposing capabilities, validating contracts, and accepting dependencies through explicit boundaries.

> Anything that gives those mechanisms knowledge of a particular application’s domain or a particular host belongs outside the Seed.

## Negative boundary

> The Seed provides reusable mechanisms, not application meaning, presentation, persistence, host integration, or an application-wide orchestration model.

> It does not impose implementation patterns not required by its architectural guarantees.

---

# 4. Architectural Principles

The major principles established during development are:

* Simplicity
* Explicit ownership
* Controlled access
* Controlled mutation
* Explicit dependencies
* Host independence
* Deterministic behavior
* Meaningful outcomes
* Honest failure
* No hidden global ownership
* No service locator
* No unnecessary framework
* No application-specific vocabulary in the Seed
* No giant controller
* No imposed application-wide orchestration model
* Runtime should be as small as the guarantees require

AI assists the human architect.

The repository is the authority for actual implementation.

---

# 5. State

ArchSeed provides a mechanism for **explicit ownership and controlled access to application-defined state**.

The application defines the actual state.

Consumers may observe state but do not receive uncontrolled mutation authority.

## Frozen rule

> ArchSeed provides mechanism for explicit ownership and controlled access to application-defined state; application defines state. Consumers may observe state but do not receive uncontrolled mutation authority.

ArchSeed does **not** prescribe mutable versus immutable application state.

## State ownership

Overall state ownership remains outside the operation.

An operation may observe application state and, where authorized, cause controlled mutation.

It does not acquire ownership of the state.

---

# 6. State Observation vs Mutation

This distinction became an explicit architectural decision.

> **State observation and state mutation are separate authorities.**

The implementation uses:

```ts
get(): Readonly<State>
```

for observation and:

```ts
mutate(mutator: (state: State) => void): void
```

for controlled mutation.

The important architectural point is not that ArchSeed has chosen a particular immutable-state system.

It has not.

The actual rule is:

> `get()` provides read access at the TypeScript boundary; `mutate()` provides controlled mutation. ArchSeed does not prescribe deep immutability or a particular application state model.

This was recorded as:

**ACP-001 — State observation and mutation authority**

Status: **Accepted**

Resolution:

> `get()` provides read access through `Readonly<State>`; `mutate()` provides controlled mutation. ArchSeed does not prescribe deep immutability or a particular application state model.

Important limitation:

`Readonly<State>` is a TypeScript-level boundary and is not a guarantee of deep runtime immutability for arbitrarily nested mutable objects.

That limitation is intentional rather than an invitation to impose `DeepReadonly` or a particular state architecture.

---

# 7. StateAuthority

Current architectural shape:

```ts
export type StateAuthority<State> = {
  get(): Readonly<State>;
  mutate(mutator: (state: State) => void): void;
};
```

The execution boundary creates/grants this authority to the operation.

The operation does not receive a caller-created authority object.

---

# 8. Operations / Actions

ArchSeed provides a mechanism for controlled operations against application-defined state.

Applications define the actual operations and rules.

Consumers request operations through a controlled boundary rather than directly mutating state.

An operation does not have to be a class.

It may be represented as a function, object, or other appropriate mechanism.

## Frozen operation concept

> Seed provides mechanism for controlled operations against app-defined state. Applications define operations/rules. Consumers request operations through controlled boundary rather than direct mutation.

The execution context supplies:

* controlled state authority
* explicit dependencies

---

# 9. Execution Context

Frozen definition:

> Seed execution context contains only controlled state access and explicitly supplied external dependencies required by an operation. It is not general-purpose service container.

The context must not become:

```text
context.services.get(...)
```

or another hidden service locator.

Host services, UI, persistence, notification, and application-specific mechanisms are not automatically placed into the context.

The execution context is an architectural concept, not necessarily a universal `KernelContext` class.

---

# 10. Execution Boundary

The execution boundary requires only:

1. operation
2. request
3. state authority
4. explicit dependencies

Conceptually:

```text
execute(operation, request, state authority, dependencies) → Outcome
```

The runtime/execution boundary must not understand:

* application domain rules
* application-specific semantics
* capability rules
* resolution rules
* validation rules
* application-wide operation registries

Those are composable mechanisms outside the minimum runtime boundary.

---

# 11. Execution Model

The conceptual execution model is:

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

Not every operation uses every stage.

Minimum:

```text
Request → Operation → Outcome → Notification
```

More complex cases may add:

```text
Validation
Capability
Resolution
```

These are optional mechanisms.

---

# 12. Outcome

Outcome is an explicit result of a controlled operation.

Frozen meanings:

* **SUCCESS** — requested operation occurred
* **NO-OP** — valid request but no change needed
* **INVALID** — request not valid under current contract/context
* **FAILURE** — valid to attempt, but could not complete

Outcome is not the same thing as an exception.

Outcome is also not a second representation of application state.

Current implementation:

```ts
export type Outcome<Details = unknown> =
  | { status: "success"; details?: Details }
  | { status: "noop"; details?: Details }
  | { status: "invalid"; details?: Details }
  | { status: "failure"; details?: Details };
```

---

# 13. Capability

Capability is distinct from execution.

Frozen concept:

> Seed provides mechanism for exposing whether controlled operation is currently available.

Capability is:

* derived from authoritative state/dependency/rule context
* separate from execution
* not something consumers should have to reproduce by duplicating operation rules

Capability is optional rather than a mandatory runtime stage.

---

# 14. Resolution

Frozen concept:

> Seed supports separating deterministic decision/calculation from state mutation.

Resolution:

* consumes explicit request/context
* determines a result
* does not mutate state

Resolution is used where needed rather than being mandatory for every operation.

---

# 15. Validation

Frozen concept:

> Seed provides host-independent, deterministic, non-mutating validation mechanism producing explicit result.

Applications define domain-specific validation rules and meanings.

External context must be explicit.

An existing `validateEntity` pattern served as an early proof of the architectural pattern, but `Entity` is not part of ArchSeed's domain.

---

# 16. Notification

ArchSeed provides a boundary through which state changes may be observed without transferring state ownership or mutation authority.

Notification does not define a specific event implementation or synchronization system.

Preferred model:

> Signal that state **may have changed**; observers re-read authoritative state.

This avoids creating a second state store.

Current implementation:

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

The execution boundary currently triggers notification after controlled mutation has been invoked.

---

# 17. Dependencies

Frozen principle:

> External requirements are supplied through explicit contracts; Seed declares needs, outside supplies; Seed never assumes source.

No:

* service locator
* hidden global
* implicit external service access

Composition is application-owned.

---

# 18. Composition

Pieces are assembled from outside.

The application supplies concrete dependencies.

The Seed provides mechanisms and contracts rather than owning the application's complete composition model.

---

# 19. Lifecycle

Frozen conceptual lifecycle:

```text
create → own → use → release
```

No hidden global ownership is required.

Runtime is created and owned by the application composition boundary.

It is not a global singleton.

Resources and subscriptions should have finite lifecycle ownership.

---

# 20. Runtime Shape

No specific runtime class has been mandated.

Do not create a `KernelRuntime` class merely because "runtime" is a useful noun.

The smallest structure that satisfies the architectural guarantees should be used.

The runtime/execution boundary is intentionally small.

---

# 21. Public Runtime Boundary

The intended public boundary is deliberately small:

* controlled state observation
* controlled operation execution
* state-change subscription

Mutation authority and implementation internals remain controlled.

Validation, capability, and resolution remain composable rather than mandatory runtime subsystems.

No public generic mutation methods.

No automatic:

```text
runtime.validate()
runtime.canExecute()
runtime.resolve()
```

style universal API.

---

# 22. Pressure Testing

The architecture was pressure-tested against mechanisms previously proven in the earlier infrastructure.

Covered:

* explicit state ownership
* controlled actions
* capability
* resolution
* validation
* read-only state observation
* notification
* dependency injection
* lifecycle
* host isolation

Application-specific vocabulary was deliberately discarded.

Discarded CC-specific concepts include:

* Project
* ProjectStatus
* CurrentObject
* NavigationDestination
* PagingTarget
* ProjectRecord
* Category
* Obsidian View

---

# 23. Unrelated Application Test

A classic-car-restoration application was used as an unrelated-domain pressure test.

Possible application concepts:

```text
CarRestorationState
installPart
capability
resolution
validation
notification
```

The point was to prove that the mechanisms remain meaningful without Command Center's domain vocabulary.

---

# 24. Multi-Host Model

The intended architecture is:

```text
Host
  ↓
Adapter
  ↓
Application
  ↓
ArchSeed
```

Obsidian is only one possible host.

A future implementation could use:

```text
Obsidian → Adapter → Application → ArchSeed
Web      → Adapter → Application → ArchSeed
Desktop  → Adapter → Application → ArchSeed
```

ArchSeed itself should not change merely because the host changes.

---

# 25. Repository History / Original Scaffold

The original scaffold contained:

```text
src/
  adapter/
    plugin.ts
    view.ts
  core/
    controller.ts
    index.ts
  data/
    index.ts
    record.ts
  main.ts

tests/
  adapter/
    .gitkeep
  core/
    controller.test.ts
  data/
    record.test.ts
```

The controller was subsequently removed because it represented the wrong abstraction for the Seed.

The adapter and host-facing files remain outside the core architectural mechanism.

---

# 26. Repository Setup

Original Grok/reference repository:

```text
22cryys56p-beep/obsidian-app-kernel
```

This repository must remain untouched.

ArchSeed working repository:

```text
22cryys56p-beep/ArchSeed_Repo
```

The working repository was created by duplicating the original project, deleting only the duplicated `.git` directory, retaining `.gitignore` and `.gitattributes`, and publishing a fresh repository.

Local path:

```text
Desktop/Projects_Folder/ArchSeed_Repo
```

The package metadata still uses:

```json
"name": "obsidian-app-kernel"
```

and version:

```text
0.1.0
```

This has not yet been renamed.

---

# 27. Current Core Files

Current `src/core/`:

```text
src/core/
├── index.ts
├── operation.ts
├── outcome.ts
└── execution.ts
```

Also present:

```text
src/core/notification.ts
```

So the practical current core is:

```text
src/core/
├── index.ts
├── operation.ts
├── outcome.ts
├── execution.ts
└── notification.ts
```

---

# 28. Current `src/core/outcome.ts`

```ts
export type Outcome<Details = unknown> =
  | { status: "success"; details?: Details }
  | { status: "noop"; details?: Details }
  | { status: "invalid"; details?: Details }
  | { status: "failure"; details?: Details };
```

---

# 29. Current `src/core/operation.ts`

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

---

# 30. Current `src/core/execution.ts`

Current implementation:

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

Important interpretation:

The execution boundary now creates the `StateAuthority` itself.

The caller supplies the application-owned state.

The operation receives the controlled authority rather than an externally constructed authority.

---

# 31. Current `src/core/notification.ts`

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

---

# 32. Current `src/core/index.ts`

```ts
export type { Outcome } from "./outcome";
export type { Operation, StateAuthority } from "./operation";
export type { Execution } from "./execution";
export { execute } from "./execution";
```

Notification is currently not included in this index export.

That may need consideration later.

---

# 33. Removed Core Controller

The original:

```text
src/core/controller.ts
```

was deleted.

Its test:

```text
tests/core/controller.test.ts
```

was also deleted.

This was intentional.

The controller abstraction was considered too broad and inconsistent with the intended Seed architecture.

---

# 34. Existing Data Placeholder

The original:

```text
src/data/record.ts
```

and:

```text
tests/data/record.test.ts
```

remain.

The data record is still an old validation placeholder and has not yet been fully replaced or redesigned.

The four existing data tests are currently passing.

This area has not yet been addressed in the current implementation work.

---

# 35. Package / Tooling

`package.json` currently remains:

```json
{
  "name": "obsidian-app-kernel",
  "version": "0.1.0",
  "description": "Reusable architectural kernel for portable Obsidian-based applications",
  "main": "main.js",
  "scripts": {
    "build": "esbuild src/main.ts --bundle --outfile=main.js --external:obsidian --format=cjs --target=es2020",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "esbuild": "^0.21.0",
    "obsidian": "^1.5.0",
    "typescript": "^5.4.0",
    "vitest": "^1.5.0"
  }
}
```

`npm install` was run successfully.

It installed:

```text
88 packages
```

and created:

```text
package-lock.json
```

The install reported dependency vulnerabilities.

No `npm audit fix --force` was run.

There was also an esbuild postinstall/allow-scripts warning.

These are not currently the focus of the architectural work.

---

# 36. Testing History

After the initial install, tests passed.

The old controller tests were later removed.

Notification tests were added.

The latest execution test was expanded to include state-observation behavior.

Current latest test result:

```text
Test Files  3 passed (3)
Tests       10 passed (10)
```

Passing files:

```text
tests/core/notification.test.ts   3 tests
tests/data/record.test.ts         4 tests
tests/core/execution.test.ts      3 tests
```

Total:

```text
10/10 passing
```

The recurring message:

```text
The CJS build of Vite's Node API is deprecated.
```

is a warning, not a test failure.

It has deliberately not been addressed yet.

---

# 37. Current Execution Tests

The current `tests/core/execution.test.ts` tests:

1. Controlled execution mutates state through `mutate()`.
2. A NO-OP does not change state or notify.
3. State observation does not itself provide mutation authority at the TypeScript boundary.

Current test file:

```ts
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
```

---

# 38. Architecture Record

`ARCHITECTURE_RECORD.md` began as an empty ACP template.

It has now been updated with:

```text
ACP-001 — State observation and mutation authority
Status: Accepted
```

Resolution:

> `get()` provides read access through `Readonly<State>`; `mutate()` provides controlled mutation. ArchSeed does not prescribe deep immutability or a particular application state model.

This was committed and pushed.

---

# 39. Important Implementation Correction

An earlier version of `execution.ts` accepted a caller-created `StateAuthority`.

That was identified as architecturally too weak because:

> The execution boundary must create/grant the authority.

The earlier form effectively allowed the caller to construct the very authority the execution boundary was supposed to control.

The implementation was corrected so `execute()` constructs the `StateAuthority` internally.

This is an important architectural correction and should be preserved in project history.

---

# 40. Current Architectural Question — STOPPING POINT

The current unresolved issue is:

## Who owns the `StateChangeNotifier`?

Current execution shape:

```ts
{
  state,
  dependencies,
  notifier
}
```

The application currently supplies the notifier to `execute()`.

The execution boundary triggers:

```ts
execution.notifier.notify();
```

The unresolved question is whether:

1. the notifier itself should be created/owned by the execution/runtime boundary, or
2. the notifier instance should remain supplied by the application composition boundary.

The distinction matters because the frozen architecture says:

> The execution/runtime boundary owns notification triggering.

It does **not yet necessarily say that the runtime must own construction of the notifier itself**.

This question should be resolved before further implementation work.

---

# 41. Important Non-Decisions

The following have deliberately NOT been frozen:

* deep immutable state
* `DeepReadonly`
* a specific mutable/immutable state-management model
* a `KernelRuntime` class
* a global runtime singleton
* an operation registry
* a service locator
* mandatory validation
* mandatory capability
* mandatory resolution
* application-wide orchestration
* persistence mechanism
* UI model
* host integration model
* specific adapter implementation
* specific notification/event implementation
* application-specific domain model

Do not accidentally convert these into requirements.

---

# 42. Project Boundary With Command Center

ArchSeed is independent of Command Center.

Command Center has its own architecture, templates, AI roles, project model, workflows, and operational concerns.

ArchSeed must not absorb CC concepts merely because CC may eventually use similar mechanisms.

CC-specific domain vocabulary must remain outside ArchSeed.

A future CC implementation could theoretically use ArchSeed mechanisms, but that does not make ArchSeed a CC subsystem.

---

# 43. Separate Future Idea — Conversation Verbatim Capture

A separate future idea was identified:

> Build a plugin/app capable of capturing/exporting complete verbatim AI conversation transcripts.

This does **not** belong in ArchSeed.

It is more naturally a Command Center/application-level tool because it concerns:

* conversation history
* project provenance
* artifact preservation
* workflow
* AI interaction records

The architectural principle behind it is:

> Preserve the authoritative record rather than reconstructing it from AI memory or summaries.

This is a future CC idea, not an ArchSeed feature.

---

# 44. Working Method

The current development workflow is:

1. Architecture is reasoned through explicitly.
2. The human architect makes the final decision.
3. Small implementation changes are made.
4. User creates/replaces `.ts` files manually using CotEditor by copy/pasting complete files.
5. `npm test` is run.
6. Passing changes are committed/pushed through GitHub Desktop.
7. Repository state is treated as implementation authority.

The user does not want to manually type code.

When replacing a file, provide the **entire copy/paste file**, not fragments to append.

---

# 45. Current Project State

At the latest stopping point:

```text
Architecture:
  Core foundation defined
  State authority defined
  Outcome defined
  Operation defined
  Execution boundary implemented
  Notification implemented
  State observation/mutation distinction recorded

Repository:
  ArchSeed_Repo
  main
  clean/pushed after latest known commit

Tests:
  10/10 passing

Current unresolved architectural question:
  Ownership of StateChangeNotifier
```

---

# 46. Resume Point

The next step is **not** to write more code immediately.

First resolve:

> **Should the execution/runtime boundary create and own the notifier, or should the application composition boundary supply the notifier while the execution boundary owns notification triggering?**

The answer should be established architecturally before changing implementation.

---

# 47. Preservation Principle

The ArchSeed project should preserve the distinction between:

**what was discussed**

and

**what was actually decided/frozen.**

Exploratory reasoning should not automatically become architecture.

The repository remains the implementation authority.

The architectural record captures accepted decisions.

The conversation provides provenance and reasoning.

---

# End of Preservation Record
