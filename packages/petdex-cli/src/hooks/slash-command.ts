/**
 * /petdesk slash command — installable across every supported agent.
 *
 * The slash command body is identical for all four agents because
 * each of them shares the same "frontmatter + markdown + $ARGUMENTS"
 * convention. We just drop the file at the right path per agent
 * (see Agent.slashCommandPath) and the agent surfaces /petdesk in
 * its picker.
 *
 * The command tells the agent to run a shell out to the persisted
 * petdesk CLI. We do NOT want the agent to "interpret" or "explain"
 * anything — it should just run the CLI and surface the output.
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

import type { Agent } from "./agents.js";

// Resolve the petdex CLI invocation at install time. We always have
// a persisted snapshot at ~/.petdex/bin/petdex.js (written by
// persistRunningBinary during hooks install), so the slash command
// uses that absolute path. This avoids the "petdesk: command not
// found" failure in agents whose shell doesn't have npm globals on
// PATH.
const PETDEX_INVOKE = `node "$HOME/.petdex/bin/petdex.js"`;

const SLASH_COMMAND_BODY = `---
description: Start or control the petdesk mascot from Codex
---

The user wants to start or control the petdesk mascot from inside the agent. The mascot is a floating desktop pet driven by hooks installed in agent settings. /petdesk with no args should force-wake the default pet, not toggle it off.

Run the matching command using the persisted petdex binary at \`$HOME/.petdex/bin/petdex.js\` (always present after \`petdesk hooks install\`):

- \`/petdesk\` (no args) → run \`${PETDEX_INVOKE} up\`
- \`/petdesk on\` or \`/petdesk start\` or \`/petdesk up\` → run \`${PETDEX_INVOKE} up\`
- \`/petdesk toggle\` → run \`${PETDEX_INVOKE} toggle\`
- \`/petdesk down\` → run \`${PETDEX_INVOKE} down\`
- \`/petdesk status\` → run \`${PETDEX_INVOKE} hooks status\`
- \`/petdesk doctor\` → run \`${PETDEX_INVOKE} doctor\`

Show the command output verbatim to the user. Don't reinterpret, don't explain. The CLI's output is already user-facing.

If \`$HOME/.petdex/bin/petdex.js\` doesn't exist, the user hasn't run \`petdesk hooks install\` yet. Tell them to install from source, run \`petdesk init\`, then retry.

Arguments: \`$ARGUMENTS\`
`;

const GEMINI_COMMAND_BODY = `description = "Start or control the petdesk mascot from Gemini"

prompt = """
The user wants to start or control the petdesk mascot from inside the agent. The mascot is a floating desktop pet driven by hooks installed in agent settings. /petdesk with no args should force-wake the default pet, not toggle it off.

Run the matching command using the persisted petdex binary at \`$HOME/.petdex/bin/petdex.js\` (always present after \`petdesk hooks install\`):

- \`/petdesk\` (no args) -> run \`${PETDEX_INVOKE} up\`
- \`/petdesk on\` or \`/petdesk start\` or \`/petdesk up\` -> run \`${PETDEX_INVOKE} up\`
- \`/petdesk toggle\` -> run \`${PETDEX_INVOKE} toggle\`
- \`/petdesk down\` -> run \`${PETDEX_INVOKE} down\`
- \`/petdesk status\` -> run \`${PETDEX_INVOKE} hooks status\`
- \`/petdesk doctor\` -> run \`${PETDEX_INVOKE} doctor\`

Show the command output verbatim to the user. Don't reinterpret, don't explain. The CLI's output is already user-facing.

If \`$HOME/.petdex/bin/petdex.js\` doesn't exist, the user hasn't run \`petdesk hooks install\` yet. Tell them to install from source, run \`petdesk init\`, then retry.

Arguments: \`{{args}}\`
"""
`;

const LEGACY_GEMINI_ANTIGRAVITY_WORKFLOW = path.join(
  homedir(),
  ".gemini",
  "antigravity",
  "global_workflows",
  "petdex.md",
);

/**
 * Drop the /petdesk slash command file at the agent's slash-command
 * path. Called from `petdesk hooks install` for each selected agent.
 * Idempotent — if the file already exists we just overwrite it
 * (this is OUR file, not user-authored, and the body never depends
 * on user state).
 */
export async function installSlashCommand(agent: Agent): Promise<void> {
  await mkdir(path.dirname(agent.slashCommandPath), { recursive: true });
  await writeFile(
    agent.slashCommandPath,
    agent.id === "gemini" ? GEMINI_COMMAND_BODY : SLASH_COMMAND_BODY,
    "utf8",
  );
  if (agent.id === "gemini") {
    await rm(LEGACY_GEMINI_ANTIGRAVITY_WORKFLOW, { force: true });
  }
}

/**
 * Remove the /petdesk slash command file. Best-effort — missing file
 * is fine, that's the desired post-state.
 */
export async function uninstallSlashCommand(agent: Agent): Promise<void> {
  try {
    await rm(agent.slashCommandPath, { force: true });
    if (agent.id === "gemini") {
      await rm(LEGACY_GEMINI_ANTIGRAVITY_WORKFLOW, { force: true });
    }
  } catch {
    // Already absent — that's the desired state.
  }
}
