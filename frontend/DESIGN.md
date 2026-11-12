# NutriBook design reference

NutriBook keeps the structure of the challenge's reference image and renders it in a bold, mostly monochrome style: ink-black actions, white cards with hairline borders, heavy display headings, and one green accent. This document is the source of truth for the frontend's look. The tokens live in `src/app/theme.css`, and `src/app/globals.css` maps them onto the shadcn/ui roles.

## Relation to the reference image

The layout and the content of each region follow the reference. The colours and the type do not.

| Region | Reference image | NutriBook |
|--------|-----------------|-----------|
| Header and search band | Green gradient, white logo and link | Same structure on an ink band |
| Search form | Two white inputs and an orange Search button | Two white inputs and a green Search button |
| Result card | Avatar, tag, green name, title and licence, location, service and price, two stacked buttons on the right | Same regions; the name is ink, and every service is listed with its price instead of sitting behind a dropdown |
| Card buttons | Peach "Schedule appointment", mint "Website" | Ink "Schedule appointment", outlined "Personal page" |
| Pagination | Numbered, left-aligned, mint active page | Numbered, left-aligned, ink active page |
| Pending requests | Grid of cards with avatar, name, date, time, and an "Answer request" footer | Same grid; the footer holds the Accept and Reject actions |

The reference puts white text on green and green text on white. Both are about 2.65:1, below the 4.5:1 that body text needs, which is one reason the green is limited to fills with ink text on them.

## Colour

| Token | Value | Use |
|-------|-------|-----|
| `--color-ink` | `#111111` | Text, primary actions, the header band, the active page |
| `--color-graphite` | `#4b5563` | Supporting text |
| `--color-line` | `#e5e7eb` | Card borders and dividers (decorative) |
| `--color-line-strong` | `#8a8f98` | Input and outline-button borders |
| `--color-wash` | `#f3f4f6` | Hover and muted surfaces |
| `--color-canvas` | `#f9f9fa` | Page background, sampled from the reference |
| `--color-brand` | `#1ab394` | The Search button, the logo mark, the success icon |
| `--color-brand-hover` | `#47baac` | Hover on a brand fill |
| `--color-brand-soft` | `#ddf9ef` | Tag background, sampled from the reference |
| `--color-brand-ink` | `#0b5e4d` | Text on `brand-soft` |
| `--color-focus` | `#2563eb` | Focus ring, on light and on ink surfaces |
| `--color-danger` | `#b42318` | Errors and destructive actions |

Components use the shadcn/ui roles, not the palette names, wherever a role exists:

| Role | Utility | Palette token |
|------|---------|---------------|
| Page background | `bg-background` | canvas |
| Default text | `text-foreground` | ink |
| Card and popover surface | `bg-card`, `bg-popover` | white |
| Primary action | `bg-primary text-primary-foreground` | ink, white |
| Muted surface and hover | `bg-muted`, `bg-secondary`, `bg-accent` | wash |
| Supporting text | `text-muted-foreground` | graphite |
| Decorative border | `border-border` | line |
| Input border | `border-input` | line-strong |
| Focus ring | `ring-ring` | focus |
| Error | `text-destructive` | danger |

The brand tokens have no shadcn role. Use `bg-brand`, `bg-brand-soft`, and `text-brand-ink` directly, or the `brand` variant of `Button` and `Badge`.

Rules:

- Green is an accent, used at most once or twice per screen. Ink owns the primary action.
- Never set text in `brand` on a light surface (2.65:1). Text on a `brand` fill is ink (7.12:1). Text on `brand-soft` is `brand-ink` (6.93:1).
- Supporting text is graphite (7.56:1 on white, 7.18:1 on the canvas). Do not go lighter for text.
- `line` is decorative. A control whose edge must be visible uses `line-strong` (3.25:1 on white).
- The focus ring reaches 5.17:1 on white and 3.65:1 on ink, so one colour serves both surfaces.
- A state such as pending, accepted, or rejected always carries a text label or an icon. Colour alone does not carry it.
- The palette is light only. `dark:` is bound to a `.dark` class that is never set, so the `dark:` classes in generated components stay inert.

## Typography

Headings use Cal Sans and everything else uses Inter. Both load through `next/font/google` in `src/app/layout.tsx`, which self-hosts the files at build time.

Cal Sans ships a single weight. Do not add `font-semibold` or `font-bold` to a heading for emphasis; `globals.css` sets `font-synthesis-weight: none` so the browser never fakes one.

| Utility | Size | Line height | Use |
|---------|------|-------------|-----|
| `text-display` | 40px | 1.05 | Reserved for a page that needs a hero line |
| `text-heading` | 30px | 1.15 | Page title (`h1`) |
| `text-subheading` | 20px | 1.3 | Card and dialog titles, the logo |
| `text-base` | 16px | Tailwind default | Inputs and emphasised body |
| `text-sm` | 14px | Tailwind default | Body, labels, buttons |
| `text-xs` | 12px | Tailwind default | Tags and captions |

The three custom sizes carry their line height and letter spacing, so they need no `leading-*` or `tracking-*` class. Pair them with `font-heading`. Inputs stay at 16px so mobile browsers do not zoom on focus.

## Layout and shape

- Content sits in a centred `max-w-5xl` (1024px) column with `px-4`, and `px-8` from the `sm` breakpoint.
- Spacing uses Tailwind's numeric scale. The usual steps are `gap-2` inside a control group, `gap-4` between cards, and `gap-6` between regions and inside cards.
- Corners: 8px on inputs (`rounded-md`), 12px on buttons (`rounded-lg`), 16px on cards and dialogs (`rounded-xl`), full on avatars and tags.
- Surfaces are flat. A card is white with a 1px `line` border and no shadow. Only overlays such as the dialog cast a shadow.
- Primary controls are at least 44px tall: the `default`, `lg`, and `icon` button sizes, inputs, and pagination links. The `xs` and `sm` sizes are for dense secondary UI only.

## Search page

- **Header band.** `bg-primary text-primary-foreground`. The first row holds the logo on the left and the "Are you a nutrition professional?" link on the right. The second row holds the search form.
- **Search form.** Two 48px white inputs with visually hidden labels and placeholders, the location input with a pin icon at its end, then a `brand` Search button. The fields stack on mobile.
- **Results title.** The `h1` states the count and the resolved city, for example "6 nutritionists in Braga". An unknown location shows an alert above it that names the fallback city.
- **Result card.** Three regions in a row, stacked on mobile:
  1. A 64px avatar. Without a photo it is an ink circle with white initials.
  2. An optional `brand` tag, the name as an `h2`, then title, licence number, and rating in graphite. Below that, two columns: the address with a pin icon, and the list of services with prices right-aligned in tabular figures.
  3. The actions, stacked and equal in width: "Schedule appointment" (primary) above "Personal page" (outline).
- **Pagination.** Left-aligned under the list. Previous and next are icon-only, and the current page is an ink fill.
- **Empty state.** A bordered white panel that says what was searched and offers to clear the query.

## Appointment dialog

- The title uses `font-heading text-subheading`, and the description names the nutritionist.
- Name and email sit side by side, then the calendar next to a three-column grid of time slots.
- A selected day or slot is an ink fill with white text. Unavailable days are struck through as well as dimmed.
- The footer has "Cancel" (outline) and "Request appointment" (primary).
- The confirmation says the appointment is requested, not confirmed, and that the answer arrives by email. Do not style a pending request as a confirmed booking.

## Pending requests page

This page is not built yet. Build it to this spec.

- A page title "Pending requests" in `text-heading`, with a one-line graphite description under it.
- A grid of cards: one column on mobile, two from `sm`, three from `lg`.
- Each card shows the guest's avatar, name, and email, then the requested date and time, each with an icon.
- The card footer holds "Accept" (primary) and "Reject" (outline) at equal width. Each shows its pending state while the action runs.
- With no requests, show the empty state in place of the grid.

## Component library (shadcn/ui)

The frontend uses [shadcn/ui](https://ui.shadcn.com) with [Base UI](https://base-ui.com) primitives (`base-nova` style, `components.json`). Components live in `src/components/ui` and are project code: change the component to fit this document instead of overriding it at every call site.

- Add components with `pnpm dlx shadcn@latest add <name>` from `frontend/`.
- After adding, change `import { cn } from "cn"` to `import { cn } from "@/lib/utils"`. The stock `cn` reads `text-heading` as a colour and drops `text-foreground` next to it. The configured `cn` in `src/lib/utils.ts` registers the custom text sizes; extend it when you add one to `theme.css`.
- Replace `ring-ring/50` with `ring-ring`. A half-opacity ring falls below 3:1 on white.
- Replace `text-primary` on a text link with `text-foreground underline`. Links are ink and underlined.
- Remove any `shadow-*` class from a non-overlay component.

`theme.css` declares the palette with `@theme static`. Most palette variables are read only through the roles in `globals.css`, and Tailwind drops theme variables that no utility uses unless the block is static.
