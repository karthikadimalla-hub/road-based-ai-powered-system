# RoadSafe India – AI-Powered Road Safety Reporting System

> **Tagline:** “Report. Analyze. Prioritize. Make Roads Safer.”  
> **Notice:** *This application is an academic engineering project & demonstration prototype designed for Indian civic technology evaluation. It is NOT officially connected to, operated by, or endorsed by GHMC, NHAI, BBMP, BMC, Delhi Traffic Police, or any Indian government department.*

---

## 1. Project Overview

**RoadSafe India** is a modern, responsive, full-stack civic-tech web application empowering Indian citizens to report municipal road safety hazards—including potholes, damaged roads, broken traffic signals, non-functional streetlights, open manholes, waterlogging, fallen trees, and unsafe intersections.

The system integrates **Google Gemini Vision AI** to automatically categorize submitted photographic evidence, determine severity, evaluate risks to Indian commuters (such as two-wheelers and auto-rickshaws), group duplicate incidents using spatial proximity algorithms, and calculate transparent priority ratings.

---

## 2. Key Features

- **Civic Citizen Hazard Reporting:**
  - Image upload with client-side preview (supports JPG, JPEG, PNG, WEBP with 10MB limit).
  - 1-click Preset Hazard Scenarios for instant evaluation without manual photo hunting.
  - Dual Location Capture: Browser Geolocation API + Interactive Leaflet map with drag-and-drop pin picker.
  - Reverse geocoding fallback for street and ward names across Indian cities.
  - Transparent AI analysis breakdown displayed immediately upon submission.

- **Multimodal AI Analysis (Gemini 3.8 Flash):**
  - Identifies hazard categories: `pothole`, `damaged_road`, `traffic_signal`, `streetlight`, `open_manhole`, `road_obstruction`, `unsafe_intersection`, `damaged_sign`, `waterlogging`, `other`.
  - Determines severity (`low`, `medium`, `high`, `critical`) and confidence score (0.0 to 1.0).
  - Evaluates visible physical evidence and assesses contextual safety risks (e.g. wet monsoons hiding open manholes, dark highway turns, two-wheeler skid dangers).
  - Robust heuristic fallback engine if API key is not supplied or quota is exceeded.

- **Intelligent Spatial Duplicate Detection:**
  - Haversine distance algorithm compares new reports against active reports within a **100–200 meter radius**.
  - Evaluates category similarity and text description overlap (Jaccard similarity).
  - Groups related reports into a single Master Incident ID (e.g., `INC-2026-00125`) while keeping individual citizen contributions linked.

- **Transparent Priority Calculation System:**
  - 100-point transparent scoring formula:
    - **Severity Points:** Critical (40 pts), High (30 pts), Medium (20 pts), Low (10 pts)
    - **Cluster Density Points:** 1 report (5 pts), 2–4 reports (10 pts), 5+ reports (20 pts)
    - **Evidence Confidence Points:** $\ge 85\%$ (20 pts), $65\%-84\%$ (10 pts), $<65\%$ (5 pts)
  - Final Priority Levels:
    - `0 – 29` = Low Priority
    - `30 – 49` = Medium Priority
    - `50 – 69` = High Priority
    - `70+` = Critical Priority
  - Clear, human-readable reasoning displayed on every report card.

- **Interactive Public GIS Map (Leaflet + OpenStreetMap):**
  - Color-coded pins for Critical (Rose), High (Orange), Medium (Amber), and Low (Emerald).
  - Multi-faceted filtering by Category, Priority, Status, and City.
  - Quick-jump navigation across 8 major Indian cities (Hyderabad, Bengaluru, Mumbai, Delhi, Chennai, Pune, Kolkata, Ahmedabad).
  - Privacy-preserving public markers (no citizen PII exposed).

- **User & Citizen Dashboard (`/dashboard`):**
  - KPI overview: Total Reports, Pending Review, In Progress, Resolved.
  - Tabbed report views with real-time status tracking.

- **Administrative Safety Console (`/admin` & `/admin/reports`):**
  - KPI statistics: Total Reports, New, High Priority, Critical, Resolved, Duplicate Groups.
  - Visual charts: Breakdown by category, priority, status, and municipal region.
  - Admin report triage: Change Status, Calibrate Priority, Assign Municipal Crew / Department, Append Audit Notes, and Merge Reports into Master Incident Clusters.

- **Authentication & Security:**
  - Password hashing via bcrypt (`bcryptjs`).
  - Stateless JWT token authentication.
  - Rate limiting middleware per client IP.
  - Input validation, file-type verification, and sanitization.

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Leaflet GIS.
- **Backend:** Node.js, Express.js (unified single-port full-stack architecture with Vite middlewares).
- **Database:** SQLite (powered by official `sql.js` WebAssembly engine, persisting real SQLite database to `roadsafe.sqlite` with foreign keys and performance indexes).
- **AI Engine:** Google Gemini API (`@google/genai` TypeScript SDK, model: `gemini-3.8-flash`) with rule-based heuristic fallback.
- **Maps:** Leaflet 1.9 + OpenStreetMap Tile Server (zero external map API key required).

---

## 4. Architecture & Directory Structure

```
├── .env.example              # Environment variables template
├── metadata.json             # AI Studio applet capabilities
├── package.json              # App scripts and dependencies
├── roadsafe.sqlite           # Persistent SQLite database file
├── server.ts                 # Full-stack Express server + Vite middleware
│
├── server/
│   ├── ai/
│   │   └── gemini.ts         # @google/genai client & heuristic analyzer
│   ├── database/
│   │   ├── db.ts             # sql.js SQLite wrapper, DDL schema, and indexes
│   │   └── seed.ts           # Demo seed data (16 Indian reports, 8 incidents)
│   ├── middleware/
│   │   ├── auth.ts           # JWT extraction & requireAdmin middleware
│   │   └── rateLimit.ts      # In-memory IP rate limiter
│   ├── routes/
│   │   ├── adminRoutes.ts    # Admin statistics, status update, merge, notes
│   │   ├── aiRoutes.ts       # On-demand AI preview analysis endpoint
│   │   ├── authRoutes.ts     # Register, login, me, and logout
│   │   ├── mapRoutes.ts      # GIS GeoJSON markers for Leaflet map
│   │   └── reportRoutes.ts   # CRUD, duplicate check, and priority scoring
│   └── utils/
│       ├── auth.ts           # bcrypt hashing and JWT sign/verify
│       └── geo.ts            # Haversine distance, duplicate detection & priority
│
└── src/
    ├── App.tsx               # Client routes & application shell
    ├── main.tsx              # React DOM entry
    ├── index.css             # Tailwind CSS & Leaflet custom pin styling
    ├── context/
    │   └── AuthContext.tsx   # React Auth context with 1-click demo switcher
    ├── components/
    │   ├── CategoryIcon.tsx  # Hazard icons and label formatting
    │   ├── Footer.tsx        # Footer with academic disclaimer and helplines
    │   ├── LeafletMap.tsx    # Interactive map component
    │   ├── Navbar.tsx        # Navigation bar with responsive drawer
    │   ├── PriorityBadge.tsx # Priority pill with score counter
    │   ├── StatusBadge.tsx   # Workflow status indicators
    │   └── Toast.tsx         # Toast notification system
    ├── pages/
    │   ├── AdminDashboardPage.tsx  # Admin statistics & charts
    │   ├── AdminReportsPage.tsx    # Admin incident management & merging
    │   ├── HomePage.tsx            # Landing page with stats & workflow
    │   ├── LoginPage.tsx           # Sign-in with 1-click demo buttons
    │   ├── PublicMapPage.tsx       # GIS interactive map across India
    │   ├── RegisterPage.tsx        # Citizen registration form
    │   ├── ReportDetailPage.tsx    # Incident details, AI audit & timeline
    │   ├── ReportPage.tsx          # Main hazard reporting interface
    │   ├── ReportsListPage.tsx     # Public reports feed with filters
    │   └── UserDashboardPage.tsx   # Citizen report tracker
    ├── services/
    │   └── api.ts            # Typed HTTP API client
    └── types/
        └── index.ts          # Shared TypeScript models and interfaces
```

---

## 5. Database Schema

The database uses real SQLite with foreign keys and indexes:

1. **`users`**:
   - `id` (TEXT PRIMARY KEY)
   - `name`, `email` (UNIQUE), `phone`, `password_hash`, `role` ('user' | 'admin'), `created_at`

2. **`incidents`** (Master Incident Clusters):
   - `id` (TEXT PRIMARY KEY, e.g. `INC-2026-00125`)
   - `title`, `category`, `latitude`, `longitude`, `priority`, `status`, `assigned_to`, `report_count`, `created_at`, `updated_at`

3. **`reports`** (Individual Citizen Hazard Reports):
   - `id` (TEXT PRIMARY KEY, e.g. `REP-2026-00101`)
   - `user_id` (FK -> users.id)
   - `incident_id` (FK -> incidents.id)
   - `category`, `description`, `image_url`, `latitude`, `longitude`, `location_name`, `landmark`, `city`, `ward`
   - `severity`, `priority`, `priority_score`, `priority_reasoning`
   - `ai_confidence`, `ai_analysis` (JSON payload)
   - `is_duplicate` (0 or 1), `duplicate_of_report_id`
   - `status` ('Reported' | 'Assigned' | 'In Progress' | 'Resolved' | 'Rejected')
   - `assigned_to`, `upvotes`, `created_at`, `updated_at`

4. **`report_relations`**:
   - `id` (TEXT PRIMARY KEY), `report_id`, `related_report_id`, `relation_type` ('duplicate' | 'nearby_cluster'), `distance_meters`, `similarity_score`, `created_at`

5. **`admin_notes`**:
   - `id`, `admin_id`, `report_id`, `admin_name`, `note`, `created_at`

6. **`status_history`**:
   - `id`, `report_id`, `status`, `changed_by`, `comment`, `created_at`

**Indexes Created:**
- `idx_reports_category`
- `idx_reports_priority`
- `idx_reports_status`
- `idx_reports_coords` (latitude, longitude)
- `idx_reports_created`
- `idx_incidents_coords`

---

## 6. Environment Variables

Create a `.env` file in the root directory (based on `.env.example`):

```bash
# Gemini API Key for AI road hazard computer vision
GEMINI_API_KEY=""

# Secret key for signing JWT authentication tokens
SESSION_SECRET="roadsafe-india-super-secure-secret-2026-key"

# Port (Defaults to 3000)
PORT=3000
```

> **Note:** If `GEMINI_API_KEY` is not provided or quota is unavailable, RoadSafe India automatically switches to its built-in intelligent heuristic engine, allowing full functional testing and demonstration without disruptions.

---

## 7. How to Run the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Full-Stack Application
```bash
npm run dev
```
The server will start at `http://localhost:3000`. The Express backend handles all API endpoints at `/api/*` and mounts the Vite dev server for instant client-side rendering.

### 3. Production Build
```bash
npm run build
npm start
```

---

## 8. Demo Login Credentials

For demonstration and grading evaluation, two pre-configured accounts are seeded:

| Role | Email | Password | Full Name |
|---|---|---|---|
| **Demo Citizen** | `citizen@roadsafe.in` | `Citizen@123` | Rajesh Kumar |
| **Demo Safety Inspector (Admin)** | `admin@roadsafe.in` | `Admin@123` | Pooja Sharma (Safety Officer) |

*You can also click the **"Demo Switcher"** button in the top navigation bar or the quick buttons on the Login page for 1-click instant login.*

---

## 9. Current Prototype Limitations

1. **Academic Demonstration Scope:** Does not dispatch actual road work crews or file legal FIRs.
2. **Reverse Geocoding:** Relies on OpenStreetMap Nominatim, which may occasionally be rate-limited in testing environments.
3. **In-Memory Rate Limiting:** Rate limiting uses in-memory IP tables rather than a distributed Redis cache.

---

## 10. FUTURE SCOPE

The following features represent the planned development roadmap for production deployment in Indian municipalities:

- **[FUTURE SCOPE] Municipal Integration:** Direct API integration with GHMC, BBMP, BMC, and NHAI grievance management portals (e.g. Swachhata / CPGRAMS).
- **[FUTURE SCOPE] Automatic Municipal Notifications:** Automated email and WhatsApp dispatch alerts to local ward corporators and area executive engineers.
- **[FUTURE SCOPE] Multilingual Regional Support:** Localization for Hindi, Telugu, Tamil, Kannada, Marathi, Bengali, and Gujarati.
- **[FUTURE SCOPE] Edge Computer Vision Models:** On-device camera models capable of identifying potholes from moving dashcams in real-time.
- **[FUTURE SCOPE] Real-Time Traffic Integration:** Overlaying live traffic congestion data from OpenStreetMap/TomTom to estimate vehicle delays caused by road hazards.
- **[FUTURE SCOPE] Citizen Verification Gamification:** Community crowdsourcing where nearby citizens can verify repairs with follow-up photos to close reports.
- **[FUTURE SCOPE] SMS & WhatsApp Alert System:** Automated SMS status alerts sent to citizens when their submitted report moves from "Reported" to "Resolved".
- **[FUTURE SCOPE] Native Mobile Application:** Dedicated React Native / Android application with offline caching and background GPS breadcrumbs.
- **[FUTURE SCOPE] IoT Road Sensor Monitoring:** Accelerometer-based road roughness telemetry from municipal buses and city auto-rickshaws.
- **[FUTURE SCOPE] Predictive Maintenance AI:** Machine learning models forecasting monsoon road surface collapse based on historical rainfall and road age data.
