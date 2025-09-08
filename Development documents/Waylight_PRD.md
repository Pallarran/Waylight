# Product Requirements Document (PRD)

**Product Name**: **Waylight**  
**Prepared For**: Solo Developer (MVP Scope)  
**Target Alpha Test**: November 2025 (Walt Disney World Trip)

---

## 1. Overview
Waylight is a mobile + web application that helps theme park visitors plan and manage their days with clarity and calm. It focuses on **pre‑trip planning**, **personal itineraries**, and **in‑park guidance** — intentionally excluding transactions like ticket purchases or Lightning Lane bookings. The MVP targets **Walt Disney World (Orlando)**, used alongside official park apps.

---

## 2. Goals & Objectives
- Reduce time in lines; increase confidence and control
- Deliver a clean, user-first experience that works **offline**
- Start with user-driven planning tools; add live data later
- Validate in a real park day during the November 2025 trip

---

## 3. Target Users
- **First-Time Visitors**: guided suggestions and tips
- **Enthusiasts**: fast, uncluttered checklist + custom plans
- **Families/Groups**: shared goals, notes, flexible order

---

## 4. Platform Support
- **Web (Desktop-first)**: pre-trip planning
- **Mobile (iOS & Android)**: in-park use
- **Offline Mode**: required for MVP (local cache of all content and plans)

---

## 5. Brand & Visual Identity (Waylight)
**Positioning**: A calm, modern guide with a subtle touch of magic; neutral enough to expand beyond Disney to other parks and general travel.

**Logo concept**: Minimal **sailboat** (journey) with a subtle **light beam** (guidance). Scales from 16px to 1024px; pairs with a clean wordmark.

**Color palette** (accessible + neutral):
- **Ink**: `#0F172A` (primary text/icons)
- **Surface**: `#F8FAFC` (background)
- **Accent – Sea**: `#0EA5A8`
- **Glow – Light**: `#FBBF24`

**Typography**:
- Primary: **Manrope** or **Inter** (UI, numbers, compact labels)
- Fallback stack: `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Manrope, Arial, sans-serif`

**Iconography**: Outline icons, ~2px stroke; use **Lucide** family for consistency (web + native variants).

**Motion & micro-interactions**:
- Transitions: 120–200ms ease-out; subtle
- Success feedback: tiny sparkle on checklist complete
- Add/reorder: quick slide/fade

**Microcopy voice**: Friendly, concise, action-first.
- Empty state: “Let’s light the way. Add your first park day.”
- Success: “Plan updated — you’re glowing.”
- Tips label: “Show planning tips”

**App icons & splash (mobile)**:
- Icon master: 1024×1024 PNG (no rounded corners). Simple sail + light mark
- Android adaptive: light surface background, centered symbol
- Splash: light background, symbol ~30–40% width, wordmark below

**Tagline options**:
- “A little light for better plans.”
- “Find your best way.”
- “Plan smarter. Wander farther.”

---

## 6. UI/UX Vision
- **Tone**: Clean, modern, minimalist with a light, playful touch (Duolingo-inspired clarity without cartoon excess)
- **Layout**: Grid-based, generous whitespace, large touch targets
- **Readability**: Sans-serif, strong hierarchy; icon-forward labels
- **View Modes**: User can switch between **List**, **Card** (drag-friendly), and (future) **Calendar**; remember preference
- **Navigation (mobile)**: Bottom tabs (Plan, Attractions, Settings); fast stack transitions
- **Navigation (web)**: Sidebar or top tabs; keyboard accessible
- **Offline-first cues**: Clear “saved locally” states; no dead-ends when offline

---

## 7. Key Features — MVP Scope
### 7.1 Trip Itinerary Builder
- Create multi-day trips; choose park per day
- Add attractions/activities; order manually (drag or up/down)
- Optional time notes; no auto-optimization in MVP

### 7.2 Attraction Information
- Static attraction entries: description, requirements, duration, location text
- Tips: static, high-signal guidance (toggle on/off globally or per item)

### 7.3 Toggleable Tips
- Global toggle + per-attraction control; default ON during planning

### 7.4 Offline Mode
- Local cache of attractions, tips, trips; full read/write offline

### 7.5 Park Map (Basic)
- Static maps or schematic with markers; optional deep link to official map

### 7.6 Personalization & Utilities
- Notes on items/days; mark done; trip countdown; export/share (text/screenshot)

### 7.7 View Modes
- **List**, **Card**, and (future) **Calendar**; quick toggle on mobile; tabs on web

---

## 8. Out of Scope (MVP)
- Live wait times and closures
- Automated or dynamic re-optimization
- Multi-user collaboration/sync
- Parks beyond Walt Disney World
- Turn-by-turn GPS navigation
- Any transactional flows

---

## 9. Future Roadmap (Post-MVP)
- Live wait times (Queue-Times API) + alerts
- Predictive waits & crowd guidance
- “Optimize My Day” (heuristics → smarter scheduling)
- Additional parks/destinations; general travel mode
- Accounts & cloud sync; shared plans
- Community tips and lightweight social features

---

## 10. Monetization
- **One-time purchase** **or** **Subscription** (TBD post-alpha)  
- No ads/affiliate in MVP

---

## 11. Timeline & Milestones
- Now–Oct 2025: MVP build (solo dev)
- Nov 2025: **Alpha** during WDW trip (offline, itinerary, tips, basic maps)
- Post-trip: feedback, prioritize live data & optimizations

---

## 12. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Solo dev velocity | Strict MVP scope, modular packages |
| Content volume | Start with Magic Kingdom; expand iteratively |
| No live data at launch | Emphasize planning guidance, not forecasts |
| Offline complexity | Local-first design; simple storage abstractions |

---

## 13. Tech Stack Overview
**Web**
- React + Vite; Tailwind CSS; Framer Motion
- Zustand for state; Dexie (IndexedDB) for offline
- Deploy: Vercel/Netlify

**Mobile (Expo + React Native)**
- NativeWind (Tailwind); React Navigation
- AsyncStorage (initial) or SQLite for offline
- Optional `react-native-maps` (post-MVP)

**Shared**
- Packages for types, storage interface, and content JSON
- No login/sync in MVP; local-first only

---

## 14. Appendix: Example User Stories
- “As a first-time visitor, I want to add my favorite rides and see when to do them.”
- “As an in-park user, I need my plan to work offline.”
- “As a seasoned visitor, I want to hide tips and just see my list.”
- “As a parent, I need height info and the ability to add lunch notes.”

---

**End of MVP PRD — Waylight**

*This PRD is optimized for agile solo development with a brand system that scales beyond a single destination.*
