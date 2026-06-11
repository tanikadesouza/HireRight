// =============================================================================
// SEVERITY — fixed ladder for all observability writers
// =============================================================================
// The ONLY valid severity values, in ascending order. Mirrors the CHECK
// constraint on every observability table's `severity` / `min_severity`
// column. See PRINCIPLES.md §5.
//
// Do NOT add `notice`, `verbose`, `fatal`, `warning`, `trace`. Use the closest
// existing value:
//   notice  → info
//   verbose → debug
//   fatal   → critical
//   warning → warn
//   trace   → debug
// =============================================================================

export type Severity = "debug" | "info" | "warn" | "error" | "critical";

const SEVERITY_RANK: Record<Severity, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  critical: 4,
};

const VALID_SEVERITIES: ReadonlySet<string> = new Set([
  "debug",
  "info",
  "warn",
  "error",
  "critical",
]);

/**
 * Type guard. Returns true if the value is a valid Severity.
 */
export function isSeverity(value: unknown): value is Severity {
  return typeof value === "string" && VALID_SEVERITIES.has(value);
}

/**
 * Coerce an arbitrary input to a Severity. Invalid inputs fall back to the
 * provided default (or `"error"` if no default given). Use this at writer
 * boundaries so a typo in a producer doesn't lose the row.
 *
 * Maps common aliases to canonical values:
 *   "notice"  → "info"
 *   "verbose" → "debug"
 *   "fatal"   → "critical"
 *   "warning" → "warn"
 *   "trace"   → "debug"
 */
export function coerceSeverity(value: unknown, fallback: Severity = "error"): Severity {
  if (isSeverity(value)) return value;
  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();
    if (isSeverity(normalized)) return normalized;
    switch (normalized) {
      case "notice":
        return "info";
      case "verbose":
      case "trace":
        return "debug";
      case "fatal":
        return "critical";
      case "warning":
        return "warn";
    }
  }
  return fallback;
}

/**
 * Returns true if severity is `critical`. Use this to decide whether to take
 * the P0 blast path (`notifyAdmins`) vs the silent log-only path (`logError`).
 *
 * Rule from PRINCIPLES.md §5: severity 'critical' is reserved for notifyAdmins.
 * Calling logError with severity 'critical' and not also notifyAdmins is
 * almost certainly a mistake.
 */
export function isCritical(severity: Severity): boolean {
  return severity === "critical";
}

/**
 * Compares two severities. Returns positive if `a` is more severe than `b`,
 * negative if less severe, 0 if equal.
 *
 * Useful for filter predicates: `compareSeverity(row.severity, "warn") >= 0`
 * matches warn / error / critical.
 */
export function compareSeverity(a: Severity, b: Severity): number {
  return SEVERITY_RANK[a] - SEVERITY_RANK[b];
}
