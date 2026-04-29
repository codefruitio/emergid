# emergID API Reference

All endpoints are relative to the base URL (e.g. `https://emergid.example.com`).

---

## Authentication

Admin endpoints require a session cookie set by `POST /api/auth`. The session is split across two HTTP-only cookies — `emergid_session` (signed account id) and `emergid_dek` (encrypted DEK) — both with a 90-day max age.

| Header | Value |
|--------|-------|
| `Cookie` | Set automatically by the browser/client after login |

Endpoints marked **Session** will return `401 Unauthorized` if the session cookie is missing or invalid.

Endpoints marked **Session + DEK** additionally require `emergid_dek` to be present (any endpoint that reads or writes encrypted medical data).

---

## Endpoints

### POST /api/account

Create a new account. No authentication required.

**Request body:** None

**Response:**

```json
{
  "accountNumber": "9817746543579281",
  "tokenUrl": "https://emergid.example.com/e/GfiHkpOkh_CMF0qdj8f7ZQ",
  "message": "Save your account number now. It will not be shown again. There is no recovery option."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `accountNumber` | string | 16-digit random account number. Shown once, never stored in plaintext. |
| `tokenUrl` | string | Full URL for the NFC tag. Contains a 128-bit random token. |
| `message` | string | User-facing warning about account number storage. |

**Notes:**
- The account number and token are the only time the plaintext credentials are returned.
- The server stores only SHA-256 hashes of both credentials.
- A unique data encryption key (DEK) is generated and encrypted under both credentials.

---

### POST /api/auth

Authenticate with an account number. Sets a session cookie and resets the account's 365-day TTL.

**Request body:**

```json
{
  "accountNumber": "9817746543579281"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accountNumber` | string | Yes | The 16-digit account number. |

**Response (200):**

```json
{
  "success": true
}
```

**Response (400):** `{ "error": "Account number required" }` if `accountNumber` is missing.

**Response (401):** `{ "error": "Invalid account number" }` if no account matches the supplied number.

**Side effects:**
- Sets `emergid_session` and `emergid_dek` HTTP-only cookies (90-day max age).
- Resets the account's TTL deadline to 365 days from now.

---

### GET /api/profile

Fetch the authenticated user's medical profile (decrypted).

**Auth:** Session + DEK

**Response (200):**

```json
{
  "bloodType": "A+",
  "allergies": "[\"Aspirin\"]",
  "medications": "[\"Atorvastatin 20mg\"]",
  "conditions": "[\"High Cholesterol\"]",
  "physicianName": "Dr. Lee",
  "physicianPhone": "555-1234",
  "emergencyContactRelation": "Partner",
  "emergencyContactPhone": "555-5678",
  "lastUpdated": "2026-04-13T20:00:00.000Z",
  "ttlDeadline": "2027-04-13T20:00:00.000Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `bloodType` | string or null | Blood type (e.g. "O+", "AB-") |
| `allergies` | string or null | JSON-encoded array of allergy strings |
| `medications` | string or null | JSON-encoded array of medication strings |
| `conditions` | string or null | JSON-encoded array of condition strings |
| `physicianName` | string or null | Physician's name |
| `physicianPhone` | string or null | Physician's phone number |
| `emergencyContactRelation` | string or null | Relationship label (e.g. "Spouse", "Partner") |
| `emergencyContactPhone` | string or null | Emergency contact phone number |
| `lastUpdated` | string | ISO 8601 timestamp of last profile update |
| `ttlDeadline` | string | ISO 8601 timestamp when the account will expire |

**Notes:**
- All medical fields are decrypted server-side using the DEK from the session cookie.
- `allergies`, `medications`, and `conditions` are JSON-encoded arrays stored as strings.

---

### PUT /api/profile

Update the authenticated user's medical profile.

**Auth:** Session + DEK

**Request body:**

```json
{
  "bloodType": "A+",
  "allergies": ["Aspirin", "Latex"],
  "medications": ["Atorvastatin 20mg"],
  "conditions": ["High Cholesterol"],
  "physicianName": "Dr. Lee",
  "physicianPhone": "555-1234",
  "emergencyContactRelation": "Partner",
  "emergencyContactPhone": "555-5678"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bloodType` | string | No | Blood type |
| `allergies` | string[] | No | Array of allergy strings |
| `medications` | string[] | No | Array of medication strings |
| `conditions` | string[] | No | Array of condition strings |
| `physicianName` | string | No | Physician's name |
| `physicianPhone` | string | No | Physician's phone number |
| `emergencyContactRelation` | string | No | Relationship label |
| `emergencyContactPhone` | string | No | Emergency contact phone |

**Response (200):**

```json
{
  "success": true
}
```

**Notes:**
- All fields are optional. Omitted or empty fields are stored as null.
- Array fields are JSON-encoded before encryption.
- All medical fields are AES-256-GCM encrypted before being written to the database.
- Updates the `lastUpdated` timestamp.

---

### POST /api/e/:token/confirm

Confirm a first-responder's intent to access a token's medical card, fire the access notification, and return the decrypted medical data. Used by the web `/e/:token` page after the user clicks "Confirm — Medical Emergency". **No authentication required**, but the endpoint requires a deliberate `POST` rather than a passive `GET`, so link unfurlers / iMessage previews / curious bystanders cannot trigger the patient's notification by merely opening the URL.

**URL parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `token` | string | The base64url token from the NFC tag URL. |

**Request body:** None.

**Response (200):** identical shape to `GET /api/card/:token` (see below).

**Response (404):** `{ "error": "Record not found" }` if the token is invalid or the account has expired.

**Side effects:** identical to `GET /api/card/:token`.

**Notes:**
- The companion route `GET /e/:token` (server-rendered HTML) only validates the token's existence and TTL — it does **not** decrypt or fire a notification. All decryption + notification happens here, after explicit confirmation.

---

### GET /api/card/:token

Fetch the medical card data for a given token. Used by the iOS app, where the access-confirmation interstitial does not apply. No authentication required.

**URL parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `token` | string | The 128-bit base64url token from the NFC tag URL |

**Response (200):**

```json
{
  "bloodType": "A+",
  "allergies": "[\"Aspirin\"]",
  "medications": "[\"Atorvastatin 20mg\"]",
  "conditions": "[\"High Cholesterol\"]",
  "physicianName": "Dr. Lee",
  "physicianPhone": "555-1234",
  "emergencyContactRelation": "Partner",
  "emergencyContactPhone": "555-5678",
  "lastUpdated": "2026-04-13T20:00:00.000Z"
}
```

**Response (404):**

```json
{
  "error": "Record not found"
}
```

**Side effects:**
- Inserts a `tag_accessed` row into the access log, stamped with the notification outcome (`sent`, `cooldown`, or `no_token`).
- If the account has an APNs token registered and is outside the 60-minute notification cooldown, an APNs alert is dispatched to the owner. Stale APNs tokens (HTTP 410) are cleared automatically.
- If the account's TTL has expired, the account is deleted and 404 is returned.

**Notes:**
- The token is hashed to look up the account, then used to decrypt the DEK, which decrypts the medical fields.
- The token is never stored — only the hash exists in the database.
- Does not return `ttlDeadline` or any internal identifiers.

---

### GET /api/access-log

Fetch the access log for the authenticated user's account.

**Auth:** Session

**Response (200):**

```json
[
  {
    "accessedAt": "2026-04-13 20:15:32",
    "eventType": "tag_accessed",
    "notificationStatus": "sent"
  },
  {
    "accessedAt": "2026-04-13 19:45:10",
    "eventType": "token_rerolled",
    "notificationStatus": null
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `accessedAt` | string | Timestamp of the event (`YYYY-MM-DD HH:MM:SS` UTC) |
| `eventType` | string | One of `tag_accessed` (NFC tap or `/e/:token` view) or `token_rerolled` |
| `notificationStatus` | string or null | For `tag_accessed`: one of `sent`, `cooldown`, `no_token`. `null` for non-tag events. |

**Notes:**
- Returns up to 100 most recent entries, ordered newest first.
- Only timestamps and event metadata are stored. No IP address, user agent, or device information is recorded.

---

### DELETE /api/access-log

Permanently delete every access-log entry belonging to the authenticated account.

**Auth:** Session

**Request body:** None

**Response (200):**

```json
{
  "success": true
}
```

**Notes:**
- Idempotent — calling it on an already-empty log still returns `{ "success": true }`.
- Does not affect the account, profile, token, or APNs registration.

---

### POST /api/token/reroll

Generate a new token and invalidate the old one. Requires reprogramming the NFC tag.

**Auth:** Session + DEK

**Response (200):**

```json
{
  "tokenUrl": "https://emergid.example.com/e/NZfDjMGQAq2ytm0Y87HMcw",
  "message": "Token rerolled. Update your NFC tag with the new URL."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `tokenUrl` | string | The new full URL to write to the NFC tag |
| `message` | string | User-facing instruction |

**Side effects:**
- The old token hash is replaced with the new one. The old URL immediately returns 404.
- The DEK is re-encrypted under the new token.
- The DEK encrypted under the account number is unchanged.
- A `token_rerolled` row is appended to the access log.

---

### POST /api/account/destroy

Permanently delete the authenticated user's account and all associated data.

**Auth:** Session

**Response (200):**

```json
{
  "success": true
}
```

**Side effects:**
- Deletes the account row and all access log entries (via CASCADE).
- Destroys the session cookies.
- The token URL immediately returns 404.
- This action is irreversible.

---

### GET /api/capabilities

Report which optional server features are configured. Unauthenticated — clients (e.g. the iOS app) probe this before login to decide which UI affordances to show.

**Auth:** None

**Response (200):**

```json
{
  "pushNotifications": true,
  "cronAuthorized": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `pushNotifications` | boolean | `true` when all four APNs env vars (`APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_PRIVATE_KEY`, `APNS_BUNDLE_ID`) are present. The server cannot send push notifications when this is `false`. |
| `cronAuthorized` | boolean | `true` when `CRON_SECRET` is set on the server. Indicates whether the daily expiry-warning cron is callable — required for scheduled `tag_accessed` warning notifications, not for ad-hoc pushes. The web UI uses this together with `pushNotifications` to decide whether to surface expiry-warning affordances. |

---

### POST /api/notifications/register

Register an APNs device token for the authenticated account so the owner is notified when their NFC tag is tapped.

**Auth:** Session

**Request body:**

```json
{
  "apnsToken": "a1b2c3d4...64hex"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `apnsToken` | string | Yes | 64-character hex APNs device token (32 raw bytes). |

**Response (200):** `{ "success": true }`

**Response (400):** `{ "error": "Invalid token" }` if `apnsToken` is not a 64-char hex string.

**Notes:**
- One device token per account. Calling again replaces the previous registration.
- Stale tokens (APNs HTTP 410) are cleared automatically on the next tag access.

---

### DELETE /api/notifications/unregister

Clear the APNs device token from the authenticated account.

**Auth:** Session

**Request body:** None

**Response (200):** `{ "success": true }`

---

### POST /api/account/test-notification

Send the authenticated account's own device a real expiry-warning push immediately, using the account's actual current days-remaining. Useful for validating APNs configuration end-to-end during setup, and surfaced on the web Account tab as "Send Test Notification" when push is configured.

**Auth:** Session

**Request body:** None.

**Response (200):**

```json
{
  "success": true,
  "daysUntilExpiry": 287
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` when the push was accepted by APNs. |
| `daysUntilExpiry` | number | The same value embedded in the push body — useful for previewing what the user will see. |

**Response (400):** `{ "error": "No device registered for push notifications. Open the iOS app to register." }` if the account has no `apnsToken` on file.

**Response (404):** `{ "error": "Account not found" }`.

**Response (410):** `{ "error": "Device token was rejected by Apple and has been cleared. Re-register from the iOS app." }` — APNs returned 410 (stale token). The token is cleared automatically; the user must re-register.

**Response (502):** `{ "error": "Failed to send notification. Check server logs." }` on transient APNs errors.

**Notes:**
- Sends the same payload used by `/api/cron/expiry-check`. See that endpoint for the exact body branches based on `daysRemaining`.
- Does **not** stamp `expiry_warning_sent_at`, so it does not interfere with the daily cron's once-per-cycle warning.

---

### GET /api/notifications/status

Report whether the authenticated account currently has an APNs device token registered.

**Auth:** Session

**Response (200):**

```json
{
  "registered": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `registered` | boolean | `true` if an APNs token is on file for this account. |

---

### GET /.well-known/apple-app-site-association

Apple App Site Association file used for Universal Links and shared web credentials with the iOS app. Served as JSON with `Cache-Control: public, max-age=3600`. Also exposed at `/apple-app-site-association` and the underlying handler `/api/aasa`.

**Auth:** None

**Response (200):**

```json
{
  "webcredentials": {
    "apps": ["5978XLQ85J.codefruit.emergID"]
  }
}
```

---

## Owner Endpoints

These endpoints are reserved for the operator of an emergID deployment, not end users. They expose aggregate, non-PII statistics about the deployment as a whole and are gated by an `OWNER_PASSWORD` environment variable.

### Authentication

Owner endpoints accept **either** of these credentials. Send one or the other, not both:

| Mechanism | Header / Cookie | Best for |
|-----------|-----------------|----------|
| Bearer token | `Authorization: Bearer <OWNER_PASSWORD>` | iOS app, scripts, `curl` |
| Session cookie | `emergid_owner` (set by `POST /api/admin/auth`) | Web dashboard at `/admin/stats` |

**Server-side requirements:**

- `OWNER_PASSWORD` must be set on the server. If unset, every owner endpoint returns `401`.
- For the cookie path, `SESSION_SECRET` must also be set (used to HMAC-sign the cookie). The bearer path does **not** require `SESSION_SECRET`, so iOS clients work even on minimally-configured deploys.

The bearer comparison uses constant-time equality (`crypto.timingSafeEqual`).

---

### POST /api/admin/auth

Owner login. Validates `OWNER_PASSWORD` and sets the `emergid_owner` cookie. **Browser dashboard only — iOS clients should skip this and use the bearer header instead.**

**Request body:**

```json
{
  "password": "the-owner-password"
}
```

**Response (200):** `{ "success": true }` — and `Set-Cookie: emergid_owner=...` (HTTP-only, 30-day max age, `Secure` in production, `SameSite=Lax`).

**Response (400):** `{ "error": "Password is required." }` if the body is missing or `password` is empty/non-string.

**Response (401):** `{ "error": "Invalid password." }` on wrong password.

**Response (503):** `{ "error": "Owner login is not configured on this server." }` when `OWNER_PASSWORD` is unset.

---

### DELETE /api/admin/auth

Clear the `emergid_owner` cookie. Always returns `{ "success": true }`.

---

### GET /api/admin/stats

Aggregate metrics for the entire deployment. Read-only. Returns no PII or any decrypted medical data — just counts, rolled-up timestamps, and internal account IDs.

**Auth:** Owner (bearer or cookie)

**Response (200):**

```json
{
  "generatedAt": "2026-04-29T13:23:35.173Z",
  "accounts": {
    "total": 4,
    "withPushEnabled": 1,
    "active": {
      "last24h": 1,
      "last7d": 2,
      "last30d": 4
    },
    "expiring": {
      "within30d": 0,
      "within60d": 0,
      "within90d": 0,
      "pastDeadline": 0
    }
  },
  "access": {
    "total": 2,
    "last24h": 1,
    "last7d": 1,
    "last30d": 2,
    "notifications": {
      "sent": 0,
      "cooldown": 0,
      "noToken": 1
    }
  },
  "recentEvents": [
    {
      "accountId": 5,
      "eventType": "tag_accessed",
      "notificationStatus": "no_token",
      "accessedAt": "2026-04-28 20:14:40"
    }
  ]
}
```

**Field reference:**

| Path | Type | Description |
|------|------|-------------|
| `generatedAt` | string | ISO 8601 timestamp when the snapshot was computed. |
| `accounts.total` | number | Count of all account rows currently in the DB (includes any past their TTL but not yet cleaned up). |
| `accounts.withPushEnabled` | number | Count of accounts with a registered APNs device token. |
| `accounts.active.last24h` / `.last7d` / `.last30d` | number | Accounts whose `lastUpdated` is within the rolling window. `lastUpdated` advances on profile saves and on every login (which also resets the TTL). |
| `accounts.expiring.within30d` / `.within60d` / `.within90d` | number | Accounts whose `ttlDeadline` is in the future and ≤ N days from now. The buckets are nested — an account expiring in 20 days appears in all three. |
| `accounts.expiring.pastDeadline` | number | Accounts whose `ttlDeadline` has already passed. These will be removed by the next `/api/cron/cleanup` run. |
| `access.total` | number | All-time access-log row count (across all accounts). |
| `access.last24h` / `.last7d` / `.last30d` | number | Access-log rows whose `accessedAt` is within the rolling window. |
| `access.notifications.sent` | number | All-time count of access events that triggered an APNs push. |
| `access.notifications.cooldown` | number | Access events suppressed by the 60-minute notification cooldown. |
| `access.notifications.noToken` | number | Access events where the account had no registered APNs token. |
| `recentEvents` | array | Up to 20 most-recent access-log rows, newest first. |
| `recentEvents[].accountId` | number | Internal autoincrement account ID. **Not** the 16-digit account number. Useful only as a stable opaque identifier within stats responses. |
| `recentEvents[].eventType` | string | One of `tag_accessed`, `token_rerolled`. |
| `recentEvents[].notificationStatus` | string or null | `sent` / `cooldown` / `no_token` for `tag_accessed`; `null` for non-tag events. |
| `recentEvents[].accessedAt` | string | SQLite timestamp string in `YYYY-MM-DD HH:MM:SS` UTC format (not ISO 8601 — same format as `GET /api/access-log`). |

**Response (401):** `{ "error": "Unauthorized" }` if neither auth credential is valid, or if `OWNER_PASSWORD` is unset on the server.

**Notes:**

- Always re-run the request to get fresh numbers; the response is not cached server-side and the route is marked `dynamic`.
- The aggregates are computed in a single SQL pass each (one for `accounts`, one for `access_log`); cost is O(rows). Fine to poll on the order of seconds; longer windows are recommended for any background polling.
- `recentEvents` exists primarily for the operator dashboard. iOS clients displaying summary numbers can ignore it.

---

### iOS / URLSession example

Storing the password in Keychain and sending it on each request keeps the iOS client stateless — no cookie jar needed.

```swift
struct OwnerStats: Decodable {
    let generatedAt: String
    let accounts: Accounts
    let access: Access
    let recentEvents: [Event]

    struct Accounts: Decodable {
        let total: Int
        let withPushEnabled: Int
        let active: Window
        let expiring: Expiring

        struct Window: Decodable {
            let last24h, last7d, last30d: Int
        }
        struct Expiring: Decodable {
            let within30d, within60d, within90d, pastDeadline: Int
        }
    }

    struct Access: Decodable {
        let total, last24h, last7d, last30d: Int
        let notifications: Notifications

        struct Notifications: Decodable {
            let sent, cooldown, noToken: Int
        }
    }

    struct Event: Decodable {
        let accountId: Int
        let eventType: String
        let notificationStatus: String?
        let accessedAt: String
    }
}

func fetchOwnerStats(baseURL: URL, ownerPassword: String) async throws -> OwnerStats {
    var req = URLRequest(url: baseURL.appendingPathComponent("api/admin/stats"))
    req.setValue("Bearer \(ownerPassword)", forHTTPHeaderField: "Authorization")
    let (data, resp) = try await URLSession.shared.data(for: req)
    guard let http = resp as? HTTPURLResponse, http.statusCode == 200 else {
        throw URLError(.userAuthenticationRequired)
    }
    return try JSONDecoder().decode(OwnerStats.self, from: data)
}
```

The endpoint deliberately uses `camelCase` JSON keys throughout, matching Swift's default `JSONDecoder` behavior — no `keyDecodingStrategy` needed.

---

## Cron Endpoints

These endpoints are intended to be invoked on a schedule (e.g. daily). They are gated by a `CRON_SECRET` environment variable and **fail closed** — if `CRON_SECRET` is unset on the server, every request is rejected.

### Authentication (cron)

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <CRON_SECRET>` |

The comparison uses constant-time equality. Missing or mismatched headers receive `401 Unauthorized`.

The repo includes a [GitHub Actions workflow](../.github/workflows/cron.yml) that invokes both cron endpoints daily at 13:00 UTC (≈ 7am Central). To use it, set `CRON_SECRET` and `PROD_BASE_URL` as repository secrets.

---

### GET /api/cron/cleanup

Delete all accounts whose TTL has expired.

**Auth:** Cron (Bearer)

**Response (200):**

```json
{
  "deleted": 3,
  "timestamp": "2026-04-13T20:00:00.000Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `deleted` | number | Number of expired accounts removed |
| `timestamp` | string | ISO 8601 timestamp of when cleanup ran |

**Response (401):** `{ "error": "Unauthorized" }` if the bearer header is missing/wrong, or if `CRON_SECRET` is unset on the server.

**Notes:**
- Deletes all accounts where `ttl_deadline < now()`.
- Access log entries are removed automatically via CASCADE.
- Idempotent — running on an already-clean DB returns `{ "deleted": 0 }`.

---

### GET /api/cron/expiry-check

Send a single expiry-warning push to every account that:

1. Has a registered `apnsToken`.
2. Has a `ttlDeadline` more than `now()` but within 31 days.
3. Has not already received a warning since the last login (`expiry_warning_sent_at` is null).

The push body is generated by `expiryWarningBody(daysRemaining)`, which has three branches:

- `daysRemaining <= 0` → `"Your emergID expires today. Sign in now to keep it active and prevent deletion."`
- `daysRemaining === 1` → `"Your emergID expires in 1 day. Sign in now to keep it active and prevent deletion."`
- otherwise → `` `Your emergID expires in ${daysRemaining} days. Sign in to keep it active and prevent deletion.` ``

**Auth:** Cron (Bearer)

**Response (200):**

```json
{
  "checked": 12,
  "notified": 9,
  "failed": 1,
  "timestamp": "2026-04-29T13:00:00.000Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `checked` | number | Accounts matching the warning criteria. |
| `notified` | number | Pushes accepted by APNs. `expiry_warning_sent_at` is stamped on each. |
| `failed` | number | Pushes that APNs rejected. Includes both stale tokens (HTTP 410) and transient failures. |
| `timestamp` | string | ISO 8601 timestamp of when the run started. |

**Response (401):** Same conditions as `/api/cron/cleanup`.

**Side effects:**
- Stale APNs tokens (HTTP 410) are cleared from the affected accounts.
- Transient failures are not stamped, so the next cron run retries them.
- A successful login (`POST /api/auth`) clears `expiry_warning_sent_at`, so warnings re-arm naturally as accounts re-approach the threshold in subsequent years.

---

## Pages (Server-Rendered)

### GET /e/:token

The public medical card page. This is the URL written to NFC tags and what first responders see.

- Renders a confirmation interstitial — header, "First Responder Access" warning, and a single "Confirm — Medical Emergency" button. **The page itself does not decrypt medical data and does not fire any notification.** This protects against link unfurlers (iMessage, Slack), accidental scans, and link previews.
- The button POSTs to `/api/e/:token/confirm`, which handles decryption + notification + access logging in one shot. The decrypted card then renders client-side.
- Returns a styled 404 page on initial load if the token is invalid or the account has expired (the existence + TTL check still happens server-side).

---

## Data Flow Summary

```
NFC Tag Tap
    |
    v
GET /e/:token
    |
    +--> Hash token
    +--> Look up account by token_hash
    +--> Decrypt DEK using token + salt (PBKDF2 -> AES-256-GCM)
    +--> Decrypt medical fields using DEK (AES-256-GCM)
    +--> Atomically claim notification cooldown slot
    +--> Fire APNs alert if claimed (and apns_token is set)
    +--> Insert access_log row (event_type='tag_accessed', notification_status=sent|cooldown|no_token)
    +--> Render HTML medical card (SSR)

Account Portal Login
    |
    v
POST /api/auth { accountNumber }
    |
    +--> Hash account number
    +--> Look up account by account_hash
    +--> Decrypt DEK using account number + salt (PBKDF2 -> AES-256-GCM)
    +--> Encrypt DEK with session secret, store in HTTP-only cookie
    +--> Reset TTL to 365 days
```
