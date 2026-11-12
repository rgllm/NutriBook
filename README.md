# NutriBook

Appointment requests for nutritionists. The project has a Next.js frontend in
`frontend/` and a Rails API in `backend/`.

## Start the backend and database

Install Docker with Docker Compose, then run from the project root.

```sh
docker compose up --build -d --wait
```

This starts two development containers, Rails at <http://localhost:3001> and
PostgreSQL on the Compose network. Rails prepares its databases before starting
the server. Check <http://localhost:3001/up> for the Rails health response.
Set `BACKEND_PORT` to choose another host port.

The database uses a named Docker volume that survives container restarts.
The `nutribook` database username and password in `compose.yaml` are local
development credentials. PostgreSQL is accessible to the backend as `db:5432`.
Use `docker compose exec db psql -U nutribook -d nutribook_development` for SQL.

```sh
docker compose logs -f backend
docker compose exec backend bin/rails console
docker compose exec backend bin/rails db:migrate
docker compose exec backend bin/rails test
docker compose exec backend bin/rubocop
docker compose down
```

Backend source changes reload through the bind mount. Rebuild the image after
changing the Gemfile or Gemfile.lock.

## Frontend

Run the existing frontend separately.

```sh
cd frontend
pnpm install
pnpm dev
```

The frontend runs at <http://localhost:3000>. The nutritionist's pending
requests page is at <http://localhost:3000/nutritionists/123/requests>; it has
no authentication, as the challenge allows. This initial setup provides the Rails
application and development/test databases. Appointment models, search, email
notifications, and frontend API integration are pending implementation. Until
then, both pages read mock data from `frontend/src/lib/`; accepting or rejecting
a request removes it from an in-memory list that resets when the server restarts.

## Design

`frontend/DESIGN.md` is the design reference. The UI keeps the layout of the
challenge's reference image (search band, result card, numbered pagination) and
deliberately changes its colours and type: ink-black actions, flat white cards,
Cal Sans headings, and green as a single accent. The reference's white-on-green
and green-on-white text is about 2.65:1, below the 4.5:1 that body text needs.

Inter and Cal Sans load through `next/font/google`, so `pnpm build` needs
network access to download them.
