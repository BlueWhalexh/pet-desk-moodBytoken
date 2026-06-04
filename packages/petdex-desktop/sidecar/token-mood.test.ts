import { describe, expect, test } from "bun:test";

import {
  breakdownFromText,
  estimateTextTokens,
  tokenMoodConfigFromEnv,
  tokenMoodSample,
  usageBreakdown,
} from "./token-mood";

describe("token mood calculation", () => {
  test("groups common agent usage token fields", () => {
    const usage = {
      input_tokens: 100,
      output_tokens: 40,
      cache_read_input_tokens: 1000,
      cache_creation_input_tokens: 200,
      nested: { prompt_tokens: 10, completion_tokens: 5 },
    };

    expect(usageBreakdown(usage)).toEqual({
      input: 110,
      output: 45,
      cacheRead: 1000,
      cacheCreation: 200,
      textEstimate: 0,
    });
  });

  test("uses weighted tokens to derive fatigue", () => {
    const sample = tokenMoodSample(
      {
        input: 100,
        output: 100,
        cacheRead: 1000,
        cacheCreation: 100,
        textEstimate: 50,
      },
      {
        windowMs: 24 * 60 * 60 * 1000,
        tokenBudget: 500,
        weights: {
          input: 1,
          output: 2,
          cacheRead: 0.1,
          cacheCreation: 0.5,
          textEstimate: 1,
        },
      },
    );

    expect(sample.rawTokens).toBe(1350);
    expect(sample.weightedTokens).toBe(500);
    expect(sample.fatigue).toBe(1);
  });

  test("estimates transcript text with pluggable tokenizer", () => {
    expect(estimateTextTokens("abcdef")).toBe(2);
    expect(
      breakdownFromText("abcdef", (text) => text.length).textEstimate,
    ).toBe(6);
  });

  test("reads budget and weights from environment", () => {
    const config = tokenMoodConfigFromEnv({
      PETDEX_USAGE_MOOD_WINDOW_MS: "1000",
      PETDEX_USAGE_MOOD_TOKEN_BUDGET: "2000",
      PETDEX_TOKEN_WEIGHT_OUTPUT: "3",
      PETDEX_TOKEN_WEIGHT_CACHE_READ: "0.25",
    });

    expect(config.windowMs).toBe(1000);
    expect(config.tokenBudget).toBe(2000);
    expect(config.weights.input).toBe(1);
    expect(config.weights.output).toBe(3);
    expect(config.weights.cacheRead).toBe(0.25);
  });
});
