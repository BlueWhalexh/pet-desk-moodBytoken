import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(
  join(import.meta.dir, "advertise-form.tsx"),
  "utf8",
);

describe("AdvertiseForm ad preview", () => {
  it("renders an analytics-free sponsored card preview", () => {
    expect(source).toContain("previewTitle");
    expect(source).toContain("<AdCard");
    expect(source).toContain("disableNavigation");
    expect(source).toContain("showImagePlaceholder={!imagePreviewUrl}");
    expect(source).not.toContain("FeedAdSlot");
  });
});
