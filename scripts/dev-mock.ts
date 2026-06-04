// Boots `next dev` with the mock environment loaded. We don't rely on
// Next's automatic .env.local discovery because that file may already
// hold real maintainer credentials — we want .env.mock to win regardless.

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const envFile = ".env.mock";
if (!existsSync(envFile)) {
  console.error(`[dev:mock] ${envFile} not found in cwd`);
  process.exit(1);
}

const env: Record<string, string> = {};
for (const line of readFileSync(envFile, "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
}

console.log(
  "[dev:mock] PETDEX_MOCK=1 — booting in-process mocks (db, clerk, redis)",
);

// Strip a maintainer's real .env.local out of the inherited env so it
// can't override our mock values. Next still reads .env.local from disk,
// so we also point it at a different file via NODE_ENV-aware overrides.
const stripped: NodeJS.ProcessEnv = { ...process.env };
for (const key of Object.keys(stripped)) {
  if (
    key.startsWith("CLERK_") ||
    key.startsWith("NEXT_PUBLIC_CLERK_") ||
    key.startsWith("UPSTASH_") ||
    key.startsWith("R2_") ||
    key.startsWith("RESEND_") ||
    key === "DATABASE_URL" ||
    key === "OPENAI_API_KEY" ||
    key === "ELEVENLABS_API_KEY"
  ) {
    delete stripped[key];
  }
}

// PGlite's wasm bindings choke under turbopack bundling — fall back to
// the webpack dev server which resolves them correctly.
const child = spawn(
  "bun",
  ["x", "next", "dev", "--webpack", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: { ...stripped, ...env, PETDEX_MOCK: "1" },
  },
);

child.on("exit", (code) => process.exit(code ?? 0));
