// The e2e stack's host ports. global-setup.ts starts Rails and Mailpit on them,
// and playwright.config.ts starts the frontend.
const port = (name: string, fallback: number) => Number(process.env[name] ?? fallback)

export const FRONTEND_PORT = port("E2E_FRONTEND_PORT", 3100)
export const BACKEND_PORT = port("E2E_BACKEND_PORT", 3101)
export const MAILPIT_PORT = port("E2E_MAILPIT_PORT", 8125)

export const FRONTEND_URL = `http://127.0.0.1:${FRONTEND_PORT}`
export const API_URL = `http://127.0.0.1:${BACKEND_PORT}`
export const MAILPIT_URL = `http://127.0.0.1:${MAILPIT_PORT}`

// The city of the nutritionists in fixtures/nutritionists.rb.
export const E2E_CITY = "Viana do Castelo"
