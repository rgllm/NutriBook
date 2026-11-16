import js from "@eslint/js"
import playwright from "eslint-plugin-playwright"
import tseslint from "typescript-eslint"

export default tseslint.config(
  { ignores: ["playwright-report/", "test-results/"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  { ...playwright.configs["flat/recommended"], files: ["specs/**"] },
)
