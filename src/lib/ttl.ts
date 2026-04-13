/** TTL duration: 18 months in milliseconds */
const TTL_MS = 18 * 30 * 24 * 60 * 60 * 1000; // ~18 months

/** Get an ISO datetime string 18 months from now */
export function newTtlDeadline(): string {
  return new Date(Date.now() + TTL_MS).toISOString();
}

/** Check if a TTL deadline has passed */
export function isExpired(ttlDeadline: string): boolean {
  return new Date(ttlDeadline).getTime() < Date.now();
}
