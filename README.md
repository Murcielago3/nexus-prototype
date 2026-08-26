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
| Luxury serif | Cormorant Garamond |
| Telemetry and numerals | JetBrains Mono |

Milker is commercial and is not vendored here. Drop the licensed file into
`public/fonts/` and it is picked up with no code change. See
`public/fonts/README.md`.

## Motion

- **Lenis** drives inertial scrolling site wide, and is deliberately disabled on
  the War Room so an operator lands exactly where they let go.
- **Framer Motion** handles the reveals, parallax and layout transitions.
- `src/components/bits/` holds the React Bits style primitives: `SplitText`,
  `DecryptedText`, `ShinyText`, `CountUp`, `ScrollReveal`, `Aurora`, `Particles`,
  `SpotlightCard`, `TiltCard`, `Magnet`, `Parallax`, `Marquee`.
- Everything respects `prefers-reduced-motion`.

## Stack

React 19, TypeScript, Vite 8, Tailwind 4, Framer Motion, Lenis, cobe, lucide.
