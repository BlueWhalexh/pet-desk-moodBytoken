import {
  existsSync,
  readdirSync,
  readFileSync,
  type Stats,
  statSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import {
  addBreakdown,
  breakdownFromText,
  DEFAULT_TOKEN_MOOD_CONFIG,
  emptyBreakdown,
  estimateTextTokens,
  type TextTokenizer,
  type TokenMoodConfig,
  type TokenUsageBreakdown,
  tokenMoodConfigFromEnv,
  tokenMoodSample,
  usageBreakdown,
} from "./token-mood";

export type AgentUsageSample = {
  agentSource: string | null;
  fatigue: number;
  tokens: number;
  weightedTokens: number;
  rawTokens: number;
  tokenBudget: number;
  usagePercent: number;
  messages: number;
  sinceMs: number;
  reason: string;
  breakdown: TokenUsageBreakdown;
};

type UsageRecord = {
  agentSource: string;
  timestampMs: number;
  breakdown: TokenUsageBreakdown;
  messages: number;
};

type UsageScanOptions = {
  homeDir?: string;
  nowMs?: number;
  config?: TokenMoodConfig;
  source?: UsageSource;
  maxFiles?: number;
  tokenizer?: TextTokenizer | null;
};

export type UsageSource = "auto" | "all" | "claude-code" | "codex";

const DEFAULT_MAX_FILES = 24;
const JSONL_TAIL_BYTES = 1024 * 1024;

export function scanLocalAgentUsage(
  opts: UsageScanOptions = {},
): AgentUsageSample {
  const home = opts.homeDir ?? homedir();
  const nowMs = opts.nowMs ?? Date.now();
  const config = opts.config ?? tokenMoodConfigFromEnv(process.env);
  const source = opts.source ?? usageSourceFromEnv(process.env);
  const maxFiles = Math.max(1, opts.maxFiles ?? DEFAULT_MAX_FILES);
  const tokenizer =
    opts.tokenizer === undefined ? loadDefaultTokenizer() : opts.tokenizer;
  const sinceMs = nowMs - config.windowMs;
  const codexRateLimit =
    source === "codex" || source === "auto"
      ? latestCodexRateLimit(
          [
            ...scanRecentJsonl(join(home, ".codex", "sessions"), maxFiles),
            ...scanRecentJsonl(
              join(home, ".codex", "archived_sessions"),
              maxFiles,
            ),
          ],
          sinceMs,
        )
      : null;
  const allRecords = [
    ...scanClaudeStats(join(home, ".claude", "stats-cache.json"), sinceMs),
    ...scanClaudeProjectJsonl(
      join(home, ".claude", "projects"),
      sinceMs,
      maxFiles,
      tokenizer,
    ),
    ...scanCodexArchivedJsonl(
      join(home, ".codex", "archived_sessions"),
      sinceMs,
      maxFiles,
      tokenizer,
    ),
    ...scanCodexSessionJsonl(
      join(home, ".codex", "sessions"),
      sinceMs,
      maxFiles,
      tokenizer,
    ),
  ];
  const selectedSource = nativeSourceForAuto(
    source,
    codexRateLimit,
    allRecords,
  );
  const records = filterUsageRecords(allRecords, selectedSource);

  const totals = records.reduce(
    (acc, record) => {
      acc.breakdown = addBreakdown(acc.breakdown, record.breakdown);
      acc.messages += record.messages;
      if (record.messages > 0) {
        acc.sources.add(record.agentSource);
      }
      return acc;
    },
    {
      breakdown: emptyBreakdown(),
      messages: 0,
      sources: new Set<string>(),
    },
  );
  const sample = tokenMoodSample(totals.breakdown, config);
  const nativeUsagePercent = codexRateLimit?.usedPercent ?? null;
  const usagePercent =
    nativeUsagePercent !== null
      ? Math.round(nativeUsagePercent)
      : Math.round(
          (sample.weightedTokens / Math.max(1, config.tokenBudget)) * 100,
        );
  const fatigue =
    nativeUsagePercent !== null
      ? clamp01(nativeUsagePercent / 100)
      : sample.fatigue;
  const agentSource =
    nativeUsagePercent !== null
      ? "codex"
      : selectedSource !== "all" && sample.weightedTokens > 0
        ? selectedSource
        : totals.sources.size === 1
          ? [...totals.sources][0]
          : totals.sources.size > 1
            ? "mixed"
            : null;
  return {
    agentSource,
    fatigue,
    tokens: Math.round(sample.weightedTokens),
    weightedTokens: sample.weightedTokens,
    rawTokens: sample.rawTokens,
    tokenBudget: Math.max(1, config.tokenBudget),
    usagePercent,
    messages: totals.messages,
    sinceMs,
    breakdown: sample.breakdown,
    reason:
      nativeUsagePercent !== null
        ? `codex rate limit: ${usagePercent}% used`
        : sample.weightedTokens > 0
          ? `local agent usage: ${Math.round(sample.weightedTokens)} weighted tokens/${Math.round(config.windowMs / 3600000)}h`
          : "local agent usage: no recent token data",
  };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function latestCodexRateLimit(
  files: string[],
  sinceMs: number,
): { usedPercent: number; timestampMs: number } | null {
  let latest: { usedPercent: number; timestampMs: number } | null = null;
  for (const file of files) {
    const sample = scanCodexRateLimit(file, sinceMs);
    if (!sample) continue;
    if (!latest || sample.timestampMs > latest.timestampMs) latest = sample;
  }
  return latest;
}

function scanCodexRateLimit(
  path: string,
  sinceMs: number,
): { usedPercent: number; timestampMs: number } | null {
  try {
    const stat = statSync(path);
    const text = readTail(path, stat.size, JSONL_TAIL_BYTES);
    let latest: { usedPercent: number; timestampMs: number } | null = null;
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(line);
      } catch {
        continue;
      }
      const timestampMs = timestampOf(parsed) ?? stat.mtimeMs;
      if (timestampMs < sinceMs) continue;
      const usedPercent = codexPrimaryUsedPercent(parsed);
      if (usedPercent === null) continue;
      if (!latest || timestampMs > latest.timestampMs) {
        latest = { usedPercent, timestampMs };
      }
    }
    return latest;
  } catch {
    return null;
  }
}

function codexPrimaryUsedPercent(value: unknown): number | null {
  if (!value || typeof value !== "object") return null;
  const payload = (value as { payload?: unknown }).payload;
  if (!payload || typeof payload !== "object") return null;
  const rateLimits = (payload as { rate_limits?: unknown }).rate_limits;
  if (!rateLimits || typeof rateLimits !== "object") return null;
  const primary = (rateLimits as { primary?: unknown }).primary;
  if (!primary || typeof primary !== "object") return null;
  const usedPercent = (primary as { used_percent?: unknown }).used_percent;
  if (typeof usedPercent !== "number" || !Number.isFinite(usedPercent)) {
    return null;
  }
  return usedPercent;
}

export function usageSourceFromEnv(env: NodeJS.ProcessEnv): UsageSource {
  const value = env.PETDEX_USAGE_MOOD_SOURCE?.trim().toLowerCase();
  if (
    value === "auto" ||
    value === "codex" ||
    value === "claude-code" ||
    value === "all"
  ) {
    return value;
  }
  return "auto";
}

function nativeSourceForAuto(
  source: UsageSource,
  codexRateLimit: { usedPercent: number; timestampMs: number } | null,
  records: UsageRecord[],
): UsageSource {
  if (source !== "auto") return source;
  if (codexRateLimit) return "codex";
  const latestMessage = records
    .filter((record) => record.messages > 0)
    .sort((a, b) => b.timestampMs - a.timestampMs)[0];
  const latest =
    latestMessage ?? records.sort((a, b) => b.timestampMs - a.timestampMs)[0];
  return latest?.agentSource === "claude-code" ? "claude-code" : "codex";
}

function filterUsageRecords(
  records: UsageRecord[],
  source: UsageSource,
): UsageRecord[] {
  if (source === "all") return records;
  return records.filter((record) => record.agentSource === source);
}

function scanClaudeStats(path: string, sinceMs: number): UsageRecord[] {
  if (!existsSync(path)) return [];
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as {
      dailyModelTokens?: unknown;
    };
    if (!Array.isArray(parsed.dailyModelTokens)) return [];
    const records: UsageRecord[] = [];
    for (const entry of parsed.dailyModelTokens) {
      if (!entry || typeof entry !== "object") continue;
      const date = (entry as { date?: unknown }).date;
      const tokensByModel = (entry as { tokensByModel?: unknown })
        .tokensByModel;
      if (
        typeof date !== "string" ||
        !tokensByModel ||
        typeof tokensByModel !== "object"
      ) {
        continue;
      }
      const timestampMs = Date.parse(`${date}T23:59:59.999Z`);
      if (!Number.isFinite(timestampMs) || timestampMs < sinceMs) continue;
      records.push({
        agentSource: "claude-code",
        timestampMs,
        breakdown: {
          ...emptyBreakdown(),
          input: sumNumericLeaves(tokensByModel),
        },
        messages: 0,
      });
    }
    return records;
  } catch {
    return [];
  }
}

function scanClaudeProjectJsonl(
  root: string,
  sinceMs: number,
  maxFiles: number,
  tokenizer: TextTokenizer | null,
): UsageRecord[] {
  return scanRecentJsonl(root, maxFiles).flatMap((file) =>
    scanJsonlUsage(file, "claude-code", sinceMs, tokenizer),
  );
}

function scanCodexArchivedJsonl(
  root: string,
  sinceMs: number,
  maxFiles: number,
  tokenizer: TextTokenizer | null,
): UsageRecord[] {
  return scanRecentJsonl(root, maxFiles).flatMap((file) =>
    scanJsonlUsage(file, "codex", sinceMs, tokenizer),
  );
}

function scanCodexSessionJsonl(
  root: string,
  sinceMs: number,
  maxFiles: number,
  tokenizer: TextTokenizer | null,
): UsageRecord[] {
  return scanRecentJsonl(root, maxFiles).flatMap((file) =>
    scanJsonlUsage(file, "codex", sinceMs, tokenizer),
  );
}

function scanRecentJsonl(root: string, maxFiles: number): string[] {
  if (!existsSync(root)) return [];
  const files: Array<{ path: string; stat: Stats }> = [];
  const visit = (dir: string, depth: number) => {
    if (depth > 3) return;
    let entries: string[] = [];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const path = join(dir, entry);
      let stat: Stats;
      try {
        stat = statSync(path);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        visit(path, depth + 1);
      } else if (stat.isFile() && path.endsWith(".jsonl")) {
        files.push({ path, stat });
      }
    }
  };
  visit(root, 0);
  return files
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)
    .slice(0, maxFiles)
    .map((f) => f.path);
}

function scanJsonlUsage(
  path: string,
  agentSource: string,
  sinceMs: number,
  tokenizer: TextTokenizer | null,
): UsageRecord[] {
  try {
    const stat = statSync(path);
    const text = readTail(path, stat.size, JSONL_TAIL_BYTES);
    const records: UsageRecord[] = [];
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(line);
      } catch {
        continue;
      }
      const timestampMs = timestampOf(parsed) ?? stat.mtimeMs;
      if (timestampMs < sinceMs) continue;
      const breakdown = usageOrTextBreakdown(parsed, tokenizer);
      if (
        tokenMoodSample(breakdown, DEFAULT_TOKEN_MOOD_CONFIG).rawTokens <= 0
      ) {
        continue;
      }
      records.push({
        agentSource,
        timestampMs,
        breakdown,
        messages: 1,
      });
    }
    return records;
  } catch {
    return [];
  }
}

function readTail(path: string, size: number, maxBytes: number): string {
  const text = readFileSync(path, "utf8");
  if (size <= maxBytes || text.length <= maxBytes) return text;
  const tail = text.slice(text.length - maxBytes);
  const firstNewline = tail.indexOf("\n");
  return firstNewline >= 0 ? tail.slice(firstNewline + 1) : tail;
}

function usageOrTextBreakdown(
  value: unknown,
  tokenizer: TextTokenizer | null,
): TokenUsageBreakdown {
  if (!value || typeof value !== "object") return emptyBreakdown();
  const maybeUsage = (value as { usage?: unknown }).usage;
  const messageUsage = (value as { message?: { usage?: unknown } }).message
    ?.usage;
  const responseUsage = (value as { response?: { usage?: unknown } }).response
    ?.usage;
  const usage = maybeUsage ?? messageUsage ?? responseUsage;
  if (usage && typeof usage === "object") {
    const breakdown = usageBreakdown(usage);
    if (tokenMoodSample(breakdown, DEFAULT_TOKEN_MOOD_CONFIG).rawTokens > 0) {
      return breakdown;
    }
  }
  return breakdownFromText(extractText(value), tokenizer);
}

function sumNumericLeaves(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (!value || typeof value !== "object") return 0;
  return Object.values(value).reduce(
    (sum, child) => sum + sumNumericLeaves(child),
    0,
  );
}

function timestampOf(value: unknown): number | null {
  if (!value || typeof value !== "object") return null;
  const raw =
    (value as { timestamp?: unknown }).timestamp ??
    (value as { ts?: unknown }).ts ??
    (value as { created_at?: unknown }).created_at;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw > 10_000_000_000 ? raw : raw * 1000;
  }
  if (typeof raw === "string") {
    const parsed = Date.parse(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function extractText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value))
    return value.map(extractText).filter(Boolean).join("\n");
  if (!value || typeof value !== "object") return "";
  const message = (value as { message?: unknown }).message;
  if (message) return extractText(message);
  const content = (value as { content?: unknown }).content;
  if (content) return extractText(content);
  const text = (value as { text?: unknown }).text;
  if (typeof text === "string") return text;
  const transcript = (value as { transcript?: unknown }).transcript;
  if (typeof transcript === "string") return transcript;
  return "";
}

function loadDefaultTokenizer(): TextTokenizer | null {
  try {
    const jsTiktoken = require("js-tiktoken") as {
      encodingForModel?: (model: string) => {
        encode: (text: string) => unknown[];
      };
      getEncoding?: (name: string) => { encode: (text: string) => unknown[] };
    };
    const encoder =
      jsTiktoken.encodingForModel?.("gpt-4o") ??
      jsTiktoken.getEncoding?.("o200k_base");
    if (!encoder) return null;
    return (text) => encoder.encode(text).length;
  } catch {
    return (text) => estimateTextTokens(text, null);
  }
}
