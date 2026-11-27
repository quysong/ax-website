import { del, list } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAdminRequest } from "../src/admin-session.js";
import {
  getImageBlobPath,
  getImageBlobPrefix,
  getImageSlot,
  imageSlots,
} from "../src/image-slots.js";
import { getManagedImageUrls } from "../src/blob-images.js";
import {
  getAvailableMusicTracks,
  getTrackBlob,
  MAX_MUSIC_TRACKS,
  MUSIC_TRACK_PREFIX,
  readMusicPlaylist,
  writeMusicPlaylist,
  type MusicTrack,
} from "../src/music.js";

const responseHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders,
  });
}

function authorizeAdmin(request: Request): Response | null {
  if (!process.env.ADMIN_PASSWORD) {
    return jsonResponse(
      { error: "Admin password is not configured on the server." },
      503,
    );
  }

  if (!isAdminRequest(request)) {
    return jsonResponse({ error: "Incorrect admin password." }, 401);
  }

  return null;
}

function requireBlobToken(): Response | null {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return jsonResponse(
      {
        error:
          "Vercel Blob is not configured. Connect a Blob store and add its read-write token.",
      },
      503,
    );
  }
  return null;
}

export async function GET(request: Request): Promise<Response> {
  const authError = authorizeAdmin(request);
  if (authError) return authError;
  const blobError = requireBlobToken();
  if (blobError) return blobError;

  try {
    const images = await getManagedImageUrls();
    const musicTracks = await getAvailableMusicTracks();
    return jsonResponse({
      slots: imageSlots.map((slot) => ({
        id: slot.id,
        label: slot.label,
        width: slot.width,
        height: slot.height,
        previewUrl: images[slot.id] ?? "",
      })),
      musicTracks,
    });
  } catch (error) {
    console.error("Could not list wedding images from Vercel Blob.", error);
    return jsonResponse(
      { error: "Could not read the Vercel Blob image store." },
      503,
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  const blobError = requireBlobToken();
  if (blobError) return blobError;

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const authError = authorizeAdmin(request);
        if (authError) {
          throw new Error(
            authError.status === 503
              ? "Admin password is not configured on the server."
              : "Incorrect admin password.",
          );
        }

        let payload: { kind?: unknown; slotId?: unknown; title?: unknown };
        try {
          payload = JSON.parse(clientPayload ?? "") as { slotId?: unknown };
        } catch {
          throw new Error("Choose a valid image slot.");
        }

        if (payload.kind === "music") {
          if (
            !pathname.startsWith(MUSIC_TRACK_PREFIX) ||
            !pathname.endsWith(".mp3") ||
            typeof payload.title !== "string" ||
            !payload.title.trim() ||
            payload.title.length > 100
          ) {
            throw new Error("Choose a valid MP3 track and title.");
          }
          if ((await getAvailableMusicTracks()).length >= MAX_MUSIC_TRACKS) {
            throw new Error(`The playlist can contain at most ${MAX_MUSIC_TRACKS} tracks.`);
          }
          return {
            allowedContentTypes: ["audio/mpeg"],
            maximumSizeInBytes: 30 * 1024 * 1024,
            addRandomSuffix: true,
            tokenPayload: JSON.stringify({
              kind: "music",
              title: payload.title.trim(),
            }),
          };
        }

        if (payload.kind !== "image" || typeof payload.slotId !== "string") {
          throw new Error("Choose a valid image slot.");
        }
        const slot = getImageSlot(payload.slotId);
        if (!slot) throw new Error("Unknown image slot.");

        const allowedPaths = [getImageBlobPath(slot.id, "image/webp")];
        if (!allowedPaths.includes(pathname)) {
          throw new Error("Upload path does not match the selected image slot.");
        }

        return {
          allowedContentTypes: ["image/webp"],
          maximumSizeInBytes: 20 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ kind: "image", slotId: slot.id }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) throw new Error("Missing image slot metadata.");

        const payload = JSON.parse(tokenPayload) as {
          kind?: unknown;
          slotId?: unknown;
          title?: unknown;
        };
        if (payload.kind === "music") {
          if (
            typeof payload.title !== "string" ||
            !blob.pathname.startsWith(MUSIC_TRACK_PREFIX) ||
            blob.contentType !== "audio/mpeg"
          ) {
            throw new Error("Completed upload is not a valid MP3 track.");
          }
          return;
        }
        if (payload.kind !== "image") {
          throw new Error("Invalid upload type.");
        }
        if (typeof payload.slotId !== "string") {
          throw new Error("Invalid image slot metadata.");
        }

        const slot = getImageSlot(payload.slotId);
        if (!slot || !blob.pathname.startsWith(getImageBlobPrefix(slot.id))) {
          throw new Error("Completed upload does not match an image slot.");
        }

        const { blobs } = await list({ prefix: getImageBlobPrefix(slot.id) });
        const previousImages = blobs.filter(
          (existingBlob) => existingBlob.pathname !== blob.pathname,
        );
        if (previousImages.length > 0) {
          await del(previousImages.map((oldBlob) => oldBlob.url));
        }
      },
    });
    return jsonResponse(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not upload the image.";
    const status = /incorrect admin password/i.test(message)
      ? 401
      : /admin password is not configured/i.test(message)
        ? 503
        : 400;
    return jsonResponse({ error: message }, status);
  }
}

export async function PUT(request: Request): Promise<Response> {
  const authError = authorizeAdmin(request);
  if (authError) return authError;
  const blobError = requireBlobToken();
  if (blobError) return blobError;

  try {
    const body = (await request.json()) as {
      tracks?: { pathname?: unknown; title?: unknown; enabled?: unknown }[];
    } | null;
    if (
      !body ||
      !Array.isArray(body.tracks) ||
      body.tracks.length > MAX_MUSIC_TRACKS
    ) {
      return jsonResponse({ error: "Invalid music playlist." }, 400);
    }

    const tracks: MusicTrack[] = [];
    const seenPathnames = new Set<string>();
    for (const candidate of body.tracks) {
      if (
        !candidate ||
        typeof candidate.pathname !== "string" ||
        typeof candidate.title !== "string" ||
        typeof candidate.enabled !== "boolean" ||
        !candidate.title.trim() ||
        candidate.title.length > 100
      ) {
        return jsonResponse({ error: "Invalid music track details." }, 400);
      }
      if (seenPathnames.has(candidate.pathname)) {
        return jsonResponse({ error: "Duplicate music track." }, 400);
      }
      const current = await getTrackBlob(candidate.pathname);
      if (!current) {
        return jsonResponse({ error: "Unknown music track." }, 400);
      }
      seenPathnames.add(candidate.pathname);
      tracks.push({
        ...current,
        title: candidate.title.trim(),
        enabled: candidate.enabled,
      });
    }

    await writeMusicPlaylist(tracks);
    return jsonResponse({ musicTracks: tracks });
  } catch (error) {
    console.error("Could not save the Vercel Blob music playlist.", error);
    return jsonResponse({ error: "Could not save the music playlist." }, 503);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const authError = authorizeAdmin(request);
  if (authError) return authError;
  const blobError = requireBlobToken();
  if (blobError) return blobError;

  try {
    const body = (await request.json()) as { pathname?: unknown } | null;
    if (
      !body ||
      typeof body.pathname !== "string" ||
      !body.pathname.startsWith(MUSIC_TRACK_PREFIX)
    ) {
      return jsonResponse({ error: "Invalid music track." }, 400);
    }
    const track = await getTrackBlob(body.pathname);
    if (!track) return jsonResponse({ error: "Music track not found." }, 404);

    const remaining = (await readMusicPlaylist()).filter(
      (item) => item.pathname !== track.pathname,
    );
    await writeMusicPlaylist(remaining);
    await del(track.url);
    return jsonResponse({ musicTracks: remaining });
  } catch (error) {
    console.error("Could not delete the Vercel Blob music track.", error);
    return jsonResponse({ error: "Could not delete the music track." }, 503);
  }
}
