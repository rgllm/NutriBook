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

The frontend runs at <http://localhost:3000>. This initial setup provides the Rails
application and development/test databases. Appointment models, search, email
notifications, and frontend API integration are pending implementation.
