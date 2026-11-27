import { getEnabledMusicTracks } from "../src/music.js";

export async function GET(): Promise<Response> {
  try {
    const tracks = await getEnabledMusicTracks();
    return Response.json(
      { tracks },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );
  } catch (error) {
    console.error("Could not load the wedding music playlist.", error);
    return Response.json(
      { error: "Could not load the music playlist." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
