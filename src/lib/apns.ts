import { createSign } from "node:crypto";
import http2 from "node:http2";

const APNS_KEY_ID = process.env.APNS_KEY_ID ?? "";
const APNS_TEAM_ID = process.env.APNS_TEAM_ID ?? "";
const APNS_BUNDLE_ID = process.env.APNS_BUNDLE_ID ?? "";
// Store the .p8 key content as an env var with literal \n for newlines
const APNS_PRIVATE_KEY = (process.env.APNS_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

// Set APNS_SANDBOX=true on Railway when testing with a dev/Xcode build.
// Switch to false (or remove the var) once distributing via App Store/TestFlight.
const APNS_HOST =
  process.env.APNS_SANDBOX === "true"
    ? "api.sandbox.push.apple.com"
    : "api.push.apple.com";

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
    console.warn("[apns] Missing env vars — skipping push.", {
      hasKeyId: !!APNS_KEY_ID,
      hasTeamId: !!APNS_TEAM_ID,
      hasPrivateKey: !!APNS_PRIVATE_KEY,
      hasBundleId: !!APNS_BUNDLE_ID,
    });
    return { success: false, staleToken: false };
  }

  console.log("[apns] Sending push to token:", deviceToken.slice(0, 8) + "...");

  let jwt: string;
  try {
    jwt = generateJWT();
  } catch (err) {
    console.error("[apns] JWT generation failed:", err);
    return { success: false, staleToken: false };
  }
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

    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));

    req.on("end", () => {
      client.close();
      if (statusCode === 200) {
        console.log("[apns] Push delivered successfully.");
        resolve({ success: true });
      } else {
        const body = Buffer.concat(chunks).toString();
        console.warn(`[apns] Push failed — HTTP ${statusCode}: ${body}`);
        resolve({ success: false, staleToken: statusCode === 410 });
      }
    });

    req.on("error", (err) => {
      console.error("[apns] Request error:", err.message);
      client.close();
      resolve({ success: false, staleToken: false });
    });
  });
}
