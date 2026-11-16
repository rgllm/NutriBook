#!/bin/sh
# Runs the e2e copy of the Docker stack: `up` resets it, `down` removes it.
set -eu

root=$(cd "$(dirname "$0")/../.." && pwd)
cd "$root"

export BACKEND_PORT="${E2E_BACKEND_PORT:-3101}"
export MAILPIT_PORT="${E2E_MAILPIT_PORT:-8125}"
compose() { docker compose -p nutribook-e2e -f compose.yaml -f e2e/compose.yaml "$@"; }

case "${1:-}" in
  up)
    # Replanting truncates Solid Queue's tables, which the worker inside Puma
    # polls, so Rails stays stopped until the data is in place.
    compose build backend
    compose stop backend
    compose up --detach --wait db mailpit
    compose run --rm --no-deps backend bin/rails db:prepare db:seed:replant
    compose run --rm --no-deps -T backend bin/rails runner - < e2e/fixtures/nutritionists.rb
    curl --fail --silent --show-error --request DELETE "http://127.0.0.1:$MAILPIT_PORT/api/v1/messages"
    compose up --detach --wait backend
    ;;
  down)
    compose down --volumes
    ;;
  *)
    echo "usage: $0 up|down" >&2
    exit 64
    ;;
esac
