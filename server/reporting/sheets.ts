import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { readFileSync } from 'fs';
import { join } from 'path';

// Inline types to avoid path resolution issues
interface PersonalInfo { fullName: string; email: string; phone?: string; dateOfBirth?: string; }
interface ApplicationData { personalInfo: PersonalInfo; educationPath: string; [key: string]: any; }
interface ValidationResult { status: string; tier1Errors: string[]; tier2Flags: string[]; tier3Enrichment: { riskScore: number; category: string; totalExperienceMonths: number; domainRelevantExperienceMonths: number; completeness: number; normalizedScores?: Record<string, number>; }; aiInsights?: { summary: string; alignment: string; strengths: string; }; [key: string]: any; }

export async function logToSheet(data: ApplicationData, result: ValidationResult, decision?: { directorDecision: string; directorNote: string; approvedBy: string; decisionTimestamp: string; }, originalTimestamp?: string) {
  if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !process.env.SHEET_ID) {
    console.warn("Google Sheets credentials or Sheet ID missing. Skipping logging.");
    return;
  }

  try {
    // Load private key from environment variable
    let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY || '';

    // Robust cleaning: handles literal \n and ensures correct PEM format
    privateKey = privateKey
      .replace(/\\n/g, '\n')
      .trim();

    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }

    // Initialize Auth
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Initialize Spreadsheet
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID, serviceAccountAuth);

    // Load info (this verifies auth)
    await doc.loadInfo();

    // Get the first sheet or Sheet1
    const sheet = doc.sheetsByTitle['Sheet1'] || doc.sheetsByIndex[0];

    // Ensure headers exist for all fields
    const headers = [
      'Timestamp', 'Name', 'Email', 'Phone', 'Path', 
      'Status', 'Risk', 'Category', 
      'ExperienceBucket', 'Total_Experience_Months', 'Domain_Experience_Months', 'Completeness',
      'NormalizedScores', 'Flags', 'Errors', 'ValidationExplanation', 
      'AI_Summary', 'AI_Alignment', 'AI_Strengths',
      'DirectorDecision', 'DirectorNote', 'ApprovedBy', 'DecisionTimestamp'
    ];
    
    try {
      await sheet.loadHeaderRow();
      if (sheet.headerValues.length === 0) {
        await sheet.setHeaderRow(headers);
      } else {
        await sheet.setHeaderRow(headers);
      }
    } catch (e) {
      await sheet.setHeaderRow(headers);
    }

    // Prepare row
    const totalExp = result.tier3Enrichment.totalExperienceMonths || 0;
    let expBucket = "Senior (5+yr)";
    if (totalExp === 0) expBucket = "Fresher";
    else if (totalExp <= 24) expBucket = "Junior (0-2yr)";
    else if (totalExp <= 60) expBucket = "Mid (2-5yr)";

    const row = {
      Timestamp: originalTimestamp || new Date().toISOString(),
      Name: data.personalInfo.fullName,
      Email: data.personalInfo.email,
      Phone: data.personalInfo.phone,
      Path: data.educationPath,
      Status: result.status,
      Risk: result.tier3Enrichment.riskScore,
      Category: result.tier3Enrichment.category,
      ExperienceBucket: expBucket,
      Total_Experience_Months: totalExp,
      Domain_Experience_Months: result.tier3Enrichment.domainRelevantExperienceMonths,
      Completeness: result.tier3Enrichment.completeness,
      NormalizedScores: JSON.stringify(result.tier3Enrichment.normalizedScores || {}),
      Flags: JSON.stringify(result.tier2Flags),
      Errors: JSON.stringify(result.tier1Errors),
      ValidationExplanation: result.explanation || '',
      AI_Summary: result.aiInsights?.summary || '',
      AI_Alignment: result.aiInsights?.alignment || '',
      AI_Strengths: result.aiInsights?.strengths || '',
      DirectorDecision: decision?.directorDecision || '',
      DirectorNote: decision?.directorNote || '',
      ApprovedBy: decision?.approvedBy || '',
      DecisionTimestamp: decision?.decisionTimestamp || ''
    };

    if (decision && originalTimestamp) {
      // Try to find the existing row to update
      const rows = await sheet.getRows();
      // Match by Email and check if the originalTimestamp is included, or just match by Email and Status
      const existingRow = rows.find(r => {
        const rowEmail = r.get('Email');
        const rowTimestamp = r.get('Timestamp');
        if (rowEmail !== data.personalInfo.email) return false;
        
        // If timestamp matches exactly
        if (rowTimestamp === originalTimestamp) return true;
        
        // If Google Sheets formatted the timestamp, we can check if it's the same application
        // by checking if the row is still pending/flagged and matches the email
        const rowStatus = r.get('Status');
        if (rowStatus === 'PENDING_REVIEW' || rowStatus === 'FLAGGED') return true;
        
        return false;
      });
      
      if (existingRow) {
        existingRow.assign(row);
        await existingRow.save();
        console.log('Successfully updated row in Google Sheets');
        return;
      }
    }

    // Add row if not updating or row not found
    await sheet.addRow(row);
    console.log('Successfully logged to Google Sheets');

  } catch (error: any) {
    console.error("Sheets Logging Error:", error.message);
  }
}