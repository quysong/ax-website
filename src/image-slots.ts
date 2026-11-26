export const imageSlots = [
  {
    id: "hero",
    label: "Ảnh bìa",
    width: 1400,
    height: 1700,
  },
  {
    id: "story-1",
    label: "Chuyện chúng mình — ảnh 1",
    width: 900,
    height: 1100,
  },
  {
    id: "story-2",
    label: "Chuyện chúng mình — ảnh 2",
    width: 900,
    height: 1100,
  },
  {
    id: "gallery-1",
    label: "Bộ sưu tập — ảnh 1",
    width: 900,
    height: 1100,
  },
  {
    id: "gallery-2",
    label: "Bộ sưu tập — ảnh 2",
    width: 900,
    height: 1100,
  },
  {
    id: "gallery-3",
    label: "Bộ sưu tập — ảnh 3",
    width: 900,
    height: 1100,
  },
] as const;

export type ImageSlotId = (typeof imageSlots)[number]["id"];
export type ImageSlot = (typeof imageSlots)[number];
export const supportedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;
export type SupportedImageType = (typeof supportedImageTypes)[number];

export function isSupportedImageType(
  contentType: string,
): contentType is SupportedImageType {
  return supportedImageTypes.some((supportedType) => supportedType === contentType);
}

export function getImageSlot(id: string): ImageSlot | undefined {
  return imageSlots.find((slot) => slot.id === id);
}

export function getImageBlobPrefix(slotId: ImageSlotId): string {
  return `wedding/${slotId}/`;
}

export function getImageBlobPath(
  slotId: ImageSlotId,
  contentType: (typeof supportedImageTypes)[number],
): string {
  const extensionByType = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
  };
  return `${getImageBlobPrefix(slotId)}image.${extensionByType[contentType]}`;
}
