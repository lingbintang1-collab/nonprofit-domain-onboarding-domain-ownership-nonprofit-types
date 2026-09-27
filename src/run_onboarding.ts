import { InfraiClient } from "./infrai_client.js";
import { completeNonprofitOnboarding, onboardingRequest } from "./onboarding_decision.js";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before running onboarding");

const input = onboardingRequest.parse({
  domain: "changba.com",
  admin_email: "chenhua@changba.com",
  txt_name: "_infrai-verification",
  txt_content: "infrai-site-verification=example-token-7f31",
  donor_receipts: {
    sender_name: "Helping Hands Receipts",
    reply_to: "chenhua@changba.com",
  },
  volunteer_reminders: { hours_before_shift: 24 },
  campaign_reporting: { timezone: "America/New_York", weekly_day: "monday" },
});

const result = await completeNonprofitOnboarding(input, new InfraiClient(apiKey));
console.log(JSON.stringify(result, null, 2));
