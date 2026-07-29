# Agents.md — Hoflärm Open Air 2026

How to collect and format data for this festival.

## Sources

| Source | URL | What it provides |
|---|---|---|
| Hoflärm website | https://www.hoflaerm.de/ | JSON-LD with all performers, dates, location, FAQ, lineup HTML |
| JSON-LD (embedded) | https://www.hoflaerm.de/ | Structured festival data: performers, dates, location, ticket prices |
| Spotify | https://open.spotify.com/ | Artist links (embedded in lineup HTML) |

## Timetable Extraction

The lineup is rendered in the HTML as `<article class="day">` blocks within `<section class="lineup">`. No image-based timetable — all data is in the DOM as text.

**Workflow:**
1. Extract JSON-LD for the full performer list
2. Parse `<article class="day">` blocks for day assignments and times
3. Each day has bands with `<span class="band-name">` and `<span class="band-time">`
4. Spotify links are embedded in `<a class="band">` elements

## Artist Data Format

Same format as appletree-2026. This festival has a **single main stage** — no stage conflicts.

## Festival Notes

- **Dates**: August 13–15, 2026 (Thursday–Saturday)
- **Location**: Obersalterberger Hof 1, 57577 Marienthal, RLP (50.7430°N, 7.6970°E)
- **Single stage**: No overlaps, no running between acts
- **Camping**: On-site, camp next to car, 0–500m to stage
- **Train**: Bahnhof Kloster Marienthal, walking distance
- **Awareness**: Safer Space policy, team at entrance
- **Tickets**: €145 weekend, €65 day — ticket.io only, no box office
- **Hotels**: Marienthal booked through 2028, try Altenkirchen or Windeck
- **Supermarket**: REWE at Marktzentrum 7, ~3 km
