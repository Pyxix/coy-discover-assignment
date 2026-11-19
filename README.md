# Coy — "Discover" Tab (SDE Intern Assignment: Part B)

A production-grade, mobile-first standalone web application implementing the **"Discover"** swipe experience for [Coy](https://app.getcoy.com), engineered with strict mutual-matching privacy guarantees, atomic SQLite persistence, smooth gesture physics, and automated verification suites.

Accompanied by the submission template for **Part A** in [PART_A_FEATURE_SUGGESTIONS.md](./PART_A_FEATURE_SUGGESTIONS.md).

---

## 1. Architectural Highlights

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile-First Web App                     │
│    (100dvh on mobile · 430px centered frame on desktop)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   ┌─────────────────┐                  ┌──────────────────┐
   │    Home Tab     │                  │   Discover Tab   │
   │  (Clean Blank   │                  │ (Pill Navigation)│
   │   Placeholder)  │                  └───┬──────────┬───┘
   └─────────────────┘                      │          │
                                            ▼          ▼
                                     ┌──────────┐ ┌──────────┐
                                     │  Swipe   │ │ Matches  │
                                     │  Deck    │ │   List   │
                                     └────┬─────┘ └────┬─────┘
                                          │            │
                                          ▼            ▼
┌─────────────────────────────────────────────────────────────┐
│                       REST API Layer                        │
│            GET /feed  ·  POST /swipe  ·  GET /matches       │
│             (Aliased at /api/feed, /api/swipe, etc.)        │
│          Enforces strict public DTO serialization           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Database & Privacy Barrier                  │
│       SQLite (WAL Mode + Foreign Keys ON + Transactions)     │
│   profiles  ·  incoming_likes (PRIVATE)  ·  swipes  · matches│
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Privacy Architecture & Non-Negotiable Invariants

Coy's brand promise is built on **complete privacy**: *nobody ever finds out you liked them unless it is mutual*. This application enforces this privacy model across every architectural boundary:

1. **Strict Mutual Matching**:
   - A match is created **only** when the user performs a `like` swipe on a profile that has already recorded an incoming like in the private `incoming_likes` table.
   - Any `pass` action—or a `like` on a profile without an incoming like—guarantees `matched: false` and `match: null`.

2. **Zero Incoming-Like Leakage in Feed**:
   - `GET /feed` projects **only** public profile columns (`id`, `name`, `age`, `photo`, `bio`, `location`, `interests`).
   - The private table `incoming_likes` is never joined, referenced, or exposed in the feed query.
   - Automated tests recursively inspect the JSON payload of `GET /feed` to assert the total absence of any hint (`hasLiked`, `incoming`, `mutual`, `isMatchCandidate`, etc.).

3. **Indistinguishable Pass Response**:
   - When a user passes on a profile, `POST /swipe` returns the exact same HTTP status (`200 OK`) and response shape (`{ "swiped": true, "action": "pass", "matched": false, "match": null }`) whether that profile liked the user or not.
   - The client UI never displays "You missed a match!" or gives any visual cue of unreciprocated interest.

4. **Anti-Probing / Double-Swipe Guard**:
   - Swipes are enforced unique at the database and API levels.
   - Once a profile has been swiped (`like` or `pass`), any subsequent swipe attempt on that profile is rejected with `409 Conflict`. This prevents an attacker or script from passing first and then immediately issuing a speculative `like` to probe whether that profile had an incoming like.

5. **No Admirer Counts**:
   - The UI never renders "X people liked you" banners, blurred cards, or admirer counts. The match badge on the header displays **only confirmed mutual matches**.

---

## 3. Technology Stack & Technical Assumptions

| Layer | Technology | Details / Decisions |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router) | React 19, TypeScript (`strict: true`), server-rendered route handlers. |
| **Styling & Theme** | Tailwind CSS | Editorial dark theme (`#0A0B0E`), soft card elevation, custom scrollbars. |
| **Motion & Gestures** | Framer Motion | 60fps card drag tracking, dynamic rotation tilt, scaling LIKE/PASS stamps, spring physics. |
| **Icons** | Lucide React | Consistent, lightweight SVG iconography. |
| **Database** | SQLite (`node:sqlite` / `better-sqlite3` compatible) | Stored at `data/coy.db`. Uses `WAL` mode (`PRAGMA journal_mode = WAL`) and `PRAGMA foreign_keys = ON`. In Node v26, V8 13.x removed deprecated C++ symbols which prevents `better-sqlite3` native compilation; our architecture seamlessly utilizes Node 26's native built-in `node:sqlite.DatabaseSync` with zero external daemons, identical prepared statement semantics, and atomic transactions. |
| **Validation** | Zod | Runtime schema validation on API request payloads. |
| **Testing** | Vitest | Isolated in-memory SQLite integration tests covering feed integrity, persistence, privacy invariants, edge cases, and demo resets. |

### Technical Assumptions
1. **Single Logged-in User**: As specified in the prompt, external authentication is omitted. The active user is statically defined as *Alex Rivera* (`/avatars/user-alex.svg`), visible in the dual-avatar "It's a Match!" celebration modal.
2. **Reliable Vector Portraits**: To ensure 100% offline stability with zero 404s, broken images, or external CDN network failures, 34 bespoke, diverse, stylized SVG portraits are bundled in `public/avatars/` and paired with an `onError` fallback on `<ProfileCard />`.
3. **Feed Seeding**: 34 realistic profiles (exceeding the requirement of 30) are pre-seeded in deterministic order. Exactly 11 profiles are pre-seeded with incoming likes, with 3 naturally positioned in the first 7 cards (Cards 2, 5, 7) so reviewers can immediately trigger mutual matches during testing without clustering all matches together.
4. **Demo Reset**: A discreet "Reset Demo" button and `POST /api/demo/reset` endpoint allow reviewers to wipe swipes and matches to test the feed repeatedly while preserving the seeded incoming likes.

---

## 4. API Reference

All endpoints support both exact assignment paths (`/feed`, `/swipe`, `/matches`) and standard Next.js paths (`/api/feed`, `/api/swipe`, `/api/matches`). All dynamic responses send `Cache-Control: no-store, no-cache, must-revalidate`.

### 1. `GET /feed`
Returns unswiped profiles in deterministic order (strict public fields only).
- **Status**: `200 OK`
- **Response**:
```json
[
  {
    "id": "prof_maya_chen",
    "name": "Maya Chen",
    "age": 23,
    "photo": "/avatars/avatar-1.svg",
    "bio": "Architecture student & 35mm film hoarder. Probably sketching in a coffee shop right now.",
    "location": "Columbia University",
    "interests": ["Architecture", "Film Photography", "Matcha", "Museums"]
  }
]
```

### 2. `POST /swipe`
Records a swipe action (`like` or `pass`) atomically.
- **Request Body**:
```json
{
  "profileId": "prof_liam_vasquez",
  "action": "like"
}
```
- **Response (Mutual Match)**: `200 OK`
```json
{
  "swiped": true,
  "action": "like",
  "matched": true,
  "match": {
    "id": "match_1795099491934_s5m2fm",
    "profileId": "prof_liam_vasquez",
    "profile": {
      "id": "prof_liam_vasquez",
      "name": "Liam Vasquez",
      "age": 24,
      "photo": "/avatars/avatar-2.svg",
      "bio": "Product designer by day, amateur sourdough baker by weekend...",
      "location": "San Francisco, CA",
      "interests": ["Sourdough", "Bouldering", "Figma", "Indie Pop"]
    },
    "matchedAt": "2026-11-19T14:44:51.934Z"
  }
}
```
- **Response (Pass or Non-Mutual Like)**: `200 OK`
```json
{
  "swiped": true,
  "action": "pass",
  "matched": false,
  "match": null
}
```
- **Error Responses**:
  - `400 Bad Request`: Missing `profileId`, invalid `action`, or malformed JSON.
  - `404 Not Found`: `profileId` does not exist.
  - `409 Conflict`: Profile has already been swiped on.

### 3. `GET /matches`
Returns all confirmed mutual matches for the user, ordered most recent first.
- **Status**: `200 OK`
- **Response**:
```json
[
  {
    "id": "match_1795099491934_s5m2fm",
    "profileId": "prof_liam_vasquez",
    "matchedAt": "2026-11-19T14:44:51.934Z",
    "profile": {
      "id": "prof_liam_vasquez",
      "name": "Liam Vasquez",
      "age": 24,
      "photo": "/avatars/avatar-2.svg",
      "bio": "Product designer by day...",
      "location": "San Francisco, CA",
      "interests": ["Sourdough", "Bouldering", "Figma", "Indie Pop"]
    }
  }
]
```

### 4. `POST /api/demo/reset`
Testing helper that deletes rows from `swipes` and `matches`, returning all profiles to the unswiped feed while leaving seeded incoming likes intact.

---

## 5. Local Setup & Verification Guide

### Prerequisites
- Node.js `v20+` or `v22+` / `v26+`
- npm `v10+`

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Verify environment configuration
cp .env.example .env.local

# 3. Seed initial database (auto-created at data/coy.db on first boot)
npm run db:seed
```

### Running Tests
Execute the full automated test suite (16 tests covering seeding, swipe exclusion, matching, and privacy invariants):
```bash
npm test
```

### Code Quality & Build
```bash
# Run ESLint (zero errors / zero warnings)
npm run lint

# Compile production Next.js build
npm run build
```

### Starting the Application
```bash
# Start Next.js development server on http://localhost:3000
npm run dev

# Or start the production server
npm start
```

### Resetting the Database
```bash
# Fully reset and re-seed the SQLite database
npm run db:reset
```

---

## 6. Verification Checklist

- [x] Blank **Home** tab and functional **Discover** tab in a mobile-first bottom tab bar.
- [x] 34 seeded profiles (exceeding requirement of 30) with all required fields.
- [x] 11 pre-seeded incoming likes naturally interleaved (3 within first 7 cards).
- [x] One card at a time with smooth 60fps drag gestures, desktop buttons, and keyboard shortcuts (`←` Pass, `→` Like).
- [x] Swiped profiles never reappear across page reloads and server restarts.
- [x] Strict mutual matching with celebratory "It's a match!" screen and persistent Matches view.
- [x] Zero leakage of incoming likes across API payloads, network responses, and client bundles.
- [x] Anti-probing guard rejects duplicate swipes with `409 Conflict`.
- [x] REST endpoints (`/feed`, `/swipe`, `/matches`) implemented and verified.
- [x] Automated test suite (`vitest`) passes with 100% success rate.
- [x] `npm run lint` and `npm run build` succeed with zero errors.
- [x] Database initialized in fresh state ready for reviewer evaluation.
