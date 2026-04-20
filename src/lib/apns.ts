import { createSign } from "node:crypto";
import http2 from "node:http2";

const APNS_KEY_ID = process.env.APNS_KEY_ID ?? "";
const APNS_TEAM_ID = process.env.APNS_TEAM_ID ?? "";
const APNS_BUNDLE_ID = process.env.APNS_BUNDLE_ID ?? "";
// Store the .p8 key content as an env var with literal \n for newlines
const APNS_PRIVATE_KEY = (process.env.APNS_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

const APNS_HOST =
  process.env.NODE_ENV === "production"
    ? "api.push.apple.com"
    : "api.sandbox.push.apple.com";

let cachedJWT: { token: string; issuedAt: number } | null = null;
const JWT_REFRESH_INTERVAL = 45 * 60; // refresh every 45 min (tokens valid for 60)

function generateJWT(): string {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJWT && now - cachedJWT.issuedAt < JWT_REFRESH_INTERVAL) {
    return cachedJWT.token;
  }

  const header = Buffer.from(
    JSON.stringify({ alg: "ES256", kid: APNS_KEY_ID })
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ iss: APNS_TEAM_ID, iat: now })
  ).toString("base64url");
  const signingInput = `${header}.${payload}`;

  const sign = createSign("SHA256");
  sign.update(signingInput);
  // ieee-p1363 gives raw r||s bytes (64 bytes) — what APNs expects
  const sig = sign.sign({ key: APNS_PRIVATE_KEY, dsaEncoding: "ieee-p1363" });
  const token = `${signingInput}.${sig.toString("base64url")}`;

  cachedJWT = { token, issuedAt: now };
  return token;
}

export type APNsResult =
  | { success: true }
  | { success: false; staleToken: boolean };

export async function sendPushNotification(
  deviceToken: string,
  accessedAt: string
): Promise<APNsResult> {
  if (!APNS_KEY_ID || !APNS_TEAM_ID || !APNS_PRIVATE_KEY || !APNS_BUNDLE_ID) {
    return { success: false, staleToken: false };
  }

  const jwt = generateJWT();
  const body = JSON.stringify({
    aps: {
      alert: {
        title: "Tag Accessed",
        body: "Your emergID tag was accessed",
      },
      sound: "default",
    },
    accessedAt,
  });

  return new Promise((resolve) => {
    const client = http2.connect(`https://${APNS_HOST}`);

    client.on("error", () => resolve({ success: false, staleToken: false }));

    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${jwt}`,
      "apns-topic": APNS_BUNDLE_ID,
      "apns-push-type": "alert",
      "content-type": "application/json",
      "content-length": Buffer.byteLength(body),
    });

    req.write(body);
    req.end();

    let statusCode = 0;
    req.on("response", (headers) => {
      statusCode = headers[":status"] as number;
    });

    // consume the response body
    req.on("data", () => {});

    req.on("end", () => {
      client.close();
      if (statusCode === 200) {
        resolve({ success: true });
      } else {
        // 410 = Unregistered (device uninstalled app), 400 = BadDeviceToken
        resolve({ success: false, staleToken: statusCode === 410 || statusCode === 400 });
      }
    });

    req.on("error", () => {
      client.close();
      resolve({ success: false, staleToken: false });
    });
  });
}
