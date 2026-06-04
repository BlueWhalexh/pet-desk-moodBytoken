/**
 * `petdex hooks refresh` — non-interactive re-write of hook configs +
 * slash commands + persisted binary, for every agent that's already
 * been wired up.
 *
 * Use case: a user ran `petdex init` weeks ago. We've since updated
 * the slash command body or the hook templates (bubble runner stuff),
 * and they need to pick up those changes WITHOUT re-running the
 * interactive install wizard. This is also what the auto-update flow
 * should call after replacing the binary.
 *
 * Detection: an agent counts as "wired" if either its config file or
 * its slash command file exists. Both are owned by us — agents that
 * never had petdex installed have neither.
 *
 * Idempotent: re-running this immediately after itself produces no
 * diff. Safe to run from cron or background tasks.
 */

import { existsSync } from "node:fs";

import { AGENTS, type Agent } from "./agents";
import { installForAgent } from "./install";
import { persistRunningBinary } from "./persist-binary";

export type RefreshResult = {
  refreshed: Agent["id"][];
  skipped: { id: Agent["id"]; reason: string }[];
  binaryPersisted: boolean;
  binaryReason?: string;
};

function isAgentWired(agent: Agent): boolean {
  // Either signal works — slash command alone is fine if the user
  // had hooks but uninstalled them, and hook config alone is fine
  // if they removed the slash command manually.
  return existsSync(agent.configFile) || existsSync(agent.slashCommandPath);
}

/**
 * Re-write the petdex-managed bits for every wired agent.
 * Returns a structured result so callers (the CLI command, or the
 * auto-update post-step) can render their own success/failure UI.
 */
export async function runRefresh(): Promise<RefreshResult> {
  const result: RefreshResult = {
    refreshed: [],
    skipped: [],
    binaryPersisted: false,
  };

  // Re-snapshot the binary first. The slash command body we're about
  // to write references `$HOME/.petdex/bin/petdex.js`, so it had
  // better be the current version.
  try {
    const binResult = await persistRunningBinary();
    result.binaryPersisted = binResult.ok;
    if (!binResult.ok) result.binaryReason = binResult.reason;
  } catch (err) {
    result.binaryReason = (err as Error).message;
  }

  for (const agent of AGENTS) {
    if (!isAgentWired(agent)) {
      result.skipped.push({ id: agent.id, reason: "not installed" });
      continue;
    }
    try {
      await installForAgent(agent);
      result.refreshed.push(agent.id);
    } catch (err) {
      result.skipped.push({ id: agent.id, reason: (err as Error).message });
    }
  }

  return result;
}
