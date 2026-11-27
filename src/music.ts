import { list, put } from "@vercel/blob";

export type MusicTrack = {
  pathname: string;
  url: string;
  title: string;
  enabled: boolean;
};

export const MUSIC_TRACK_PREFIX = "wedding/music/tracks/";
export const MUSIC_PLAYLIST_PATH = "wedding/music/playlist.json";
export const MAX_MUSIC_TRACKS = 30;

async function getStoredTracks(): Promise<MusicTrack[]> {
  const { blobs } = await list({ prefix: MUSIC_TRACK_PREFIX });
  return blobs
    .filter((blob) => blob.pathname.toLowerCase().endsWith(".mp3"))
    .sort((a, b) => a.uploadedAt.getTime() - b.uploadedAt.getTime())
    .map((blob) => {
      const fileName = blob.pathname.split("/").pop() ?? "Wedding track";
      const title = fileName
        .replace(/\.mp3$/i, "")
        .replace(/-[a-z0-9]{6,}$/i, "")
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b[a-z]/g, (character) => character.toUpperCase());
      return {
        pathname: blob.pathname,
        url: blob.url,
        title: title.slice(0, 100),
        enabled: true,
      };
    });
}

export async function readMusicPlaylist(): Promise<MusicTrack[]> {
  const storedTracks = await getStoredTracks();
  const storedByPath = new Map(
    storedTracks.map((track) => [track.pathname, track]),
  );
  const { blobs } = await list({ prefix: MUSIC_PLAYLIST_PATH });
  const manifest = blobs.find((blob) => blob.pathname === MUSIC_PLAYLIST_PATH);
  if (!manifest) return storedTracks.slice(0, MAX_MUSIC_TRACKS);

  const response = await fetch(manifest.url, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not read the music playlist.");
  const value: unknown = await response.json();
  if (!Array.isArray(value)) throw new Error("Invalid music playlist format.");

  return value
    .filter(
      (item): item is MusicTrack =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as MusicTrack).pathname === "string" &&
        typeof (item as MusicTrack).title === "string" &&
        typeof (item as MusicTrack).enabled === "boolean",
    )
    .flatMap((track) => {
      const storedTrack = storedByPath.get(track.pathname);
      return storedTrack
        ? [{ ...track, url: storedTrack.url, title: track.title.slice(0, 100) }]
        : [];
    })
    .slice(0, MAX_MUSIC_TRACKS);
}

export async function writeMusicPlaylist(
  tracks: MusicTrack[],
): Promise<void> {
  await put(MUSIC_PLAYLIST_PATH, JSON.stringify(tracks), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

export async function getAvailableMusicTracks(): Promise<MusicTrack[]> {
  return readMusicPlaylist();
}

export async function getEnabledMusicTracks(): Promise<
  Pick<MusicTrack, "url" | "title">[]
> {
  return (await readMusicPlaylist())
    .filter((track) => track.enabled)
    .map(({ url, title }) => ({ url, title }));
}

export async function getTrackBlob(
  pathname: string,
): Promise<{ url: string; pathname: string } | undefined> {
  if (!pathname.startsWith(MUSIC_TRACK_PREFIX)) return undefined;
  const { blobs } = await list({ prefix: pathname });
  const blob = blobs.find(
    (item) => item.pathname === pathname && item.pathname.toLowerCase().endsWith(".mp3"),
  );
  return blob ? { url: blob.url, pathname: blob.pathname } : undefined;
}
