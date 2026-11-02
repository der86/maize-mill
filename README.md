# Maize Mill Tracker

A stock-tracking system for a maize milling plant: records maize purchased, flour bales
and bran produced per milling batch, and flour bales sold (with revenue) — plus a
dashboard summarizing stock on hand and trends.

**Stack:** React Native (Expo) · NativeWind (Tailwind CSS for React Native) · Node.js/Express · MongoDB (Mongoose) · JWT auth

```
maize-mill-app/
├── backend/     Express API + MongoDB models
└── frontend/    Expo React Native app, styled with NativeWind (test with Expo Go)
```

**About the styling:** the app uses [NativeWind](https://www.nativewind.dev/) v4, which lets
you write Tailwind CSS utility classes (`className="bg-mill-orange rounded-xl p-4"`) directly
on React Native components. It compiles those classes to native styles at build time — there's
no actual CSS or DOM involved, so it works identically on iOS, Android and Expo Go. All the
brand colors (`mill-orange`, `mill-blue`, `mill-green`, `mill-red`, etc.) are defined once in
`frontend/tailwind.config.js` — change them there to re-theme the whole app.

---

## 0. Everything you need installed, at a glance

| What | Why | Install |
|---|---|---|
| Node.js 18+ & npm | runs both backend and frontend tooling | [nodejs.org](https://nodejs.org) |
| MongoDB (local) **or** a free MongoDB Atlas cluster | the database | [mongodb.com](https://www.mongodb.com/try/download/community) or [Atlas](https://www.mongodb.com/atlas) |
| Backend npm packages | Express, Mongoose, JWT, security middleware | `cd backend && npm install` (see §2) |
| Frontend npm packages | Expo, React Navigation, NativeWind/Tailwind, chart-kit | `cd frontend && npm install` (see §3) |
| Expo Go app | run the app on your own phone for testing | App Store / Google Play |
| (Optional) Postman or `curl` | test the API directly without the app | [postman.com](https://www.postman.com/) |
| (For real deployment later) `eas-cli` | build a real installable app instead of Expo Go | `npm install -g eas-cli` |

Nothing else needs installing globally — everything else (NativeWind, Tailwind, nodemon, etc.)
comes down with the two `npm install` runs below.

---

## 1. Prerequisites

- Node.js 18+ and npm
- MongoDB — either:
  - Local: install MongoDB Community Server and run `mongod`, or
  - Free cloud option: a [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (easier if
    you don't want to manage a database server)
- The **Expo Go** app on your phone (App Store / Google Play) — same Wi-Fi network as
  your computer
- (Optional) [Postman](https://www.postman.com/) or `curl` for testing the API directly

---

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` — your local (`mongodb://127.0.0.1:27017/maize_mill`) or Atlas connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — generate strong random values:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
  Run it twice and use a different value for each secret.
- `CORS_ORIGINS` — leave as-is for now (Expo Go doesn't send an `Origin` header, so it's
  allowed through regardless)
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — the first login you'll use

Create the first admin user (the API has no public signup — accounts are admin-created only):

```bash
npm run seed:admin
```

Start the API:

```bash
npm run dev      # auto-restarts on changes, needs nodemon (already a devDependency)
# or
npm start
```

You should see `MongoDB connected: ...` and `Server running in development mode on port 5000`.

**Verify it's alive:**
```bash
curl http://localhost:5000/api/health
```
Expect: `{"success":true,"message":"API is healthy",...}`

---

## 3. Frontend setup (Expo)

```bash
cd frontend
npm install
```

NativeWind is already configured (`tailwind.config.js`, `babel.config.js`, `metro.config.js`,
`global.css` are all set up) — `npm install` pulls in `nativewind` and `tailwindcss` along with
everything else, nothing extra to run. The first time you start the bundler after installing,
clear the Metro cache so it picks up the Tailwind config cleanly:

```bash
npx expo start --clear
```

After that, `npx expo start` works normally for subsequent runs.

**Important — point the app at your computer's IP, not `localhost`.** Your phone (running
Expo Go) is a separate device on the network, so `localhost` on the phone means the phone
itself, not your computer.

1. Find your computer's LAN IP:
   - Mac/Linux: `ifconfig | grep inet` (or `ip a`)
   - Windows: `ipconfig` → "IPv4 Address"
   - Look for something like `192.168.1.10`
2. Edit `frontend/app.json` → `expo.extra.apiUrl` → set it to
   `http://<your-ip>:5000/api`, e.g. `http://192.168.1.10:5000/api`

Start Expo:

```bash
npx expo start
```

This opens a QR code in your terminal / browser. Scan it with the Expo Go app (iOS: use
the Camera app; Android: use the Expo Go app's built-in scanner). The app will bundle and
load on your phone.

Make sure your phone and computer are on the **same Wi-Fi network**. If they can't see each
other (common on office/guest Wi-Fi that isolates devices), run `npx expo start --tunnel`
instead — slower, but routes around network isolation.

---

## 4. Manual test checklist (do this before treating it as production-ready)

Since testing requires a live phone, network, and database, run through this yourself:

- [ ] `npm run seed:admin` succeeds and prints the admin email
- [ ] Backend health check returns success (`/api/health`)
- [ ] App loads in Expo Go and shows the Login screen, **with colors and rounded buttons
      rendering** (confirms NativeWind/Tailwind classes compiled correctly — if everything
      renders unstyled/plain, run `npx expo start --clear` once)
- [ ] Log in with the seeded admin credentials → lands on Dashboard
- [ ] Log in with a wrong password 5 times in a row → account locks for 15 minutes
      (confirms brute-force protection works)
- [ ] Add a maize purchase → appears in the Purchases list, total cost calculated correctly
- [ ] Add a milling batch → appears in Milling list; check the yield% shown on the add
      screen looks sane (typically 80–95% for maize milling)
- [ ] Record a flour sale → appears in Sales list, amount = bales × price
- [ ] Tap any purchase/milling/sale in a list → opens it pre-filled for editing; save a
      change and confirm it updates in the list
- [ ] As admin or manager, delete a record from its edit screen → confirmation prompt
      appears, then it disappears from the list and dashboard totals update
- [ ] Log in as an `operator` (create one via `POST /api/auth/register` while logged in
      as admin) → open an existing record → the Delete button should not appear (only
      admin/manager can delete)
- [ ] Dashboard reflects updated numbers after pull-to-refresh: maize in stock should equal
      total bought minus total milled; flour bales in stock should equal total produced
      minus total sold
- [ ] Log out, then log back in — session should work cleanly
- [ ] Force-quit the app, reopen — should stay logged in (tokens persisted in
      SecureStore) until the refresh token expires (7 days by default)
- [ ] Try creating a second (non-admin) user via `POST /api/auth/register` while logged in
      as a non-admin → should be rejected (403)
- [ ] Try hitting any `/api/*` route without a token → should be rejected (401)

If a step fails, check the backend terminal for the logged error first — the API returns
descriptive messages and logs everything via Winston (`backend/logs/`).

---

## 5. Security measures already built in

- **Passwords**: hashed with bcrypt (12 salt rounds), never returned in any API response
- **Auth**: short-lived JWT access tokens (15 min) + rotating refresh tokens (7 days),
  stored on-device in `expo-secure-store` (OS-level encrypted storage, not AsyncStorage)
- **Account lockout**: 5 failed logins locks the account for 15 minutes
- **No public signup**: only an existing admin can create new users
- **Role-based access**: `admin` / `manager` / `operator` — editing and deleting records is
  restricted to admin/manager
- **Input validation**: every write endpoint validates and sanitizes input server-side
  (`express-validator`) — the client-side checks are a convenience, not the real defense
- **NoSQL injection protection**: `express-mongo-sanitize` strips `$`/`.` operators from
  user input
- **XSS protection**: `xss-clean` sanitizes input
- **HTTP security headers**: `helmet` (CSP, HSTS, disables `X-Powered-By`, etc.)
- **Rate limiting**: general API limiter + a stricter one on `/api/auth/login`
- **HTTP parameter pollution protection**: `hpp`
- **CORS**: origin allow-list (configurable via `.env`)
- **No secrets in the repo**: `.env` is git-ignored; `.env.example` has placeholders only
- **Errors don't leak internals**: stack traces are only included in non-production
  responses

### Before you actually go to production, also do this yourself:
- [ ] Put the API behind **HTTPS** (e.g. via a reverse proxy like Nginx + Let's Encrypt, or
  a platform that provides TLS termination — Render, Railway, Fly.io, etc.)
- [ ] Use MongoDB Atlas (or a properly firewalled self-hosted instance) with a
  strong, unique database user password and IP allow-listing
- [ ] Set `NODE_ENV=production` and real, unique `JWT_SECRET`/`JWT_REFRESH_SECRET` values
  on the server — never reuse the ones from `.env.example` or your dev `.env`
- [ ] Tighten `CORS_ORIGINS` to your actual deployed app origins
- [ ] Set up automated MongoDB backups
- [ ] Change the seeded admin password immediately after first login
- [ ] Consider adding audit logging for who edited/deleted which records (the schema
  already stores `recordedBy` on every record as a starting point)
- [ ] Build the Expo app as a standalone binary (`eas build`) for real distribution instead
  of relying on Expo Go, which is a development/testing tool

---

## 6. API reference (quick summary)

All routes except `/api/health`, `/api/auth/login`, `/api/auth/refresh` require
`Authorization: Bearer <accessToken>`.

| Method | Route                  | Who                  | Purpose                          |
|--------|-------------------------|-----------------------|-----------------------------------|
| POST   | /api/auth/login          | anyone with account   | log in                            |
| POST   | /api/auth/refresh        | anyone with valid token | get new access token            |
| POST   | /api/auth/logout         | logged in              | invalidate refresh token         |
| POST   | /api/auth/register       | admin only              | create a new user                |
| GET    | /api/purchases           | logged in               | list maize purchases (paginated) |
| POST   | /api/purchases           | logged in               | record a maize purchase          |
| GET    | /api/milling             | logged in               | list milling batches             |
| POST   | /api/milling             | logged in               | record a milling batch           |
| GET    | /api/sales               | logged in               | list flour sales                 |
| POST   | /api/sales               | logged in               | record a flour sale              |
| GET    | /api/dashboard/summary   | logged in               | stock levels, totals, 30-day trend |

`PUT`/`DELETE` on purchases/milling/sales are restricted to `admin`/`manager`.
