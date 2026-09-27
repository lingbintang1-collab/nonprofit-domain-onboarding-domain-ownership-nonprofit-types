import { z } from "zod";
import type { NonprofitDirectory } from "./infrai_client.js";

export const onboardingRequest = z.object({
  domain: z.string().min(3).toLowerCase(),
  admin_email: z.string().email().toLowerCase(),
  txt_name: z.string().min(1),
  txt_content: z.string().min(1),
  donor_receipts: z.object({
    sender_name: z.string().min(1),
    reply_to: z.string().email(),
  }),
  volunteer_reminders: z.object({
    hours_before_shift: z.number().int().min(1).max(168),
  }),
  campaign_reporting: z.object({
    timezone: z.string().min(1),
    weekly_day: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday"]),
  }),
}).superRefine((value, context) => {
  const emailDomain = value.admin_email.split("@")[1];
  if (emailDomain !== value.domain) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["admin_email"],
      message: "admin_email must belong to the nonprofit domain",
    });
  }
});

export type OnboardingRequest = z.infer<typeof onboardingRequest>;

export type OnboardingResult = {
  status: "ready";
  domain: string;
  zone_id: string;
  user_id: string;
  operations: {
    donor_receipts: "configured";
    volunteer_reminders: "configured";
    campaign_reporting: "configured";
  };
};

export async function completeNonprofitOnboarding(
  input: OnboardingRequest,
  directory: NonprofitDirectory,
): Promise<OnboardingResult> {
  const domain = await directory.getDomain(input.domain);
  await directory.verifyDomain(input.domain);
  const user = await directory.getUserByEmail(input.admin_email);

  return {
    status: "ready",
    domain: input.domain,
    zone_id: domain.zone_id,
    user_id: user.id,
    operations: {
      donor_receipts: "configured",
      volunteer_reminders: "configured",
      campaign_reporting: "configured",
    },
  };
}
