import {
  randomBytes,
  createHash,
  createHmac,
  createCipheriv,
  createDecipheriv,
  timingSafeEqual,
  pbkdf2Sync,
} from "crypto";

/** Generate a random account number in XXXX-XXXX-XXXX format */
export function generateAccountNumber(): string {
  const bytes = randomBytes(6); // 48 bits of entropy
  const num = bytes.readUIntBE(0, 6);
  const digits = num.toString().padStart(12, "0").slice(0, 12);
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
}

/** Generate a 128-bit cryptographically random token as base64url */
export function generateToken(): string {
  return randomBytes(16).toString("base64url");
}

/** Generate a 256-bit random data encryption key */
export function generateDEK(): Buffer {
  return randomBytes(32);
}

/** SHA-256 hash a string, return hex */
export function hash(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/** Derive a 256-bit encryption key from a credential using PBKDF2 */
export function deriveKey(credential: string, salt: string): Buffer {
  return pbkdf2Sync(credential, salt, 100_000, 32, "sha256");
}

/** AES-256-GCM encrypt. Returns base64 string of iv:authTag:ciphertext */
export function encrypt(plaintext: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  // Pack as iv:authTag:ciphertext, all base64
  return `${iv.toString("base64")}.${authTag.toString("base64")}.${encrypted.toString("base64")}`;
}

/** AES-256-GCM decrypt. Input is the format from encrypt() */
export function decrypt(packed: string, key: Buffer): string {
  const [ivB64, authTagB64, ciphertextB64] = packed.split(".");
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/** Encrypt DEK with a credential-derived key */
export function encryptDEK(dek: Buffer, credential: string, salt: string): string {
  const wrappingKey = deriveKey(credential, salt);
  return encrypt(dek.toString("hex"), wrappingKey);
}

/** Decrypt DEK with a credential-derived key */
export function decryptDEK(encryptedDek: string, credential: string, salt: string): Buffer {
  const wrappingKey = deriveKey(credential, salt);
  const dekHex = decrypt(encryptedDek, wrappingKey);
  return Buffer.from(dekHex, "hex");
}

/** Sign a payload with HMAC-SHA256 */
export function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Verify an HMAC signature using timing-safe comparison */
export function verify(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = sign(payload, secret);
  try {
    return timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}
