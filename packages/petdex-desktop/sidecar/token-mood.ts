export type TokenMoodConfig = {
  windowMs: number;
  tokenBudget: number;
  weights: {
    input: number;
    output: number;
    cacheRead: number;
    cacheCreation: number;
    textEstimate: number;
  };
};

export type TokenUsageBreakdown = {
  input: number;
  output: number;
  cacheRead: number;
  cacheCreation: number;
  textEstimate: number;
};

export type TokenMoodSample = {
  fatigue: number;
  weightedTokens: number;
  rawTokens: number;
  breakdown: TokenUsageBreakdown;
};

export type TextTokenizer = (text: string) => number;

const DEFAULT_CHARS_PER_TOKEN = 4;

export const DEFAULT_TOKEN_MOOD_CONFIG: TokenMoodConfig = {
  windowMs: 24 * 60 * 60 * 1000,
  tokenBudget: 600_000,
  weights: {
    input: 1,
    output: 1.5,
    cacheRead: 0.15,
    cacheCreation: 0.5,
    textEstimate: 1,
  },
};

export function tokenMoodSample(
  breakdown: TokenUsageBreakdown,
  config: TokenMoodConfig = DEFAULT_TOKEN_MOOD_CONFIG,
): TokenMoodSample {
  const safeBudget = Math.max(1, config.tokenBudget);
  const weightedTokens =
    breakdown.input * config.weights.input +
    breakdown.output * config.weights.output +
    breakdown.cacheRead * config.weights.cacheRead +
    breakdown.cacheCreation * config.weights.cacheCreation +
    breakdown.textEstimate * config.weights.textEstimate;
  const rawTokens =
    breakdown.input +
    breakdown.output +
    breakdown.cacheRead +
    breakdown.cacheCreation +
    breakdown.textEstimate;
  return {
    fatigue: clamp01(weightedTokens / safeBudget),
    weightedTokens,
    rawTokens,
    breakdown,
  };
}

export function emptyBreakdown(): TokenUsageBreakdown {
  return {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheCreation: 0,
    textEstimate: 0,
  };
}

export function addBreakdown(
  a: TokenUsageBreakdown,
  b: TokenUsageBreakdown,
): TokenUsageBreakdown {
  return {
    input: a.input + b.input,
    output: a.output + b.output,
    cacheRead: a.cacheRead + b.cacheRead,
    cacheCreation: a.cacheCreation + b.cacheCreation,
    textEstimate: a.textEstimate + b.textEstimate,
  };
}

export function usageBreakdown(value: unknown): TokenUsageBreakdown {
  const out = emptyBreakdown();
  collectUsage(value, out);
  return out;
}

export function estimateTextTokens(
  text: string,
  tokenizer: TextTokenizer | null = null,
): number {
  if (!text) return 0;
  if (tokenizer) {
    try {
      const count = tokenizer(text);
      if (Number.isFinite(count) && count > 0) return Math.ceil(count);
    } catch {}
  }
  return Math.ceil(text.length / DEFAULT_CHARS_PER_TOKEN);
}

export function breakdownFromText(
  text: string,
  tokenizer: TextTokenizer | null = null,
): TokenUsageBreakdown {
  return {
    ...emptyBreakdown(),
    textEstimate: estimateTextTokens(text, tokenizer),
  };
}

export function tokenMoodConfigFromEnv(
  env: NodeJS.ProcessEnv,
): TokenMoodConfig {
  const base = DEFAULT_TOKEN_MOOD_CONFIG;
  return {
    windowMs: positiveNumber(env.PETDEX_USAGE_MOOD_WINDOW_MS, base.windowMs),
    tokenBudget: positiveNumber(
      env.PETDEX_USAGE_MOOD_TOKEN_BUDGET,
      base.tokenBudget,
    ),
    weights: {
      input: positiveNumber(env.PETDEX_TOKEN_WEIGHT_INPUT, base.weights.input),
      output: positiveNumber(
        env.PETDEX_TOKEN_WEIGHT_OUTPUT,
        base.weights.output,
      ),
      cacheRead: positiveNumber(
        env.PETDEX_TOKEN_WEIGHT_CACHE_READ,
        base.weights.cacheRead,
      ),
      cacheCreation: positiveNumber(
        env.PETDEX_TOKEN_WEIGHT_CACHE_CREATION,
        base.weights.cacheCreation,
      ),
      textEstimate: positiveNumber(
        env.PETDEX_TOKEN_WEIGHT_TEXT_ESTIMATE,
        base.weights.textEstimate,
      ),
    },
  };
}

function collectUsage(value: unknown, out: TokenUsageBreakdown) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === "number" && Number.isFinite(child)) {
      addUsageField(key, child, out);
    } else if (child && typeof child === "object") {
      collectUsage(child, out);
    }
  }
}

function addUsageField(key: string, value: number, out: TokenUsageBreakdown) {
  const lower = key.toLowerCase();
  if (!isTokenField(lower)) return;
  if (lower.includes("cache_read")) {
    out.cacheRead += value;
  } else if (
    lower.includes("cache_creation") ||
    lower.includes("cache_write")
  ) {
    out.cacheCreation += value;
  } else if (lower.includes("output") || lower.includes("completion")) {
    out.output += value;
  } else if (lower.includes("input") || lower.includes("prompt")) {
    out.input += value;
  } else {
    out.input += value;
  }
}

function isTokenField(lower: string): boolean {
  return lower.endsWith("tokens") || lower.endsWith("_tokens");
}

function positiveNumber(value: string | undefined, fallback: number): number {
  if (value == null || value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
