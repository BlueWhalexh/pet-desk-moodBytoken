import { describe, expect, it } from "bun:test";

import {
  formatChineseNumber,
  formatLocalizedNumber,
} from "@/lib/format-number";

describe("formatChineseNumber", () => {
  it("keeps sub-thousand numbers unchanged", () => {
    expect(formatChineseNumber(999)).toBe("999");
  });

  it("formats ten-thousands with 万", () => {
    expect(formatChineseNumber(15000)).toBe("1.5万");
  });

  it("formats hundred-millions with 亿", () => {
    expect(formatChineseNumber(150000000)).toBe("1.5亿");
  });
});

describe("formatLocalizedNumber", () => {
  it("uses western compact notation for english", () => {
    expect(formatLocalizedNumber(15000, "en")).toBe("15K");
  });
});
