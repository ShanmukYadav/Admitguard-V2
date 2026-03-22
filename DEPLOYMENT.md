# AdmitGuard v2 - Deployment Guide

## 1. Environment Variables
Ensure the following are set in your production environment (Render, Vercel, etc.):
- `GEMINI_API_KEY`: From Google AI Studio.
- `GOOGLE_SHEETS_CLIENT_EMAIL`: Service account email.
- `GOOGLE_SHEETS_PRIVATE_KEY`: Service account private key (handle `\n` characters).
- `SHEET_ID`: The ID of your Google Sheet.

## 2. Deploying to Render (Full-Stack)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node server.ts` (Note: `tsx` is used in dev, but for production you might want to compile or use `tsx` if the environment supports it. In this applet environment, `tsx` is available).

## 3. Deploying to Vercel
- Vercel is primarily for frontend. For full-stack with a custom Express server, use **Render** or **Railway**.
- If using Vercel, you would need to convert the Express routes into Vercel Serverless Functions (`/api/*`).

## 4. Google Sheets Setup
1. Create a new Google Sheet.
2. Create a Service Account in Google Cloud Console.
3. Share the Sheet with the Service Account email (Editor access).
4. Enable the Google Sheets API.
