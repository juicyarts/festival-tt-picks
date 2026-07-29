# AGENTS.md — Festival TT Picks

Common patterns and workflows for maintaining this festival companion app. See each festival's own `Agents.md` for festival-specific sources and notes.

## Architecture

```
festival-tt-picks/
├── index.html          # SPA: listing → tabbed festival views
├── sw.js               # Service worker (network-first, cache fallback)
├── manifest.json       # PWA manifest
├── pages.json          # Registry of all festivals
├── server.js           # Local dev server (node server.js)
├── AGENTS.md           # This file — common patterns
├── {festival-slug}/
│   ├── schedule.md     # Timetable / artist picks
│   ├── notifications.md # Awareness, warnings, info
│   ├── Agents.md       # Festival-specific data sources & notes
│   └── assets/         # Maps, images (PNG, cached offline)
└── scripts/
    └── screenshot-map.js  # Generates supermarket map screenshots
```

## Adding a New Festival

1. Create a directory: `{slug}/` (e.g. `hoflaerm-2026/`)
2. Create `schedule.md` with the timetable (see format below)
3. Create `notifications.md` with awareness/info blocks
4. Create `Agents.md` with festival-specific sources
5. Add entry to `pages.json`:
   ```json
   { "slug": "slug", "title": "Name", "date": "Dates", "file": "slug/schedule.md", "map": "slug/assets/map.png" }
   ```
   Set `"map": ""` if no festival grounds map exists.
6. If the festival has location-specific content, add a branch in `buildLocationsPanel()` in `index.html`
7. Commit & push — GitHub Actions deploys automatically

## Common Data Format

### schedule.md

```markdown
# Festival Name — Subtitle

> Dates &nbsp;|&nbsp; meta info

## Day Name (Date)

| Artist | Time | Stage | Rating | Genre | Summary |
|---|---|---|---|---|---|
| [Artist](spotify-link) | HH:MM–HH:MM | Stage | ++ / + / — | Genre | One-line bio summary |
```

- Days must start with English day names (`## Thursday`, `## Friday`, etc.) for auto-scroll-to-now
- Format times as `HH:MM–HH:MM`
- Rate bands: `++` (don't miss), `+` (priority), `—` (unrated)
- Sort rows by start time within each day

### notifications.md

```markdown
## 🚨 Awareness
- Urgent/awareness items first

## ⚠️ Warnings
- Safety/time-sensitive warnings

## ℹ️ Info
- General info and feature announcements
```

- **Emergency/awareness always at the top**
- Each `##` heading + its list items = one notification block
- Add new notifications as new blocks, don't append to existing ones

### Sources

Always verify against the official festival website. For each festival, document:
- Website URL
- Timetable source (HTML, JSON-LD, image/PDF)
- Artist detail pages
- Location/supermarket data

## Notification Workflow

1. User opens a GitHub Issue requesting a notification
2. Agent edits `{slug}/notifications.md` — adds a new block under the correct category
3. Emergency/warnings always stay above info blocks
4. Commit & push → GitHub Actions redeploys

## Code Generalization

When adding new festivals, prefer adding data over adding code:
- New festival locations go in `buildLocationsPanel()` as `else if (slug === '...')` branches
- Festival cards in `pages.json` drive the listing page
- The `scrollToNow()` function works for any festival with English day headings

Avoid hardcoding festival-specific logic in shared components unless necessary.
