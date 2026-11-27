import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "ax_admin_session";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export function isValidAdminPassword(password: string): boolean {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword || !password) return false;

  const expectedDigest = createHash("sha256").update(expectedPassword).digest();
  const suppliedDigest = createHash("sha256").update(password).digest();
  return timingSafeEqual(expectedDigest, suppliedDigest);
}

export function hasAdminSession(request: Request): boolean {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) return false;

  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!cookie) return false;

  const [expiresAt, signature, extra] = cookie.split(".");
  if (!expiresAt || !signature || extra !== undefined) return false;
  const expiresAtNumber = Number(expiresAt);
  if (!Number.isSafeInteger(expiresAtNumber) || expiresAtNumber <= Date.now()) {
    return false;
  }

  const expectedSignature = createHmac("sha256", expectedPassword)
    .update(`${COOKIE_NAME}:${expiresAt}`)
    .digest();
  let suppliedSignature: Buffer;
  try {
    suppliedSignature = Buffer.from(signature, "base64url");
  } catch {
    return false;
  }
  return (
    suppliedSignature.length === expectedSignature.length &&
    timingSafeEqual(expectedSignature, suppliedSignature)
  );
}

export function isAdminRequest(request: Request): boolean {
  if (hasAdminSession(request)) return true;
  const authorization = request.headers.get("authorization") ?? "";
  const password = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  return isValidAdminPassword(password);
}

export function createAdminSessionCookie(
  request: Request,
  password: string,
): string | undefined {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword || !isValidAdminPassword(password)) return undefined;

  const expiresAt = String(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const signature = createHmac("sha256", expectedPassword)
    .update(`${COOKIE_NAME}:${expiresAt}`)
    .digest("base64url");
  const secure =
    new URL(request.url).protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https";
  return `${COOKIE_NAME}=${expiresAt}.${signature}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; SameSite=Strict${secure ? "; Secure" : ""}`;
}

export function clearAdminSessionCookie(request: Request): string {
  const secure =
    new URL(request.url).protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https";
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict${secure ? "; Secure" : ""}`;
}
