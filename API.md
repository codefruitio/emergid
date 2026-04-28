# emergID API Reference

All endpoints are relative to the base URL (e.g. `https://emergid.example.com`).

---

## Authentication

Admin endpoints require a session cookie set by `POST /api/auth`. The session is split across two HTTP-only cookies — `emergid_session` (signed account id) and `emergid_dek` (encrypted DEK) — both with a 24-hour max age.

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
- Sets `emergid_session` and `emergid_dek` HTTP-only cookies (24-hour max age).
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

### GET /api/card/:token

Fetch the medical card data for a given token. This is the public endpoint accessed when a first responder taps an NFC tag. No authentication required.

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
  "pushNotifications": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `pushNotifications` | boolean | `true` when all four APNs env vars (`APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_PRIVATE_KEY`, `APNS_BUNDLE_ID`) are present. The server cannot send push notifications when this is `false`. |

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

### GET /api/cron/cleanup

Delete all accounts whose TTL has expired. Intended to be called on a schedule (e.g. daily cron job).

**Auth:** None (should be protected by infrastructure-level access control in production)

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

**Notes:**
- Deletes all accounts where `ttl_deadline < now()`.
- Access log entries are removed automatically via CASCADE.
- On Railway, configure a cron job to call this endpoint daily. On Docker, use a system cron or a sidecar.

---

## Pages (Server-Rendered)

### GET /e/:token

The public medical card page. This is the URL written to NFC tags and what first responders see.

- Fully server-side rendered — no client JavaScript required.
- Displays all decrypted medical fields in a mobile-optimized layout.
- Includes a notice that the patient's name is on the physical NFC tag.
- Returns a styled 404 page if the token is invalid or the account has expired.
- Logs each access to the access log and triggers an APNs notification to the owner (subject to the 60-minute cooldown).

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
