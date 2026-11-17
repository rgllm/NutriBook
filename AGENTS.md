# NutriBook agent guide

NutriBook is a submission for a senior full-stack technical challenge. Patients
(guests, identified by email) search for nutritionists and request appointments;
nutritionists accept or reject those requests. Reviewers will read every line, so
the code is the deliverable.

## How the work is judged

The evaluation criteria, in order of importance. When two goals conflict, the
higher one wins.

1. **Use case coverage.** Every requirement below works end to end.
2. **Design accuracy.** The UI matches the challenge's reference images.
   `frontend/DESIGN.md` is the source of truth for tokens and components.
3. **Database design.** Models are appropriate and efficient: correct
   constraints, foreign keys, and indexes for the queries the app runs.
4. **Code quality.** Clear, modular, reusable, maintainable, and correct.

## Stack

- `backend/`: Rails 8.1 API, Ruby 3.4, PostgreSQL, Minitest, RuboCop (Rails
  Omakase), Brakeman, bundler-audit. Runs in Docker through `compose.yaml`,
  with Meilisearch ranking typed searches and falling back to SQL when it is
  down (`NutritionistIndex`).
- `frontend/`: Next.js 16 (App Router), React 19 with the React Compiler,
  TypeScript, Tailwind CSS v4, shadcn/ui on Base UI, pnpm.
- `e2e/`: Playwright end-to-end tests over the whole stack, run against a
  separate Compose project (`nutribook-e2e`) so development data stays intact.

The challenge requires Ruby on Rails 7.2+, PostgreSQL, and a JavaScript
framework. Do not swap any of these out.

## Requirements

### Guest flow

- List available nutritionists and the services they offer. A service has an
  arbitrary name, price, location, and duration.
- Search nutritionists by their name, by the name of a service, and by location.
- Request an appointment with a chosen nutritionist by giving a name and email
  and picking a date and time.
- A guest has at most one pending request. Submitting a new one invalidates that
  guest's existing pending requests.
- A request stays pending until the nutritionist it was sent to accepts or
  rejects it.
- Accepting a request automatically rejects every other pending request for that
  nutritionist that overlaps it in time.
- The guest gets an email when their request is answered, accepted or rejected.
  This includes requests rejected automatically by an overlap.

### Nutritionist flow

- View the list of appointment requests.
- Accept or reject each one. The guest is notified by email.

### Pages

**Nutritionist search page** (main page)

- One search input for name or type of service, and another for location.
- With no location or an invalid one, default to "Braga".
- The list of nutritionists matching the search.
- Per nutritionist, a "Schedule Appointment" button that opens a modal collecting
  the guest's name, email, and desired date and time.
- Per nutritionist, a "Personal Page" button. It may be a non-functional
  placeholder.

**Pending appointment requests page** (nutritionist view)

- Must be built with the JavaScript framework. No authentication.
- Each request shows the guest's information, the requested date and time, and
  Accept and Reject actions.
- Answering a request triggers the guest email.

### Extra-mile features

Optional, valued by reviewers. Do them after the core flows are solid.

- Sort results by distance, nearest first.
- Improved search through an external search engine or tool.
- Utility-first CSS (already in place with Tailwind).
- Internationalization with more than one language.

### Submission

- A public Git repository.
- `README.md` with setup instructions, how to run the app, and notes on relevant
  decisions. Update it whenever setup, commands, or a notable decision changes.
- Seeds that create multiple nutritionists with services at different prices and
  locations, so search can be tested right after setup.
- A defined testing strategy and a test suite covering the implemented features.

## Domain rules that are easy to get wrong

- The one-pending-request rule and the overlap rejection are invariants. Enforce
  them in the backend inside a transaction, and back them with database
  constraints where PostgreSQL can express them. Never rely on the frontend.
- Two nutritionists answering, or two guests submitting, at the same moment must
  not break those invariants. Think about locking before writing the code.
- Overlap depends on the service's duration, not only the start time.
- Every state change that answers a request sends exactly one email, including
  the automatic rejections.
- Store times in UTC and be deliberate about the time zone shown to the user.

## Engineering standards

- Hold lint, tests, and test stability to the same standard as the features. If
  you see a lint error, a failing test, or a flaky test, fix it, even when your
  current work did not cause it.
- Every feature ships with tests. Backend rules get model and request tests, and
  mailers get mailer tests. Frontend logic gets Vitest tests, components get
  Testing Library tests in `*.test.tsx`, and API fixtures go through `stubApi`
  so they are checked against `openapi.yaml`. A change to a user flow updates
  its spec in `e2e/`.
- Before calling work done, run the checks for the side you touched and report
  the real result.

```sh
# Backend (from the project root, with the stack running)
docker compose exec backend bin/ci        # rubocop, audits, brakeman, tests, seeds
docker compose exec backend bin/rails test
docker compose exec backend bin/rubocop

# Frontend
cd frontend
pnpm lint
pnpm typecheck
pnpm build

# End to end (from the project root; each run resets the e2e stack)
pnpm e2e
pnpm e2e:lint
pnpm e2e:typecheck
```

## Working in this codebase

- Consider the whole project before suggesting or writing code: both apps, the
  README, `frontend/DESIGN.md`, and the requirements above.
- Do not duplicate existing functionality or add a second implementation that
  conflicts with the first. Search for an existing helper, component, model
  method, or token before creating one, and extend it when it almost fits.
- Take earlier decisions and already implemented features into account, so new
  answers and code do not contradict or repeat them. If an earlier decision now
  looks wrong, say so and change it in one place instead of working around it.
- Anticipate what is needed next and suggest solutions that were not asked for:
  missing edge cases, a requirement the change puts at risk, a simpler design, a
  gap in the tests or the README. Suggest it; keep the diff to what was asked.

### Frontend

- Server Components are the default. Pages, layouts, and data fetching run on
  the server and call the Rails API there. Add `"use client"` only to the
  smallest leaf that needs state, effects, or browser APIs (a dialog, a date
  picker, a form's pending state), and pass server-rendered content into it as
  `children` instead of moving a whole subtree to the client.
- Use the latest React and Next.js features in place of older patterns:
  - Search state lives in the URL (`searchParams`), so results are
    server-rendered and shareable. No client-side fetching in `useEffect`.
  - Mutations (request an appointment, accept, reject) are Server Actions used
    through `<form action>`, with `useActionState` for results and errors,
    `useFormStatus` for pending state, and `useOptimistic` where it helps.
    Revalidate the affected data from the action.
  - Stream with `<Suspense>` and `loading.tsx`; handle failures with `error.tsx`
    and `not-found.tsx`.
  - `params` and `searchParams` are async; await them.
- This project runs Next.js 16 and React 19, which are newer than most examples
  online. Check the documentation for the installed versions before using an
  API, and do not use deprecated ones (Pages Router patterns,
  `getServerSideProps`, `forwardRef`, `useFormState`).
- Follow `frontend/DESIGN.md`. Use the semantic theme tokens from
  `src/app/theme.css`, never hard-coded colours.
- Reuse the components in `src/components/ui/` before building new ones. Add
  shadcn components through the shadcn CLI so they pick up the project theme.
- The React Compiler is on, so do not add `useMemo`, `useCallback`, or
  `React.memo` by hand without a measured reason.
- Use pnpm only.

### Backend

- The Rails app is an API. The Next.js server talks to it over JSON from Server
  Components and Server Actions. CORS in `config/initializers/cors.rb` matters
  only for calls made from the browser.
- Keep controllers thin and put domain rules in models or small plain objects.
- Every schema change is a migration with the constraints and indexes it needs.
- Keep `db/seeds.rb` idempotent and in step with the schema; CI replants it.
