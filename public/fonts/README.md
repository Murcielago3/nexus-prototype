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

## Role Model (luxury serif)

`Role Model` by Ef Studio is **free for personal use only**, so it is not
vendored here either. Drop the licensed files in:

```
public/fonts/RoleModel.woff2           <- preferred
public/fonts/RoleModel.woff
public/fonts/RoleModel.otf
public/fonts/RoleModel-Oblique.woff2   <- picked up as the italic
public/fonts/RoleModel-Oblique.otf
```

**Until then** the serif stack falls through to **Bodoni Moda** (Google Fonts),
a high contrast modern serif in the same register: the same fashion and luxury
feel, and a variable optical size axis so it does not go spindly at small sizes.

Note that Role Model ships an *oblique*, not a true italic. The `@font-face`
above maps it to `font-style: italic` so every existing italic in the app picks
it up without markup changes.

## The rest of the stack

| Role | Family | Source |
|---|---|---|
| Display / primary | Milker → Anton | local drop-in / Google Fonts |
| Luxury serif | Role Model → Bodoni Moda | local drop-in / Google Fonts |
| Telemetry / numerals | JetBrains Mono | Google Fonts |
