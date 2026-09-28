/**
 * Campaign application layer — composition.
 *
 * This is the "application composition boundary" that ACP-002 refers to:
 * it constructs the state and the single StateChangeNotifier, keeps them
 * together for the life of the app, and hands both to ArchSeed's
 * execute() on every run.
 *
 * It knows nothing about Obsidian. The host supplies storage through
 * the small CampaignStorage contract below; anything that can load and
 * save one plain object can host a campaign.
 *
 * Persistence is just an observer of the notifier. It is subscribed
 * first, so it takes its snapshot before any view reacts.
 */

import { execute } from "../../src/core/execution";
import type { Operation } from "../../src/core/operation";
import type { Outcome } from "../../src/core/outcome";
import {
  createStateChangeNotifier,
  type StateChangeListener,
} from "../../src/core/notification";
import type { CampaignState, CampaignDependencies } from "./state";
import { fromStoredCampaign, toStoredCampaign } from "./persistence";

/** What a host must provide. Obsidian's loadData/saveData fit this exactly. */
export interface CampaignStorage {
  load(): Promise<unknown>;
  save(data: unknown): Promise<void>;
}

export interface CampaignApp {
  /** Read access to the authoritative state. Do not mutate it directly. */
  get(): Readonly<CampaignState>;

  /** Run an operation through ArchSeed's execute(). */
  run<Request, Details>(
    operation: Operation<Request, CampaignState, CampaignDependencies, Details>,
    request: Request
  ): Outcome<Details>;

  /** Be told that state may have changed; re-read with get(). */
  subscribe(listener: StateChangeListener): () => void;

  /** Resolves once every save requested so far has finished (or failed). */
  flush(): Promise<void>;
}

export type OpenCampaignOptions = {
  /**
   * Called when a save fails. The operation that caused it has already
   * succeeded in memory; the outcome cannot report this, so the host
   * must surface it some other way.
   */
  onPersistError?: (error: unknown) => void;
};

export type OpenCampaignResult =
  | { ok: true; app: CampaignApp }
  | { ok: false; reason: string };

export async function openCampaign(
  storage: CampaignStorage,
  options: OpenCampaignOptions = {}
): Promise<OpenCampaignResult> {
  let stored: unknown;

  try {
    stored = await storage.load();
  } catch (error) {
    return { ok: false, reason: `storage load failed: ${String(error)}` };
  }

  // Bad data is refused, never replaced. Starting empty here would let
  // the next save overwrite whatever the user had.
  const loaded = fromStoredCampaign(stored);
  if (!loaded.ok) {
    return { ok: false, reason: loaded.reason };
  }

  const state = loaded.state;
  const notifier = createStateChangeNotifier();
  let pending: Promise<void> = Promise.resolve();

  notifier.subscribe(() => {
    const snapshot = toStoredCampaign(state);

    // Saves run one at a time, in the order requested, and a failed
    // save never blocks the ones after it. Each snapshot is complete,
    // so a later successful save also repairs an earlier failed one.
    pending = pending
      .then(() => storage.save(snapshot))
      .catch((error) => {
        try {
          options.onPersistError?.(error);
        } catch {
          // A failing error handler must not stop future saves.
        }
      });
  });

  const app: CampaignApp = {
    get() {
      return state;
    },

    run(operation, request) {
      return execute(operation, request, {
        state,
        dependencies: {},
        notifier,
      });
    },

    subscribe(listener) {
      return notifier.subscribe(listener);
    },

    flush() {
      return pending;
    },
  };

  return { ok: true, app };
}