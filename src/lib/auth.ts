import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "cp_session";
const ALG = "HS256";

function getSecret() {
  const password = process.env.SITE_PASSWORD;
  if (!password) {
    throw new Error(
      "SITE_PASSWORD is not set. Set it in your environment (see .env.example)."
    );
  }
  // Derive a stable secret from the password itself — simplest approach for
  // a single shared-password gate; no separate secret to manage.
  return new TextEncoder().encode(`constituency-pulse:${password}`);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ ok: true })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret(), { algorithms: [ALG] });
    return true;
  } catch {
    return false;
  }
}

export function checkPassword(input: string): boolean {
  const expected = process.env.SITE_PASSWORD;
  if (!expected) return false;
  return input === expected;
}

export { COOKIE_NAME };
