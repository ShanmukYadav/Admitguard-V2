import { GoogleGenAI } from "@google/genai";
import { ApplicationData, ValidationResult } from "../../src/types";

export async function getAIInsights(data: ApplicationData, result: ValidationResult) {
  const rawApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  const apiKey = rawApiKey.trim().replace(/^"|"$/g, '');
  
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.length < 10) {
    console.warn("GEMINI_API_KEY missing, placeholder, or invalid. Skipping AI insights.");
    return { summary: "AI insights unavailable (API key not configured)", alignment: "N/A", strengths: "N/A" };
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Analyze this student application for admission to a technical program:
    
    Applicant: ${data.personalInfo.fullName}
    Education Path: ${data.educationPath}
    Education History: ${JSON.stringify(data.educationHistory, null, 2)}
    Work Experience: ${JSON.stringify(data.workExperience, null, 2)}
    
    Validation Status: ${result.status}
    Risk Score: ${result.tier3Enrichment.riskScore}/100
    Total Experience: ${result.tier3Enrichment.totalExperienceMonths} months
    Domain Relevant Experience: ${result.tier3Enrichment.domainRelevantExperienceMonths} months
    Flags: ${result.tier2Flags.join(', ')}
    Errors: ${result.tier1Errors.join(', ')}
    
    Provide a concise 3-part analysis in JSON format:
    {
      "summary": "1-2 sentences summarizing the applicant's profile (education + work).",
      "alignment": "1-2 sentences on how well their background (especially domain experience) aligns with a technical program.",
      "strengths": "1-2 sentences highlighting their strongest points (e.g., specific skills, consistent scores, relevant work)."
    }
    
    Return ONLY valid JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        maxOutputTokens: 500
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return { summary: "AI insights unavailable", alignment: "N/A", strengths: "N/A" };
  }
}