# Agents.md — Appletree Garden 2026

How to collect and format data for this festival schedule.

## Sources

| Source | URL | What it provides |
|---|---|---|
| Appletree Garden website | https://appletreegarden.de/ | Artist lineup, timetable (PNG/PDF), descriptions, lineup page |
| Line-up 2026 page | https://appletreegarden.de/line-up-2026/ | Full artist listing with links to detail pages |
| Program / Timetable | https://appletreegarden.de/programm/ | Timetable as PNG image + PDF download |
| Artist detail pages | `https://appletreegarden.de/artist/{slug}/` | Artist bio, social links, genre hints |
| Spotify | https://open.spotify.com/ | Artist links, genre verification |
| MusicBrainz | https://musicbrainz.org/ | Genre and artist metadata |
| Wikipedia | https://wikipedia.org/ | Artist background, genre |

## Timetable Extraction

The official timetable is published as a **PNG image** (and PDF) on the program page. Text cannot be extracted programmatically — it requires manual transcription.

**Workflow:**
1. Open https://appletreegarden.de/programm/
2. Download the timetable image / PDF
3. Manually transcribe artist names, times, and stages into the markdown table
4. Verify against the line-up page for artist links

## Artist Data Format

Each table row follows this structure:

```markdown
| Artist | Time | Stage | Rating | Genre | Summary |
|---|---|---|---|---|---|
| [Artist Name](spotify-link) | HH:MM–HH:MM | Stage Name | ++ / + / — | Genre / Genre | One-line summary from official bio |
```

### Fields

- **Artist**: Linked to Spotify (or SoundCloud if no Spotify). Unlinked if no streaming profile found.
- **Time**: Start–end from the timetable. DJ/headliner sets typically 60–90 min, live acts ~45 min.
- **Stage**: Keep original German stage names:
  - `Große Bühne`, `Tiefes Holz`, `Wald Bühne`, `Zirkus Zelt`, `Oase`, `Glitzer Salon`
  - `?` = unknown (check timetable)
- **Rating**:
  - `++` = don't miss
  - `+` = priority
  - `—` = unrated / skip
- **Genre**: Concise, from official bio + MusicBrainz/Wikipedia cross-reference.
- **Summary**: One sentence describing the artist's sound and origin, sourced from the official bio on appletreegarden.de, translated to English.

### Adding a New Artist

1. Find the artist on https://appletreegarden.de/line-up-2026/
2. Open their detail page for bio text (in German, translate to English)
3. Find their Spotify profile (often linked on the detail page or search manually)
4. Find their time slot in the timetable image
5. Add row to the correct day's table in `schedule.md`

## Schedule HTML Page

The schedule is rendered by `index.html` via:
- `pages.json` maps `appletree-2026` slug → `appletree-2026/schedule.md`
- Client-side markdown parser converts `.md` to HTML on the fly
- Tables become card layout on mobile (<520px)

## Notifications

Notifications are stored in `notifications.md` alongside `schedule.md`. They are rendered in the **Notifications** tab of the app.

### Format

```markdown
## ℹ️ Info
- Info notification text

## ⚠️ Warnings
- Warning notification text

## 🚨 Emergency / Awareness
- Urgent notification text
```

Supported categories (use `##` headings):
- `## ℹ️ Info` — general information
- `## ⚠️ Warnings` — things to be careful about
- `## 🚨 Emergency` or `## 🚨 Awareness` — urgent/awareness info

Each notification is a markdown list item (`- text`). Links and **bold** are supported.

### Adding Notifications

Notifications are requested via **GitHub Issues** on the repo. To add one:

1. A user opens an issue describing the notification
2. An agent edits `notifications.md` and adds the entry under the appropriate category
3. The agent commits and pushes — GitHub Actions redeploys the site automatically

### Factual Sources

Always verify notification facts against the official festival info page:
- https://appletreegarden.de/infos/ (general info, awareness, accessibility, cashless)
- https://appletreegarden.de/programm/ (timetable changes)

Only include information that is confirmed on the official site. Mark speculative or user-reported info clearly.

## Notes

- **bangerfabrique**: Hamburg German rap collective, Saturday night 01:00–02:00, Zirkus Zelt.
- **Awareness team**: purple vests, 24h phone **0152 03566598**, also via security/bars/awareness stand
- **Cashless**: wristband payment only, top up at https://appletreegarden.de/cashless/
- Festival dates for 2026: July 30 – August 1 (Thursday–Saturday).
- The festival takes a break year in 2027 (25th anniversary in 2026).
