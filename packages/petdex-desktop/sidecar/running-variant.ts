/**
 * Running-variant alternator: hooks send the bare "running" state, the
 * sidecar substitutes alternating "running-left" / "running-right" so
 * consecutive tool calls don't all show the same sprite frame. Lives in
 * its own module so the toggle state is easy to reset in tests and the
 * pure logic is exercisable without spinning up an HTTP server.
 *
 * The toggle is module-level by design — there's exactly one sidecar
 * process per Petdex install and we want the variant to persist across
 * the whole session, not per-request.
 */

let toggle: "running-left" | "running-right" = "running-left";

export function nextRunningVariant(): "running-left" | "running-right" {
  const next = toggle;
  toggle = next === "running-left" ? "running-right" : "running-left";
  return next;
}

/** Test-only: reset the toggle so each describe() starts at left. */
export function resetRunningVariantForTests(): void {
  toggle = "running-left";
}
