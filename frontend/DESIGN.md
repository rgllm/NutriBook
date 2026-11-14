# NutriBook design reference

NutriBook follows the challenge's reference image, which is a Nutrium page, and takes its palette and shapes from [nutrium.com](https://nutrium.com/): the Nutrium green, slate text, coral and mint action buttons, pill buttons, and soft white cards. This document is the source of truth for the frontend's look. The tokens live in `src/app/theme.css`, and `src/app/globals.css` maps them onto the shadcn/ui roles.

## Relation to the reference image

The layout, the content of each region, and the colour of each element follow the reference. The shades are adjusted where the reference falls below 4.5:1 for text.

| Region | Reference image | NutriBook |
|--------|-----------------|-----------|
| Header and search band | Green gradient, white logo and link | Flat green band (`brand-strong`), white logo and link |
| Search form | Two white inputs and an orange Search button with white text | Two white inputs and a mint (`brand-soft`) Search button with dark green text |
| Result card | Avatar, tag, green name, title and licence, location, service and price, two stacked buttons on the right | Same regions and colours; every service is listed with its price instead of sitting behind a dropdown |
| Card buttons | Peach "Schedule appointment", mint "Website" | Peach (`coral-soft`) "Schedule appointment", mint (`brand-soft`) "Personal page" |
| Pagination | Numbered, left-aligned, mint active page | Same |
| Pending requests | Grid of cards with avatar, name, date, time, and an "Answer request" footer; carousel arrows, share, and history buttons in the header | Same grid; the footer holds the Accept and Reject actions. The grid shows every request, so there are no carousel arrows, and share and history are left out until they have a use |

Three deliberate differences from the reference:

- The band is flat, with no gradient.
- The band uses `brand-strong`, a darker shade of the Nutrium green. White text on the Nutrium green itself (`brand`) is 2.65:1.
- The Search button is mint with dark green text, not orange, so the band stays in one colour family and the orange stays with "Schedule appointment".

## Colour

Values marked "Nutrium" are sampled from the nutrium.com stylesheet. The others are darker shades of the same hues, chosen to reach 4.5:1.

| Token | Value | Use |
|-------|-------|-----|
| `--color-ink` | `#343a46` | Text (Nutrium's slate) |
| `--color-graphite` | `#5e6982` | Supporting text (Nutrium) |
| `--color-line` | `#e3e8ef` | Card borders and dividers (decorative) |
| `--color-line-strong` | `#7f8799` | Input and outline-button borders |
| `--color-wash` | `#f2f6fd` | Hover and muted surfaces (Nutrium) |
| `--color-canvas` | `#fafcff` | Page background (Nutrium) |
| `--color-brand` | `#1ab394` | The Nutrium green. Icons and fills that carry no text |
| `--color-brand-strong` | `#0e7c66` | The header band, primary actions, green text such as the nutritionist's name |
| `--color-brand-soft` | `#e3f4f4` | Mint: tags, avatars, the Search and "Personal page" buttons, the active page (Nutrium) |
| `--color-brand-soft-hover` | `#d5f6ef` | Hover on a `brand-soft` fill (Nutrium) |
| `--color-brand-ink` | `#0b5e4d` | Text on `brand-soft` |
| `--color-coral-soft` | `#faede5` | Peach: the "Schedule appointment" button (Nutrium) |
| `--color-coral-soft-hover` | `#f5dccd` | Hover on a `coral-soft` fill |
| `--color-coral-ink` | `#8f3d14` | Text on `coral-soft` |
| `--color-focus` | `#2e619e` | Focus ring on light surfaces (Nutrium's blue) |
| `--color-danger` | `#b42318` | Errors and destructive actions |

Components use the shadcn/ui roles, not the palette names, wherever a role exists:

| Role | Utility | Palette token |
|------|---------|---------------|
| Page background | `bg-background` | canvas |
| Default text | `text-foreground` | ink |
| Card and popover surface | `bg-card`, `bg-popover` | white |
| Primary action | `bg-primary text-primary-foreground` | brand-strong, white |
| Muted surface and hover | `bg-muted`, `bg-secondary`, `bg-accent` | wash |
| Supporting text | `text-muted-foreground` | graphite |
| Decorative border | `border-border` | line |
| Input border | `border-input` | line-strong |
| Focus ring | `ring-ring` | focus |
| Error | `text-destructive` | danger |

The other brand and coral tokens have no shadcn role. Use them through the `coral-soft` and `brand-soft` variants of `Button` and the `brand` variant of `Badge`, or directly (`text-brand-strong`, `bg-brand-soft text-brand-ink`).

Rules:

- Green is the default action colour: the primary button, a selected day or time slot, Accept. Peach (`coral-soft`) belongs to "Schedule appointment", as in the reference. On the green band the Search action is `brand-soft`, the same mint button as "Personal page".
- Never set text in `brand` on a light surface, or white text on a `brand` fill (both 2.65:1). Green text is `brand-strong` (5.13:1 on white, 4.99:1 on the canvas). White text sits on `brand-strong` (5.13:1).
- Text on `brand-soft` is `brand-ink` (6.8:1). Text on `coral-soft` is `coral-ink` (6.43:1).
- Supporting text is graphite (5.5:1 on white, 5.35:1 on the canvas). Do not go lighter for text.
- `line` is decorative. A control whose edge must be visible uses `line-strong` (3.6:1 on white).
- The focus ring reaches 6.33:1 on white. On the green band it would drop to about 1.2:1, so the header sets `--ring` to white (5.13:1) for everything inside it.
- No gradients. Every fill is a flat colour.
- A state such as pending, accepted, or rejected always carries a text label or an icon. Colour alone does not carry it.
- The palette is light only. `dark:` is bound to a `.dark` class that is never set, so the `dark:` classes in generated components stay inert.

## Typography

Headings use Outfit and everything else uses Inter. Both load through `next/font/google` in `src/app/layout.tsx`, which self-hosts the files at build time. Nutrium sets its site in Geomanist, a commercial typeface; Outfit is the closest geometric sans available on Google Fonts.

| Utility | Size | Line height | Use |
|---------|------|-------------|-----|
| `text-display` | 40px | 1.05 | Reserved for a page that needs a hero line |
| `text-heading` | 30px | 1.15 | Page title (`h1`) |
| `text-subheading` | 20px | 1.3 | Card and dialog titles, the logo |
| `text-base` | 16px | Tailwind default | Inputs and emphasised body |
| `text-sm` | 14px | Tailwind default | Body, labels, buttons |
| `text-xs` | 12px | Tailwind default | Tags and captions |

The three custom sizes carry their line height, letter spacing, and weight (600), so they need no `leading-*`, `tracking-*`, or `font-*` weight class. Pair them with `font-heading`. Inputs stay at 16px so mobile browsers do not zoom on focus.

## Layout and shape

- Content sits in a centred `max-w-5xl` (1024px) column with `px-4`, and `px-8` from the `sm` breakpoint.
- Spacing uses Tailwind's numeric scale. The usual steps are `gap-2` inside a control group, `gap-4` between cards, and `gap-6` between regions and inside cards.
- Corners follow Nutrium: buttons, tags, and avatars are pills (`rounded-full`), cards and dialogs are 20px (`rounded-2xl`), and inputs and time slots are 12px (`rounded-lg`).
- Surfaces are flat. A card is white with a 1px `line` border and no shadow. Only overlays such as the dialog cast a shadow.
- Primary controls are at least 44px tall: the `default`, `lg`, and `icon` button sizes, inputs, and pagination links. The `xs` and `sm` sizes are for dense secondary UI only.

## Search page

- **Header band.** `bg-primary text-primary-foreground`, with `--ring` set to white. The first row holds the logo, the word "NutriBook" in `font-heading text-subheading` with no mark, on the left and the "Are you a nutrition professional?" link on the right. The second row holds the search form.
- **Favicon.** `src/app/icon.svg`, a full circle in `brand-strong`. An SVG cannot read the theme tokens, so the hex is repeated there; change both together.
- **Search form.** Two 48px white inputs with visually hidden labels and placeholders, the location input with a pin icon at its end and a quiet hint under it ("If no location is provided we default to Braga.", `text-xs text-brand-soft`, 4.52:1 on the band, inset to line up with the input text). Translucent white would fall below 4.5:1, then a `brand-soft` (mint, dark green text) Search button. The fields stack on mobile.
- **Results title.** The `h1` states the count and the resolved city, for example "6 nutritionists in Braga". An unknown location shows an alert above it that names the fallback city.
- **Result card.** Three regions in a row, stacked on mobile:
  1. A 64px avatar. Without a photo it is a `brand-soft` circle with `brand-ink` initials.
  2. An optional `brand` tag, the name as an `h2` in `brand-strong`, then title and licence number in graphite. Below that, two columns: the address with a pin icon, and the list of services with prices right-aligned in tabular figures.
  3. The actions, stacked and equal in width: "Schedule appointment" (`coral-soft`) above "Personal page" (`brand-soft`).
- **Pagination.** Left-aligned under the list. Previous and next are icon-only, and the current page is a `brand-soft` fill.
- **Empty state.** A bordered white panel that says what was searched and offers to clear the query.

## Appointment dialog

- The title uses `font-heading text-subheading`, and the description names the nutritionist.
- Name and email sit side by side, then the calendar next to a three-column grid of time slots.
- A selected day or slot is a primary (green) fill with white text. Unavailable days are struck through as well as dimmed.
- The footer has "Cancel" (outline) and "Request appointment" (primary).
- The confirmation says the appointment is requested, not confirmed, and that the answer arrives by email. Do not style a pending request as a confirmed booking.

## Pending requests page

Lives at `/nutritionists/[id]/requests`. It reads mock data from `src/lib/pending-requests.ts` until the API serves it.

- A page title "Pending requests" in `text-heading`, with a one-line graphite description under it.
- A grid of cards: one column on mobile, two from `sm`, three from `lg`.
- Each card shows the guest's avatar, name, and the requested service, then the email, date, and time range, each with an icon. Dates and times show in the practice's time zone, Europe/Lisbon.
- The card footer holds "Accept" (primary) and "Reject" (outline) at equal width. Each shows its pending state while the action runs.
- With no requests, show the empty state in place of the grid.

## Component library (shadcn/ui)

The frontend uses [shadcn/ui](https://ui.shadcn.com) with [Base UI](https://base-ui.com) primitives (`base-nova` style, `components.json`). Components live in `src/components/ui` and are project code: change the component to fit this document instead of overriding it at every call site.

- Add components with `pnpm dlx shadcn@latest add <name>` from `frontend/`.
- After adding, change `import { cn } from "cn"` to `import { cn } from "@/lib/utils"`. The stock `cn` reads `text-heading` as a colour and drops `text-foreground` next to it. The configured `cn` in `src/lib/utils.ts` registers the custom text sizes; extend it when you add one to `theme.css`.
- Replace `ring-ring/50` with `ring-ring`. A half-opacity ring falls below 3:1 on white.
- Replace `text-primary` on a text link with `text-foreground underline`. Links are slate and underlined.
- Remove any `shadow-*` class from a non-overlay component.

`theme.css` declares the palette with `@theme static`. Most palette variables are read only through the roles in `globals.css`, and Tailwind drops theme variables that no utility uses unless the block is static.
