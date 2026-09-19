import { describe, it, expect } from "vitest";
import { KernelController } from "../../src/core/controller";
import type { Entity } from "../../src/data/record";

const sample: Entity[] = [
  { id: "a" },
  { id: "b" },
  { id: "" }, // invalid
];

describe("KernelController", () => {
  it("starts with no selection", () => {
    const controller = new KernelController(() => sample);
    expect(controller.getState().selectedId).toBeNull();
  });

  it("selects an existing entity", () => {
    const controller = new KernelController(() => sample);
    controller.select("b");
    expect(controller.getState().selectedId).toBe("b");
  });

  it("ignores selection of a missing id", () => {
    const controller = new KernelController(() => sample);
    controller.select("does-not-exist");
    expect(controller.getState().selectedId).toBeNull();
  });

  it("clears selection", () => {
    const controller = new KernelController(() => sample);
    controller.select("a");
    controller.clearSelection();
    expect(controller.getState().selectedId).toBeNull();
  });

  it("returns only valid entities", () => {
    const controller = new KernelController(() => sample);
    const valid = controller.getValidEntities();
    expect(valid.map((e) => e.id)).toEqual(["a", "b"]);
  });
});
