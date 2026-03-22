# AdmitGuard v2

AdmitGuard v2 is an enterprise-grade admission validation platform. It captures applicant data, validates it against complex rules (including Indian education pathways), provides an intelligence layer for scoring and categorization, and persists data to Google Sheets.

## Architecture

The application is structured into four layers:
1. **Input Layer (Frontend):** React-based UI that dynamically adapts to education paths (Standard, Diploma, Lateral) and captures work experience.
2. **Validation Engine (Backend):** Node.js/Express backend using Zod for robust server-side validation. It enforces Hard Rejects (Tier 1) and Soft Flags (Tier 2).
3. **Intelligence Layer (Analytics/ML):** Calculates a risk score, categorizes applicants, and uses the Gemini API to generate AI insights (summary, alignment, strengths).
4. **Persistent Storage & Reporting:** Integrates with Google Sheets to log validated applications in real-time.

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file with the following:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   GOOGLE_SHEETS_CLIENT_EMAIL=your_service_account_email
   SHEET_ID=your_google_sheet_id
   ```

3. **Google Sheets Private Key:**
   Create a `server/reporting/privatekey.json` file with your service account private key:
   ```json
   {
     "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
   }
   ```

4. **Run the Application:**
   ```bash
   npm run dev
   ```

## Tech Stack
- **Frontend:** React, Tailwind CSS, Lucide React, Framer Motion
- **Backend:** Node.js, Express, Zod
- **Integrations:** Google Sheets API (`google-spreadsheet`), Gemini API (`@google/genai`)

## Live URL
The application is deployed and accessible at the provided AI Studio URL.
