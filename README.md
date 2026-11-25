# Anh & Xinh — A Little Love Story

A React + TypeScript + Vite wedding invitation website starter.

## Included
- Interactive envelope opening transition
- Wedding cover and live countdown to 14 March 2027
- Love story, wedding details, photo placeholder gallery
- RSVP form with local browser demo storage
- Responsive layouts and pastel retro scrapbook styling

## Run locally

```bash
npm install
npm run dev
```

## Build for Vercel

```bash
npm run build
```

Import this folder/repository into Vercel. Framework preset: Vite. Build command: `npm run build`; output directory: `dist`.

## RSVP integration

Without configuration, RSVP submissions are stored only in the current browser's `localStorage` for demo purposes. They are not sent to the couple.

To connect a Google Apps Script web app or another HTTPS endpoint, create a `.env` file:

```bash
VITE_RSVP_ENDPOINT=https://your-endpoint.example/submit
```

The endpoint receives a JSON POST body:

```json
{
  "name": "Guest name",
  "attendance": "yes",
  "guests": 2,
  "message": "Congratulations!",
  "submittedAt": "2027-01-01T10:00:00.000Z"
}
```

For production, configure the endpoint with appropriate validation, spam protection, and CORS settings. Never put private API keys in `VITE_` variables.

## Before publishing
- Replace the photo placeholder panels with the couple's approved photos.
- Confirm the full street address and map pin for Diamond Place 3. The current map button uses a Google Maps search, not a verified venue pin.
- Confirm guest arrival and reception times; 17:00 and 17:30–21:00 are provisional display values.
- Add the selected background music file and playback behavior if desired; music playback is intentionally not wired to a copyrighted track.
- Add the final domain and test RSVP on mobile.
