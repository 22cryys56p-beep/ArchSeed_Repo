import { describe, it, expect } from "vitest";
import { validateEntity, type Entity } from "../../src/data/record";

describe("validateEntity", () => {
  it("accepts a minimal valid entity", () => {
    const entity: Entity = { id: "ent-001" };
    const result = validateEntity(entity);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("rejects null / non-object input", () => {
    expect(validateEntity(null).valid).toBe(false);
    expect(validateEntity(42).valid).toBe(false);
    expect(validateEntity("string").valid).toBe(false);
  });

  it("flags a missing id", () => {
    const result = validateEntity({});
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual({ field: "id", reason: "missing" });
  });

  it("flags an empty / whitespace-only id", () => {
    const result = validateEntity({ id: "   " });
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual({ field: "id", reason: "missing" });
  });
});
