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

The build produces static HTML with the invitation and styled-components CSS already rendered, then hydrates it in the browser. The envelope is an overlay; the invitation content remains in the initial HTML. `npm run dev` uses client rendering while `npm run preview` serves the production prerendered output.

Import this folder/repository into Vercel. Framework preset: Vite. Build command: `npm run build`; output directory: `dist`. This uses Vercel's static CDN and does not add a server runtime.

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

## Before publishing
- Replace the photo placeholder panels with the couple's approved photos.
- Confirm the full street address and map pin for Diamond Place 3. The current map button uses a Google Maps search, not a verified venue pin.
- Confirm guest arrival and reception times; 17:00 and 17:30–21:00 are provisional display values.
- Add the selected background music file and playback behavior if desired; music playback is intentionally not wired to a copyrighted track.
- Add the final domain and test RSVP on mobile.
