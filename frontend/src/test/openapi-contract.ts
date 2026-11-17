import { readFileSync } from "node:fs"
import { join } from "node:path"

import { Ajv } from "ajv"
import addFormats from "ajv-formats"
import { parse } from "yaml"

type JsonContent = { content?: { "application/json"?: { schema: unknown } } }

type Operation = {
  operationId: string
  parameters?: { name: string; in: "path" | "query"; required?: boolean }[]
  requestBody?: JsonContent
  responses: Record<string, JsonContent>
}

type Spec = { paths: Record<string, Record<string, Operation>> }

const spec: Spec = parse(
  readFileSync(join(import.meta.dirname, "../../../backend/public/openapi.yaml"), "utf8"),
)

// OpenAPI 3.0 schemas are JSON Schema plus keywords such as `example`, which
// strict mode would refuse.
const ajv = new Ajv({ strict: false, allErrors: true })
addFormats(ajv)
ajv.addSchema(spec, "openapi")

const pointer = (...segments: string[]) =>
  `openapi#/${segments.map((segment) => segment.replaceAll("~", "~0").replaceAll("/", "~1")).join("/")}`

function violations(ref: string, data: unknown, label: string) {
  const validate = ajv.getSchema(ref)
  if (!validate) return [`${label} has no schema at ${ref}`]
  return validate(data) ? [] : [ajv.errorsText(validate.errors, { dataVar: label, separator: "; " })]
}

function findOperation(method: string, url: URL) {
  for (const [path, operations] of Object.entries(spec.paths)) {
    const operation = operations[method.toLowerCase()]
    if (!operation) continue
    const template = new RegExp(`^${path.replace(/\{(\w+)\}/g, "(?<$1>[^/]+)")}$`)
    const match = url.pathname.match(template)
    if (match) return { path, method: method.toLowerCase(), operation, params: match.groups ?? {} }
  }
}

export type ApiCall = { method: string; url: URL; body?: unknown }

// The ways a call the frontend made, and the JSON reply a test gave it, differ
// from backend/public/openapi.yaml. Omit the reply when there is no JSON one.
export function contractViolations(call: ApiCall, reply?: { status: number; body: unknown }) {
  const found = findOperation(call.method, call.url)
  if (!found) return [`${call.method} ${call.url.pathname} is not in openapi.yaml`]
  const { path, method, operation, params } = found
  const label = operation.operationId

  const problems = (operation.parameters ?? []).flatMap((parameter, index) => {
    const value = parameter.in === "path"
      ? params[parameter.name]
      : call.url.searchParams.getAll(parameter.name).at(-1)
    const parameterLabel = `${label} ${parameter.in} ${parameter.name}`
    if (value === undefined) {
      return parameter.required ? [`${parameterLabel} is required`] : []
    }
    return violations(
      pointer("paths", path, method, "parameters", String(index), "schema"),
      value,
      parameterLabel,
    )
  })

  if (operation.requestBody) {
    problems.push(
      ...violations(
        pointer("paths", path, method, "requestBody", "content", "application/json", "schema"),
        call.body,
        `${label} request body`,
      ),
    )
  } else if (call.body !== undefined) {
    problems.push(`${label} takes no request body`)
  }

  if (reply) {
    const status = String(reply.status)
    if (!operation.responses[status]?.content?.["application/json"]) {
      problems.push(`${label} documents no JSON response for ${status}`)
    } else {
      problems.push(
        ...violations(
          pointer("paths", path, method, "responses", status, "content", "application/json", "schema"),
          reply.body,
          `${label} ${status} response`,
        ),
      )
    }
  }

  return problems
}
