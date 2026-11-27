type RSVP = {
  name: string;
  attendance: "yes" | "no";
  guests: number;
  message: string;
  publishWish: boolean;
  submittedAt: string;
};

function isValidRSVP(value: unknown): value is RSVP {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<RSVP>;
  return (
    typeof data.name === "string" &&
    data.name.trim().length > 0 &&
    data.name.length <= 120 &&
    (data.attendance === "yes" || data.attendance === "no") &&
    typeof data.guests === "number" &&
    Number.isInteger(data.guests) &&
    data.guests >= 0 &&
    data.guests <= 4 &&
    (data.attendance === "yes" || data.guests === 0) &&
    typeof data.message === "string" &&
    data.message.length <= 1000 &&
    typeof data.publishWish === "boolean" &&
    typeof data.submittedAt === "string"
  );
}

export async function POST(request: Request): Promise<Response> {
  const endpoint = process.env.GOOGLE_SCRIPT_APP;
  if (!endpoint) {
    return Response.json(
      { error: "Google Sheets RSVP endpoint is not configured." },
      { status: 503 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid RSVP request." }, { status: 400 });
  }
  if (!isValidRSVP(payload)) {
    return Response.json(
      { error: "Please check the RSVP details and try again." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.includes("application/json")) {
      throw new Error(`Apps Script returned HTTP ${response.status}.`);
    }

    const result = (await response.json()) as { ok?: unknown };
    if (result.ok !== true) {
      return Response.json(
        { error: "Google Sheets could not save this RSVP." },
        { status: 502 },
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Could not submit the RSVP to Google Sheets.", error);
    return Response.json(
      { error: "Could not confirm the RSVP with Google Sheets." },
      { status: 502 },
    );
  }
}
