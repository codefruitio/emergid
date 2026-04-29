/**
 * Resolve the SESSION_SECRET environment variable used to sign cookies
 * (per-account `emergid_session` and owner `emergid_owner`).
 *
 * Throws if unset or too short. Called per-request rather than at module load
 * so that:
 *   1) the error message ("SESSION_SECRET is unset") surfaces in operator
 *      logs on the first request that needs it, rather than crashing boot.
 *   2) request paths that don't touch session cookies (e.g. owner endpoints
 *      authorized via Authorization: Bearer) are unaffected.
 *
 * Minimum length check is a soft guard against the previous fallback
 * ("dev-secret-change-in-production") being copied as-is.
 */
export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET environment variable must be set to a string of at least 16 characters. " +
        "Generate one with: openssl rand -base64 32"
    );
  }
  return secret;
}
