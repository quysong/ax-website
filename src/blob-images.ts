import { list } from "@vercel/blob";
import { getImageBlobPrefix, imageSlots, type ImageSlotId } from "./image-slots";

export async function getManagedImageUrls(): Promise<
  Partial<Record<ImageSlotId, string>>
> {
  const { blobs } = await list({ prefix: "wedding/" });
  const images: Partial<Record<ImageSlotId, string>> = {};

  for (const slot of imageSlots) {
    const newest = blobs
      .filter((blob) => blob.pathname.startsWith(getImageBlobPrefix(slot.id)))
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0];

    if (newest) images[slot.id] = newest.url;
  }

  return images;
}
