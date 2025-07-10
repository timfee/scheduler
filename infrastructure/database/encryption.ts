import crypto from "crypto";
import env from "@/env.config";
import { EncryptionError } from "@/lib/errors";

function validateEncryptionKey(key: string): boolean {
  return /^[0-9A-Fa-f]{64}$/.test(key);
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 *
 * The encryption key is provided via the `ENCRYPTION_KEY` environment
 * variable and must be a 64 character hex string.
 * The returned format is `iv:authTag:ciphertext` all in hex.
 */
export function encrypt(text: string): string {
  try {
    const key = env.ENCRYPTION_KEY;
    if (!key || !validateEncryptionKey(key)) {
      throw new EncryptionError("Invalid encryption key format", "INVALID_KEY");
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      Buffer.from(key, "hex"),
      iv,
    );

    const encrypted = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    const result = [
      iv.toString("hex"),
      authTag.toString("hex"),
      encrypted.toString("hex"),
    ].join(":");

    return result;
  } catch (error) {
    throw new EncryptionError(
      error instanceof Error ? error.message : "Encryption failed",
      "ENCRYPT_FAILED",
    );
  }
}

/**
 * Decrypt a value previously encrypted with {@link encrypt}.
 *
 * The input must be a string in the format `iv:authTag:ciphertext` using hex
 * encoding. If the data cannot be decrypted an `EncryptionError` is thrown.
 */
export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      throw new EncryptionError(
        "Invalid encrypted data format",
        "DECRYPT_FAILED",
      );
    }

    const [ivHex, authTagHex, encrypted] = parts;
    if (!ivHex || !authTagHex || !encrypted) {
      throw new EncryptionError("Invalid encrypted data format", "DECRYPT_FAILED");
    }

    const key = env.ENCRYPTION_KEY;
    if (!key || !validateEncryptionKey(key)) {
      throw new EncryptionError("Invalid encryption key format", "INVALID_KEY");
    }

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(key, "hex"),
      Buffer.from(ivHex, "hex"),
    );

    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted, "hex")),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    throw new EncryptionError(
      error instanceof Error ? error.message : "Decryption failed",
      "DECRYPT_FAILED",
    );
  }
}
