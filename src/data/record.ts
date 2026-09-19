/**
 * Data layer — pure types and validators.
 *
 * This module defines record shapes and validation rules only.
 * It does not read or write files, and it never imports the host
 * framework (Obsidian or anything else).
 *
 * The concrete domain model is intentionally left as a minimal
 * placeholder. Replace `Entity` and `validateEntity` with your
 * application's real record type when you start a new project from
 * this Kernel.
 */

/** Minimal placeholder identity. Replace with your domain type. */
export interface Entity {
  id: string;
}

export type ValidationIssue = {
  field: string;
  reason: "missing" | "invalid_type" | "invalid_value";
};

export type ValidationResult = {
  valid: boolean;
  issues: ValidationIssue[];
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates a plain object against the Entity shape.
 * Operates only on plain data — no framework, no I/O.
 */
export function validateEntity(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (input === null || typeof input !== "object") {
    return {
      valid: false,
      issues: [{ field: "(root)", reason: "invalid_type" }],
    };
  }

  const record = input as Partial<Entity>;

  if (!isNonEmptyString(record.id)) {
    issues.push({ field: "id", reason: "missing" });
  }

  return { valid: issues.length === 0, issues };
}
