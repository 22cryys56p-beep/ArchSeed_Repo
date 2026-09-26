# ArchSeed

A minimal, reusable architectural starter for building **portable Obsidian-based applications**.

## Core Principle

> **Data and logic never import the host framework. The adapter layer is the only place that's allowed to.**

This is the actual ArchSeed. Everything else is scaffolding around it.

| Layer       | Location       | Rule                                                                                                                           |
| ----------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Data**    | `src/data/`    | Plain TypeScript types + standalone validators. Zero framework imports. Operates on plain objects only.                        |
| **Core**    | `src/core/`    | Real application logic. Fully unit-testable (Vitest). No Obsidian imports. Host data arrives only via injected function types. |
| **Adapter** | `src/adapter/` | The *only* place allowed to import `obsidian`. Thin: lifecycle, registration, wiring.                                          |

Dependency direction (enforced by convention):

```text
adapter  →  core  →  data
 ↘
 obsidian   (adapter only)
```

## What this is (and is not)

* **Is**: a clean structural pattern you can copy for every new Obsidian app/plugin.
* **Is not**: a domain model, a finished app, or a library you `npm install`.
* Domain, status vocabularies, screens, and business rules belong in the *application* that starts from this Kernel — not here.

## Worked example

[Command Center](https://github.com/22cryys56p-beep/Command_Center) is a full application built on this same architectural pattern.
Study it as a reference implementation. Do **not** copy its domain content into a new project.

## Getting started

1. Use this repository as a GitHub **template** (or copy the folder).
2. Rename the plugin in `manifest.json` (`id` + `name`).
3. Place the folder under `YourVault/.obsidian/plugins/<your-plugin-id>/` (or symlink it).
4. `npm install && npm run build`
5. Enable the plugin in Obsidian → Community plugins.
6. Replace the placeholder `Entity` in `src/data/` with your real domain type, and build your application logic in `src/core/`.
7. Record architectural decisions in this project's own `ARCHITECTURE_RECORD.md`.

## Scripts

```bash
npm test          # run unit tests (data + core only — no Obsidian runtime required)
npm run build     # produce main.js for Obsidian
```

## Governance

`ARCHITECTURE_RECORD.md` contains an empty Architecture Change Proposal (ACP) table.

Use it as a lightweight, append-only log of architectural decisions for the new application.
