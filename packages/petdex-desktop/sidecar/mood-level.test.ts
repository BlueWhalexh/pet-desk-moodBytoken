import { describe, expect, test } from "bun:test";

import { fatigueToLevel } from "./mood-level";

describe("fatigueToLevel", () => {
  test("0 -> energetic", () => {
    expect(fatigueToLevel(0)).toBe("energetic");
  });

  test("upper boundary of energetic exclusive (0.2 = normal)", () => {
    expect(fatigueToLevel(0.19)).toBe("energetic");
    expect(fatigueToLevel(0.2)).toBe("normal");
  });

  test("normal band covers 0.2..<0.45", () => {
    expect(fatigueToLevel(0.3)).toBe("normal");
    expect(fatigueToLevel(0.44)).toBe("normal");
    expect(fatigueToLevel(0.45)).toBe("tired");
  });

  test("tired band covers 0.45..<0.7", () => {
    expect(fatigueToLevel(0.5)).toBe("tired");
    expect(fatigueToLevel(0.69)).toBe("tired");
    expect(fatigueToLevel(0.7)).toBe("exhausted");
  });

  test("exhausted band covers 0.7..<0.9", () => {
    expect(fatigueToLevel(0.75)).toBe("exhausted");
    expect(fatigueToLevel(0.89)).toBe("exhausted");
    expect(fatigueToLevel(0.9)).toBe("dying");
  });

  test("dying caps at 1", () => {
    expect(fatigueToLevel(0.95)).toBe("dying");
    expect(fatigueToLevel(1)).toBe("dying");
  });
});
