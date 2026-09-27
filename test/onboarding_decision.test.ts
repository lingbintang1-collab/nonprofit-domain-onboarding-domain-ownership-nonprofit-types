import { describe, expect, it, vi } from "vitest";
import type { NonprofitDirectory } from "../src/infrai_client.js";
import { completeNonprofitOnboarding, onboardingRequest } from "../src/onboarding_decision.js";

describe("nonprofit onboarding decision", () => {
  it("becomes ready only after domain verification and company user lookup", async () => {
    const calls: string[] = [];
    const directory: NonprofitDirectory = {
      getDomain: vi.fn(async () => { calls.push("domain"); return { zone_id: "zone_42" }; }),
      upsertTxt: vi.fn(async (zoneId) => { calls.push(`txt:${zoneId}`); return {}; }),
      verifyDomain: vi.fn(async () => { calls.push("verify"); return { zone_id: "zone_42", verified: true }; }),
      getUserByEmail: vi.fn(async () => { calls.push("user"); return { id: "user_7", email: "maya@helpinghands.org" }; }),
    };
    const input = onboardingRequest.parse({
      domain: "helpinghands.org",
      admin_email: "maya@helpinghands.org",
      txt_name: "_infrai-verification",
      txt_content: "verification-123",
      donor_receipts: { sender_name: "Helping Hands", reply_to: "maya@helpinghands.org" },
      volunteer_reminders: { hours_before_shift: 24 },
      campaign_reporting: { timezone: "America/New_York", weekly_day: "monday" },
    });

    const result = await completeNonprofitOnboarding(input, directory);

    expect(calls).toEqual(["domain", "verify", "user"]);
    expect(result).toMatchObject({ status: "ready", zone_id: "zone_42", user_id: "user_7" });
  });
});
