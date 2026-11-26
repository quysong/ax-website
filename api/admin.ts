import { del, list } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { createHash, timingSafeEqual } from "node:crypto";
import {
  getImageBlobPath,
  getImageBlobPrefix,
  getImageSlot,
  imageSlots,
} from "../src/image-slots.js";
import { getManagedImageUrls } from "../src/blob-images.js";

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

function hasValidPassword(request: Request): boolean {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const authorization = request.headers.get("authorization") ?? "";
  const suppliedPassword = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!expectedPassword || !suppliedPassword) return false;

  const expectedDigest = createHash("sha256")
    .update(expectedPassword)
    .digest();
  const suppliedDigest = createHash("sha256")
    .update(suppliedPassword)
    .digest();

  return timingSafeEqual(expectedDigest, suppliedDigest);
}

function authorizeAdmin(request: Request): Response | null {
  if (!process.env.ADMIN_PASSWORD) {
    return jsonResponse(
      { error: "Admin password is not configured on the server." },
      503,
    );
  }

  if (!hasValidPassword(request)) {
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
    return jsonResponse({
      slots: imageSlots.map((slot) => ({
        id: slot.id,
        label: slot.label,
        width: slot.width,
        height: slot.height,
        previewUrl: images[slot.id] ?? "",
      })),
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

        let payload: { slotId?: unknown };
        try {
          payload = JSON.parse(clientPayload ?? "") as { slotId?: unknown };
        } catch {
          throw new Error("Choose a valid image slot.");
        }

        if (typeof payload.slotId !== "string") {
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
          tokenPayload: JSON.stringify({ slotId: slot.id }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) throw new Error("Missing image slot metadata.");

        const payload = JSON.parse(tokenPayload) as { slotId?: unknown };
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
