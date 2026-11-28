# Anh & Xinh — A Little Love Story

A React + TypeScript + Vite wedding invitation website starter.

## Included
- Interactive envelope opening transition
- Wedding cover and live countdown to 14 March 2027
- Love story, wedding details, photo placeholder gallery
- RSVP form integration with a Google Apps Script web app
- Responsive layouts and pastel retro scrapbook styling

## Run locally

```bash
npm install
npm run dev
```

## Build for Vercel

```bash
npm run build
# In a second terminal:
npm run preview
```

The build produces static HTML with the invitation and styled-components CSS already rendered, then hydrates it in the browser. The envelope is an overlay; the invitation content remains in the initial HTML. `npm run dev` uses Vite's client-rendered dev server while `npm run preview` serves the production-prerendered site.

Import this folder/repository into Vercel. Framework preset: Vite. Build command: `npm run build`; output directory: `dist`. The invitation is static on Vercel's CDN; the image-admin API is a small Node.js Vercel Function.

## RSVP integration

The RSVP form reads the Google Apps Script web app URL from `GOOGLE_SCRIPT_APP` in `.env`. This project already has that variable configured locally. For production, add the same variable to your hosting provider's build environment; do not rely on your local `.env` file being deployed.

```bash
GOOGLE_SCRIPT_APP=https://script.google.com/macros/s/your-deployment-id/exec
```

For a bound Apps Script project (opened from **Extensions → Apps Script** in the destination spreadsheet), use this handler. It creates an `RSVP` tab with headers on the first submission:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const name = String(data.name || "").trim();
    const attendance = data.attendance;
    const guests = attendance === "yes" ? Number(data.guests) : 0;

    if (!name || !["yes", "no"].includes(attendance) ||
        !Number.isInteger(guests) || guests < 0 || guests > 4) {
      throw new Error("Invalid RSVP data");
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("RSVP") || spreadsheet.insertSheet("RSVP");
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Name", "Attendance", "Guests", "Message", "Submitted at"]);
    }

    const safeText = value => {
      const text = String(value || "");
      return /^[=+\-@]/.test(text) ? "'" + text : text;
    };
    sheet.appendRow([
      safeText(name),
      attendance,
      guests,
      safeText(data.message),
      safeText(data.submittedAt || new Date().toISOString()),
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error(error);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

Deploy or update the web app with **Execute as: Me** and access set to **Anyone**, then set its `/exec` URL as `GOOGLE_SCRIPT_APP`. The browser sends JSON as `text/plain` in `no-cors` mode so Apps Script can accept the cross-origin POST without a preflight request. Browsers do not expose the Apps Script response in this mode, so the form can confirm that the request was sent but cannot verify that the row was written; check the `RSVP` tab when testing.

The endpoint receives:

```json
{
  "name": "Guest name",
  "attendance": "yes",
  "guests": 2,
  "message": "Congratulations!",
  "submittedAt": "2027-01-01T10:00:00.000Z"
}
```

For production, configure the endpoint with appropriate validation and spam protection. Never put private API keys in `VITE_` variables.

## Image management

Create a **public Vercel Blob store** connected to this Vercel project. Enable **Add a read-write token env var to this connection**, and include Production, Preview, and Development environments as needed. Public access is intentional: the wedding invitation photos are delivered to every visitor by URL.

Visit `/admin` to replace the six invitation image slots. Each slot shows a recommended pixel size and aspect ratio. Select an image or drag it onto its preview frame; valid images are previewed immediately and centered/cropped to fit. The browser converts images to WebP and scales them down to the slot's recommended maximum dimensions before uploading, while preserving the original aspect ratio. The website lazy-loads images below the hero. Blob delivers the optimized WebP as stored, without on-the-fly responsive image transformations; usage is subject to [Vercel Blob pricing](https://vercel.com/docs/vercel-blob#pricing).

Configure these variables in Vercel **Production** (and Preview/Development if needed):

- `BLOB_READ_WRITE_TOKEN`: added when connecting the Blob store with the read-write token option. It is required for authenticated browser uploads.
- `ADMIN_PASSWORD`: a long, unique password used to authorize image management.

`CLOUDINARY_URL` is no longer used and can be removed from the Vercel project after switching. For local development, connect the Blob store to the **Development** environment, then run `vercel env pull` to populate local variables. Use `.env.example` as a reference, but never commit real environment values.

For local admin/API testing, use the Vercel CLI so the `/api/admin` function is available:

```bash
npm run dev:vercel
```

This script runs `npx --yes vercel@latest dev`; the CLI is downloaded on first use, so an internet connection and Node.js 20+ are required. The first run may ask you to link this checkout to a Vercel project; use `vercel link` if needed. To run without linking, use `npm run dev:vercel -- --local`. Pull local environment variables with `vercel env pull` or configure the required variables locally. Without them, the site can start but APIs that depend on Blob, RSVP, or the admin password will return configuration errors.

`npm run dev` and `npm run preview` run the Vite website only; they do not emulate Vercel Functions. The admin HTML is a separate Vite entry and is served at `/admin.html` in those modes.

The Windows `EPERM` symlink error previously observed is an OS/cache permission issue, not a missing project library. On Windows, enabling **Developer Mode** in **Settings → System → For developers** or running the terminal elevated may help. That specific symlink restriction is Windows-related; macOS should not encounter the same Windows permission issue, although Node version, filesystem permissions, network, or Vercel project-link/environment problems can still prevent startup.

Implementation references:
- [Vercel Blob client uploads](https://vercel.com/docs/vercel-blob/client-upload)
- [Vercel Blob SDK](https://vercel.com/docs/vercel-blob/using-blob-sdk)
- [Vercel Blob public and private storage](https://vercel.com/docs/vercel-blob#private-and-public-storage)
- [Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel clean URLs](https://vercel.com/docs/project-configuration/vercel-json#cleanurls)

## Before publishing
- Replace the photo placeholder panels at `/admin` with the couple's approved photos.
- Confirm the full street address and map pin for Diamond Place 3. The current map button uses a Google Maps search, not a verified venue pin.
- Confirm guest arrival and reception times; 17:00 and 17:30–21:00 are provisional display values.
- Add the selected background music file and playback behavior if desired; music playback is intentionally not wired to a copyrighted track.
- Add the final domain and test RSVP on mobile.
