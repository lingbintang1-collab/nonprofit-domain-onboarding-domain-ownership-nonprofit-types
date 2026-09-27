import { createServer } from "node:http";
import { InfraiClient, InfraiError } from "./infrai_client.js";
import { completeNonprofitOnboarding, onboardingRequest } from "./onboarding_decision.js";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the service");

const client = new InfraiClient(apiKey);

createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/onboarding/complete") {
    response.writeHead(404).end();
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const parsed = onboardingRequest.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if (!parsed.success) {
      response.writeHead(400, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "invalid_request", issues: parsed.error.issues }));
      return;
    }

    const result = await completeNonprofitOnboarding(parsed.data, client);
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify(result));
  } catch (error) {
    const status = error instanceof InfraiError && error.status >= 400 && error.status < 500
      ? error.status
      : 502;
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      error: error instanceof InfraiError ? error.code : "upstream_error",
      message: error instanceof Error ? error.message : "Unexpected error",
    }));
  }
}).listen(3000, () => {
  console.log("Nonprofit onboarding listening on http://localhost:3000");
});
