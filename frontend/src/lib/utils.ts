import { createCn } from "cn/config"

// Teach the merger the custom text sizes from src/app/theme.css (see
// DESIGN.md). Without this, `text-heading` reads as a text colour and would
// override `text-foreground`.
export const cn = createCn({
  extend: {
    theme: {
      text: ["subheading", "heading", "display"],
    },
  },
})
