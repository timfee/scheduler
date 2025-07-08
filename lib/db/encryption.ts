import crypto from "crypto";
import env from "@/env.config";
import { Result, ok, err, EncryptionError } from "@/lib/errors";

function validateEncryptionKey(key: string): boolean {
  return /^[0-9A-Fa-f]{64}$/.test(key);
}

export function encrypt(text: string): Result<string, EncryptionError> {
  try {
    if (!validateEncryptionKey(env.ENCRYPTION_KEY)) {
      return err(new EncryptionError("Invalid encryption key format", "INVALID_KEY"));
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      Buffer.from(env.ENCRYPTION_KEY, "hex"),
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

    return ok(result);
  } catch (error) {
    return err<EncryptionError>(
      new EncryptionError(
        error instanceof Error ? error.message : "Encryption failed",
        "ENCRYPT_FAILED",
      ),
    ) as Result<string, EncryptionError>;
  }
}

export function decrypt(encryptedText: string): Result<string, EncryptionError> {
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      return err(new EncryptionError("Invalid encrypted data format", "DECRYPT_FAILED"));
    }

    const [ivHex, authTagHex, encrypted] = parts;

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(env.ENCRYPTION_KEY, "hex"),
      Buffer.from(ivHex, "hex"),
    );

    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted, "hex")),
      decipher.final(),
    ]);

    return ok(decrypted.toString("utf8"));
  } catch (error) {
    return err<EncryptionError>(
      new EncryptionError(
        error instanceof Error ? error.message : "Decryption failed",
        "DECRYPT_FAILED",
      ),
    ) as Result<string, EncryptionError>;
  }
}
