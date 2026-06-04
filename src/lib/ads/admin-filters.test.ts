import { describe, expect, test } from "bun:test";

import {
  DEFAULT_ADMIN_AD_CAMPAIGN_LIMIT,
  MAX_ADMIN_AD_CAMPAIGN_LIMIT,
  parseAdminAdCampaignFilters,
} from "./admin-filters";

describe("parseAdminAdCampaignFilters", () => {
  test("uses safe defaults", () => {
    expect(parseAdminAdCampaignFilters()).toEqual({
      status: "all",
      q: "",
      limit: DEFAULT_ADMIN_AD_CAMPAIGN_LIMIT,
    });
  });

  test("accepts valid campaign statuses", () => {
    expect(parseAdminAdCampaignFilters({ status: "active" }).status).toBe(
      "active",
    );
    expect(parseAdminAdCampaignFilters({ status: "deleted" }).status).toBe(
      "deleted",
    );
  });

  test("normalizes invalid status to all", () => {
    expect(parseAdminAdCampaignFilters({ status: "approved" }).status).toBe(
      "all",
    );
  });

  test("trims search text", () => {
    expect(parseAdminAdCampaignFilters({ q: "  pixel treats  " }).q).toBe(
      "pixel treats",
    );
  });

  test("clamps invalid and out-of-range limits", () => {
    expect(parseAdminAdCampaignFilters({ limit: "nope" }).limit).toBe(
      DEFAULT_ADMIN_AD_CAMPAIGN_LIMIT,
    );
    expect(parseAdminAdCampaignFilters({ limit: "-10" }).limit).toBe(1);
    expect(parseAdminAdCampaignFilters({ limit: "999" }).limit).toBe(
      MAX_ADMIN_AD_CAMPAIGN_LIMIT,
    );
  });
});
