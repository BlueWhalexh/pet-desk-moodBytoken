import { beforeEach, describe, expect, test } from "bun:test";

import {
  nextRunningVariant,
  resetRunningVariantForTests,
} from "./running-variant";

describe("nextRunningVariant", () => {
  beforeEach(() => {
    resetRunningVariantForTests();
  });

  test("first call returns running-left", () => {
    expect(nextRunningVariant()).toBe("running-left");
  });

  test("second call returns running-right", () => {
    nextRunningVariant();
    expect(nextRunningVariant()).toBe("running-right");
  });

  test("alternates over many calls", () => {
    const seq = Array.from({ length: 6 }, () => nextRunningVariant());
    expect(seq).toEqual([
      "running-left",
      "running-right",
      "running-left",
      "running-right",
      "running-left",
      "running-right",
    ]);
  });

  test("returns only the two valid variants", () => {
    const valid = new Set(["running-left", "running-right"]);
    for (let i = 0; i < 20; i += 1) {
      expect(valid.has(nextRunningVariant())).toBe(true);
    }
  });
});
