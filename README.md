# Achja?!

Personal festival schedule picks, rendered as a mobile-friendly PWA.

🌐 **Live**: [juicyarts.github.io/festival-tt-picks](https://juicyarts.github.io/festival-tt-picks/)

## View Locally

```bash
node server.js
```

Open **http://localhost:8080** — use Chrome's device toolbar (Cmd+Shift+M) for mobile preview.

To test on your phone: connect to the same WiFi, then open `http://<your-mac-lan-ip>:8080` (find your IP with `ipconfig getifaddr en0`).

The service worker registers correctly on localhost, so offline mode works in local dev too.

## Add a Festival

1. Create a folder: `festival-name/schedule.md`
2. Add an entry to `pages.json`:

```json
{
  "slug": "festival-name",
  "title": "Festival Name",
  "date": "Month YYYY",
  "file": "festival-name/schedule.md"
}
```

## Install as App

- **iOS Safari**: Tap Share → "Add to Home Screen"
- **Android Chrome**: Menu → "Add to Home Screen"

Works fully offline after first visit.
