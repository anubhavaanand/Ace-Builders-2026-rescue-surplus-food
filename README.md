# README — Rescue the Surplus

> **ACE Builders Hackathon 2026 · Problem Statement 2 · Society and Environment**

A mobile-first Progressive Web App that connects surplus food from donors (caterers, restaurants, hostel messes, event organisers) with nearby receivers (NGOs, community kitchens, shelters, volunteers) — inside a short spoilage window, with live pickup coordination and transparent impact reporting.

---

## Live Demo

🌐 **[https://ace-builders-2026-rescue-surplus-food.up.railway.app](https://ace-builders-2026-rescue-surplus-food.up.railway.app)**

**Demo credentials:** No login required. Use the **Role Switch** dropdown at the top to toggle between:
- **Donor** — post surplus food
- **Receiver** — view matches and claim listings
- **Volunteer** — mark collections and deliveries
- **Admin** — view full status board and impact

---

## What It Does

| Screen | Feature |
|---|---|
| **Post Surplus** | Donor posts food type, quantity, pickup time, storage, allergens in under 60 seconds. A visible countdown timer stops and freezes on submit. |
| **Match & Claim** | Receivers see ranked listings with a **visible score breakdown** (distance / quantity fit / time-to-spoil / need). One tap to claim. |
| **Status Board** | Live view of all listings across four states: `posted → claimed → collected → delivered`. Auto-expires past listings. |
| **Impact Dashboard** | Meals saved, kg diverted, CO₂e avoided, cost per meal saved. **Every number is clickable** and expands to show its formula and inputs. |
| **Listing Detail** | Full handling info: storage requirements, allergen list, "do not consume after" timestamp, food safety disclaimer. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS |
| PWA | vite-plugin-pwa (manifest + service worker) |
| Backend | Node.js + Express.js |
| Database | SQLite (better-sqlite3) |
| Deployment | Railway |

---

## Project Structure

```
rescue-surplus-food/
├── client/          ← React PWA frontend
├── server/          ← Express REST API + SQLite
├── .env.example     ← Environment variable template
└── package.json     ← Root scripts (build, start, dev)
```

---

## Running Locally

**Prerequisites:** Node.js 20.x, npm

```bash
# 1. Clone the repo
git clone https://github.com/[your-username]/rescue-surplus-food.git
cd rescue-surplus-food

# 2. Set up environment variables
cp .env.example .env
# Edit .env if needed (defaults work for local dev)

# 3. Install all dependencies
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# 4. Start development servers (runs both client + server)
npm run dev
```

Frontend: `http://localhost:5173`  
API: `http://localhost:3001`

> **The database seeds automatically on first boot.** No manual seed step required.

---

## Deployment

```bash
# Build frontend
cd client && npm run build

# Start production server (serves built frontend + API)
cd server && NODE_ENV=production node index.js
```

**Environment variables for production:** See `.env.example`

---

## Synthetic Data

All data in this application is **100% synthetic**. No real names, addresses, phone numbers, or personal details are used anywhere in the codebase, database, or API responses. This is a requirement of the ACE Builders Hackathon 2026 rules.

---

## Business Model

| Party | Pays | For what |
|---|---|---|
| NGO / shelter / community kitchen | **₹0** | Always. The platform never charges receivers. |
| Small donor (restaurant, dhaba) | **₹0** | Free to post — this drives supply. |
| Larger donor (hotel, caterer, cloud kitchen) | Optional suggested amount | `₹20 base + ₹5/km`, shown as suggestion only, never a gate. |
| CSR sponsor | Funds the logistics gap | Receives the impact report. ₹X → N meals saved. |

> **Impact metric:** Cost per meal saved = total logistics spend ÷ meals delivered. Visible on the dashboard. This is what CSR sponsors buy.

---

## Rules Compliance

| Rule | How we comply |
|---|---|
| No food safety certification | Disclaimer on every listing: *"We connect donors and receivers. We do not certify food safety."* |
| No tax or legal promises | No such language anywhere in the UI |
| Synthetic data only | All seed data is fictional (Bengaluru zone, synthetic names and coordinates) |
| Built in Codebenders + Nexen | See Prompt Log for full build history |

---

## Hackathon Submission

- **Built at:** ACE Builders Hackathon 2026 by Codebenders
- **Problem Statement:** PS2 — Society and Environment
- **Platform:** Codebenders IDE + Nexen
- **Prompt log:** See `PROMPT-LOG.md` in the project root

---

## Licence

TBD — pending clarification of IP ownership terms with Codebenders organisers (see RULES-AND-JUDGING.md, Open Questions section).
