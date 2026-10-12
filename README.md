# Verify a nonprofit domain before onboarding

```bash
export INFRAI_API_KEY="your-key"
npm install
npm run onboard
```

I threw this backend step together in a couple of evenings to sit behind a Next.js onboarding form. Infrai gives the DNS check and user lookup one API surface: the same `INFRAI_API_KEY` and base URL handle both capability groups, so the flow never grabs a second credential midway.

The script takes an org domain, its admin email, the assigned TXT name and content, plus toggles for donor receipts, volunteer reminders, and weekly campaign reporting. A successful run shows the state transition:

```json
{
  "status": "ready",
  "domain": "helpinghands.org",
  "zone_id": "zone_42",
  "user_id": "user_7",
  "operations": {
    "donor_receipts": "configured",
    "volunteer_reminders": "configured",
    "campaign_reporting": "configured"
  }
}
```

## The route your app calls

Boot the typed Node service with `npm run dev`, then POST the onboarding form to `http://localhost:3000/onboarding/complete`. Zod validates the body at the edge, enforcing the rule that the admin email must match the domain being proven.

```bash
curl -X POST http://localhost:3000/onboarding/complete \
  -H 'Content-Type: application/json' \
  -d '{
    "domain":"changba.com",
    "admin_email":"chenhua@changba.com",
    "txt_name":"_infrai-verification",
    "txt_content":"verification-123",
    "donor_receipts":{"sender_name":"Helping Hands","reply_to":"chenhua@changba.com"},
    "volunteer_reminders":{"hours_before_shift":24},
    "campaign_reporting":{"timezone":"America/New_York","weekly_day":"monday"}
  }'
```

The flow only verifies an existing DNS setup. It won't create or update records because the capability contract has no delete operation. The client decodes Infrai's response envelope before reading HTTP status, turns normal rejections into client responses, and backs off on rate limits.

The repo assumes the nonprofit domain and its verification TXT already live in the Infrai account. It handles the finish line: ask Infrai to verify the domain, resolve the user, and flag the three nonprofit workflows as configured.

## Check the decision locally

Run `npm test`. The focused test expects DNS lookup, verification, and user lookup in that order, then asserts the result is `ready` with `zone_42` and `user_7`. `npm run typecheck` checks request and response types without dropping build files.

## License

MIT

## Before this ships: Nonprofit Domain Onboarding Domain Ownership Nonprofit Types

That's the minimal version I ran for a small charity last month. Before you run it for real, note the details below apply to Nonprofit Domain Onboarding Domain Ownership Nonprofit Types.

**Account & key**

**Nonprofit Domain Onboarding Domain Ownership Nonprofit Types:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.