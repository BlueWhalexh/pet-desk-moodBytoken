import { describe, expect, test } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { scanLocalAgentUsage } from "./agent-usage";

function tmpHome(): string {
  return join(
    tmpdir(),
    `petdex-agent-usage-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
}

describe("scanLocalAgentUsage", () => {
  test("sums Claude JSONL message usage inside the window", () => {
    const home = tmpHome();
    const projectDir = join(home, ".claude", "projects", "demo");
    mkdirSync(projectDir, { recursive: true });
    const nowMs = Date.parse("2026-06-04T08:00:00.000Z");
    writeFileSync(
      join(projectDir, "session.jsonl"),
      [
        JSON.stringify({
          timestamp: "2026-06-04T07:00:00.000Z",
          message: {
            usage: {
              input_tokens: 100,
              output_tokens: 50,
              cache_read_input_tokens: 20,
            },
          },
        }),
        JSON.stringify({
          timestamp: "2026-06-01T07:00:00.000Z",
          message: { usage: { input_tokens: 999_999 } },
        }),
      ].join("\n"),
    );

    const sample = scanLocalAgentUsage({
      homeDir: home,
      nowMs,
      config: {
        windowMs: 24 * 60 * 60 * 1000,
        tokenBudget: 1_000,
        weights: {
          input: 1,
          output: 1,
          cacheRead: 1,
          cacheCreation: 1,
          textEstimate: 1,
        },
      },
    });

    expect(sample.agentSource).toBe("claude-code");
    expect(sample.tokens).toBe(170);
    expect(sample.messages).toBe(1);
    expect(sample.fatigue).toBe(0.17);
  });

  test("uses Claude stats-cache daily totals when current", () => {
    const home = tmpHome();
    mkdirSync(join(home, ".claude"), { recursive: true });
    const nowMs = Date.parse("2026-06-04T08:00:00.000Z");
    writeFileSync(
      join(home, ".claude", "stats-cache.json"),
      JSON.stringify({
        dailyModelTokens: [
          {
            date: "2026-06-04",
            tokensByModel: { "claude-sonnet": 2500 },
          },
        ],
      }),
    );

    const sample = scanLocalAgentUsage({
      homeDir: home,
      nowMs,
      config: {
        windowMs: 24 * 60 * 60 * 1000,
        tokenBudget: 10_000,
        weights: {
          input: 1,
          output: 1,
          cacheRead: 1,
          cacheCreation: 1,
          textEstimate: 1,
        },
      },
    });

    expect(sample.tokens).toBe(2500);
    expect(sample.fatigue).toBe(0.25);
  });

  test("estimates text when native usage is absent", () => {
    const home = tmpHome();
    const projectDir = join(home, ".codex", "archived_sessions");
    mkdirSync(projectDir, { recursive: true });
    const nowMs = Date.parse("2026-06-04T08:00:00.000Z");
    writeFileSync(
      join(projectDir, "session.jsonl"),
      JSON.stringify({
        timestamp: "2026-06-04T07:00:00.000Z",
        message: { content: [{ text: "hello world" }] },
      }),
    );

    const sample = scanLocalAgentUsage({
      homeDir: home,
      nowMs,
      tokenizer: (text) => text.split(/\s+/).length,
      config: {
        windowMs: 24 * 60 * 60 * 1000,
        tokenBudget: 10,
        weights: {
          input: 1,
          output: 1,
          cacheRead: 1,
          cacheCreation: 1,
          textEstimate: 1,
        },
      },
    });

    expect(sample.agentSource).toBe("codex");
    expect(sample.breakdown.textEstimate).toBe(2);
    expect(sample.fatigue).toBe(0.2);
  });

  test("returns normal baseline when no recent token data exists", () => {
    const sample = scanLocalAgentUsage({
      homeDir: tmpHome(),
      nowMs: Date.parse("2026-06-04T08:00:00.000Z"),
    });

    expect(sample.agentSource).toBeNull();
    expect(sample.tokens).toBe(0);
    expect(sample.fatigue).toBe(0);
  });
});
