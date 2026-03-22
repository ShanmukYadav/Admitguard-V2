import { GoogleGenAI, Type } from '@google/genai';
import { ApplicationData, EducationPath, EducationLevel } from '../../src/types';

const fileCache = new Map<string, any>();

export async function autoFillFromDocuments(files: { name: string; base64: string; mimeType: string }[]) {
  const envKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  const rawApiKey = (envKey === 'MY_GEMINI_API_KEY' || envKey.length < 20) 
    ? "" 
    : envKey;
  const apiKey = rawApiKey ? rawApiKey.trim().replace(/^"|"$/g, '') : undefined;
  console.log("API Key being used:", apiKey ? apiKey.substring(0, 10) + "..." : "NONE");
  console.log("API Key length:", apiKey?.length);
  
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.length < 10) {
    console.warn("GEMINI_API_KEY missing, placeholder, or invalid. AI autofill will return empty/mock data.");
    return { 
      data: { 
        personalInfo: { fullName: '', email: '', phone: '', dateOfBirth: '' }, 
        educationPath: EducationPath.PATH_A, 
        educationHistory: [], 
        workExperience: [] 
      }, 
      confidence: 0, 
      warnings: ["AI processing skipped: Missing API Key"] 
    };
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  let educationHistory: any[] = [];
  let personalInfo: any = {};
  let workExperience: any[] = [];
  let warnings: string[] = [];
  
  const getFilePart = (file: { name: string; base64: string; mimeType: string }) => {
    if (file.mimeType === 'text/csv' || file.mimeType === 'application/csv' || file.name.endsWith('.csv')) {
      const decodedText = Buffer.from(file.base64, 'base64').toString('utf-8');
      return { text: `Document content (${file.name}):\n${decodedText}` };
    }
    return { inlineData: { data: file.base64, mimeType: file.mimeType } };
  };

  for (const file of files) {
    try {
      const cacheKey = file.base64.substring(0, 100);
      let extractedData: any;

      if (fileCache.has(cacheKey)) {
        console.log(`Using cached result for file: ${file.name}`);
        extractedData = fileCache.get(cacheKey);
      } else {
        const filePart = getFilePart(file);
        
        const prompt = `You are a document parser for an Indian education admission system. 
Analyze this document and extract ALL available information in one pass.

Reply ONLY with this exact JSON structure (no markdown, no extra text):
{
  "personalInfo": { "fullName": "string", "email": "string", "phone": "string", "dateOfBirth": "string" },
  "educationHistory": [{
    "level": "10th"|"12th"|"Diploma"|"ITI"|"UG"|"PG"|"PhD",
    "boardUniversity": "string",
    "yearOfPassing": 2020,
    "score": 85,
    "scoreScale": "Percentage"|"CGPA_10"|"CGPA_4",
    "stream": "string",
    "backlogs": 0,
    "gapMonths": 0
  }],
  "workExperience": [{
    "company": "string",
    "role": "string",
    "domain": "string",
    "startDate": "string",
    "endDate": "string",
    "isCurrent": false,
    "employmentType": "Full-time"|"Part-time"|"Internship"|"Contract"|"Freelance",
    "skills": ["string"]
  }]
}

Rules:
- For CSV: parse all rows, group education and work entries per person
- For phone: digits only, remove country code, dashes, spaces
- For education levels map: Bachelors/B.Tech/BE/BCA/BSc → UG, Masters/M.Tech/MCA/MBA → PG
- For CGPA: if out of 4.0 use CGPA_4, if out of 10 use CGPA_10
- If a field is not found, use empty string for strings, 0 for numbers, false for booleans
- Never return null, always return the full structure even if empty`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: {
            parts: [
              filePart,
              { text: prompt }
            ]
          },
          config: {
            responseMimeType: 'application/json',
            maxOutputTokens: 4096
          }
        });
        
        console.log("Raw Gemini response:", response.text);
        try {
          extractedData = JSON.parse(response.text || '{}');
        } catch (parseError) {
          console.error("Failed to parse Gemini response:", parseError);
          extractedData = {};
        }
        fileCache.set(cacheKey, extractedData);
      }

      if (extractedData.personalInfo) {
        personalInfo = { ...personalInfo, ...extractedData.personalInfo };
      }
      if (extractedData.educationHistory && Array.isArray(extractedData.educationHistory)) {
        educationHistory = [...educationHistory, ...extractedData.educationHistory];
      }
      if (extractedData.workExperience && Array.isArray(extractedData.workExperience)) {
        workExperience = [...workExperience, ...extractedData.workExperience];
      }
    } catch (err: any) {
      console.error(`Error processing file ${file.name}:`, err);
      warnings.push(`Failed to process ${file.name}: ${err.message}`);
    }
  }

  // Step 3: Merge and return
  educationHistory.sort((a, b) => (a.yearOfPassing || 0) - (b.yearOfPassing || 0));
  
  // Auto-detect educationPath
  let educationPath = EducationPath.PATH_A;
  const has12th = educationHistory.some(e => e.level === '12th' || e.level === EducationLevel.TWELFTH);
  const hasDiploma = educationHistory.some(e => e.level === 'Diploma' || e.level === EducationLevel.DIPLOMA);
  const hasITI = educationHistory.some(e => e.level === 'ITI' || e.level === EducationLevel.ITI);
  
  if (has12th) {
    educationPath = EducationPath.PATH_A;
  } else if (hasDiploma && !has12th && !hasITI) {
    educationPath = EducationPath.PATH_B;
  } else if (hasITI) {
    educationPath = EducationPath.PATH_C;
  }

  // Calculate confidence
  let expectedFields = 4; // personalInfo fields
  let extractedFields = 0;
  if (personalInfo.fullName) extractedFields++;
  else warnings.push("Could not extract: Full Name — please fill manually");
  
  if (personalInfo.email) extractedFields++;
  else warnings.push("Could not extract: Email — please fill manually");
  
  if (personalInfo.phone) extractedFields++;
  else warnings.push("Could not extract: Phone — please fill manually");
  
  if (personalInfo.dateOfBirth) extractedFields++;
  else warnings.push("Could not extract: Date of Birth — please fill manually");
  
  const confidence = Math.round((extractedFields / expectedFields) * 100);

  const data: ApplicationData = {
    personalInfo: {
      fullName: personalInfo.fullName || '',
      email: personalInfo.email || '',
      phone: personalInfo.phone || '',
      dateOfBirth: personalInfo.dateOfBirth || ''
    },
    educationPath,
    educationHistory,
    workExperience
  };

  return { data, confidence, warnings };
}
