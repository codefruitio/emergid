import { sendPushNotification, type APNsResult } from "@/lib/apns";

/** Days remaining until the given ISO ttlDeadline, rounded up (today = 0). */
export function daysUntilExpiry(ttlDeadline: string): number {
  return Math.ceil(
    (new Date(ttlDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

/** Threshold (in days) for sending the first expiry warning. */
export const EXPIRY_WARNING_THRESHOLD_DAYS = 31;

export function expiryWarningTitle(): string {
  return "emergID expires soon";
}

export function expiryWarningBody(daysRemaining: number): string {
  if (daysRemaining <= 0) {
    return "Your emergID expires today. Sign in now to keep it active and prevent deletion.";
  }
  if (daysRemaining === 1) {
    return "Your emergID expires in 1 day. Sign in now to keep it active and prevent deletion.";
  }
  return `Your emergID expires in ${daysRemaining} days. Sign in to keep it active and prevent deletion.`;
}

/** Send the "expiring soon" push to the given device token. */
export function sendExpiryWarning(
  apnsToken: string,
  daysRemaining: number
): Promise<APNsResult> {
  return sendPushNotification(apnsToken, new Date().toISOString(), {
    title: expiryWarningTitle(),
    body: expiryWarningBody(daysRemaining),
    extra: { kind: "expiry_warning", daysRemaining },
  });
}
