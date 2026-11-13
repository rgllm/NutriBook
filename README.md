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

### Shortcuts

The root `package.json` wraps these commands as pnpm scripts, so you can run
them from the project root without typing `docker compose exec`. Extra
arguments pass through to the underlying command.

```sh
pnpm dev                  # start Docker services, then the frontend
pnpm stop                 # stop Docker services
pnpm rails <args>         # any Rails command, e.g. pnpm rails generate model Service
pnpm db:migrate
pnpm db:rollback
pnpm db:seed
pnpm db:psql
pnpm backend:test         # add a path to run one file
pnpm backend:lint
pnpm backend:ci
pnpm backend:console
pnpm backend:logs
pnpm frontend:lint
pnpm frontend:typecheck
pnpm frontend:build
pnpm test                 # backend tests
pnpm lint                 # backend and frontend lint
```

## Database

```mermaid
erDiagram
    nutritionists ||--o{ services : offers
    nutritionists ||--o{ appointment_requests : receives
    services ||--o{ appointment_requests : "is booked in"

    nutritionists {
        bigint id PK
        string name
        string slug UK
        string title "Dietitian or Nutritionist"
        string license_number
        string city "used by search"
        string address
        boolean offers_online
    }

    services {
        bigint id PK
        bigint nutritionist_id FK
        string name
        decimal price ">= 0"
        integer duration_minutes "> 0"
    }

    appointment_requests {
        bigint id PK
        bigint service_id FK "with nutritionist_id, references services"
        bigint nutritionist_id FK
        string guest_name
        string guest_email "stored lowercase"
        datetime starts_at "UTC"
        datetime ends_at "starts_at + service duration"
        string status "pending, accepted, rejected, superseded"
        datetime answered_at "set only when accepted or rejected"
    }
```

A guest is identified by email and has no table of their own; their name and
email live on each request. Every column is `NOT NULL` except `answered_at`, and
every table has `created_at` and `updated_at`.

The business rules that PostgreSQL can express are database constraints, so
they hold even if application code has a bug or two requests race:

| Rule | Constraint |
| --- | --- |
| A guest has at most one pending request | Partial unique index on `lower(guest_email)` where `status = 'pending'` |
| A nutritionist never has two accepted appointments that overlap | Exclusion constraint on `nutritionist_id` and `tsrange(starts_at, ends_at)` where `status = 'accepted'` (`btree_gist`). Ranges are half-open, so 10:00–11:00 and 11:00–12:00 do not overlap |
| A request's service belongs to the request's nutritionist | Composite foreign key `(nutritionist_id, service_id)` → `services (nutritionist_id, id)` |
| `answered_at` is set exactly when a nutritionist answered | Check that `answered_at IS NOT NULL` equals `status IN ('accepted', 'rejected')` |
| Valid values | Checks on `title`, `status`, `price >= 0`, `duration_minutes > 0`, and `ends_at > starts_at` |

A request copies its end time from the service's duration when it is created,
so editing a service later does not move existing appointments. `superseded`
marks a pending request replaced by the same guest's newer one, so it stays
distinct from a request the nutritionist rejected. Nutritionists and services
use `restrict_with_error`, so records that requests point to cannot be deleted.
A nutritionist works from one practice, so the city and address belong to the
nutritionist and every service is offered there.

`docker compose exec backend bin/rails db:seed` (or `pnpm db:seed`) creates 30
nutritionists across the eight cities the frontend offers, with services at
different prices and durations. Braga, the default location, has enough for
more than one results page. The first Braga nutritionist has four pending requests, two of which
overlap, to try the automatic rejection. Names come from Faker with a fixed
random seed, so every run produces the same data, and the file is idempotent.
Use `bin/rails db:seed:replant` to start over.

Indexes follow the queries: `nutritionists (city, name)` for search by city in
name order, `services (nutritionist_id, id)` for the composite key and lookups by
nutritionist, and `appointment_requests (nutritionist_id, status, starts_at)`
for a nutritionist's request list.

## API

`GET /nutritionists` searches nutritionists. It takes three optional query
parameters.

| Parameter | Meaning |
| --- | --- |
| `q` | Matches part of a nutritionist's name or the name of one of their services |
| `location` | The city to search |
| `page` | The results page, five nutritionists per page |

Matching ignores case and accents, so `joao` finds João and `guimaraes` finds
Guimarães. PostgreSQL's `unaccent` extension does this for `q`. The known
locations are the cities that have at least one nutritionist, plus `Lisbon` and
`Oporto` as aliases. A blank location searches Braga, and so does an unknown
one. The response says which case applied in `location.source`: `input`,
`default`, or `fallback`. A page past the end returns the last page, and a
missing or invalid page returns the first.

Results are ordered by name, and each nutritionist lists all their services.
Prices are decimal strings.

```sh
curl 'http://localhost:3001/nutritionists?q=first&location=braga'
```

```json
{
  "nutritionists": [
    {
      "id": 1,
      "slug": "mary-jane",
      "name": "Mary Jane",
      "title": "Dietitian",
      "license_number": "2963N",
      "city": "Braga",
      "address": "Rua do Souto 45",
      "offers_online": true,
      "services": [
        {
          "id": 1,
          "name": "First appointment",
          "price": "25.0",
          "duration_minutes": 60
        }
      ]
    }
  ],
  "location": { "city": "Braga", "source": "input" },
  "pagination": { "page": 1, "per_page": 5, "total_count": 1, "total_pages": 1 }
}
```

`NutritionistSearch` in `backend/app/models/` owns location resolution,
matching, and paging. It runs a fixed number of queries whatever the page
size, because the page's services are preloaded in one query.

## Frontend

Run the existing frontend separately.

```sh
cd frontend
pnpm install
pnpm dev
```

The frontend runs at <http://localhost:3000>. The nutritionist's pending
requests page is at <http://localhost:3000/nutritionists/123/requests>; it has
no authentication, as the challenge allows. The search API is in place; the
request endpoints, email notifications, and frontend API integration are
pending implementation. Until then, both pages read mock data from
`frontend/src/lib/`; accepting or rejecting a request removes it from an
in-memory list that resets when the server restarts.

## Design

`frontend/DESIGN.md` is the design reference. The UI keeps the layout of the
challenge's reference image (search band, result card, numbered pagination) and
deliberately changes its colours and type: ink-black actions, flat white cards,
Cal Sans headings, and green as a single accent. The reference's white-on-green
and green-on-white text is about 2.65:1, below the 4.5:1 that body text needs.

Inter and Cal Sans load through `next/font/google`, so `pnpm build` needs
network access to download them.
