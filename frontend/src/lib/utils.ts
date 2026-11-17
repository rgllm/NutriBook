import { createCn } from "cn/config"

export const cn = createCn({
  extend: {
    theme: {
      text: ["subheading", "heading", "display"],
    },
  },
})
