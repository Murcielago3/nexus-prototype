# Fonts

## Milker (primary display)

`Milker` is a **commercial** typeface and is deliberately not vendored in this
repo, because shipping it would be a licence violation.

To activate it, drop the licensed file here:

```
public/fonts/Milker.woff2      <- preferred
public/fonts/Milker.woff
public/fonts/Milker.otf
```

The `@font-face` rule in `src/index.css` already points at all three paths, so
the app picks it up on the next reload with no code change.

**Until then** the display stack falls through to **Anton** (Google Fonts, loaded
in `index.html`), a heavy condensed grotesque picked so that every headline
keeps its intended mass and the layout does not reflow when Milker arrives.

## The rest of the stack

| Role | Family | Source |
|---|---|---|
| Display / primary | Milker → Anton | local drop-in / Google Fonts |
| Luxury serif | Cormorant Garamond | Google Fonts |
| Telemetry / numerals | JetBrains Mono | Google Fonts |
