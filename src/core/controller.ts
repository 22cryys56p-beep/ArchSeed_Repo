/**
 * Core logic layer — framework-agnostic application behavior.
 *
 * This module contains real state and logic that can be unit-tested
 * with Vitest and has zero dependency on Obsidian (or any other host).
 *
 * Host data arrives only through injected function types
 * (e.g. EntityProvider). The adapter layer is responsible for
 * supplying those functions; this layer never reaches for host APIs.
 */

import type { Entity } from "../data/record";
import { validateEntity } from "../data/record";

/**
 * Minimal injected dependency for obtaining the current set of entities.
 * Kept as a plain function type so the controller never imports the host.
 */
export type EntityProvider = () => readonly Entity[];

export type ControllerState = {
  selectedId: string | null;
  entities: readonly Entity[];
};

/**
 * A tiny host-agnostic state holder.
 * Replace or extend this with your application's real controller logic.
 */
export class KernelController {
  private selectedId: string | null = null;
  private readonly getEntities: EntityProvider;

  constructor(getEntities: EntityProvider) {
    this.getEntities = getEntities;
  }

  /** Snapshot of current state (read-only). */
  getState(): ControllerState {
    return {
      selectedId: this.selectedId,
      entities: this.getEntities(),
    };
  }

  /** Select an entity by id. No-op if the id is not present. */
  select(id: string): void {
    const entities = this.getEntities();
    const found = entities.find((e) => e.id === id);
    this.selectedId = found ? found.id : null;
  }

  /** Clear selection. */
  clearSelection(): void {
    this.selectedId = null;
  }

  /**
   * Returns only entities that pass validation.
   * Demonstrates pure data + logic composition with no host involvement.
   */
  getValidEntities(): Entity[] {
    return this.getEntities().filter((e) => validateEntity(e).valid);
  }
}
