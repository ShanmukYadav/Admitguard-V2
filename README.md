<div align="center">

# 🛡️ AdmitGuard v2

### Admission Validation Platform with Agentic AI
[![Live App](https://img.shields.io/badge/Live%20App-Render-blue?style=for-the-badge&logo=render)](https://admitguard-v2.onrender.com)
[![Google Sheets](https://img.shields.io/badge/Google%20Sheets-Live%20Data-green?style=for-the-badge&logo=googlesheets)](https://docs.google.com/spreadsheets/d/1YViOiL7NKDol_PX5Vi_yILnT7So9FJwyIFiIsRGeAC0/edit?gid=0#gid=0)
[![GitHub](https://img.shields.io/badge/GitHub-Source%20Code-black?style=for-the-badge&logo=github)](https://github.com/ShanmukYadav/Admitguard-V2)

</div>

---

## 📌 The Problem

Admission pipelines at premier institutions process hundreds of candidates per cohort. The current reality:

- Counselors **manually type** candidate data into Excel sheets — slow and error-prone
- **Zero validation** at point of entry — ineligible candidates only get caught at document verification, after wasting interview panel time
- **No audit trail** for exception decisions
- **No intelligence layer** — every application treated the same regardless of risk profile

AdmitGuard v2 solves all of this in one platform.

---

## 🚀 Live Links

| Resource | Link |
|----------|------|
| 🌐 Live Application | [https://admitguard-v2.onrender.com](https://admitguard-v2.onrender.com) |
| 📊 Live Google Sheet | [View Real-Time Data](https://docs.google.com/spreadsheets/d/1YViOiL7NKDol_PX5Vi_yILnT7So9FJwyIFiIsRGeAC0/edit?gid=0#gid=0) |
| 💻 Source Code | [GitHub Repository](https://github.com/ShanmukYadav/Admitguard-V2) |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AdmitGuard v2                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    FRONTEND (React + TS)                  │   │
│  │                                                          │   │
│  │  Step 0: 🤖 Agent Auto-Fill  ──→  Upload CSV/PDF/Image  │   │
│  │  Step 1: 👤 Personal Info                               │   │
│  │  Step 2: 🎓 Education Path (Indian System)              │   │
│  │  Step 3: 💼 Work Experience                             │   │
│  │  Step 4: ✅ Results + Risk Score                        │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       │ POST /api/validate                      │
│                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               EXPRESS BACKEND (Node.js + TS)             │   │
│  │                                                          │   │
│  │  ┌─────────────────┐  ┌──────────────────────────────┐  │   │
│  │  │ Validation Engine│  │    Intelligence Layer        │  │   │
│  │  │                 │  │                              │  │   │
│  │  │ Tier 1: REJECT  │  │ • Risk Scoring (0-100)      │  │   │
│  │  │ Tier 2: FLAG    │  │ • Auto-Categorization       │  │   │
│  │  │ Tier 3: ENRICH  │  │ • Gemini AI Insights        │  │   │
│  │  └─────────────────┘  └──────────────────────────────┘  │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       │                                         │
│          ┌────────────┴────────────┐                           │
│          ▼                         ▼                           │
│  ┌──────────────────┐   ┌─────────────────────────────────┐   │
│  │  In-Memory Store  │   │     Google Sheets (Live Sync)   │   │
│  │  + JSON File      │   │     23 columns, real-time       │   │
│  └──────────────────┘   └─────────────────────────────────┘   │
│          │                                                      │
│          ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      DASHBOARDS                          │   │
│  │  👤 Counselor Dashboard  |  🔐 Director Dashboard       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## ☁️ Deployment

AdmitGuard v2 is hosted on **Render** — a full-stack cloud platform that runs both the React frontend and the Express backend together as a single service.

| Detail | Value |
|--------|-------|
| Platform | Render (Free Tier) |
| Live URL | https://admitguard-v2.onrender.com |
| Runtime | Node.js v22 |
| Region | Oregon, USA |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/server.cjs` |
| Auto-Deploy | Yes — every push to `main` triggers a redeploy |

> **Note:** Render free tier spins down after 15 minutes of inactivity. First load may take 30-60 seconds to wake up.

---

## 🤖 Agentic Auto-Fill Feature

> **The standout feature of AdmitGuard v2.** Instead of counselors manually typing every field, an AI agent reads uploaded documents and fills the entire form automatically.

### How the Agent Works

```
Counselor uploads document (CSV / PDF / Image)
           │
           ▼
   Agent sends document to Gemini 2.5 Flash
   with a structured extraction prompt
           │
           ▼
   Gemini reads and returns structured JSON:
   ├── personalInfo (name, email, phone, DOB)
   ├── educationHistory (level, board, year, score, stream)
   └── workExperience (company, role, domain, dates, skills)
           │
           ▼
   Form auto-populates across ALL steps
   Confidence score calculated (0–100%)
           │
           ▼
   ⚠️  IMPORTANT: Counselor reviews ALL filled fields
       across every step before proceeding
           │
           ▼
   Counselor clicks Submit
           │
           ▼
   Validation runs → Data saved → Google Sheets updated
```

### Why This Is Truly Agentic

| Capability | Description |
|-----------|-------------|
| **Autonomous Decision Making** | Agent detects document type and adapts extraction without being told |
| **Intelligent Data Mapping** | Maps "Bachelors" → "UG", strips country codes from phones, converts CGPA scales automatically |
| **Self-Evaluation** | Calculates its own confidence score based on how many fields were successfully extracted |
| **Edge Case Handling** | Handles partial data gracefully — warns counselor about missing fields |
| **Result Caching** | Remembers previously processed documents to avoid redundant API calls |

### Supported Document Formats

| Format | Use Case |
|--------|----------|
| 📄 CSV | Exported candidate data from other systems |
| 📑 PDF | Marksheets, degree certificates |
| 🖼️ JPG / PNG | Scanned documents, photos of certificates |

### Sample CSV Format

Download the sample: [`public/sample_applicant.csv`](public/sample_applicant.csv)

```csv
Full Name,Email,Phone,Date of Birth,Edu Level,Edu Board/University,...
Balaji Venkatesh,balaji.venkatesh@gmail.com,9894561230,2000-11-03,10th,CBSE,...
```

> **Note:** After the agent fills the form, the counselor must **review all fields** across each step and click **Submit** to trigger validation and save to Google Sheets. The agent assists — the human confirms.

---

## ✅ Validation Engine

Three-tier server-side validation. No client-side shortcuts — all rules enforced in `engine.ts`.

### Tier 1 — Hard Reject 🔴
*Application cannot proceed. Returns field-level error messages.*

| Rule | Condition |
|------|-----------|
| Missing mandatory fields | Name, email, phone, 10th details required |
| Duplicate application | Same email or phone already submitted |
| Age check | Must be ≥ 18 at time of application |
| Chronological dates | Education years must be in ascending order |
| Score range | Percentage cannot exceed 100 |
| Path enforcement | Path A requires 12th; Path B requires Diploma |
| Stream required | Stream/specialization mandatory for 12th and above |

### Tier 2 — Soft Flag 🟡
*Application saved but flagged for director review.*

| Rule | Condition |
|------|-----------|
| Education gap | Gap > 24 months between education levels |
| Active backlogs | Backlogs > 0 at any level |
| No work experience | > 3 years since last qualification with zero work experience |
| Career gaps | > 6 months gap between jobs |
| Domain transitions | > 3 career domain switches detected |
| Low academic score | Below program-defined threshold |

### Tier 3 — Enrichment 🟢
*Auto-computed metadata attached to every record.*

- Normalized scores across all education levels (CGPA → Percentage)
- Total experience bucket (Fresher / Junior / Mid / Senior)
- Application completeness percentage
- Risk score (0–100) and category classification

---

## 🧠 Intelligence Layer

### Risk Scoring Formula (0–100)

```
Risk Score =
  (Tier 2 Flags × 10)
  + (Declining score trend × 10)
  + (Latest education score < 50% × 15)
  + (Total education gap > 24mo × 10)
  + (Total education gap > 48mo × 10)
  + (Backlogs × 5 each)
  + (No work exp + 3yr since graduation × 15)

  MAX capped at 100
```

### Auto-Categorization

| Risk Score | Category | Action |
|-----------|----------|--------|
| 0 – 19 | 🟢 Strong Fit | Auto-approved |
| 20 – 49 | 🟡 Needs Review | Director review recommended |
| 50 – 100 | 🔴 Weak Fit | Director approval required |

### Gemini AI Insights
For flagged and high-risk applications, Gemini generates:
- **Summary** — 2-sentence candidate profile overview
- **Alignment** — Career fit assessment for technical programs
- **Strengths** — Key positive aspects of the application

---

## 📊 Google Sheets Integration

Every validated application **automatically syncs** to a live Google Sheet within seconds. No manual steps required.

**[→ View Live Sheet](https://docs.google.com/spreadsheets/d/1YViOiL7NKDol_PX5Vi_yILnT7So9FJwyIFiIsRGeAC0/edit?gid=0#gid=0)**

### All 23 Columns

| Column | Description |
|--------|-------------|
| `Timestamp` | ISO timestamp of submission |
| `Name` | Candidate full name |
| `Email` | Candidate email address |
| `Phone` | Candidate phone number |
| `Path` | Education path selected (A/B/C) |
| `Status` | SUCCESS / FLAG / REJECT |
| `Risk` | Risk score (0–100) |
| `Category` | Strong Fit / Needs Review / Weak Fit |
| `ExperienceBucket` | Fresher / Junior / Mid / Senior |
| `Total_Experience_Months` | Computed total work tenure |
| `Domain_Experience_Months` | Relevant domain experience |
| `Completeness` | Form completion percentage |
| `NormalizedScores` | Per-level scores normalized to % (JSON) |
| `Flags` | Tier 2 flags as JSON array |
| `Errors` | Tier 1 errors as JSON array |
| `ValidationExplanation` | Human-readable decision reason |
| `AI_Summary` | Gemini profile summary |
| `AI_Alignment` | Gemini career alignment analysis |
| `AI_Strengths` | Gemini strengths assessment |
| `DirectorDecision` | APPROVED / REJECTED |
| `DirectorNote` | Director's rationale for decision |
| `ApprovedBy` | Director name |
| `DecisionTimestamp` | When the director decision was made |

---

## 👥 Dashboards

### 👤 Counselor Dashboard
Read-only view for admissions staff.

- 4 summary stat cards: Total, Pending Review, Flagged, Approved
- Searchable and filterable table (by status, category, name, email)
- Expandable rows showing full application details
- Color-coded status badges (blue / amber / green / red)

### 🔐 Director Dashboard
Full control interface for the program director.

- Analytics section: risk score distribution, submissions per day trend, category breakdown
- **"Needs Director Attention"** — auto-filtered section showing flagged + high-risk applications
- Per-application action panel: Approve or Reject with mandatory director note
- All decisions sync to Google Sheets in real-time

---

## 🛠️ Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | React 19 + TypeScript + Tailwind CSS | Type-safe, responsive, component-driven UI |
| Backend | Express + TypeScript | Lightweight server with full validation control |
| Validation | Zod + custom business logic | Schema validation + semantic rules in one pass |
| Intelligence | Weighted rule engine + Gemini AI | Explainable scores + LLM-powered insights |
| Agent | Gemini (vision + text) | Multi-format document extraction in 1 API call |
| Reporting | google-spreadsheet v5 + JWT auth | Real-time sync via service account |
| Hosting | Render | Full-stack Node.js hosting, auto-deploy from GitHub |
| Build | Vite + esbuild | Fast HMR for frontend + bundled server |

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- Gemini API key from [aistudio.google.com](https://aistudio.google.com)
- Google Cloud service account with Sheets API enabled

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/ShanmukYadav/Admitguard-V2.git
cd Admitguard-V2

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your actual values

# 4. Start development server
npm run dev

# 5. Open in browser
# http://localhost:3000
```

### Environment Variables

```env
# Gemini API — get from aistudio.google.com
GEMINI_API_KEY=your_gemini_api_key_here

# Google Sheets — from Google Cloud Console service account
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
SHEET_ID=your_google_sheet_id
```

---

## 📁 Project Structure

```
Admitguard-V2/
│
├── server.ts                        # Express server + all API routes
│
├── server/
│   ├── intelligence/
│   │   ├── autoFillAgent.ts         # 🤖 Agentic document extraction
│   │   └── gemini.ts                # AI insights generation
│   │
│   ├── validation/
│   │   └── engine.ts                # Tier 1/2/3 validation rules
│   │
│   └── reporting/
│       └── sheets.ts                # Google Sheets live sync
│
├── src/
│   ├── App.tsx                      # 5-step application form
│   ├── CounselorDashboard.tsx       # Read-only counselor view
│   ├── DirectorDashboard.tsx        # Director approval interface
│   └── types.ts                     # Shared TypeScript interfaces
│
├── public/
│   └── sample_applicant.csv         # Demo CSV for auto-fill testing
│
├── .env.example                     # Environment variable template
├── DEPLOYMENT.md                    # Deployment guide
└── README.md                        # This file
```

---

## 🎯 Key Design Decisions

**1. Server-side validation only**
Client-side `required` attributes are UX convenience only. All 3 tiers enforced entirely in `engine.ts`. Cannot be bypassed by disabling JavaScript.

**2. Single Gemini call per document**
Earlier versions made 3 separate API calls per file. Refactored to 1 combined call — reduces API quota usage by 66% and latency by ~2 seconds per document.

**3. Human-in-the-loop agent design**
The agent fills the form but never submits it. The counselor always reviews and confirms. AI assists — human decides.

**4. Weighted risk scoring**
Simple flag counting produces scores that cluster at the same values. The weighted formula with different multipliers per risk factor produces a meaningful, explainable distribution.

**5. Render over Vercel**
Vercel is frontend-only. Render supports full-stack Node.js with persistent processes — essential for the Express backend and in-memory application store.

---

## ⚠️ Known Limitations

- No user authentication — director dashboard is open access (v3 would add OAuth)
- Render free tier spins down after inactivity — first load may be slow
- Gemini free tier: ~20 requests/day — sufficient for demo, needs paid tier for production
- In-memory store resets on server restart (mitigated by `applications.json` persistence)

---

<div align="center">

*AdmitGuard v2 — Admission Validation Platform*

</div>

---

## 🔮 Future Scope

### 1. Bulk CSV Processing (High Priority)
Currently the auto-fill agent reads a CSV and fills the form for **one candidate at a time** — the counselor still has to review and submit each one manually.

The next version would support **true bulk processing**:
```
Upload CSV with 50-60 candidates
           │
           ▼
Agent reads ALL rows automatically
           │
           ▼
Each row → Validation Engine → Intelligence Layer
           │
           ▼
All records written to Google Sheets in one batch
           │
           ▼
Summary report: X passed, Y flagged, Z rejected
```

This would reduce a 2-hour manual data entry session to a single CSV upload — the entire point of the platform.

### 2. Authentication & Role-Based Access
Currently the Director Dashboard is open to anyone with the URL. v3 would add:
- Google OAuth login
- Role assignment: Counselor / Director / Admin
- Audit log showing who viewed/approved what and when

### 3. Multi-Institution Rule Engine
Currently validation rules are hardcoded for one program. Future version would support:
- Multiple institutions with separate rule sets
- Rules editable via a UI (no code changes needed)
- Rule versioning — track which cohort used which rule set

### 4. ML-Based Risk Scoring
Current risk scoring is rule-based (weighted formula). Once enough historical data accumulates in Google Sheets:
- Train a logistic regression model on past admission outcomes
- Replace the rule-based score with a model prediction
- Continuously retrain as more data comes in

### 5. Automated Offer Letter Pipeline
Currently AdmitGuard only validates and consolidates data — offer letters are issued separately. Future integration would:
- Auto-generate offer letter PDFs for APPROVED candidates
- Send via email directly from the platform
- Track acceptance/rejection responses

### 6. WhatsApp / Email Notifications
- Notify candidates automatically when their application status changes
- Alert directors when high-risk applications need review
- Weekly digest reports to program heads
