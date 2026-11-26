import { getManagedImageUrls } from "../src/blob-images.js";

export async function GET(): Promise<Response> {
  try {
    const images = await getManagedImageUrls();
    return Response.json(
      { images },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );
  } catch (error) {
    console.error("Could not load wedding images from Vercel Blob.", error);
    return Response.json(
      { error: "Could not load wedding images." },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );
  }
}
