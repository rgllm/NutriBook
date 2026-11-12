import { createCn } from "cn/config"

// Teach the merger the custom scales from src/app/theme.css (see DESIGN.md).
// Without this, `text-caption` reads as a text colour and would override
// `text-foreground`, and `shadow-card` would read as a shadow colour.
export const cn = createCn({
  extend: {
    theme: {
      text: [
        "caption",
        "body-sm",
        "content-sm",
        "content",
        "subheading",
        "heading",
        "section-header",
        "display",
      ],
      leading: [
        "caption",
        "body-sm",
        "content-sm",
        "content",
        "subheading",
        "heading",
        "section-header",
        "display",
      ],
      tracking: ["caption"],
      spacing: ["3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl"],
      shadow: ["subtle", "card", "card-hover", "dropdown", "modal"],
    },
  },
})
