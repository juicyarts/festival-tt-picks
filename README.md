# Festival TT Picks

Personal festival schedule picks, rendered as a mobile-friendly PWA.

🌐 **Live**: [juicyarts.github.io/festival-tt-picks](https://juicyarts.github.io/festival-tt-picks/)

## View Locally

Any static file server works. Quickest options:

```bash
# Python 3 (built-in)
python3 -m http.server 8080

# Node.js (npx, no install)
npx serve .

# PHP (built-in)
php -S localhost:8080
```

Open http://localhost:8080 on your phone (same WiFi) or in desktop Chrome's mobile device mode.

For full PWA testing (service worker) use `npx serve .` — `http.server` may not register the SW properly on localhost.

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
