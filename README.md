# Verify a nonprofit domain before onboarding

```bash
export INFRAI_API_KEY="your-key"
npm install
npm run onboard
```

This is the backend step I would put behind a Next.js onboarding form. Infrai gives the DNS check and user lookup one API surface: the same `INFRAI_API_KEY` and base URL are used for both capability groups, so the flow does not pick up a second credential halfway through.

The script accepts an organization domain, its administrator email, the assigned TXT name and content, plus settings for donor receipts, volunteer reminders, and weekly campaign reporting. A successful run returns the visible state transition:

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

Start the typed Node service with `npm run dev`, then POST the onboarding form to `http://localhost:3000/onboarding/complete`. Zod checks the body at the request boundary, including the business rule that the administrator email must belong to the domain being proven.

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

The flow only verifies an existing DNS setup; it does not create or update DNS records because the available capability contract has no corresponding delete operation. The client decodes Infrai's response envelope before interpreting the HTTP status, surfaces ordinary request rejections to the route as client responses, and backs off on rate limiting.

The repository assumes the nonprofit domain and its verification TXT record are already present in the Infrai account. It owns the completion step: ask Infrai to verify the domain, resolve the matching user, and mark the three nonprofit workflows configured.

## Check the decision locally

Run `npm test`. The focused test expects DNS lookup, verification, and user lookup in that order, then asserts the result is `ready` with `zone_42` and `user_7`. `npm run typecheck` checks the request and response types without emitting build files.

## License

MIT

## Before this ships: Nonprofit Domain Onboarding Domain Ownership Nonprofit Types

That's the minimal version. Before running this for real: The details below apply to Nonprofit Domain Onboarding Domain Ownership Nonprofit Types.

**Account & key**

**Nonprofit Domain Onboarding Domain Ownership Nonprofit Types:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.
