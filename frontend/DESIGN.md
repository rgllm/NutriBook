# NutriBook design reference

Light surfaces, charcoal typography, and a green primary action. NutriBook helps people request appointments with nutritionists. Keep the interface calm, readable, and clear about whether an appointment has been requested or confirmed.

This document and `frontend/src/app/theme.css` adapt the supplied palette for the project's Next.js frontend and Tailwind CSS v4. They define the intended styling. The current frontend is a starter and does not yet import this theme.

## Color palette

Keep these source values exact. Prefer semantic roles in components and use named palette tokens for deliberate accents.

| Color | Value | Tailwind theme token | Use |
|-------|-------|----------------------|-----|
| Primary green | `#1ab394` | `--color-primary` | Main actions and selected accents |
| Light green | `#62cdc0` | `--color-primary-light` | Soft emphasis and navbar buttons |
| Green hover | `#47baac` | `--color-primary-light-hover` | Hover on green actions |
| Pale mint | `#e2fcfc` | `--color-primary-lighter` | Selected backgrounds |
| Charcoal | `#343a46` | `--color-gray-900` | Headings and default text |
| Secondary charcoal | `#404b59` | `--color-gray-900-light` | Supporting text and input outlines |
| Body gray | `#3e3e3e` | `--color-message-body` | Body copy |
| Transparent gray | `#b0b1b24d` | `--color-gray-900-transparent` | Decorative dividers on light surfaces |
| White | `#ffffff` | `--color-white` | Cards, forms, and text on dark surfaces |
| Translucent white | `#ffffff99` | `--color-white-bg-50` | Overlays with a checked background |
| Page canvas | `#fafcff` | `--color-canvas` | Page and mobile menu background |
| Footer | `#333945` | `--color-footer-bg` | Dark footer surface |
| Footer bar | `#434a59` | `--color-footer-bottom-bar` | Bottom footer strip |
| Decorative gray | `#9b9b9b` | `--color-dark-grey` | Disabled or decorative details |
| Neutral blue wash | `#e5f8fd` | `--color-highlight-first` | Informational sections |
| Blue wash | `#e5f1ff` | `--color-highlight-second` | Supporting sections |
| Green wash | `#e3f4f4` | `--color-highlight-third` | Muted surfaces and selected cards |
| Pale blue | `#ebf4ff` | `--color-blue-200` | Informational backgrounds |
| Light blue | `#83bcff` | `--color-blue-500` | Illustration and data accents |
| Dark blue | `#2e619e` | `--color-blue-800` | Links and focus indicators on light surfaces |
| Bright blue | `#0099ff` | `--color-valesaude-primary2` | Occasional decorative emphasis |
| Duall blue | `#74abec` | `--color-duall-blue` | Supporting illustration accent |
| Lilac blue | `#bddcff` | `--color-lilac-2` | Soft supporting background |
| Yellow | `#f3ca58` | `--color-yellow-500` | Supporting accent |
| Fuchsia | `#d6b8db` | `--color-fuchia-500` | Supporting accent |
| Pale fuchsia | `#f9f5fa` | `--color-fuchia-200` | Soft supporting background |
| Pale coral | `#faede5` | `--color-coral-200` | Soft supporting background |
| Black | `#000000` | `--color-black` | Exceptional high-contrast details |

The original `--_duall---*` aliases and source spellings, including `fuchia`, remain available in `:root`. Their Tailwind equivalents use `--color-duall-*` names. `--color-accessible-grey` preserves a source alias for `#9b9b9b`; its name does not establish sufficient text contrast.

## Semantic roles

| Role | Token | Source |
|------|-------|--------|
| Page background | `--color-background` | `--gray-3` |
| Default text | `--color-foreground` | `--gray-900` |
| Card or form surface | `--color-surface` | `--white` |
| Muted surface | `--color-surface-muted` | `--highlight-bg-third` |
| Body copy | `--color-body` | `--message-body-color` |
| Supporting copy | `--color-muted` | `--gray-900-light` |
| Decorative border | `--color-border` | `--gray-900-transparent` |
| Input border | `--color-input-border` | `--gray-900-light` |
| Main action | `--color-action` | `--primary` |
| Action hover | `--color-action-hover` | `--primary-light-hover` |
| Text on main action | `--color-on-action` | `--black` |
| Link and focus indicator | `--color-link`, `--color-focus` | `--blue-800` |
| Footer and footer text | `--color-footer`, `--color-on-footer` | `--footer-background-color`, `--white` |

Use black text on primary green buttons. Charcoal `#343a46` on `#1ab394` reaches only 4.30:1, so it is insufficient for normal-size button labels. White on `#1ab394` is too low contrast for normal text. Use dark blue for text links on white or pale surfaces. Reserve `#9b9b9b` for decoration and disabled states, and use secondary charcoal for readable helper copy.

Transparent dividers are decorative. Inputs need the stronger input-border token so their boundaries remain visible. On dark surfaces, use white text and a light focus indicator. Always pair appointment states and validation messages with text or icons; color alone must not carry their meaning. This palette does not define an error color. Choose and validate a separate semantic error treatment when implementing validation.

## Typography

The supplied brand families are Geomanist and Geomanist Book. No font files are included. Provide licensed files through `@font-face` before relying on either family. `--font-sans` includes a system sans fallback. The frontend currently loads Geist; select one font strategy when integrating rather than loading both unnecessarily.

| Role | Size | Line height | Theme tokens |
|------|------|-------------|--------------|
| Caption | 12px | 1.5 | `--text-caption`, `--leading-caption` |
| Compact body | 14px | 1.43 | `--text-body-sm`, `--leading-body-sm` |
| Small content | 16px | 24px | `--text-content-sm`, `--leading-content-sm` |
| Main content | 18px | 28px | `--text-content`, `--leading-content` |
| Subheading | 20px | 1.4 | `--text-subheading`, `--leading-subheading` |
| Heading | 30px | 1.25 | `--text-heading`, `--leading-heading` |
| Section header | 38px | 50px | `--text-section-header`, `--leading-section-header` |
| Display | 50px | 1.1 | `--text-display`, `--leading-display` |

Use regular body text and medium or bold headings where the loaded font supports those weights. Keep form labels at least 14px and inputs at least 16px. Allow headings to wrap naturally on mobile. Apply the matching `leading-*` utility alongside custom `text-*` sizes.

## Spacing and layout

| Token suffix | Value |
|--------------|-------|
| `3xs` | 2px |
| `2xs` | 4px |
| `xs` | 8px |
| `sm` | 16px |
| `md` | 24px |
| `lg` | 32px |
| `xl` | 40px |
| `2xl` | 48px |
| `3xl` | 64px |

Use named spacing utilities such as `gap-xs`, `p-md`, and `px-lg`. Avoid numeric spacing aliases such as `--spacing-4: 4px`, which would change the meaning of Tailwind's existing numeric utilities.

Center public pages within a suggested 1200px maximum width. The supplied page-margin tokens are 64px on desktop, 40px on medium screens, 32px on small screens, and 24px on the smallest screens. Components may use the supplied 16px container padding where space is constrained.

Public landing sections can use the supplied 112px top and 104px bottom spacing. Curved-section values are 168px top and 192px bottom, with 160px tablet top spacing and 128px mobile top and bottom spacing. These are marketing layout options, not required padding for appointment forms or compact application views.

Cards use 24px padding and 12px or 16px corners. Inputs use 6px or 8px corners. Public CTAs may use full pill corners. Keep form actions consistent within each flow. Shadows should be subtle; use the supplied `shadow-card`, `shadow-dropdown`, and `shadow-modal` tokens only where elevation helps explain layering.

## Components

- Navigation uses a white or canvas surface, charcoal links, and green emphasis. A dark hero may use the supplied white menu text and translucent charcoal navbar background. Check contrast against the actual image or background.
- Primary buttons use `bg-action text-on-action hover:bg-action-hover`. Keep targets at least 44px tall and provide visible keyboard focus.
- Secondary buttons use white surfaces, charcoal text, and a visible outline. Keep one clearly dominant action per appointment step.
- Cards use white surfaces, decorative borders, and restrained shadows. Selected cards can use pale mint or the green wash with a stronger outline and a textual selected indicator.
- Inputs have persistent labels, secondary-charcoal borders, and dark-blue focus indicators. Place helper and error text beside the relevant input.
- Date and time controls distinguish available, selected, unavailable, and focused states. Selected green cells use black labels. Unavailable slots remain distinguishable without relying on opacity alone.
- Request receipts explicitly say that the appointment is requested until the backend confirms it. Do not style a pending request as a confirmed booking.
- Footers use `#333945` with white text and an optional `#434a59` bottom bar. Supporting links must remain readable.

Use pastel accents sparingly. Green owns the primary action; blue is the supporting interactive color. Avoid carrying over Cap-specific download buttons, recording mockups, traffic-light controls, and invented social-proof claims from the previous reference.

## Integration

The design reference is at the project root and the theme is at `frontend/src/app/theme.css`. To apply the theme, import it after Tailwind in `frontend/src/app/globals.css`:

```css
@import "tailwindcss";
@import "./theme.css";

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}
```

The theme also defines `--color-background` and `--color-foreground` for `bg-background` and `text-foreground`. When integrating, replace the starter's competing background, foreground, font, and automatic dark-mode declarations with the intended light theme. Remove starter page classes that force unrelated colors. The palette supplied here defines light mode only.

For the plain CSS body example above, add these aliases to the consuming stylesheet:

```css
:root {
  --background: var(--gray-3);
  --foreground: var(--gray-900);
}
```

The `:root` source tokens work in plain CSS. The complete file contains Tailwind-specific `@theme` directives and must pass through Tailwind v4 to generate utilities.

Example primary action:

```html
<button
  type="submit"
  class="min-h-11 rounded-full bg-action px-md py-xs text-content-sm leading-content-sm font-medium text-on-action transition-colors hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
>
  Request an appointment
</button>
```

Before shipping a styled flow, verify mobile wrapping, keyboard navigation, focus visibility, text contrast, loading and error states, and the distinction between requested and confirmed appointments.
