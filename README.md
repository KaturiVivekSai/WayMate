# Waymate

Waymate is a light, student-first campus mobility prototype built with React, Vite, Tailwind-style utility classes, and lucide-react.

## What changed in this version

- Branded loading screen and light landing page
- Sign up / log in flow without modal switching
- Signup captures username, registration number, campus email, phone, password, bike number and profile picture
- Generated Waymate User ID support in the login field
- Persistent demo database in localStorage with migration-safe loading
- User count increases when a new account is created
- Profile vehicle details for bike colour, model and EV status
- Honest trust states for new users with no reviews
- Closest-match campus ride fallback around PVPSIT Parking
- Community credits wallet remains connected to ride mutations
- Smart demand dashboard with ride, request, wallet and event signals
- Add-campus-event flow
- Landing-page shared ride, member and estimated carbon statistics
- Optional backend/Supabase schema under `backend/supabase-schema.sql`
- No background video

## Demo account

Email: `koushik@campus.edu`
Password: `mootcourt2026`

## Run

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

The supplied development environment used for packaging did not have a working Vite native optional dependency installed, so the final archive intentionally excludes `node_modules`. Run `npm install` in a normal development environment before building.

## Backend direction

The current demo storage is deliberately isolated in `src/services/api.js` so a real backend can replace it without rewriting the page components. A normalized Supabase schema is provided in `backend/supabase-schema.sql`.

Do not put service-role keys in the Vite frontend. Use the Supabase anon key only with proper Row Level Security, or put privileged operations behind a server/API layer.


## Waymate database contract

The supplied PostgreSQL diagram is treated as the source of truth. The SQL file intentionally uses these tables only: `profiles`, `vehicles`, `ride_offers`, `ride_requests`, `bike_requests`, `bookings`, `credit_transactions`, and `notifications`. Smart Demand reads the ride/booking/request/vehicle records rather than creating an analytics-only table.

If Supabase is configured with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, Smart Demand will read those exact PostgreSQL tables through the Supabase REST API. Without those variables the project runs its existing local demo persistence, so the UI remains usable for judging and development.
