# NEXUS

Frontend prototype for **NEXUS**, an intelligent event orchestration platform.
Built for the Mega-Event Hospitality Orchestration problem statement.

> From reactive firefighting to proactive orchestration.

## What this is

This repo is **frontend only**. Every screen is complete and demo ready, and the
data it renders is mocked so the UI can be driven without a server. The real
scoring, forecasting and recommendation logic belongs in the backend.

## Routes

| Route | Screen | Who it is for |
|---|---|---|
| `/` | Overture | The landing page. Interactive globe, parallax, the pitch. |
| `/war-room` | War Room | Organisers and city ops. Dense console, pressure plate, forecast, dispatch queue. |
| `/guide` | Smart Guide | Visitors. One question on screen, always with its reason. |

## Running it

```bash
npm install
npm run dev
```

## Plugging in the real backend

Every component reads the shapes defined in `src/data/types.ts`. Nothing else.

`src/data/mock.ts` exposes the four functions the UI calls:

```ts
getSnapshot(clock, relief)       // zones, pressures, forecasts, links, totals
getForecast(zoneId, clock)       // 120 minute projection + prediction chain
buildIntervention(zoneId, clock) // ranked relief targets + nudge copy
getRecommendations(clock)        // the visitor facing list
```

To go live, replace those four bodies with `fetch` calls and delete the rest of
the file. `src/hooks/useSimClock.ts` holds the demo clock and the local `relief`
state, both of which disappear once the server owns them.

If the backend response shape and `types.ts` ever disagree, `types.ts` wins.
Regenerate the server models from it, not the other way round.

## Design

**Palette** is locked to five colours. The only additions are tints of the
lightest swatch used as paper and card grounds.

| Token | Hex | Role |
|---|---|---|
| `ember-900` | `#4a0d02` | deepest maroon, the calm band |
| `ember-700` | `#a61304` | critical |
| `ember-500` | `#e85d10` | primary accent, warning |
| `ember-400` | `#f9843f` | watch, fills |
| `ember-100` | `#fbdbbb` | raised surfaces |

The band scale reads as an inversion on purpose: on paper the dark maroon is the
calm state and the bright oranges are alarm.

**Type**

| Role | Family |
|---|---|
| Display | Milker, falling back to Anton |
| Luxury serif | Role Model, falling back to Bodoni Moda |
| Telemetry and numerals | JetBrains Mono |

Role Model and Bodoni Moda both carry a healthy x-height, so the serif sizes
here are ordinary numbers. They were much larger while the serif was Cormorant,
which sets very small for its declared size. If the serif is ever swapped again,
re-check the scale rather than assuming it carries over.

The landing page runs on the serif. Both dashboards default to the mono, which
is the right voice for a console and keeps dense small text legible.

Neither Milker nor Role Model is vendored here: Milker is commercial and Role
Model is free for personal use only. Drop the licensed files into
`public/fonts/` and they are picked up with no code change. See
`public/fonts/README.md`.

## Motion

- **Lenis** drives inertial scrolling site wide, and is deliberately disabled on
  the War Room so an operator lands exactly where they let go. Two things break
  it silently: any `scroll-behavior: smooth` in CSS, and forgetting to import
  `lenis/dist/lenis.css`. Both are handled, do not reintroduce either.
- **Framer Motion** handles the reveals, parallax and layout transitions.
- `src/components/bits/` holds the React Bits style primitives: `SplitText`,
  `DecryptedText`, `ShinyText`, `CountUp`, `ScrollReveal`, `Aurora`, `Particles`,
  `SpotlightCard`, `TiltCard`, `Magnet`, `Parallax`, `Marquee`.
- Everything respects `prefers-reduced-motion`.

## Stack

React 19, TypeScript, Vite 8, Tailwind 4, Framer Motion, Lenis, cobe, lucide.

## Guided tour

`src/tour/` holds a 25 step walkthrough aimed at someone who has never heard of
NEXUS and is about to judge it. It runs across all three pages.

- `steps.ts` is the script and the only file to edit for wording. Each step
  names a `route`, an optional `target`, and an optional `act` that puts the
  app into the state the point needs.
- `TourProvider.tsx` owns position, navigates the router, and drives the
  simulation through a small `TourControls` surface.
- `TourOverlay.tsx` draws the dim, the spotlight and the callout.

Steps anchor to `data-tour="..."` attributes on real elements. If you rename or
move one of those, the step falls back to a centred card rather than breaking,
so check the anchors after refactoring a page. There is a source level check:

```bash
node -e "const fs=require('fs');const t=[...fs.readFileSync('src/tour/steps.ts','utf8').matchAll(/target: '([^']+)'/g)].map(m=>m[1]);const all=['src/pages/Overture.tsx','src/pages/WarRoom.tsx','src/pages/SmartGuide.tsx','src/components/Nav.tsx'].map(f=>fs.readFileSync(f,'utf8')).join('');const miss=[...new Set(t)].filter(x=>!all.includes('\"'+x+'\"'));console.log(miss.length?'MISSING: '+miss:'all anchors present')"
```

Three steps target the War Room alert card, which only exists once the clock
reaches the critical moment. Those steps seek the clock in `act` first. Do not
reorder them ahead of the seek.

The tour auto starts once per browser on the first visit to `/`, tracked in
`localStorage` under `nexus.tour.seen`. The nav button restarts it any time.

