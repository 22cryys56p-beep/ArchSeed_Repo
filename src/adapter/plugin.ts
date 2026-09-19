/**
 * Adapter layer — Obsidian plugin entry point.
 *
 * This is one of the only places allowed to import from "obsidian".
 * Keep it thin: register the view, expose a command, manage lifecycle.
 * All real logic lives in src/core and src/data.
 */

import { Plugin } from "obsidian";
import { KernelView, KERNEL_VIEW_TYPE } from "./view";

export default class KernelPlugin extends Plugin {
  async onload(): Promise<void> {
    this.registerView(KERNEL_VIEW_TYPE, (leaf) => new KernelView(leaf));

    this.addCommand({
      id: "open-kernel-view",
      name: "Open Kernel View",
      callback: () => {
        void this.activateView();
      },
    });

    console.log("Obsidian App Kernel: plugin loaded.");
  }

  onunload(): void {
    console.log("Obsidian App Kernel: plugin unloaded.");
  }

  /**
   * Opens the Kernel view, reusing an existing leaf if one is already open.
   */
  private async activateView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(KERNEL_VIEW_TYPE);

    if (existing.length > 0) {
      this.app.workspace.revealLeaf(existing[0]);
      return;
    }

    const leaf = this.app.workspace.getLeaf(false);
    await leaf.setViewState({
      type: KERNEL_VIEW_TYPE,
      active: true,
    });
    this.app.workspace.revealLeaf(leaf);
  }
}
