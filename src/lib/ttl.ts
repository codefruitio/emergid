/** TTL duration: 365 days in milliseconds */
const TTL_MS = 365 * 24 * 60 * 60 * 1000;

/** Get an ISO datetime string 365 days from now */
export function newTtlDeadline(): string {
  return new Date(Date.now() + TTL_MS).toISOString();
}

/** Check if a TTL deadline has passed */
export function isExpired(ttlDeadline: string): boolean {
  return new Date(ttlDeadline).getTime() < Date.now();
}
