/**
 * Adapter layer — thin ItemView shell.
 *
 * This is one of the only places allowed to import from "obsidian".
 * Real behavior stays in core. This file currently owns no controller —
 * the earlier generic Controller abstraction was deliberately removed
 * (see ArchSeed_Working_Notes) as too broad an orchestration layer.
 * Wiring a real data source back in is future work, not done here.
 */

import { ItemView, type WorkspaceLeaf } from "obsidian";

export const KERNEL_VIEW_TYPE = "obsidian-app-kernel-view";

export class KernelView extends ItemView {
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

  async onClose(): Promise<void> {}
}