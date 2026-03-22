import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import crypto from 'crypto';
import { validateApplication } from './server/validation/engine';
import { logToSheet } from './server/reporting/sheets';
import { getAIInsights } from './server/intelligence/gemini';
import { autoFillFromDocuments } from './server/intelligence/autoFillAgent';
import { StoredApplication, ApplicationData, ValidationResult } from './src/types';

// In-memory store
const applicationStore: Map<string, StoredApplication> = new Map();
const STORE_FILE = path.join(process.cwd(), 'applications.json');

function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      for (const app of parsed) {
        applicationStore.set(app.id, app);
      }
      console.log(`Loaded ${applicationStore.size} applications from store.`);
    }
  } catch (err) {
    console.error('Error loading application store:', err);
  }
}

function saveStore() {
  try {
    const data = Array.from(applicationStore.values());
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving application store:', err);
  }
}

loadStore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  
  console.log('Environment Check:', {
    NODE_ENV: process.env.NODE_ENV,
    HAS_GEMINI_KEY: !!process.env.GEMINI_API_KEY,
    HAS_SHEETS_CONFIG: !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL && !!process.env.SHEET_ID,
    SHEET_ID: process.env.SHEET_ID
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Rate limiting for autofill
  const autofillRateLimit = new Map<string, { count: number, resetTime: number }>();

  // API Routes
  app.post('/api/autofill', async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      const limitData = autofillRateLimit.get(ip) || { count: 0, resetTime: now + 60000 };
      
      if (now > limitData.resetTime) {
        limitData.count = 1;
        limitData.resetTime = now + 60000;
      } else {
        limitData.count++;
      }
      
      autofillRateLimit.set(ip, limitData);

      if (limitData.count > 5) {
        return res.status(429).json({ error: 'Too Many Requests', message: 'Please wait a moment before uploading again' });
      }

      const { files } = req.body;
      if (!files || !Array.isArray(files)) {
        return res.status(400).json({ error: 'Missing or invalid files array' });
      }
      const result = await autoFillFromDocuments(files);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error('AutoFill Endpoint Error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  });

  app.get('/api/applications', (req, res) => {
    try {
      const apps = Array.from(applicationStore.values()).sort((a, b) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      res.json(apps);
    } catch (error: any) {
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  });

  app.get('/api/applications/stats', (req, res) => {
    try {
      const apps = Array.from(applicationStore.values());
      
      const stats = {
        total: apps.length,
        approved: apps.filter(a => a.status === 'APPROVED').length,
        rejected: apps.filter(a => a.status === 'REJECTED').length,
        flagged: apps.filter(a => a.status === 'FLAGGED').length,
        pendingReview: apps.filter(a => a.status === 'PENDING_REVIEW').length,
        averageRiskScore: apps.length > 0 ? Math.round(apps.reduce((sum, a) => sum + a.validationResult.tier3Enrichment.riskScore, 0) / apps.length) : 0,
        categoryBreakdown: {
          strongFit: apps.filter(a => a.validationResult.tier3Enrichment.category === 'Strong Fit').length,
          needsReview: apps.filter(a => a.validationResult.tier3Enrichment.category === 'Needs Review').length,
          weakFit: apps.filter(a => a.validationResult.tier3Enrichment.category === 'Weak Fit').length,
        },
        pathBreakdown: {
          pathA: apps.filter(a => a.data.educationPath === '10th -> 12th -> UG -> PG').length,
          pathB: apps.filter(a => a.data.educationPath === '10th -> Diploma -> UG').length,
          pathC: apps.filter(a => a.data.educationPath === '10th -> ITI -> Diploma -> UG').length,
        },
        submissionsPerDay: [] as { date: string, count: number }[]
      };

      // Calculate submissions per day for last 7 days
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const count = apps.filter(a => a.submittedAt.startsWith(dateStr)).length;
        stats.submissionsPerDay.push({ date: dateStr, count });
      }

      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  });

  app.get('/api/applications/:id', (req, res) => {
    try {
      const app = applicationStore.get(req.params.id);
      if (!app) return res.status(404).json({ error: 'Application not found' });
      res.json(app);
    } catch (error: any) {
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  });

  app.patch('/api/applications/:id/decision', async (req, res) => {
    try {
      const { status, directorNote, approvedBy } = req.body;
      const app = applicationStore.get(req.params.id);
      
      if (!app) return res.status(404).json({ error: 'Application not found' });
      if (status !== 'APPROVED' && status !== 'REJECTED') {
        return res.status(400).json({ error: 'Invalid status' });
      }
      if (!directorNote || directorNote.length < 20) {
        return res.status(400).json({ error: 'Director note must be at least 20 characters' });
      }

      app.status = status;
      app.directorNote = directorNote;
      app.approvedBy = approvedBy || 'Director';
      app.approvedAt = new Date().toISOString();
      
      saveStore();

      // Log decision to sheets
      try {
        await logToSheet(app.data, app.validationResult, {
          directorDecision: app.status,
          directorNote: app.directorNote,
          approvedBy: app.approvedBy,
          decisionTimestamp: app.approvedAt
        }, app.submittedAt);
      } catch (sheetErr) {
        console.error('Failed to update sheet with decision:', sheetErr);
      }

      res.json(app);
    } catch (error: any) {
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  });

  app.post('/api/validate', async (req, res) => {
    try {
      console.log('Validating application for:', req.body?.personalInfo?.fullName);
      if (!req.body) {
        return res.status(400).json({ error: 'Missing request body' });
      }
      const result = validateApplication(req.body);
      
      // Step 4 & 5: Intelligence & Reporting (Async)
      if (result.status !== 'REJECT') {
        // Get AI insights (awaiting to return in response)
        try {
          if (result.status === 'FLAG' || result.tier3Enrichment.riskScore > 30) {
            const insights = await getAIInsights(req.body, result);
            result.aiInsights = insights;
          } else {
            result.aiInsights = { summary: "Clean application, AI analysis skipped.", alignment: "Strong", strengths: "Low risk profile." };
          }
        } catch (aiError) {
          console.error('AI Insights Error:', aiError);
        }

        // Save to store
        const newApp: StoredApplication = {
          id: crypto.randomUUID(),
          submittedAt: new Date().toISOString(),
          data: req.body,
          validationResult: result,
          status: (result.tier2Flags.length > 0 || result.tier3Enrichment.riskScore > 50) ? 'FLAGGED' : 'PENDING_REVIEW'
        };
        applicationStore.set(newApp.id, newApp);
        saveStore();

        // Log to sheets in background
        logToSheet(req.body, result, undefined, newApp.submittedAt).catch(err => console.error('Sheets Logging Error:', err));
      }
      
      res.json(result);
    } catch (error: any) {
      console.error('CRITICAL: Validation Endpoint Error:', error);
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: `Server failed to process request: ${error.message}`,
        details: error.stack,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Global Error:', err);
    res.status(500).json({ error: 'Global Server Error', message: err.message });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AdmitGuard v2 Server running on http://localhost:${PORT}`);
  });
}

startServer();
