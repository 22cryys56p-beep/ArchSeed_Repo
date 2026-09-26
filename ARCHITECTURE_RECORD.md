# Architecture Record

Lightweight, append-only log of architectural decisions for this project.

Each entry is an **Architecture Change Proposal (ACP)**.

| ID | Title | Status | Resolution |
|--------|-------|----------|------------|
| ACP-001 | State observation and mutation authority | Accepted | `get()` provides read access through `Readonly<State>`; `mutate()` provides controlled mutation. ArchSeed does not prescribe deep immutability or a particular application state model. |
| ACP-002 | Notifier construction and lifecycle ownership | Accepted | The application composition boundary constructs and owns the lifecycle of the `StateChangeNotifier`. Execution receives the notifier as an explicit dependency and owns the authority to trigger notification when its controlled state mutation boundary is invoked. Execution does not construct, replace, or release the notifier. |

**Status values**: `Proposed` · `Accepted` · `Resolved`

When you make an architectural decision (layer boundary, identity scheme, validation rule, navigation model, etc.), add a new row. Keep the resolution to one clear line.