type PublicWish = {
  name: string;
  message: string;
  submittedAt?: string;
};

export async function GET(): Promise<Response> {
  const endpoint = process.env.GOOGLE_SCRIPT_APP;
  if (!endpoint) {
    return Response.json(
      { error: "Google Sheets RSVP endpoint is not configured." },
      { status: 503 },
    );
  }

  try {
    const url = new URL(endpoint);
    url.searchParams.set("action", "wishes");
    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) throw new Error(`Apps Script returned HTTP ${response.status}.`);
    const result = (await response.json()) as { wishes?: unknown };
    if (!Array.isArray(result.wishes)) {
      throw new Error("Apps Script returned an invalid wishes list.");
    }

    const wishes = result.wishes
      .filter(
        (wish): wish is PublicWish =>
          typeof wish === "object" &&
          wish !== null &&
          typeof (wish as PublicWish).name === "string" &&
          typeof (wish as PublicWish).message === "string",
      )
      .slice(-30)
      .map(({ name, message, submittedAt }) => ({
        name: name.slice(0, 120),
        message: message.slice(0, 1000),
        submittedAt:
          typeof submittedAt === "string" ? submittedAt.slice(0, 40) : "",
      }));

    return Response.json(
      { wishes },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("Could not load consented guest wishes.", error);
    return Response.json(
      { error: "Could not load guest wishes." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
