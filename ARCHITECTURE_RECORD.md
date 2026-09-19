# Architecture Record

Lightweight, append-only log of architectural decisions for this project.

Each entry is an **Architecture Change Proposal (ACP)**.

| ID | Title | Status | Resolution |
|--------|-------|----------|------------|
| ACP-001 | State observation and mutation authority | Accepted | `get()` provides read access through `Readonly<State>`; `mutate()` provides controlled mutation. ArchSeed does not prescribe deep immutability or a particular application state model. |

**Status values**: `Proposed` · `Accepted` · `Resolved`

When you make an architectural decision (layer boundary, identity scheme, validation rule, navigation model, etc.), add a new row. Keep the resolution to one clear line.