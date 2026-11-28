# AI Project Guide — Anh & Xinh Wedding Website

This document gives coding assistants and developers the product context,
architecture, operational constraints, and known follow-up work for this
repository. Read it before changing wedding content, RSVP, admin, images, music,
or deployment behavior.

## Product and design intent

- A personal, Vietnamese wedding invitation website for **Anh & Xinh**.
- Wedding date: **14 March 2027**. The countdown and invitation time use
  `2027-03-14T17:30:00+07:00`.
- Venue: **Diamond Place 3**, 333 Nguyễn Văn Luông, phường Phú Lâm, Hồ Chí Minh.
  The supplied map link is
  <https://maps.app.goo.gl/FZy8cqXpXVY5Sgv8A>.
- The visual direction is warm, romantic, pastel scrapbook/editorial: a
  clickable animated invitation envelope, a photo-led story, wedding details,
  gallery slideshow, guest wishes, RSVP, and a light animated scene of the
  couple emerging from a house.
- Keep the experience responsive, polished on mobile, accessible, and fast.
  Respect `prefers-reduced-motion`; avoid blocking the initial invitation with
  large images or audio.
- Body copy uses **Noto Sans** for readability. **Caveat** is used for
  handwritten accents and **Cormorant Garamond** for decorative headings.
  General UI text should not be smaller than **13px**.
- The front-end is Vietnamese. Follow existing wording, typography, and
  styled-components patterns when editing.

## Main features

### Invitation (`src/App.tsx`)

- Envelope opening transition, countdown, story, event information, map link,
  photo gallery, RSVP form, public wishes, and floating music player.
- The gallery is a three-image slideshow with previous/next controls,
  indicators, keyboard support, and mobile swipe.
- RSVP asks for guest name, attendance, guest count (up to four), and an
  optional message. Guests explicitly choose whether their name/message may be
  shown publicly; only consented wishes are returned by the public wishes API.
- Background music is managed as a playlist. Only enabled tracks are exposed
  to the public player. Browser autoplay policies can prevent playback until a
  visitor interacts; do not promise guaranteed autoplay.

### Admin (`/admin`, `src/admin/AdminApp.tsx`)

- Image and music management share the admin UI. `/admin/home` is the
  authenticated destination; `/admin` is the login entry.
- Image slots are defined in `src/image-slots.ts`: hero, two story images, and
  three gallery images. Their recommended dimensions are displayed in admin.
- Image upload supports file selection and drag/drop, responsive previews,
  client-side WebP conversion/scaling, and upload to public Vercel Blob.
- Music admin supports MP3 files (up to 30 MB each, at most 30 tracks), title
  editing, enable/disable, ordering, and deletion. Order and enabled state are
  stored in the Blob playlist manifest.
- Admin uses `ADMIN_PASSWORD`; successful login creates a signed, HttpOnly
  cookie lasting seven days. The browser checks the session on reload and
  returns authenticated users to `/admin/home`. The backend must enforce auth
  on every admin API operation: the static admin HTML route itself is not a
  security boundary.
- `vercel.json` rewrites `/admin/home` to the static `/admin.html` entry.

### RSVP and wishes

1. The client submits RSVP JSON to `POST /api/rsvp`.
2. The Vercel Function validates the payload and forwards it to the
   `GOOGLE_SCRIPT_APP` Apps Script web app.
3. `google-apps-script/Code.gs` appends RSVP data to a Google Sheet tab named
   `RSVP`, creating the tab/headers when necessary. Spreadsheet-formula-like
   text is escaped before writing.
4. `GET /api/wishes` asks Apps Script for the latest consented wishes and
   returns at most 30, cached briefly at the edge.

Deploy the Apps Script web app as **Execute as: Me** and grant access to
**Anyone** (or the narrowest setting that still permits the Vercel server
request). Verify the deployment URL and actual Sheet writes before relying on
RSVP in production. Previous smoke tests received HTTP 401/non-JSON from Apps
Script, so end-to-end RSVP has not been confirmed until retested against the
current deployment.

### Images and music storage

- Vercel Blob is the storage layer; Cloudinary is no longer used.
- Wedding photos and audio are public assets. Do not upload content without
  permission to make it publicly accessible.
- `src/blob-images.ts` selects the latest Blob image for each slot.
- `src/music.ts` reads/writes `wedding/music/playlist.json` and lists MP3 files
  under `wedding/music/tracks/`. If the playlist manifest is absent, existing
  MP3 files are recovered in upload-time order (up to the track limit) and
  enabled by default so an admin can manage them again.
- After an MP3 upload completes, the client explicitly saves the playlist
  manifest. Do not rely on the Blob completion callback as the only manifest
  writer; local callback routing may not work.
- Public endpoints: `GET /api/images`, `GET /api/music`, `GET /api/wishes`.
  Admin endpoints: `GET/POST/PUT/DELETE /api/admin` and
  `GET/POST/DELETE /api/admin-session`; RSVP uses `POST /api/rsvp`.

## Architecture and project map

- **React + TypeScript + Vite**, with `styled-components` and `lucide-react`.
- Multi-page Vite build:
  - `index.html` → `src/main.tsx` → `src/App.tsx`
  - `admin.html` → `src/admin/main.tsx` → `src/admin/AdminApp.tsx`
- Production site is prerendered/static on Vercel. Build script:
  `tsc -b`, Vite client build, Vite SSR build, then `scripts/prerender.mjs`.
- `api/*.ts` are Vercel Node.js Functions. Vite dev/preview serve the site but
  do **not** emulate these APIs.
- Important implementation files:
  - `src/image-slots.ts` — image slot IDs, sizes, and Blob paths.
  - `src/blob-images.ts` — managed image lookup in Blob.
  - `src/music.ts` — playlist manifest and track listing.
  - `src/admin-session.ts`, `api/admin-session.ts` — password verification and
    signed cookie session.
  - `api/admin.ts` — image upload authorization, playlist writes, and deletion.
  - `api/rsvp.ts`, `api/wishes.ts`, `api/music.ts`, `api/images.ts` — public
    integrations.
  - `google-apps-script/Code.gs` — Google Sheets backend.
  - `vercel.json` — clean URLs and admin home rewrite.

Node ESM imports within Vercel Functions must include the emitted `.js`
extension (for example `../src/music.js`). A past production failure was caused
by an extensionless import that Vercel's Node runtime could not resolve.

## Environment and secret handling

Use `.env.example` only as a list of variable names/placeholders. Put real
values in ignored local env files and Vercel Environment Variables:

- `GOOGLE_SCRIPT_APP` — deployed Apps Script `/exec` URL.
- `ADMIN_PASSWORD` — long, unique admin password.
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob read/write token, available to the
  server upload-token handler and Blob SDK.
- `BLOB_STORE_ID` — informational/configuration value for the connected store;
  do not expose credentials to browser code.

Never put credentials in source, docs, client `VITE_` variables, screenshots,
commits, or logs. If a token/password has been shared or committed, revoke or
rotate it and update both local and Vercel environment configuration. A
placeholder in the latest commit does not erase a secret from Git history.
Avoid printing environment values when debugging; check only whether a
variable is present.

## Local development and deployment

```powershell
npm install
npm run dev
```

For admin and API testing, use the Vercel CLI local runtime:

```powershell
npm run dev:vercel
```

This script runs `npx --yes vercel@latest dev`; the CLI is downloaded on first
use, requiring an internet connection and Node.js 20+. The first run may
require linking the checkout to the Vercel project with `vercel link`; pass
`--local` (`npm run dev:vercel -- --local`) to run without linking. Use
`vercel env pull` or configure the required environment variables locally. The
server may start without them, but Blob, RSVP, and admin API calls will report
missing configuration.

`npm run dev` alone cannot exercise `/api/*`; `/admin.html` may be served as
the admin entry in Vite-only mode but its API calls will not work. The
previously observed Windows `EPERM` while creating a symlink in the Vercel CLI
cache is an OS/cache permission issue, not a missing library. Enabling Windows
Developer Mode or running the terminal elevated may help. macOS does not have
that same Windows symlink restriction, but can still encounter Node version,
filesystem permission, network, or Vercel project-link/environment issues.

Validate changes with:

```powershell
npx tsc -b
npm run build
```

If Windows locks an old generated file under `dist`, a local diagnostic build
may use Vite's `--emptyOutDir false`; do not change the production build
behavior solely to work around a transient file lock. Vercel deployment should
use `npm run build` and `dist` as the output directory.

## Known follow-up checks

- After setting current Vercel environment variables and deploying, test the
  admin login, reload `/admin/home`, unauthenticated redirect, image management,
  and playlist reload against the deployed URL.
- Confirm the old Blob read/write token has been rotated if it was exposed
  previously, and ensure the connected Blob store is public (required for the
  current direct public image/audio URLs).
- Run actual RSVP submissions for both attending and declining; verify rows in
  Google Sheets. Test a consented wish and a non-consented message and confirm
  only the former appears publicly. Avoid deleting test data unless agreed.
- Confirm final event timing and venue/map pin before publication. The
  displayed reception timing has previously been provisional.
- The couple considered `hunganhvamyxinh.com` and other name combinations.
  GoDaddy previously showed a first-year promotion requiring a three-year
  purchase; availability and pricing are volatile. No domain purchase or
  final domain selection is recorded here.
- Ensure all music files are appropriately licensed/authorized for use.

## Working agreements for future AI changes

- Read existing implementation and recent diffs before editing; preserve
  unrelated user changes.
- Keep changes focused, follow established patterns, and update this guide when
  an architectural decision or operational flow changes.
- Protect secrets and personal guest data. Public wishes must remain
  consent-based.
- Do not upload/delete production Blob assets or submit test RSVPs without
  explicit user approval.
- For any code change, run the smallest relevant type-check/build and report
  what was and was not validated. Do not claim a production deployment or
  external integration test unless it actually occurred.
