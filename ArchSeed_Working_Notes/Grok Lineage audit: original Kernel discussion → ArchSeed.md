## Lineage audit: original Kernel discussion → ArchSeed

This is historical only. No redesign, no recommendations, no ranking.

---

### 1. What we originally believed belonged in a reusable application kernel

From the original prompt and the early part of this thread, the Kernel was framed as:

**Structural / layering**
- A plain **data** layer: types + standalone validators, zero host imports, operates on plain objects
- A **core** (logic) layer: real behavior, unit-testable without Obsidian, host data only via injected function types
- A thin **adapter** layer: the only place allowed to import Obsidian (lifecycle, registration, wiring)
- Dependency direction: `adapter → core → data`, host only at the edge
- Tests mirroring `src/` for data and core

**Governance**
- An empty ACP-style architecture record (append-only decision log)

**Principle (stated explicitly)**
> Data and logic never import the host framework. The adapter is the only place that’s allowed to.

**What the first concrete artifact treated as “the Kernel”**
- Placeholder `Entity` + `validateEntity`
- A small `KernelController` (selection state, injected provider, filter-to-valid)
- Thin Obsidian `Plugin` + `ItemView`
- Folder scaffold and README pointing at Command Center as a worked example

**What the deeper (GPT-shared) reasoning later treated as Kernel substance**
Not folders, but **relationships / guarantees**:
- Explicit state ownership  
- Controlled state transitions / actions  
- Capability separate from action  
- Resolution separate from execution  
- Dependency injection / abstract contracts (providers)  
- Read-only state access for consumers  
- State-change notification without handing over mutation  
- Composition / wiring as a deliberate boundary  
- Lifecycle ownership  
- Honest failure (success vs legitimate no-op vs invalid vs failure)  
- Host-independent data contracts + validation  

Candidate “primitives” named in that phase (not implemented here): State, Action, Capability, Resolver, Contract, Validator, StateChangeNotification, Composition, Lifecycle, Outcome/Failure.

**Also present in original framing, but ambiguous**
- Obsidian as the natural home of the starter (plugin layout, `manifest.json`, “open in vault”)
- Command Center as both “worked example” and “ground zero” of the pattern
- Later corrections in this thread: foundation *under* applications; Obsidian as sandbox; then “core of the kernel *is* Obsidian but structured for portability” — those were **corrections to framing**, not settled Kernel contents

---

### 2. Which of those ideas survived into ArchSeed

**Survived as mechanisms (or direct descendants)**

| Original idea | In ArchSeed |
|---------------|-------------|
| Host-independent core | Yes — formal definition: host-independent architectural mechanisms |
| Controlled mutation / state ownership | Yes — `StateAuthority` (`get` / `mutate`) |
| Explicit outcomes / honest failure | Yes — `Outcome`: success \| noop \| invalid \| failure |
| Operation as controlled action | Yes — `Operation` type |
| Execution path that runs an operation | Yes — `execute` |
| State-change notification without exposing mutation | Yes — `StateChangeNotifier`; notify only when mutation occurred |
| Application uses Seed; Seed does not know application domain | Yes — `campaign/` imports core; core does not import campaign |
| Adapter / host at the edge | Yes — `src/adapter/` still exists for Obsidian sandbox; Seed core does not depend on it |
| Layered repo shape (data / core / adapter, tests) | Partially — structure remains; meaning of “core” shifted from “app logic skeleton” to “Seed mechanisms” |
| ACP-style architecture record | Yes — `ARCHITECTURE_RECORD.md` with decisions recorded |
| Unit tests without host runtime | Yes — core + campaign tests |

**Survived as principle, not as the same artifact**
- “Data and logic never import the host” → restated as host independence of the Seed and a negative boundary (no domain, presentation, persistence, host integration, or imposed app orchestration in the Seed)

---

### 3. Which were deliberately stripped away during the evolution into ArchSeed

These appear **intentionally** outside the Seed (by formal definition, negative boundary, or Stage 1 practice):

- **Imposed application structure** — explicit guardrail: not an application framework; no full app skeleton required by the Seed  
- **Placeholder domain model** (`Entity`, generic record as Kernel content) — domain lives in the application (`campaign/`), not in the Seed  
- **KernelController-style application controller** as a Seed primitive — replaced by generic `Operation` + `StateAuthority` + `execute`, not a one-size controller class  
- **Capability / availability model as a Seed primitive** — present in the deep Candidate Map; not present as a core type in ArchSeed Stage 1  
- **Resolver as a Seed primitive** — pure “resolve then optionally execute” was a CC-derived candidate; ArchSeed does not ship a generic Resolver type  
- **Composition root / lifecycle ownership as Seed concepts** — composition and lifecycle are application/host concerns; Seed does not define a composition or lifecycle API  
- **Validation as a Seed mechanism** — original data-layer validators were Kernel-shaped; ArchSeed core has no generic Validator primitive (validation, if any, sits in application operations / domain)  
- **Contract / provider as a named Seed abstraction** — original “injected provider” idea survives only as the generic `Dependencies` parameter on `Operation`, not as a first-class Provider type  
- **Obsidian plugin starter as the identity of the project** — README still mentions portable Obsidian apps, but formal definition and preservation record center host-independent *mechanisms*, with Obsidian as current host/sandbox  

---

### 4. Which were stripped because they were actually Obsidian- or application-specific

**Clearly adapter / host**
- `manifest.json`, plugin registration, `ItemView` shell, leaf activation — belong to the Obsidian host path, not the Seed definition  
- “Place under `.obsidian/plugins/`” workflow — host packaging, not architectural mechanism  

**Clearly application (CC or any app)**
- Project records, status vocabularies, navigation depths, screens, orientation bar, category/list behavior  
- CC-specific composition (`CommandCenterView` as owner of controller + views)  
- Any requirement that the Seed know “quest”, “character”, “project”, etc.  

**Borderline in the original thread, treated as non-Seed in ArchSeed**
- A reusable **navigation** or **UI capability** model — was argued as Kernel-candidate from CC; ArchSeed Stage 1 treats capability-like behavior (if any) as application logic over `Outcome` / operations, not a Seed type  
- **Composition and lifecycle** as extractable Kernel primitives — in CC they were real; ArchSeed classifies them as outside the Seed (application/host assemble and own lifetime)  

---

### 5. Did anything important from the original architectural reasoning disappear accidentally rather than deliberately?

From repo + preservation/Stage 1 notes, these look **deliberate** (documented boundary or evaluation choice), not silent loss:

- Capability-as-primitive  
- Resolver-as-primitive  
- Generic validation layer in the Seed  
- Composition/lifecycle as Seed API  

**Possible accidental under-emphasis (not “deleted code,” but thinner than the original deep reasoning):**

- **Read-only observation as a first-class story** — `get(): Readonly<State>` exists, but the original thread stressed “consumers observe; they do not control” as a major relationship. ArchSeed encodes that mainly via `StateAuthority` + notification, without a separate “read model” or observation API. That may be intentional minimalism rather than an accident; the audit cannot prove intent beyond the formal negative boundary.  
- **Explicit distinction of “legitimate no-op vs programmer error” at the type level** — `Outcome` has `noop` and `invalid` (and `failure`), which covers the *categories*. CC’s practice of throw-on-programmer-error vs return-on-no-op is not mandated by ArchSeed as a Seed rule; operations choose. Whether that is deliberate flexibility or a softening of the original “honest failure” rigor is not stated as an accidental drop.  
- **The original “Kernel core *is* Obsidian” line from late in this thread** — ArchSeed’s formal docs say host-independent mechanisms and Obsidian as sandbox/host. That is a **reframing**, consistent with the preservation record, not an unexplained disappearance of a mechanism.

Nothing in the Stage 1 evaluation claims an important original *mechanism* was lost by mistake; it claims the existing mechanisms were sufficient for the tested application behaviors.

---

### 6. What ArchSeed discovered in Stage 1 that the original Kernel concept did not establish

Original Kernel concept (this thread) largely **proposed** structure and relationships. ArchSeed Stage 1 **exercised** a minimal mechanism set against a real application slice (campaign).

Established by Stage 1 evidence (not merely proposed):

1. **A small set of mechanisms is enough for controlled app behavior** — create/start/complete/assign quests, characters, sessions, without new Seed abstractions.  
2. **Cross-entity mutation can live inside one controlled mutation boundary** — e.g. complete assigned quest and grant XP in the same `mutate` / `execute` path; no extra Seed “transaction” type was required for the tested case.  
3. **Notification correctness tied to actual mutation** — no mutation → no notification (e.g. completing an already-completed quest).  
4. **Application-level relationships need not become Seed concepts** — assignment, session links, XP→level calculation stayed in the application layer.  
5. **Synchronous single-mutator “atomicity” is a language/runtime property, not a Seed guarantee** — Stage 1 notes explicitly refuse to claim transactions/rollback/isolation as ArchSeed features.  
6. **Negative boundary holds under load** — Seed did not absorb campaign meaning, persistence, or host concerns during the test.

The original thread did not run an application probe of that kind; it stopped at candidate maps, framing corrections, and a thin starter.

---

### 7. What in the original reasoning you would classify differently now that ArchSeed exists

**Reclassify from “Kernel content” → “application-level implementation”**
- A default controller class, placeholder entities, and “starter screens”  
- Most of CC’s navigation/availability UI wiring as *examples* of using boundaries, not as Seed primitives  

**Reclassify from “Kernel content” → “Obsidian adapter concern”**
- Plugin packaging, ItemView shell, vault install path — host integration, even when the first host is Obsidian  

**Reclassify from “proposed Kernel primitive” → “optional application pattern”**
- Capability model, generic Resolver, generic Validator, formal Composition/Lifecycle types — useful patterns applications may implement *using* Outcome/Operation/StateAuthority; ArchSeed did not establish them as Seed mechanisms  

**Reclassify from “folder starter = Kernel” → “scaffolding around mechanisms”**
- The original deliverable’s identity was largely structural. ArchSeed’s identity is the **mechanism set** (`Outcome`, `Operation`/`StateAuthority`, `execute`, notification). The folders are packaging.  

**Reclassify framing of Obsidian**
- Early thread: Kernel as portable Obsidian-app starter  
- Mid thread: foundation under apps; Obsidian as sandbox  
- Late correction: “core of the kernel *is* Obsidian” but portable  
- ArchSeed formal stance: **mechanisms are host-independent; Obsidian is current host/sandbox**  
  Seeing ArchSeed, the durable classification is the formal one: Obsidian is not the definition of the Seed; it is one host path.

**Still “proposed but never established” in the original thread**
- Full primitive list (Capability, Resolver, Contract, Composition, Lifecycle as Seed APIs)  
- A complete boundary document of the rigor ArchSeed’s preservation record later wrote  
- Evidence from a non-CC application test  

---

### Distinction summary (as requested)

| Kind | Examples in this lineage |
|------|---------------------------|
| **Architectural mechanism** | `Outcome`; `Operation` + `StateAuthority`; `execute`; mutation-triggered notification |
| **Application-level implementation** | Campaign quest/character/session; XP rules; CC project/navigation domain |
| **Obsidian adapter concern** | `src/adapter/*`, `manifest.json`, plugin lifecycle |
| **Proposed but never established (in original thread)** | Capability/Resolver/Composition/Lifecycle as Seed primitives; Kernel = full extracted CC relationship set in code |

End of lineage audit. No score, no winner, no ArchSeed modification.