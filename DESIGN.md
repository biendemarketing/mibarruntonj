---
name: Mi Barrunto — Carta
description: A one-file bilingual menu for a Peruvian criollo table, built as an open painted retablo box.
colors:
  retablo-red: "#d6280f"
  field-red: "#8e1d0b"
  deep-red: "#a9210f"
  painted-wood: "#6b4426"
  light-wood: "#8a5a33"
  gold-leaf: "#c89532"
  lit-gold: "#e6c168"
  lime-plaster: "#f6ecd9"
  plaster-shadow: "#ece0c6"
  andean-green: "#2f4a3a"
  ink: "#3a2414"
  gloss-ink: "#6b4a38"
  night-field: "#1d0d09"
  night-plaster: "#e6d5b0"
typography:
  display:
    fontFamily: "Grandstander, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 11vw, 3.9rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "normal"
  headline:
    fontFamily: "Grandstander, system-ui, sans-serif"
    fontSize: "1.32rem (1.5rem at 900px+)"
    fontWeight: 800
    lineHeight: 1.5
    letterSpacing: "0.05em"
  title:
    fontFamily: "Grandstander, system-ui, sans-serif"
    fontSize: "1rem (1.05rem at 900px+)"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Alegreya Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Grandstander, system-ui, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.04em"
rounded:
  pill: "999px"
  plate: "18px"
  niche: "16px"
  spine: "14px"
  ticket: "6px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "14px"
  lg: "18px"
  page: "clamp(8px, 2.5vw, 26px)"
components:
  price-pill:
    backgroundColor: "{colors.retablo-red}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "0.16rem 0.65rem"
    typography: "{typography.label}"
  chip-index:
    backgroundColor: "transparent"
    textColor: "{colors.lime-plaster}"
    rounded: "{rounded.pill}"
    padding: "0.4rem 0.8rem"
    typography: "{typography.label}"
  chip-index-active:
    backgroundColor: "{colors.lit-gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.4rem 0.8rem"
  toggle-night:
    backgroundColor: "{colors.lit-gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.42rem 0.95rem"
  niche-plate:
    backgroundColor: "{colors.lime-plaster}"
    rounded: "{rounded.niche}"
    padding: "14px 14px 10px"
  ticket-origin:
    backgroundColor: "transparent"
    textColor: "{colors.andean-green}"
    rounded: "{rounded.ticket}"
    padding: "0.14rem 0.5rem"
---

# Design System: Mi Barrunto — Carta

## Overview

**Creative North Star: "El Retablo Abierto"**

The page is an open Ayacucho retablo box: a painted wooden frame whose lid folds to two plank doors, gold fillets drawing every niche, and the whole criollo carta shelved inside as 13 painted niches. Nothing floats over the page or hovers above the frame — every element lives inside the box, the way a figurine lives in a niche. The material is paint: flat field colors, zigzag painted ribbon, gold leaf used as trim and rings, wooden planks rendered as stripes.

The system reads at two registers of light. Day is lime plaster inside a red frame; night is the same box by candle and oil lamp — the whole palette swaps through five variables, never per-element restyling. Type is carved, not typeset: Grandstander, a fat informal display with round terminals, carries the lettering on the box; Alegreya Sans, quiet and humanist, carries what the box explains, with English always as an italic gloss.

Density is that of a real menu held at arm's length: name, gloss, price on one line each, divided by dashed pencil rules, prices ringed in gold. The page adds no imagery — no photography and no illustration exist and none is invented; the box, the ribbon, the doors, the medallion carry the surface.

**Key Characteristics:**
- One painted box; sections are niches, never floating cards
- Gold appears as fillet, ring and ribbon — never as a field above tint scale
- Two light registers (day plaster / candlelit night) swapped by variables
- Prices are the only pills; every price is a gold-ringed red pill
- One authored motion moment (the two-beat door reveal); everything else yields
- Bilingual by contrast: Spanish leads, English whispers in italic

## Colors

A red-box palette of painted surfaces, wood and gold, with cream plaster carrying all reading.

### Primary
- **Retablo Red** (#d6280f): the box red, an intense vermilion. Price pills, ribbon stripes, the toggle's pressed state. Never body text.
- **Deep Red** (#a9210f): darkened box red for headings and the index spine plate; the "carved" value, still on the red axis.
- **Field Red** (#8e1d0b): the page ground behind the box, a deep saturated turn of the same red so the box reads as lifted, not pasted.

### Secondary
- **Painted Wood** (#6b4426): door planks, family headings (h3) and their tracking — the structural material that is not gold and not paper. **Light Wood** (#8a5a33) is its lit stripe partner in plank stripes and niche borders.

### Tertiary
- **Gold Leaf** (#c89532): fillets, rings, ribbon, the sun medallion. Line-weight metal only.
- **Lit Gold** (#e6c168): gold at flame distance — active chip, night toggle, the title's offset block shadow. Reserved for state and the title alone.

### Neutral
- **Lime Plaster** (#f6ecd9): every niche field and all reading surfaces; the menu is printed on this.
- **Plaster Shadow** (#ece0c6): dish-row hover wash; the plaster with the lamp moved away.
- **Ink** (#3a2414): names and heading ink.
- **Gloss Ink** (#6b4a38): English glosses, captions, credits — the whisper tone.
- **Andean Green** (#2f4a3a): notes and origin tickets; the voice of the kitchen talking about the dish.
- **Night Field** (#1d0d09) / **Night Plaster** (#e6d5b0): the night register's ground and paper; the candlelit swap of the same box.

### Named Rules
**The Painted Register Rule.** There are exactly two color registers, day and night, and they swap as a set through the palette variables. No element may be restyled for night on its own.

**The Gold Is Trim Rule.** Gold renders as fillet, 2–4px ring, ribbon stripe or medallion. A gold field larger than a chip is forbidden; lit gold belongs to state, not decoration.

## Typography

**Display Font:** Grandstander (embedded latin woff2, self-hosted; with system-ui fallback)
**Body Font:** Alegreya Sans 400 with 400 italic (embedded latin woff2, self-hosted; with system-ui fallback)

**Character:** A fat rounded sign-painter display over a calm humanist text face: the box shouts its name and explains dinner quietly. The contrast carries the bilingual system — Spanish in carved display, English in italic body ink.

### Hierarchy
- **Display** (800, `clamp(2.6rem, 11vw, 3.9rem)`, 1): the restaurant name only, with a flat 3px lit-gold block shadow to its lower right; the one heading allowed to be shout-size.
- **Headline** (800, 1.32rem / 1.5rem desktop, 1.5): section names in uppercase with 0.05em tracking, deep red; the English section gloss follows inline in body italic.
- **Title** (600, 1rem / 1.05rem desktop, 1.35): dish names, ink color; never uppercase, never tracked.
- **Body** (400, 1rem, 1.5): English glosses and prose, gloss ink; glosses cap near 62ch.
- **Label** (600, 0.78rem, 1.5, 0.04em): index chips, price pills, the night toggle — the only tracked-and-small voice, always at control size.

### Named Rules
**The Italic Gloss Rule.** English is always Alegreya Sans italic in gloss ink; it is never display, never uppercase, never the same tone as its Spanish name.

**The Carved At Size Rule.** Grandstander is uppercase and tracked only at label and headline sizes; dish titles run mixed case untracked, so the display face never becomes a texture.

## Layout

One street through one box. The `.marco` (18px radius, max-width ~1040–1080px) holds: painted head (doors, banner, ribbon), a control strip, then the corridor — a single vertical run of 13 niches separated by 18px of red ground. Body padding is `clamp(8px, 2.5vw, 26px)`; niches are inset plates (16px radius, 14–20px internal padding, `scroll-margin-top: 74px`).

At 900px and up the corridor gains a second lane: a 196px sticky index spine (14px radius plate, deep red, gold border) at the left, and all chips become left-aligned rows inside it. Below 900px the index collapses into a sticky hamburger button pinned under the banner; tapping it opens a two-column dropdown panel of sections that overlays the corridor and closes on selection. Density stays menu-real: dish rows are 0.5rem vertical padding with a dashed 1px rule (`rgba(107,68,38,.32)`) between dishes, never between name and gloss.

## Elevation & Depth

Depth is painted, not lit: nested frames and inset fillets do the structural work, and the only drop shadows are neutral black alphas with blur — no colored glow anywhere. The box lifts off the field red with one large soft shadow; niches and the spine sit inside it with small soft shadows; the doors swing with perspective rather than shadow.

### Shadow Vocabulary
- **Box Lift** (`0 12px 30px rgba(0,0,0,.45)`, plus inset gold/red fillets): the whole retablo against the field red.
- **Plate Rest** (`0 4px 10px rgba(0,0,0,.22)`, plus 2px inset gold fillet): each niche and the index spine.
- **Pill Hover** (`0 3px 6px rgba(0,0,0,.25)` with `translateY(-1px)`): the only hover elevation; price pills lift as if fingered.
- **Medallion** (`inset 0 -9px 0 rgba(0,0,0,.14), 0 4px 10px rgba(0,0,0,.25)`): the closing sun.

### Named Rules
**The Painted Box Rule.** Nested frames — niche inside corridor inside box — are the depth system. Flattening any level (dropping a fillet, merging two plates) breaks the retablo and is a defect, not a simplification.

**The Neutral Shadow Rule.** Every drop shadow is black-alpha, offset and blurred. A chromatic glow, a zero-offset halo, or a hard offset shadow is refused by the world.

## Shapes

Corner language is soft and hand-built: pills (999px) for everything the hand touches — prices, chips, the toggle; plates at 12–18px radius (marco 18, niche 16, spine 14) for everything the eye reads. The origin ticket is the single 6px-radius shape, dashed-green like a torn receipt. Recurring geometry: the 45°-rotated square (door diamonds, medallion core) and the zigzag ribbon — `repeating-linear-gradient` stripes standing for painted cloth — which appears as the tricolor cinta and as the shelf rule under every section name, and nowhere else wholesale.

### Named Rules
**The Ribbon Rule.** Painted stripes exist only as ribbon: the cinta, the shelf rules, the plank surface of the doors. Stripes used as a background fill for content areas are a violation of the material.

## Components

### Buttons
- **Shape:** full pill (999px), 2px painted-wood border.
- **Primary (night toggle):** lit-gold field, ink label ("Luz de noche / night light"), padding 0.42rem 0.95rem, Grandstander 700 at 0.8rem.
- **States:** hover deepens to gold leaf; pressed (`aria-pressed="true"`) flips to retablo-red with gold border and plaster text, matching its function.
- **Focus:** 3px lit-gold outline with a dark 6px halo for contrast on any surface.

### Chips (index)
- **Style:** transparent on the spine, plaster text, Grandstander 600 at 0.78rem, pill shape; mobile strip is the same chip on deep red.
- **States:** active chip is a lit-gold pill with ink text; the next unvisited section chip pulses in lit gold at 1.5s ease-in-out until reached (reduced motion disables the pulse); hover draws a gold border.

### Cards / Containers (niches)
- **Corner Style:** 16px.
- **Background:** lime plaster.
- **Shadow Strategy:** Plate Rest (see Elevation & Depth).
- **Border:** 3px light-wood with a 2px inset gold fillet (the niche moulding).
- **Internal Padding:** 14px mobile, 18–20px desktop; section head is title + inline English gloss + tricolor shelf rule.

### Navigation
The index is the map of the box: chips in notebook order, sticky at all sizes. On desktop it is the spine plate; on mobile a hamburger button (bars morph to an X) reveals a two-column dropdown of the same chips, overlaying the corridor without shifting it. Selecting a section closes the panel and scrolls smoothly to the niche.

### Signature Components
- **Painted doors:** two plank panels with gold diamond handles; they open once, in two staggered beats (0.9s, second door delayed 160ms, perspective rotateX), then stay put — legible at rest.
- **Dish row:** name (Title) / English gloss (Body italic) / dashed rule / gold-ringed red price pill with tabular numerals — the atomic unit of all 239 entries.
- **Origin ticket:** dashed green "Cuaderno p. N" tag on every section, naming its source pages in the house notebook.
- **Sun medallion:** painted closing mark — gold circle, dashed inner ring, red core — the box's painted full stop.

## Do's and Don'ts

### Do:
- **Do** keep every price a retablo-red pill with a 2px gold ring and tabular numerals.
- **Do** write English as Alegreya italic in gloss ink, following its Spanish name.
- **Do** keep the nested frames intact (niche in corridor in box) and the 0.5rem dashed dish rhythm.
- **Do** swap day/night only through the palette register, and honor `prefers-reduced-motion` by stilling the doors, the pulse and smooth scrolling.
- **Do** name each section's notebook origin with a green ticket.

### Don't:
- **Don't** add photography, illustration or texture images; the material is CSS paint only.
- **Don't** add kickers or eyebrow labels above headings, gradient text, or glyph icons — refused by the craft floor.
- **Don't** use colored glows, zero-offset halos or hard offset shadows; shadows are neutral, offset and blurred.
- **Don't** give gold a field larger than a chip, or let lit gold escape state duty.
- **Don't** uppercase or track dish names; carving is for the box's labels, not the food's names.
