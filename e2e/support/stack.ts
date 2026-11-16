// Ports match scripts/stack.sh, which starts the backend and Mailpit on them.
const port = (name: string, fallback: number) => Number(process.env[name] ?? fallback)

export const FRONTEND_URL = `http://127.0.0.1:${port("E2E_FRONTEND_PORT", 3100)}`
export const API_URL = `http://127.0.0.1:${port("E2E_BACKEND_PORT", 3101)}`
export const MAILPIT_URL = `http://127.0.0.1:${port("E2E_MAILPIT_PORT", 8125)}`

// The city of the nutritionists in fixtures/nutritionists.rb.
export const E2E_CITY = "Viana do Castelo"
