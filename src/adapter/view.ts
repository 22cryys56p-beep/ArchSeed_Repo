/**
 * Adapter layer — thin ItemView shell.
 *
 * This is one of the only places allowed to import from "obsidian".
 * It owns the controller's lifetime (create in onOpen, drop in onClose)
 * and supplies the injected EntityProvider. Real behavior stays in core.
 */

import { ItemView, type WorkspaceLeaf } from "obsidian";
import { KernelController } from "../core/controller";
import type { Entity } from "../data/record";

export const KERNEL_VIEW_TYPE = "obsidian-app-kernel-view";

export class KernelView extends ItemView {
  private controller: KernelController | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return KERNEL_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Kernel";
  }

  async onOpen(): Promise<void> {
    // Placeholder provider — replace with real vault / cache integration
    // when you define the application's data model.
    const provider = (): readonly Entity[] => [];

    this.controller = new KernelController(provider);

    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.addClass("kernel-view-root");

    const title = root.createEl("h2", { text: "Obsidian App Kernel" });
    title.style.margin = "1rem";

    const hint = root.createEl("p", {
      text: "Replace this shell with your application's UI. Core logic lives in src/core and is independent of Obsidian.",
    });
    hint.style.margin = "0 1rem 1rem";
  }

  async onClose(): Promise<void> {
    this.controller = null;
  }
}
