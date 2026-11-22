# Prompt Log — Rescue the Surplus
**Maintained by:** Anubhav Anand  
**Event:** ACE Builders Hackathon 2026 by Codebenders  
**Track:** Problem Statement 2 — Society and Environment: Rescue the Surplus  
**Purpose:** Official Codebenders platform usage proof, key prompts, and iterative agent orchestration log  

> ⚠️ **Evaluation Reference:** Scored under *Build Quality and Use of Codebenders (15%)*. This log documents the exact structured prompts, architecture context injections, and subagent orchestration passes executed during development across the four core Codebenders sessions.

---

## Specification-Driven Prompt Methodology (Context Injection Architecture)

Rather than relying on conversational or fragmented instructions, development followed a rigorous **Specification-Driven Prompt Engineering** pattern. Complete, ground-truth technical specifications were authored upfront and injected into Nexen and its subagents (`explore`, `editor`, `tester`):

| Document Injected | Role in Prompt Engineering & Codebenders Workflow |
|---|---|
| **`02-TECH-ARCHITECTURE.md`** | Injected as master system architecture prompt: directory hierarchy, 4-part scoring algorithms, state machine transitions, and PWA offline rules. |
| **`03-DATA-MODEL.md`** | Enforced database invariants at the prompt level: `CHECK (receiver_charge = 0)`, relational constraints, and zero-fee mandates. |
| **`04-API-CONTRACT.md`** | Ground-truth contract prompt used by read-only audit subagents (`explore`, `tester`) to verify all 6 Express endpoints. |
| **`05-SEED-DATA.md`** | Injected to seed realistic Bengaluru coordinates, donors, receivers, and volunteers without real personal data (100% synthetic). |
| **`PRD-FULL.md` & `08-BUSINESS-VIABILITY.md`** | Established the Meera hero persona, CSR logistics gap funding models, and verbatim food safety disclaimers. |

---

## Session 1: Initial Bootstrap & Full-Stack Application Scaffold

### Prompt 1.1
```markdown
```
You are building a production-quality web application for the ACE Builders Hackathon 2026.

## Project: Rescue the Surplus

A mobile-first Progressive Web App (PWA) that connects surplus food donors with nearby receivers inside a short spoilage window, coordinates volunteer pickup, and proves social impact through a transparent dashboard.

---

## STACK — Do not deviate

- Frontend: React 18 + Vite + TailwindCSS
- PWA: vite-plugin-pwa (manifest + service worker + offline fallback)
- Backend: Node.js + Express.js (REST API)
- Database: SQLite with better-sqlite3 (file-based, zero config)
- No ORM — use raw SQL with better-sqlite3's synchronous API
- Package manager: npm

---

## REPOSITORY STRUCTURE

Generate this exact folder structure:

rescue-surplus-food/
├── client/
│   ├── public/
│   │   ├── manifest.json
│   │   ├── icon-192.png       (green food rescue icon, 192×192)
│   │   ├── icon-512.png       (same, 512×512)
│   │   └── offline.html       (simple "You are offline. Please reconnect." page)
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx            (React Router + RoleContext provider)
│   │   ├── context/
│   │   │   └── RoleContext.jsx
│   │   ├── components/
│   │   │   ├── RoleSwitch.jsx
│   │   │   ├── Timer.jsx
│   │   │   ├── ScoreCard.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── MetricBox.jsx
│   │   │   └── Disclaimer.jsx
│   │   ├── pages/
│   │   │   ├── PostSurplus.jsx
│   │   │   ├── MatchClaim.jsx
│   │   │   ├── StatusBoard.jsx
│   │   │   ├── Impact.jsx
│   │   │   └── ListingDetail.jsx
│   │   ├── hooks/
│   │   │   ├── useTimer.js
│   │   │   └── useRole.js
│   │   └── api/
│   │       └── client.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/
│   ├── index.js
│   ├── db/
│   │   ├── connection.js
│   │   ├── schema.sql
│   │   └── seed.js
│   ├── routes/
│   │   ├── listings.js
│   │   └── impact.js
│   ├── middleware/
│   │   └── validate.js
│   ├── services/
│   │   ├── matching.js
│   │   ├── expiry.js
│   │   └── impact.js
│   └── package.json
├── .env.example
├── .gitignore
└── package.json   (root: scripts to run client + server together)

---

## DATABASE SCHEMA

Create server/db/schema.sql with these exact tables:

CREATE TABLE donors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  area TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  is_verified INTEGER DEFAULT 0
);

CREATE TABLE receivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  area TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  capacity_meals INTEGER NOT NULL,
  need_score REAL NOT NULL DEFAULT 0.5
);

CREATE TABLE volunteers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  available INTEGER DEFAULT 1
);

CREATE TABLE listings (
  id TEXT PRIMARY KEY,
  donor_id TEXT NOT NULL REFERENCES donors(id),
  food_type TEXT NOT NULL CHECK (food_type IN ('veg','non_veg','egg')),
  quantity_value REAL NOT NULL CHECK (quantity_value > 0),
  quantity_unit TEXT NOT NULL CHECK (quantity_unit IN ('meals','kg')),
  pickup_by DATETIME NOT NULL,
  storage TEXT NOT NULL CHECK (storage IN ('hot','cold','ambient')),
  allergens TEXT NOT NULL DEFAULT '[]',
  area TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('posted','claimed','collected','delivered','expired')),
  claimed_by_receiver_id TEXT REFERENCES receivers(id),
  claimed_by_volunteer_id TEXT REFERENCES volunteers(id),
  posted_at DATETIME NOT NULL DEFAULT (datetime('now')),
  claimed_at DATETIME,
  collected_at DATETIME,
  delivered_at DATETIME,
  expires_at DATETIME NOT NULL
);

CREATE TABLE matches (
  listing_id TEXT NOT NULL REFERENCES listings(id),
  receiver_id TEXT NOT NULL REFERENCES receivers(id),
  score REAL NOT NULL,
  distance_score REAL NOT NULL,
  quantity_fit_score REAL NOT NULL,
  time_to_spoil_score REAL NOT NULL,
  need_score REAL NOT NULL,
  ranked_at DATETIME NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (listing_id, receiver_id)
);

CREATE TABLE impact_events (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id),
  kind TEXT NOT NULL,
  value REAL NOT NULL,
  formula TEXT NOT NULL,
  inputs_json TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id),
  donor_contribution REAL NOT NULL DEFAULT 0,
  csr_coverage REAL NOT NULL DEFAULT 0,
  receiver_charge REAL NOT NULL DEFAULT 0 CHECK (receiver_charge = 0)
);

---

## SEED DATA

Seed these exact records in server/db/seed.js. Run seedIfEmpty() on boot.

DONORS:
D1 | Meera Catering Co | caterer | Koramangala | 12.9352 | 77.6245
D2 | Spice Garden Restaurant | restaurant | Indiranagar | 12.9784 | 77.6408
D3 | PESIT Hostel Mess | hostel_mess | Banashankari | 12.9165 | 77.5478
D4 | Sunrise Events | event_organiser | Whitefield | 12.9698 | 77.7499
D5 | The Grand Buffet | restaurant | HSR Layout | 12.9116 | 77.6389
D6 | City College Canteen | hostel_mess | Jayanagar | 12.9308 | 77.5831

RECEIVERS:
R1 | Asha Community Kitchen | community_kitchen | Koramangala | 12.9340 | 77.6220 | cap:80 | need:0.9
R2 | Hope NGO | ngo | Indiranagar | 12.9760 | 77.6390 | cap:50 | need:0.7
R3 | Shelter First | shelter | HSR Layout | 12.9100 | 77.6370 | cap:40 | need:0.85
R4 | Priya (Volunteer) | volunteer | Whitefield | 12.9700 | 77.7510 | cap:10 | need:0.5
R5 | New Life Kitchen | community_kitchen | Banashankari | 12.9180 | 77.5490 | cap:60 | need:0.75
R6 | Care Shelter | shelter | Jayanagar | 12.9290 | 77.5820 | cap:35 | need:0.8
R7 | FoodBridge NGO | ngo | Koramangala | 12.9360 | 77.6260 | cap:70 | need:0.65
R8 | Raju (Volunteer) | volunteer | Indiranagar | 12.9780 | 77.6420 | cap:15 | need:0.55

VOLUNTEERS:
V1 | Arvind Kumar | Koramangala | 12.9345 | 77.6230 | available:1
V2 | Sunita Devi | Indiranagar | 12.9775 | 77.6400 | available:1
V3 | Mohan Das | HSR Layout | 12.9110 | 77.6380 | available:0

LISTINGS (8 records, mixed states):
L1 | D1 | veg | 60 | meals | hot | [] | Koramangala | posted
L2 | D2 | veg | 25 | meals | ambient | ["dairy"] | Indiranagar | claimed (by R1, V1)
L3 | D3 | egg | 15 | kg | cold | ["egg"] | Banashankari | collected (by V2)
L4 | D4 | non_veg | 40 | meals | hot | ["nuts"] | Whitefield | delivered
L5 | D5 | veg | 30 | meals | ambient | [] | HSR Layout | posted
L6 | D6 | veg | 10 | kg | cold | ["gluten"] | Jayanagar | expired
L7 | D1 | veg | 20 | meals | hot | [] | Koramangala | delivered
L8 | D2 | non_veg | 50 | meals | hot | ["shellfish"] | Indiranagar | posted

Also seed 30 days of impact_events (one delivered listing per day, 10–80 meals each) and payments records with receiver_charge = 0 always.

---

## API ROUTES

Build these exact 6 routes:

POST   /api/listings                  — create listing (60-second donor flow)
GET    /api/listings/available        — ranked matches with score breakdown
POST   /api/listings/:id/claim        — claim listing + assign nearest volunteer
POST   /api/listings/:id/transition   — {to: "collected"|"delivered", actor_id}
GET    /api/impact                    — metrics with formula_meta + funding_split
GET    /api/listings/:id              — detail + handling + allergens + disclaimer

Validation:
- Reject POST /listings if pickup_by is missing or in the past
- Reject POST /listings if quantity_value <= 0
- Reject POST /listings/:id/claim if listing is expired → 409
- Reject POST /listings/:id/claim if already claimed → 409
- Reject POST /listings/:id/transition if transition is not posted→claimed→collected→delivered → 422
- All errors: { "error": "message", "field": "optional" } — no stack traces

---

## SCORING ALGORITHM (server/services/matching.js)

score = (0.35 × distance_score) + (0.25 × quantity_fit_score) + (0.25 × time_to_spoil_score) + (0.15 × need_score)

distance_score      = 1 - (euclidean_distance_km / 15)   // 15km = max zone radius
quantity_fit_score  = min(listing.quantity_value, receiver.capacity_meals) / receiver.capacity_meals
time_to_spoil_score = max(0, minutes_remaining / 120)     // 120 min = max window
need_score          = receiver.need_score                  // from seed data

GET /api/listings/available response per item:
{
  "listing": { ...all fields, donor_name, donor_type },
  "score": 0.74,
  "components": {
    "distance_score": 0.82,
    "quantity_fit_score": 0.75,
    "time_to_spoil_score": 0.68,
    "need_score": 0.60
  }
}

Expiry check: before building the response, mark all listings where now() > expires_at as "expired". Exclude expired listings from the response.

---

## THE FIVE SCREENS

### Screen 1 — PostSurplus.jsx (Donor view)
- A countdown timer starts on component mount (counts UP from 0:00)
- Form fields — all pickers/toggles, no typing required:
  - food_type: 3 large buttons (Veg / Non-Veg / Egg) — min 48px height
  - quantity_value: number input or stepper
  - quantity_unit: toggle (Meals / kg)
  - pickup_by: time picker defaulting to now + 2 hours
  - storage: 3 buttons (Hot / Cold / Ambient)
  - allergens: multi-select chips (Dairy, Nuts, Gluten, Shellfish, None)
  - donor_id: select from seeded donors (default D1 Meera)
- Submit button: large, green, full-width
- On submit: call POST /api/listings, freeze the timer display, show success screen with listing ID and matched_count
- Success screen shows: "Posted in X:XX • 3 receivers matched • Listing #L9"

### Screen 2 — MatchClaim.jsx (Receiver view)
- Calls GET /api/listings/available
- Shows a ranked list of listing cards
- Each card MUST show:
  - Food type, quantity, area, pickup-by time
  - Score bar (0–100%)
  - Four component rows with label + value:
    "📍 Distance  0.82"
    "🍱 Quantity fit  0.75"
    "⏱ Time remaining  0.68"
    "❤️ Need  0.60"
  - Allergen chips
  - Claim button (green, full-width, min 48px)
- On claim: call POST /api/listings/:id/claim with receiver_id
- If 409 expired: show red banner "This listing has expired — please choose another"
- If success: show "Claimed! Volunteer Arvind Kumar is on the way"

### Screen 3 — StatusBoard.jsx (All roles)
- Shows ALL listings (posted, claimed, collected, delivered, expired)
- Each row: listing ID, food type, quantity, area, status badge, last transition timestamp + actor
- Status badges: color-coded
  - posted: blue
  - claimed: yellow/amber
  - collected: orange
  - delivered: green
  - expired: grey
- Volunteer view: shows "Mark Collected" button on claimed listings
- Donor view: shows "Mark Delivered" button on collected listings
- Auto-refresh or manual "Refresh" button

### Screen 4 — Impact.jsx (All roles)
- Four headline metric cards:
  1. Meals Saved: [number]
  2. kg Diverted: [number]
  3. CO₂e Avoided: [number] kg
  4. Cost per Meal: ₹[number]
- EVERY metric card is clickable and expands to show:
  - Formula string (e.g. "meals_saved × 0.4 kg per meal")
  - Input values used (e.g. "meals_saved: 1,247 | kg_per_meal: 0.4")
- Funding split panel (always visible below metrics):
  "Donor contributed ₹4,280 | CSR covered ₹10,480 | Receiver paid ₹0"
  The ₹0 must be bold and green.

### Screen 5 — ListingDetail.jsx (All roles)
- Shows full listing detail
- Must include:
  - Food type, quantity, pickup-by time, storage requirement
  - Allergen chips (or "None declared")
  - Bold red line: "Do not consume after [datetime]"
  - Time remaining countdown
  - Disclaimer (always visible, never hidden):
    "Rescue the Surplus connects donors and receivers. We do not inspect, certify, or guarantee the safety of any food item. Handle all food with standard hygiene practices."
- If role = volunteer: show pickup instructions (donor area + donor name)
- If listing is expired: show red "EXPIRED" banner, hide Claim button

---

## GLOBAL REQUIREMENTS

RoleSwitch component: persistent dropdown at the top of every screen
- Options: Donor | Receiver | Volunteer | Admin
- Stored in RoleContext, used by all pages to conditionally show UI elements

Navigation: tab bar or nav links at bottom (mobile pattern):
- Post | Match | Status | Impact

Touch targets: ALL buttons minimum 48 × 48 CSS pixels

PWA: vite.config.js must configure vite-plugin-pwa with:
- name: "Rescue the Surplus"
- short_name: "RescueSurplus"
- display: "standalone"
- theme_color: "#16a34a"
- icons: 192px and 512px
- workbox navigateFallback: "/offline.html"

Mobile viewport: test at 390px width. No horizontal scroll.

Error states: every API call must have a loading state and an error state shown to the user.

---

## ENVIRONMENT VARIABLES (.env.example)

PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DB_PATH=./db/rescue.db

---

## ROOT package.json SCRIPTS

{
  "scripts": {
    "dev": "concurrently \"cd client && npm run dev\" \"cd server && node index.js\"",
    "build": "cd client && npm install && npm run build",
    "start": "cd server && node index.js"
  }
}

In production, server/index.js serves client/dist as static files.

---

## WHAT NOT TO BUILD

- No authentication (role switch only)
- No real maps or geolocation (use seeded coordinates)
- No payment gateway (show amounts only)
- No SMS, email, or push notifications
- No external API calls of any kind
- No WebSockets (polling or manual refresh is fine)
- No multi-city logic (single zone)

---

Begin by generating the complete project scaffold with all files listed above. Start with the database schema and seed data, then the Express server, then the React frontend. Generate all five screens completely.
```
```

### Prompt 1.2
```markdown
also you create a new folder inside the project folder i deided to use a s the git repo was that  a mistake
```

### Prompt 1.3
```markdown
the main dir is our project dir  in which youre in      /home/anubhavanand/Documents/ACE Builders Hackathon 2026/rescue-surplus-food/
```

### Prompt 1.4
```markdown
Yes, proceed immediately. 

1. Permission granted: Use the General Agent or any tool needed to create and write the files directly.
2. Paths: Your current working directory (.) is already the project root. Create `server/`, `client/`, and root config files directly here in `.`, with NO nested rescue-surplus-food folder.
3. Start now by creating the root files and the server scaffold:
   - Root: `package.json`, `.gitignore`, `.env.example`
   - Server: 
     - `server/package.json`
     - `server/index.js`
     - `server/db/schema.sql` (remember: CHECK (receiver_charge = 0) on payments)
     - `server/db/connection.js`
     - `server/db/seed.js` (with seedIfEmpty() on boot)
     - `server/middleware/validate.js`
     - `server/services/matching.js` (the 4-part scoring formula)
     - `server/services/expiry.js`
     - `server/services/impact.js`
     - `server/routes/listings.js`
     - `server/routes/impact.js`

Generate and write these files to disk now.
```

### Prompt 1.5
```markdown
The folders (server/db, server/middleware, server/routes, server/services) already exist on disk. Proceed with writing the server files one by one, starting with server/package.json, verifying each on disk before moving to the next.
```

### Prompt 1.6
```markdown
I confirm. Switch to the general agent now. Have the general agent write server/db/schema.sql and the remaining server files directly.
```

### Prompt 1.7
```markdown
The server is working. Leave the server files as they are. 

Move on immediately to building the client/ frontend:
Create the Vite + React + Tailwind + PWA app in ./client with the 5 screens:
1. PostSurplus.jsx (Screen 1: donor flow with 60s timer)
2. MatchClaim.jsx (Screen 2: receiver view with 4 score breakdown components)
3. StatusBoard.jsx (Screen 3: live 4-state lifecycle board)
4. Impact.jsx (Screen 4: clickable metrics revealing formulas + funding split)
5. ListingDetail.jsx (Screen 5: handling, allergens, food safety disclaimer)

Start scaffolding and writing ./client now.
```

### Prompt 1.8
```markdown
The error "parent directory does not exist" is happening because you are prefixing paths with "rescue-surplus-food/".

You are ALREADY inside the rescue-surplus-food directory.

Use paths starting directly with `client/`:
- `client/package.json` (NOT rescue-surplus-food/client/package.json)
- `client/vite.config.js`
- `client/src/App.jsx`

Write `client/package.json` directly to `./client/package.json` now.
```

### Prompt 1.9
```markdown
Yes, continue immediately! Write the remaining config and core frontend files:
1. `client/vite.config.js` (configured with vite-plugin-pwa, standalone mode, #16a34a theme, and workbox fallback to /offline.html)
2. `client/index.html`
3. `client/tailwind.config.js` and `client/postcss.config.js`
4. `client/public/offline.html` and `client/public/manifest.json`
5. `client/src/index.css` (with Tailwind base, components, utilities) and `client/src/main.jsx`
6. `client/src/App.jsx`

Write these files now, then we'll do the components and 5 screens.
```

### Prompt 1.10
```markdown
Finish client/src/App.jsx and build the client:

1. Update `client/src/App.jsx` to:
   - Wrap the app in `<RoleProvider>` (from `./context/RoleContext.jsx`)
   - Header: Render the `<RoleSwitch />` component and app title "Rescue the Surplus"
   - Body: Render the active tab screen (`PostSurplus`, `MatchClaim`, `StatusBoard`, `Impact`, or `ListingDetail` if an item is selected)
   - Bottom Navigation Bar: Mobile-friendly tabs with minimum 48px touch targets:
     [Post] | [Match] | [Status] | [Impact]

2. Ensure `client/public/icon-192.png` and `client/public/icon-512.png` exist (create simple placeholder image/binary files if missing).
'
3. Run `npm install` and `npm run build` inside `client/` to verify the build passes without errors!
```

### Prompt 1.11
```markdown
Frontend build is confirmed on disk and complete! Excellent work.
```

---

## Session 2: Technical Architecture Alignment & Screen 4 Impact Logic

### Prompt 2.1
```markdown
# Technical Architecture — Rescue the Surplus
**Version:** 1.0  
**Date:** 2026-11-22  
**Status:** LOCKED — paste this into Nexen before first code generation  
**Project:** ACE Builders Hackathon 2026, PS2  

---

## 1. What You Are Building

A **mobile-first Progressive Web App (PWA)** called **Rescue the Surplus**.

- Single public URL, deployable on Railway or Render
- Works on a cheap Android phone in bright daylight
- Every screen must look alive on first load — seeded data is mandatory
- No native app. No external APIs in the demo path. No real user data.

---

## 2. Tech Stack — Canonical, Do Not Deviate

| Layer | Technology | Version | Reason |
|---|---|---|---|
| Frontend framework | **React** | 18.x | Stable, wide component ecosystem |
| Build tool | **Vite** | 5.x | Fast HMR, native PWA plugin support |
| Styling | **TailwindCSS** | 3.x | Mobile-first utility classes, 48px touch targets trivial |
| PWA | **vite-plugin-pwa** | latest | Manifest + service worker + offline fallback in one plugin |
| Backend | **Express.js** | 4.x | Lightweight REST API, well-understood by all models |
| Database | **SQLite** via **better-sqlite3** | latest | Zero config, file-based, seed script runs on first boot |
| ORM/Query | **Raw SQL** (better-sqlite3 synchronous API) | — | No abstraction overhead, seed script is plain SQL |
| Runtime | **Node.js** | 20.x LTS | Stable, available on all free hosting tiers |
| Package manager | **npm** | — | Default, no pnpm/yarn complexity |

> **Do not substitute:** Next.js, Prisma, MongoDB, Supabase, Firebase, or any service requiring a paid API key.

---

## 3. Repository Structure

```
rescue-surplus-food/
├── client/                        ← React + Vite frontend (PWA)
│   ├── public/
│   │   ├── manifest.json          ← PWA manifest
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── src/
│   │   ├── main.jsx               ← Entry point
│   │   ├── App.jsx                ← Router + role context
│   │   ├── components/
│   │   │   ├── RoleSwitch.jsx     ← Persistent donor/receiver/volunteer/admin toggle
│   │   │   ├── Timer.jsx          ← 60-second countdown, freezes on submit
│   │   │   ├── ScoreCard.jsx      ← Match listing card with 4 score components
│   │   │   ├── StatusBadge.jsx    ← posted/claimed/collected/delivered badge
│   │   │   ├── MetricBox.jsx      ← Clickable impact metric with reveal panel
│   │   │   └── Disclaimer.jsx     ← Food safety disclaimer, reused on every listing
│   │   ├── pages/
│   │   │   ├── PostSurplus.jsx    ← Screen 1 — donor flow, 60-second timer
│   │   │   ├── MatchClaim.jsx     ← Screen 2 — receiver match list + claim
│   │   │   ├── StatusBoard.jsx    ← Screen 3 — live status of all listings
│   │   │   ├── Impact.jsx         ← Screen 4 — impact dashboard, click-to-reveal
│   │   │   └── ListingDetail.jsx  ← Screen 5 — handling, allergens, disclaimer
│   │   ├── hooks/
│   │   │   ├── useTimer.js        ← Start/stop/freeze timer logic
│   │   │   └── useRole.js         ← Current role from context
│   │   ├── context/
│   │   │   └── RoleContext.jsx    ← Global role state (donor/receiver/volunteer/admin)
│   │   └── api/
│   │       └── client.js          ← fetch wrapper, base URL from env
│   ├── index.html
│   ├── vite.config.js             ← vite-plugin-pwa config here
│   └── package.json
│
├── server/                        ← Express.js REST API
│   ├── index.js                   ← App entry, middleware, route mounting
│   ├── db/
│   │   ├── connection.js          ← better-sqlite3 singleton
│   │   ├── schema.sql             ← All CREATE TABLE statements
│   │   └── seed.js                ← Seed script: donors, receivers, volunteers, listings, impact history
│   ├── routes/
│   │   ├── listings.js            ← POST /, GET /available, POST /:id/claim, POST /:id/transition, GET /:id
│   │   └── impact.js              ← GET /api/impact
│   ├── middleware/
│   │   └── validate.js            ← Field validation, error shape: { error, field? }
│   ├── services/
│   │   ├── matching.js            ← Score calculation: 0.35×dist + 0.25×qty + 0.25×time + 0.15×need
│   │   ├── expiry.js              ← Lazy expiry check: marks expired on every GET /available
│   │   └── impact.js              ← Metric calculations + formula metadata
│   └── package.json
│
├── .env.example                   ← All env vars documented, no defaults with secrets
├── .gitignore
├── README.md
└── package.json                   ← Root: scripts to run both client and server
```

---

## 4. Data Flow

```
Mobile Browser (PWA)
       │
       │ HTTP/JSON (REST)
       ▼
Express.js API (server/)
       │
       │ Synchronous SQL
       ▼
SQLite DB (server/db/rescue.db)
       │
       │ Seeded on first boot by seed.js
       └─────────────────────────────────────
```

No message queues. No WebSockets. No cron jobs.  
Expiry is **lazy** — checked and applied on every `GET /api/listings/available` call.

---

## 5. The Five Screens and Their Data Sources

| Screen | Page component | Primary API call | Key data |
|---|---|---|---|
| 1 — Post Surplus | `PostSurplus.jsx` | `POST /api/listings` | Timer starts on mount, freezes on 201 |
| 2 — Match & Claim | `MatchClaim.jsx` | `GET /api/listings/available` | Returns listings with score + 4 components per item |
| 3 — Status Board | `StatusBoard.jsx` | `GET /api/listings/available` + transitions | Shows all non-expired listings, all states |
| 4 — Impact | `Impact.jsx` | `GET /api/impact` | Metrics with formula_meta, funding_split |
| 5 — Listing Detail | `ListingDetail.jsx` | `GET /api/listings/:id` | Allergens, storage, handling, disclaimer |

---

## 6. Scoring Algorithm (Server-Side, `services/matching.js`)

```javascript
// All inputs are normalised 0–1 before weighting
score = (0.35 × distance_score)
      + (0.25 × quantity_fit_score)
      + (0.25 × time_to_spoil_score)
      + (0.15 × need_score)

// distance_score: 1 - (distance_km / MAX_DISTANCE_KM)
// quantity_fit_score: min(listing.quantity_value, receiver.capacity_meals) / receiver.capacity_meals
// time_to_spoil_score: minutes_remaining / MAX_MINUTES (e.g. 120)
// need_score: receiver-defined value stored in receivers table (0.0–1.0)
```

Return shape per listing:
```json
{
  "listing": { ...all listing fields },
  "score": 0.74,
  "components": {
    "distance_score": 0.82,
    "quantity_fit_score": 0.75,
    "time_to_spoil_score": 0.68,
    "need_score": 0.60
  }
}
```

---

## 7. API Contract Summary

| Method | Route | Auth | Returns |
|---|---|---|---|
| `POST` | `/api/listings` | None | `201 { id, status, matched_count }` |
| `GET` | `/api/listings/available` | None | `200 [{ listing, score, components }]` |
| `POST` | `/api/listings/:id/claim` | None | `200 { status, volunteer_id }` |
| `POST` | `/api/listings/:id/transition` | None | `200 { status }` |
| `GET` | `/api/impact` | None | `200 { metrics, formula_meta, funding_split }` |
| `GET` | `/api/listings/:id` | None | `200 { listing, handling, allergens, disclaimer }` |

**Error shape (all errors):**
```json
{ "error": "Human-readable message", "field": "optional_field_name" }
```

No stack traces in responses. No 500 with raw error objects.

---

## 8. Database Schema (Canonical)

```sql
CREATE TABLE donors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,       -- caterer | restaurant | hostel_mess | event_organiser
  area TEXT NOT NULL,
  lat  REAL NOT NULL,
  lng  REAL NOT NULL,
  is_verified INTEGER DEFAULT 0
);

CREATE TABLE receivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,       -- ngo | community_kitchen | shelter | volunteer
  area TEXT NOT NULL,
  lat  REAL NOT NULL,
  lng  REAL NOT NULL,
  capacity_meals INTEGER NOT NULL,
  need_score REAL NOT NULL DEFAULT 0.5  -- 0.0–1.0, set in seed
);

CREATE TABLE volunteers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  lat  REAL NOT NULL,
  lng  REAL NOT NULL,
  available INTEGER DEFAULT 1
);

CREATE TABLE listings (
  id TEXT PRIMARY KEY,
  donor_id TEXT NOT NULL REFERENCES donors(id),
  food_type TEXT NOT NULL CHECK (food_type IN ('veg','non_veg','egg')),
  quantity_value REAL NOT NULL CHECK (quantity_value > 0),
  quantity_unit  TEXT NOT NULL CHECK (quantity_unit IN ('meals','kg')),
  pickup_by DATETIME NOT NULL,
  storage   TEXT NOT NULL CHECK (storage IN ('hot','cold','ambient')),
  allergens TEXT NOT NULL DEFAULT '[]',
  area TEXT NOT NULL,
  lat  REAL NOT NULL,
  lng  REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'posted'
    CHECK (status IN ('posted','claimed','collected','delivered','expired')),
  claimed_by_receiver_id  TEXT REFERENCES receivers(id),
  claimed_by_volunteer_id TEXT REFERENCES volunteers(id),
  posted_at    DATETIME NOT NULL DEFAULT (datetime('now')),
  claimed_at   DATETIME,
  collected_at DATETIME,
  delivered_at DATETIME,
  expires_at   DATETIME NOT NULL
);

CREATE TABLE matches (
  listing_id TEXT NOT NULL REFERENCES listings(id),
  receiver_id TEXT NOT NULL REFERENCES receivers(id),
  score REAL NOT NULL,
  distance_score      REAL NOT NULL,
  quantity_fit_score  REAL NOT NULL,
  time_to_spoil_score REAL NOT NULL,
  need_score          REAL NOT NULL,
  ranked_at DATETIME NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (listing_id, receiver_id)
);

CREATE TABLE impact_events (
  id TEXT PRIMARY KEY,
  listing_id  TEXT NOT NULL REFERENCES listings(id),
  kind        TEXT NOT NULL,
  value       REAL NOT NULL,
  formula     TEXT NOT NULL,
  inputs_json TEXT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  listing_id         TEXT NOT NULL REFERENCES listings(id),
  donor_contribution REAL NOT NULL DEFAULT 0,
  csr_coverage       REAL NOT NULL DEFAULT 0,
  receiver_charge    REAL NOT NULL DEFAULT 0
    CHECK (receiver_charge = 0)
);
```

> **`receiver_charge = 0` is a database constraint, not just a UI default. Never remove this constraint.**

---

## 9. PWA Requirements

**`vite.config.js` must include:**
```javascript
import { VitePWA } from 'vite-plugin-pwa'

VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Rescue the Surplus',
    short_name: 'RescueSurplus',
    description: 'Connect surplus food with community receivers',
    theme_color: '#16a34a',
    background_color: '#ffffff',
    display: 'standalone',
    start_url: '/',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  },
  workbox: {
    navigateFallback: '/offline.html'
  }
})
```

**Minimum for Lighthouse PWA audit to pass:**
- `manifest.json` with name, short_name, icons, display: standalone
- Service worker registered
- `/offline.html` fallback page (can be a simple "You are offline" page)
- HTTPS (Railway/Render provides this)

---

## 10. Deployment Target

**Primary: [Railway](https://railway.app)**  
**Secondary (fallback): [Render](https://render.com)**

**Railway setup:**
- One service: Node.js
- Root command: `npm run build && npm start`
- Root `package.json` scripts:
```json
{
  "scripts": {
    "build": "cd client && npm install && npm run build",
    "start": "cd server && node index.js",
    "dev": "concurrently \"cd client && npm run dev\" \"cd server && node index.js\""
  }
}
```
- Express serves `client/dist` as static files in production
- SQLite file: `server/db/rescue.db` — created on first boot by `seed.js`

**Environment variables (`.env.example`):**
```
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DB_PATH=./db/rescue.db
```

> **Deploy at Milestone 1 (first hour). Do not wait for features to be complete.**

---

## 11. Non-Negotiables for Nexen

1. **Touch targets:** minimum 48 × 48 CSS pixels on all interactive elements
2. **Mobile viewport:** test at 390px width (iPhone 14) and 360px (Android mid-range)
3. **No external API calls** in any demo path — no Google Maps, no Twilio, no Razorpay
4. **No real data** anywhere — all names, addresses, and coordinates are synthetic
5. **Score breakdown:** all 4 component values visible per listing card, not just the total
6. **Click-to-reveal:** every impact metric must expand to show formula + inputs
7. **60-second timer:** starts on mount of PostSurplus page, freezes on API success
8. **Disclaimer:** appears on every listing detail screen, verbatim text in `Disclaimer.jsx`
9. **State machine:** `posted → claimed → collected → delivered` only. Any other transition = 422
10. **Seed on boot:** `seed.js` runs automatically if DB is empty — no manual step required

---

## 12. What Not to Build

- Real authentication (role switch toggle only)
- Real payments (show amounts, no gateway)
- Real maps (seed coordinates, no map render)
- Native app (PWA only)
- WebSockets or real-time push (polling or manual refresh)
- Multi-city support (single zone, `city_zone_id` column exists in schema but unused in V1)
- Any external ML (scoring is the formula in Section 6, nothing else)
```

### Prompt 2.2
```markdown
Build the complete mobile-first Progressive Web App (PWA) frontend for "Rescue the Surplus".

Target directory: Create all files directly inside `./client` (do NOT touch `./server` or root).

## 1. TECH STACK & CONFIG
- React 18 + Vite + TailwindCSS
- vite-plugin-pwa (configured in vite.config.js with standalone mode, #16a34a theme, and workbox fallback to /offline.html)
- Node/npm

## 2. CLIENT FOLDER STRUCTURE TO GENERATE
client/
├── public/
│   ├── manifest.json
│   ├── offline.html
│   ├── icon-192.png
│   └── icon-512.png
├── src/
│   ├── main.jsx
│   ├── App.jsx            (Routes + RoleContext Provider)
│   ├── context/
│   │   └── RoleContext.jsx (Roles: Donor | Receiver | Volunteer | Admin)
│   ├── components/
│   │   ├── RoleSwitch.jsx  (Persistent dropdown at top of all pages)
│   │   ├── Timer.jsx       (Starts counting up on mount, freezes on submit)
│   │   ├── ScoreCard.jsx   (Listing card showing ALL 4 score components)
│   │   ├── StatusBadge.jsx (Color-coded: posted, claimed, collected, delivered, expired)
│   │   ├── MetricBox.jsx   (Clickable impact card that expands formula + inputs)
│   │   └── Disclaimer.jsx  (Verbatim food safety disclaimer component)
│   ├── pages/
│   │   ├── PostSurplus.jsx   (Screen 1: Donor flow in <60s with visible timer)
│   │   ├── MatchClaim.jsx    (Screen 2: Receiver ranked matches + score breakdown)
│   │   ├── StatusBoard.jsx   (Screen 3: Live 4-state lifecycle board)
│   │   ├── Impact.jsx        (Screen 4: Metrics with click-to-reveal formulas + funding split)
│   │   └── ListingDetail.jsx (Screen 5: Allergens, handling instructions, disclaimer)
│   ├── hooks/
│   │   ├── useTimer.js
│   │   └── useRole.js
│   └── api/
│       └── client.js         (Fetch API wrapper targeting http://localhost:3001/api)
├── index.html
├── vite.config.js
└── package.json

## 3. SCREEN REQUIREMENTS (MANDATORY & TESTABLE)

### Screen 1: PostSurplus.jsx (Donor Flow)
- Visible timer starting at 0:00 on mount.
- Fast form with big buttons (min 48px height, 3 taps to submit):
  - food_type: Veg / Non-Veg / Egg
  - quantity_value + quantity_unit: (Meals / kg)
  - pickup_by: datetime picker (defaults to +2 hours)
  - storage: Hot / Cold / Ambient
  - allergens: Multi-select chips (Dairy, Nuts, Gluten, Shellfish, None)
- On POST /api/listings success: Freeze the timer display, show success banner: "Posted in X:XX • 3 receivers matched • Listing #[ID]"

### Screen 2: MatchClaim.jsx (Receiver View)
- Fetches GET /api/listings/available
- Displays ranked listings sorted by score.
- CRITICAL: Every card MUST visibly show all 4 score components:
  - 📍 Distance (weight 0.35)
  - 🍱 Quantity fit (weight 0.25)
  - ⏱ Time remaining (weight 0.25)
  - ❤️ Need (weight 0.15)
- "Claim" button calls POST /api/listings/:id/claim with receiver_id.
- If 409 expired: Shows "Listing expired and removed".

### Screen 3: StatusBoard.jsx (Live Coordination)
- Shows all non-expired listings across 4 states: posted → claimed → collected → delivered.
- Shows timestamp and actor for each transition.
- Action buttons based on role:
  - Volunteer role: "Mark Collected" button on claimed items (POST /api/listings/:id/transition)
  - Donor/Volunteer role: "Mark Delivered" button on collected items.

### Screen 4: Impact.jsx (Impact Dashboard)
- 4 headline metrics: Meals Saved, kg Diverted, CO2e Avoided, Cost per Meal Saved.
- CRITICAL: Every metric box is CLICKABLE and expands an inline panel showing:
  - Formula string (e.g., "meals_saved × 0.4 kg")
  - Input variables and values used in calculation
- Funding split panel prominently displayed:
  "Donor contributed: ₹X | CSR covered: ₹Y | Receiver paid: ₹0" (₹0 bold green).

### Screen 5: ListingDetail.jsx (Handling & Safety)
- Full details: storage instruction, allergens, bold line: "Do not consume after [timestamp]".
- Must include the disclaimer verbatim:
  "Rescue the Surplus connects donors and receivers. We do not inspect, certify, or guarantee the safety of any food item. Handle all food with standard hygiene practices."

## 4. API CONTRACT (api/client.js)
Base URL: `http://localhost:3001/api`
- POST /api/listings -> creates listing
- GET /api/listings/available -> returns [{ listing, score, components }]
- POST /api/listings/:id/claim -> body: { receiver_id }
- POST /api/listings/:id/transition -> body: { to: 'collected'|'delivered', actor_id }
- GET /api/impact -> returns { metrics, formula_meta, funding_split }
- GET /api/listings/:id -> returns { listing, handling, allergens, disclaimer }

Build and write all client files directly inside `./client` now.
```

### Prompt 2.3
```markdown
Create the two icon files using this one-line command in terminal, then re-run the build:

node -e 'const fs=require("fs"), b=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==","base64"); fs.writeFileSync("client/public/icon-192.png", b); fs.writeFileSync("client/public/icon-512.png", b);' && cd client && npm run build
```

### Prompt 2.4
```markdown
P0 — Screen 4 (Impact) shows four dashes
Impact.jsx reads keys the server doesn't return, and treats numbers as objects.
// client/src/pages/Impact.jsx — current
{ label: 'Meals Saved', key: 'meals_rescued' }        // server returns meals_saved
{ label: 'CO2e Avoided', key: 'co2_avoided_kg' }      // server returns co2e_avoided_kg
value={metric ? metric.value : null}                  // metric is a NUMBER → .value is undefined
Result: all four tiles render "—". The funding split also reads donor_contribution but the server sends donor_contributed.
This is 25% Business Viability + part of 20% Clarity, on screen, blank.
Paste into the session that built the client:
Fix client/src/pages/Impact.jsx only. Do not touch the server.

1. TILES keys must be exactly: meals_saved, kg_diverted, co2e_avoided_kg, cost_per_meal_saved.
2. The server returns metrics as bare numbers, not objects. Change the value prop from `metric ? metric.value : null` to `metric ?? null`.
3. In the funding split, read `split.donor_contributed` (not donor_contribution).
4. Verify the page renders four numbers, not dashes.
P0 — Screen 5 (Listing Detail) crashes React
// client/src/pages/ListingDetail.jsx
const { listing, handling, allergens } = data;
<p>{handling || '—'}</p>   // handling is an OBJECT → React throws, white screen
The server returns handling: { do_not_consume_after, storage_instruction, time_window_minutes }.
Paste:
Fix client/src/pages/ListingDetail.jsx. The `handling` field is an object, not a string. Rendering it directly crashes React.

Render handling.storage_instruction as the storage text, and use handling.do_not_consume_after for the bold red "Do not consume after" line. Do not change the server.
P0 — Screen 3 (Status Board) only ever shows "Posted"
getAvailable() sends no status, so the server defaults to status = 'posted'. The seed has claimed/collected/delivered listings, but they're never fetched. Three of four sections are permanently empty — and the code even admits it in a comment.
That kills the "posted → claimed → collected → delivered" bullet (20% Clarity).
Paste:
Fix the status board so all four sections populate.

1. In client/src/api/client.js, change getAvailable to accept an optional status argument and pass it as `?status=` query param.
2. In client/src/pages/StatusBoard.jsx, fetch all four statuses in parallel (posted, claimed, collected, delivered) using Promise.all, then merge the listings before grouping.
3. Remove the stale comment saying the other sections will stay empty.
```

### Prompt 2.5
```markdown
Correction and one new bug.

1. ICONS ARE NOT MISSING. I verified on disk:
   client/public/icon-192.png — valid PNG, 192x192
   client/public/icon-512.png — valid PNG, 512x512
   Both also exist in client/dist.
   Do not regenerate, replace, or switch to SVG. Your check was stale.

2. Your Impact fix introduced a crash. In client/src/pages/Impact.jsx you pass
   formula={formulaMeta[tile.key]}, but that value is an object { formula, inputs }.
   MetricBox renders it as a React child, so clicking "How is this calculated?"
   throws "Objects are not valid as a React child".

   Fix Impact.jsx:
   - formula={formulaMeta[tile.key]?.formula}
   - inputs={formulaMeta[tile.key]?.inputs || {}}

   Then click each of the four metric cards in the browser and confirm that the
   formula STRING and the input VALUES both appear, with no crash.

3. The 404: open DevTools → Network → filter for 404 and tell me the exact URL.
   If it is /favicon.ico, add <link rel="icon" href="/icon-192.png"> to client/index.html.
   If it is an /api/ route, STOP and report it — that is a real failure.

4. Verify the two screens not checked this round:
   - Post: timer starts on mount, freezes on submit, success banner shows
     "Posted in X:XX • N receivers matched • Listing #..."
   - Match: every card shows all four score components with labels; Claim works

Report file:line for every change.
```

### Prompt 2.6
```markdown
5. Also fix cost_per_meal_saved in server/services/impact.js:
   compute it as (SUM(donor_contribution + csr_coverage) from payments) ÷ meals_saved,
   not a hardcoded 12. Update its formula_meta string and inputs to match.
```

---

## Session 3: Synthetic Seed Data & API Contract Verification

### Prompt 3.1
```markdown
# Seed Data Specification — Rescue the Surplus
**Extracted from PRD-FULL.md | Standalone reference for Nexen**  
**Version:** 1.0 | **Date:** 2026-11-22  
**Rule:** Every screen must look alive on first load. Seed runs automatically on boot if DB is empty.

---

## City Zone

**Single zone: Bengaluru, Karnataka (synthetic)**  
Lat range: 12.91 – 12.98 | Lng range: 77.54 – 77.75  
All addresses are neighbourhood names only — never precise street addresses.

---

## Donors (6 records)

| id | name | type | area | lat | lng | is_verified |
|---|---|---|---|---|---|---|
| D1 | Meera Catering Co | caterer | Koramangala | 12.9352 | 77.6245 | 1 |
| D2 | Spice Garden Restaurant | restaurant | Indiranagar | 12.9784 | 77.6408 | 1 |
| D3 | PESIT Hostel Mess | hostel_mess | Banashankari | 12.9165 | 77.5478 | 0 |
| D4 | Sunrise Events | event_organiser | Whitefield | 12.9698 | 77.7499 | 0 |
| D5 | The Grand Buffet | restaurant | HSR Layout | 12.9116 | 77.6389 | 1 |
| D6 | City College Canteen | hostel_mess | Jayanagar | 12.9308 | 77.5831 | 0 |

---

## Receivers (8 records)

| id | name | type | area | lat | lng | capacity_meals | need_score |
|---|---|---|---|---|---|---|---|
| R1 | Asha Community Kitchen | community_kitchen | Koramangala | 12.9340 | 77.6220 | 80 | 0.9 |
| R2 | Hope NGO | ngo | Indiranagar | 12.9760 | 77.6390 | 50 | 0.7 |
| R3 | Shelter First | shelter | HSR Layout | 12.9100 | 77.6370 | 40 | 0.85 |
| R4 | Priya (Volunteer) | volunteer | Whitefield | 12.9700 | 77.7510 | 10 | 0.5 |
| R5 | New Life Kitchen | community_kitchen | Banashankari | 12.9180 | 77.5490 | 60 | 0.75 |
| R6 | Care Shelter | shelter | Jayanagar | 12.9290 | 77.5820 | 35 | 0.8 |
| R7 | FoodBridge NGO | ngo | Koramangala | 12.9360 | 77.6260 | 70 | 0.65 |
| R8 | Raju (Volunteer) | volunteer | Indiranagar | 12.9780 | 77.6420 | 15 | 0.55 |

---

## Volunteers (3 records)

| id | name | area | lat | lng | available |
|---|---|---|---|---|---|
| V1 | Arvind Kumar | Koramangala | 12.9345 | 77.6230 | 1 |
| V2 | Sunita Devi | Indiranagar | 12.9775 | 77.6400 | 1 |
| V3 | Mohan Das | HSR Layout | 12.9110 | 77.6380 | 0 |

---

## Listings (8 records — mixed states for demo)

| id | donor_id | food_type | qty | unit | storage | allergens | area | status | notes |
|---|---|---|---|---|---|---|---|---|---|
| L1 | D1 | veg | 60 | meals | hot | [] | Koramangala | posted | Hero listing — Meera's surplus, freshly posted |
| L2 | D2 | veg | 25 | meals | ambient | ["dairy"] | Indiranagar | claimed | Claimed by R1, V1 assigned |
| L3 | D3 | egg | 15 | kg | cold | ["egg"] | Banashankari | collected | V2 collected, en route to R5 |
| L4 | D4 | non_veg | 40 | meals | hot | ["nuts"] | Whitefield | delivered | Complete — appears in impact history |
| L5 | D5 | veg | 30 | meals | ambient | [] | HSR Layout | posted | Available for matching, good quantity |
| L6 | D6 | veg | 10 | kg | cold | ["gluten"] | Jayanagar | expired | Past pickup time — demonstrates expiry |
| L7 | D1 | veg | 20 | meals | hot | [] | Koramangala | delivered | Older Meera delivery — in impact history |
| L8 | D2 | non_veg | 50 | meals | hot | ["shellfish"] | Indiranagar | posted | Large batch — shows allergen handling |

**Timestamps to seed (relative to boot time):**
- L1: `posted_at = now() - 10min`, `expires_at = now() + 110min`
- L2: `posted_at = now() - 45min`, `claimed_at = now() - 30min`, `expires_at = now() + 75min`
- L3: `posted_at = now() - 90min`, `claimed_at = now() - 70min`, `collected_at = now() - 20min`, `expires_at = now() + 30min`
- L4: `posted_at = now() - 180min`, all timestamps filled, `delivered_at = now() - 60min`
- L5: `posted_at = now() - 5min`, `expires_at = now() + 115min`
- L6: `posted_at = now() - 240min`, `expires_at = now() - 60min` (already expired)
- L7: `posted_at = yesterday - 180min`, all timestamps filled, `delivered_at = yesterday - 60min`
- L8: `posted_at = now() - 2min`, `expires_at = now() + 118min`

---

## Impact Events (30 records — 30 days of history)

Generate one `delivered` listing equivalent per day for the past 30 days.  
Each record should have:
- `kind`: one of `meals_saved`, `kg_diverted`, `co2e_avoided`, `cost_per_meal`
- Random `quantity` between 10–80 meals per day
- Computed values using standard formulas

**Formula constants for seed:**
```
kg_per_meal = 0.4
co2e_per_kg = 2.5
cost_per_meal_base = 12.0
```

**Example seed loop (pseudo-code):**
```javascript
for (let d = 1; d <= 30; d++) {
  const meals = Math.floor(Math.random() * 70) + 10  // 10–80
  const kg = +(meals * 0.4).toFixed(1)
  const co2e = +(kg * 2.5).toFixed(1)
  const cost = +(meals * 12).toFixed(0)
  const date = new Date(Date.now() - d * 86400000).toISOString()
  
  // Insert synthetic listing for this day
  // Insert 4 impact_events (one per kind) linked to it
  // Insert payments: donor_contribution random 0-120, csr_coverage fills gap, receiver_charge = 0
}
```

**Target totals (approximate, for dashboard headline):**
- Meals saved: ~1,200–1,500
- kg diverted: ~480–600
- CO₂e avoided: ~1,200–1,500 kg
- Cost per meal: ~₹11–₹13

---

## Payments (one per delivered listing)

| listing_id | donor_contribution | csr_coverage | receiver_charge |
|---|---|---|---|
| L4 | 80 | 160 | **0** |
| L7 | 40 | 200 | **0** |
| (30 historical) | random 0–120 | fills to ~₹240/delivery | **0** |

> `receiver_charge` is `0` on every row. This is enforced by `CHECK (receiver_charge = 0)` in the schema. Never seed a non-zero value here.

---

## Seed Script Behaviour

```javascript
// server/db/seed.js — run automatically on first boot
const db = require('./connection')

function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as c FROM donors').get()
  if (count.c > 0) return  // already seeded, skip
  
  console.log('Seeding database...')
  // Insert donors, receivers, volunteers, listings, impact_events, payments
  // All in a single transaction for atomicity
  console.log('Seed complete.')
}

module.exports = { seedIfEmpty }
```

Call `seedIfEmpty()` in `server/index.js` before starting the HTTP server.
```

### Prompt 3.2
```markdown
# API Contract — Rescue the Surplus
**Extracted from PRD-FULL.md | Standalone reference for Nexen**  
**Version:** 1.0 | **Date:** 2026-11-22  
**Base URL (dev):** `http://localhost:3001/api`  
**Base URL (prod):** `https://[your-railway-url]/api`

---

## General Rules

- All requests and responses are `Content-Type: application/json`
- All error responses have shape: `{ "error": "message", "field": "optional_field_name" }`
- **Never expose stack traces in error responses**
- No authentication required — role is passed as a query param or body field where needed
- Expiry check runs on every `GET /api/listings/available` (lazy expiry, no cron needed)

---

## Endpoints

---

### POST `/api/listings`
**Screen:** 1 — Post Surplus (donor flow)  
**Called when:** Donor submits the post form

**Request body:**
```json
{
  "donor_id": "D1",
  "food_type": "veg",
  "quantity_value": 60,
  "quantity_unit": "meals",
  "pickup_by": "2026-11-22T23:30:00",
  "storage": "hot",
  "allergens": ["dairy", "nuts"],
  "area": "Koramangala",
  "lat": 12.9352,
  "lng": 77.6245,
  "notes": "Optional free text"
}
```

**Validation rules (reject with 400 if violated):**
- `food_type` must be one of: `veg`, `non_veg`, `egg`
- `quantity_value` must be > 0
- `quantity_unit` must be one of: `meals`, `kg`
- `pickup_by` must be present and in the future
- `storage` must be one of: `hot`, `cold`, `ambient`
- `donor_id` must reference an existing donor
- `allergens` must be an array (can be empty `[]`)

**Success response — 201 Created:**
```json
{
  "id": "L9",
  "status": "posted",
  "matched_count": 3,
  "expires_at": "2026-11-22T23:30:00"
}
```

**Error responses:**
| Status | Condition | Body |
|---|---|---|
| 400 | Missing `pickup_by` | `{ "error": "pickup_by is required", "field": "pickup_by" }` |
| 400 | `quantity_value` ≤ 0 | `{ "error": "quantity must be greater than 0", "field": "quantity_value" }` |
| 400 | Invalid `food_type` | `{ "error": "food_type must be veg, non_veg, or egg", "field": "food_type" }` |
| 404 | Unknown `donor_id` | `{ "error": "donor not found", "field": "donor_id" }` |

---

### GET `/api/listings/available`
**Screen:** 2 — Match & Claim (receiver view), 3 — Status Board  
**Called when:** Receiver opens the match screen; also called on Status Board for all listings

**Query params (optional):**
- `receiver_id` — if provided, scores are calculated relative to this receiver's location and capacity
- `status` — filter by status (default: returns `posted` listings only for match screen)

**Success response — 200 OK:**
```json
[
  {
    "listing": {
      "id": "L1",
      "donor_id": "D1",
      "donor_name": "Meera Catering Co",
      "donor_type": "caterer",
      "food_type": "veg",
      "quantity_value": 60,
      "quantity_unit": "meals",
      "pickup_by": "2026-11-22T23:30:00",
      "storage": "hot",
      "allergens": [],
      "area": "Koramangala",
      "status": "posted",
      "posted_at": "2026-11-22T22:35:00",
      "expires_at": "2026-11-22T23:30:00"
    },
    "score": 0.74,
    "components": {
      "distance_score": 0.82,
      "quantity_fit_score": 0.75,
      "time_to_spoil_score": 0.68,
      "need_score": 0.60
    }
  }
]
```

**Side effect:** Any listing where `now() > expires_at` is marked `expired` before the response is built. Expired listings are excluded from the response.

**Error responses:**
| Status | Condition |
|---|---|
| 500 | Database error |

---

### POST `/api/listings/:id/claim`
**Screen:** 2 — Match & Claim  
**Called when:** Receiver taps the Claim button

**Request body:**
```json
{
  "receiver_id": "R1"
}
```

**Success response — 200 OK:**
```json
{
  "listing_id": "L1",
  "status": "claimed",
  "volunteer_id": "V1",
  "volunteer_name": "Arvind Kumar",
  "claimed_at": "2026-11-22T22:38:00"
}
```

**Logic:**
1. Check listing exists → 404 if not
2. Check `expires_at > now()` → 409 if expired
3. Check `status == 'posted'` → 409 if already claimed
4. Find nearest available volunteer (Euclidean distance, `available = 1`) → assign
5. Update listing: `status = claimed`, `claimed_by_receiver_id`, `claimed_by_volunteer_id`, `claimed_at`
6. Mark assigned volunteer `available = 0`

**Error responses:**
| Status | Condition | Body |
|---|---|---|
| 404 | Listing not found | `{ "error": "listing not found" }` |
| 409 | Listing expired | `{ "error": "this listing has expired and is no longer available" }` |
| 409 | Already claimed | `{ "error": "this listing has already been claimed" }` |
| 400 | Missing `receiver_id` | `{ "error": "receiver_id is required", "field": "receiver_id" }` |

---

### POST `/api/listings/:id/transition`
**Screen:** 3 — Status Board  
**Called when:** Volunteer marks collected; donor/volunteer marks delivered

**Request body:**
```json
{
  "to": "collected",
  "actor_id": "V1"
}
```

**Valid transitions:**
```
posted    → claimed     (via /claim endpoint, not this one)
claimed   → collected
collected → delivered
```
Any other transition → 422

**Success response — 200 OK:**
```json
{
  "listing_id": "L2",
  "status": "collected",
  "collected_at": "2026-11-22T22:55:00",
  "actor_id": "V1"
}
```

**On `delivered`:** Server also creates `impact_events` records for this listing and a `payments` record with `receiver_charge = 0`.

**Error responses:**
| Status | Condition | Body |
|---|---|---|
| 404 | Listing not found | `{ "error": "listing not found" }` |
| 422 | Illegal transition | `{ "error": "cannot transition from posted to delivered" }` |
| 400 | Invalid `to` value | `{ "error": "to must be collected or delivered", "field": "to" }` |

---

### GET `/api/impact`
**Screen:** 4 — Impact Dashboard  
**Called when:** User opens the Impact tab

**Success response — 200 OK:**
```json
{
  "metrics": {
    "meals_saved": 1247,
    "kg_diverted": 498.8,
    "co2e_avoided_kg": 1247.0,
    "cost_per_meal_saved": 11.84
  },
  "formula_meta": {
    "meals_saved": {
      "formula": "sum of quantity_value for all delivered listings",
      "inputs": { "delivered_listing_count": 42, "total_quantity": 1247 }
    },
    "kg_diverted": {
      "formula": "meals_saved × 0.4 kg per meal",
      "inputs": { "meals_saved": 1247, "kg_per_meal": 0.4 }
    },
    "co2e_avoided_kg": {
      "formula": "kg_diverted × 2.5 kg CO₂e per kg food",
      "inputs": { "kg_diverted": 498.8, "co2e_factor": 2.5 }
    },
    "cost_per_meal_saved": {
      "formula": "total_logistics_spend ÷ meals_delivered",
      "inputs": { "total_logistics_spend": 14760, "meals_delivered": 1247 }
    }
  },
  "funding_split": {
    "donor_contributed": 4280,
    "csr_coverage": 10480,
    "receiver_paid": 0
  }
}
```

> **`receiver_paid` is always 0.** This is enforced at DB level and surfaced here for the demo.

**Error responses:**
| Status | Condition |
|---|---|
| 500 | Database error |

---

### GET `/api/listings/:id`
**Screen:** 5 — Listing Detail & Handling  
**Called when:** User taps a listing card to view details

**Success response — 200 OK:**
```json
{
  "listing": {
    "id": "L1",
    "donor_name": "Meera Catering Co",
    "donor_type": "caterer",
    "food_type": "veg",
    "quantity_value": 60,
    "quantity_unit": "meals",
    "pickup_by": "2026-11-22T23:30:00",
    "storage": "hot",
    "allergens": [],
    "area": "Koramangala",
    "status": "posted",
    "posted_at": "2026-11-22T22:35:00",
    "expires_at": "2026-11-22T23:30:00",
    "claimed_by_volunteer_name": null
  },
  "handling": {
    "do_not_consume_after": "2026-11-22T23:30:00",
    "storage_instruction": "Keep hot. Do not leave unattended above 2 hours.",
    "time_window_minutes": 55
  },
  "allergens": [],
  "disclaimer": "Rescue the Surplus connects donors and receivers. We do not inspect, certify, or guarantee the safety of any food item. Handle all food with standard hygiene practices.",
  "pickup_instructions": "Contact Meera Catering Co at Koramangala zone. Ask for the event coordinator on arrival."
}
```

**Note:** `pickup_instructions` is shown only when the requesting role is `volunteer`. For other roles it is `null`.

**Error responses:**
| Status | Condition | Body |
|---|---|---|
| 404 | Listing not found | `{ "error": "listing not found" }` |
```

### Prompt 3.3
```markdown
Fix all confirmed gaps:
- E: Reject `claimed` in /transition (returns 422; claims must go through /claim)
- I: Support receiver-relative scores and status filter in /available, include donor_name
- K: Reject claim if listing is past expires_at (return 409)
- C & D: When claim has receiver_id, auto-assign nearest available volunteer and set volunteer.available = 0
- F: On `delivered` transition, insert impact_events and payments record (with receiver_charge = 0)
- J: Standardize impact response keys to: `meals_saved`, `kg_diverted`, `co2e_avoided_kg`, `cost_per_meal_saved`

Implement these fixes in server/routes/ and verify with fresh seed.
```

### Prompt 3.4
```markdown
Yes, fix both to match the contract:

1. In GET /api/listings/:id: include `donor_name`, structured `handling` object (`do_not_consume_after`, `storage_instruction`, `time_window_minutes`), and `pickup_instructions`.

2. In GET /api/impact: structure the response as:
   - `metrics`: { meals_saved, kg_diverted, co2e_avoided_kg, cost_per_meal_saved } (bare numbers)
   - `formula_meta`: { meals_saved: { formula, inputs }, ... } (the formula details for click-to-reveal)
   - `funding_split`: { donor_contributed, csr_coverage, receiver_paid }

Apply these two fixes now.
```

---

## Session 4: Multi-Batch Deep Audit (Batches A, B, C) & Defect Remediation

### Prompt 4.1
```markdown
hey its a fresh session analzye 02-TECH-ARCHITECTURE.md, PRD-FULL.md, 08-BUSINESS-VIABILITY.md  anf then  Read-only. Do not modify any file.

The docs above are the spec. Check the code on disk against them.

Output a table:

| Requirement | Source | Status | Evidence (file:line) |

Rules:
- PASS only if you can cite the exact file and line that implements it.
- FAIL if the file, the field, or the behaviour is missing or wrong.
- If you cannot find evidence, mark it FAIL, not PASS.
- Do not fix anything. Report only.
```

### Prompt 4.2
```markdown
Fix every FAIL from your table, one at a time.
After each fix: name the file, the lines changed, and what was wrong.
Do not touch anything marked PASS.
When done, re-run your own check and give me the updated table.
That gives you a real audit trail: doc → check → fix → re-check. And the evidence requirement stops the false "all good" reports you've been getting.
```

### Prompt 4.3
```markdown
Fix only these, one at a time. Do not build anything else.

1. F5 (still failing): GET /api/listings/available must return donor_name for every listing row, and posted rows must show the donor name as actor, not "—". Check server/routes/listings.js:88 and client/src/pages/StatusBoard.jsx:99-104.

2. Pin dependency: In server/package.json change "better-sqlite3": "*" to "^13.2.0" and add "engines": { "node": ">=20" }. Run npm install to regenerate server/package-lock.json.

3. F3 wording: Leave success label as "Posted in X:XX". No change needed. Close this row.

Log F25, F14–F17, F19, F13 as known gaps. Do not implement them.

After fixes, commit:
git add . && git commit -m "fix: status board names and pin better-sqlite3" && git push origin main
Then deploy immediately.      B — Data	03-DATA-MODEL.md, 05-SEED-DATA.md	Schema, seed records,      Read-only. Do not modify any file.

The docs above are the spec. Check the code on disk against them.

Output a table:

| Requirement | Source | Status | Evidence (file:line) |

Rules:
- PASS only if you can cite the exact file and line that implements it.
- FAIL if the file, the field, or the behaviour is missing or wrong.
- If you cannot find evidence, mark it FAIL, not PASS.
- Do not fix anything. Report only.
```

### Prompt 4.4
```markdown
B — Data	03-DATA-MODEL.md, 05-SEED-DATA.md	Schema, seed records  in batch b after youre done checking and verify ing  , task 1 verify only:
Read-only. Do not modify any file.

The docs above are the spec. Check the code on disk against them.

Output a table:

| Requirement | Source | Status | Evidence (file:line) |

Rules:
- PASS only if you can cite the exact file and line that implements it.
- FAIL if the file, the field, or the behaviour is missing or wrong.
- If you cannot find evidence, mark it FAIL, not PASS.
- Do not fix anything. Report only.    tas k 2 Fix every FAIL from your table, one at a time.
After each fix: name the file, the lines changed, and what was wrong.
Do not touch anything marked PASS.
When done, re-run your own check and give me the updated table.
That gives you a real audit trail: doc → check → fix → re-check. And the evidence requirement stops the false "all good" reports you've been getting.,,,,,,,  then report me the final state of batch 1 and 2
```

### Prompt 4.5
```markdown
Read-only. Do not modify any file.

The docs above are the spec. Check the code on disk against them.

Output a table:

| Requirement | Source | Status | Evidence (file:line) |

Rules:
- PASS only if you can cite the exact file and line that implements it.
- FAIL if the file, the field, or the behaviour is missing or wrong.
- If you cannot find evidence, mark it FAIL, not PASS.
- Do not fix anything. Report only. note the open isssues but dirst        C — API	04-API-CONTRACT.md	6 routes                    then  Fix every FAIL from your table, one at a time.
After each fix: name the file, the lines changed, and what was wrong.
Do not touch anything marked PASS.
When done, re-run your own check and give me the updated table.
That gives you a real audit trail: doc → check → fix → re-check. And the evidence requirement stops the false "all good" reports you've been getting.
```

### Prompt 4.6
```markdown
also the issue syou find which arent fixed yet you could open github issues for them and the batch and what it coivewr like from the batch a  and which doc
```

### Prompt 4.7
```markdown
C — API	04-API-CONTRACT.md	6 routes batch c   Message 1 — verify only:
Read-only. Do not modify any file.

The docs above are the spec. Check the code on disk against them.

Output a table:

| Requirement | Source | Status | Evidence (file:line) |

Rules:
- PASS only if you can cite the exact file and line that implements it.
- FAIL if the file, the field, or the behaviour is missing or wrong.
- If you cannot find evidence, mark it FAIL, not PASS.Message 2 — fix only:
Fix every FAIL from your table, one at a time.
After each fix: name the file, the lines changed, and what was wrong.
Do not touch anything marked PASS.
When done, re-run your own check and give me the updated table.
That gives you a real audit trail: doc → check → fix → re-check. And the evidence requirement stops the false "all good" reports you've been getting.
- Do not fix anything. Report only.
```

### Prompt 4.8
```markdown
now create those issues like i asked ofr batch a b c open ones which you hadnt fixed yet or delegate  subajet to it
```

### Prompt 4.9
```markdown
D — Docs	06-README.md, 07-PROMPT-LOG.md, 09-DEMO-	Not code — copy into repo later
```

### Prompt 4.10
```markdown
Fix the code	server/services/impact.js: compute (SUM(donor_contribution + csr_coverage)) ÷ SUM(quantity_value) for delivered listings   — Decide cost_per_meal_saved (C-7)
```

### Prompt 4.11
```markdown
tsart with batch 1 open issues then batch 2,  and if theres any decision you need , you can prepare the question and ill makethe decision , for hthe issues the decision isnt need you can fix them akso you can use internet for you research purposes  ,,,,
```

---

## Session 5: Post-Token-Exhaustion Infrastructure & CI/CD Hardening

Following platform token limit exhaustion in Codebenders IDE (`BalanceExhausted`), the project transitioned to automated CI/CD validation and cloud container ingress configuration:

- **GitHub Actions CI Pipeline (`.github/workflows/ci.yml`):** Multi-step automated workflow on Node.js 22 validating production builds and API integrity on every push and PR.
- **Cloud Container Build Script Hardening (`package.json`):** Unified root build script ensuring both frontend and server dependencies are built in cloud environments.
- **Container Ingress Binding (`server/index.js`):** Bound Express explicitly to `0.0.0.0` for cloud container edge proxies.
- **SQLite Normalization (`server/db/connection.js`):** Bulletproof path resolution across execution roots.
- **Status:** Automated CI tests verified green (✓) on GitHub.

---

## Summary (Final Deliverable)

| Metric | Final Value | Target |
|---|---|---|
| Total Codebenders Sessions | 4 Dedicated Sessions | 4+ |
| Backend files generated & verified | 11/11 | 11 |
| Frontend files generated & built | 26/26 | 25+ |
| PWA assets & Service Worker | Verified (`client/dist/sw.js`) | Verified |
| API endpoints verified | 6/6 | 6 |
| Database seeded | Yes (`rescue.db`) | Yes |
| CI/CD Pipeline | Automated GitHub Actions (`ci.yml`) | Active (Passing ✓) |
| Build status | Clean production build (`exit 0`) | Clean build |