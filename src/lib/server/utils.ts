import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Constant-time string comparison to prevent timing attacks.
 * Hashes inputs with SHA-256 first to ensure same-length comparison
 * and avoid leaking information about the string lengths.
 */
export function secureCompare(a: string, b: string) {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();

  return timingSafeEqual(hashA, hashB);
}
