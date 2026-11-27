import {
  clearAdminSessionCookie,
  createAdminSessionCookie,
  hasAdminSession,
  isValidAdminPassword,
} from "../src/admin-session.js";

function jsonResponse(body: unknown, status = 200, cookie?: string): Response {
  const headers = new Headers({
    "Cache-Control": "no-store, max-age=0",
    "Content-Type": "application/json; charset=utf-8",
  });
  if (cookie) headers.set("Set-Cookie", cookie);
  return new Response(JSON.stringify(body), { status, headers });
}

export async function GET(request: Request): Promise<Response> {
  if (!process.env.ADMIN_PASSWORD) {
    return jsonResponse({ error: "Admin password is not configured." }, 503);
  }
  return hasAdminSession(request)
    ? jsonResponse({ authenticated: true })
    : jsonResponse({ error: "Admin login required." }, 401);
}

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ADMIN_PASSWORD) {
    return jsonResponse({ error: "Admin password is not configured." }, 503);
  }

  let body: { password?: unknown };
  try {
    body = (await request.json()) as { password?: unknown };
  } catch {
    return jsonResponse({ error: "Invalid login request." }, 400);
  }
  if (typeof body.password !== "string" || !isValidAdminPassword(body.password)) {
    return jsonResponse({ error: "Incorrect admin password." }, 401);
  }

  const cookie = createAdminSessionCookie(request, body.password);
  if (!cookie) {
    return jsonResponse({ error: "Could not create an admin session." }, 500);
  }
  return jsonResponse({ authenticated: true }, 200, cookie);
}

export async function DELETE(request: Request): Promise<Response> {
  return jsonResponse(
    { authenticated: false },
    200,
    clearAdminSessionCookie(request),
  );
}
