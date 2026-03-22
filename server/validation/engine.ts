import { z } from 'zod';
import { ApplicationData, ValidationResult, EducationLevel, EducationPath } from '../../src/types';

// Tier 1: Zod Schema for basic validation
const EducationEntrySchema = z.object({
  level: z.nativeEnum(EducationLevel),
  boardUniversity: z.string().min(2, "Board/University is required"),
  stream: z.string().optional(),
  yearOfPassing: z.number().min(1950).max(new Date().getFullYear() + 5), // Allow future passing for current students
  score: z.number().min(0),
  scoreScale: z.enum(['Percentage', 'CGPA (out of 10)', 'CGPA (out of 4)', 'Grade']),
  backlogs: z.number().min(0).optional(),
  gapMonths: z.number().min(0)
});

const WorkExperienceSchema = z.object({
  company: z.string().min(2, "Company name is required"),
  role: z.string().min(2, "Role is required"),
  domain: z.enum(['IT', 'Non-IT', 'Government', 'Startup', 'Freelance', 'Other']),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  isCurrent: z.boolean(),
  employmentType: z.enum(['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance']),
  skills: z.array(z.string())
});

const ApplicationSchema = z.object({
  personalInfo: z.object({
    fullName: z.string().min(3, "Full name must be at least 3 characters"),
    email: z.string().email("Invalid email format"),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
    dateOfBirth: z.string().min(1, "Date of birth is required")
  }),
  educationPath: z.nativeEnum(EducationPath),
  educationHistory: z.array(EducationEntrySchema).min(1, "At least one education entry is required"),
  workExperience: z.array(WorkExperienceSchema)
});

// In-memory store for duplicate checking (for this sprint)
const submittedApplications = new Set<string>();

export function validateApplication(data: any): ValidationResult {
  console.log('Engine: Starting validation for data:', JSON.stringify(data).substring(0, 100) + '...');
  const tier1Errors: string[] = [];
  const tier2Flags: string[] = [];
  
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    console.warn('Engine: Invalid or empty data provided');
    return {
      status: 'REJECT',
      tier1Errors: ['No valid data provided'],
      tier2Flags: [],
      tier3Enrichment: { riskScore: 100, category: 'Weak Fit', totalExperienceMonths: 0, domainRelevantExperienceMonths: 0, completeness: 0, normalizedScores: {} },
      explanation: 'No valid data provided'
    };
  }

  // Tier 1: Schema Validation
  const parseResult = ApplicationSchema.safeParse(data);
  if (!parseResult.success) {
    tier1Errors.push(...parseResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`));
  }

  const appData = data as ApplicationData;

  // Duplicate Check
  const uniqueKey = `${appData.personalInfo?.email?.toLowerCase()}|${appData.personalInfo?.phone}`;
  if (appData.personalInfo?.email && appData.personalInfo?.phone && submittedApplications.has(uniqueKey)) {
    tier1Errors.push('Duplicate application: An application with this email and phone number has already been submitted.');
  }

  if (tier1Errors.length === 0) {
    // Tier 1: Business Logic Rejections
    
    // Age check
    const dob = new Date(appData.personalInfo.dateOfBirth);
    if (!isNaN(dob.getTime())) {
      const age = new Date().getFullYear() - dob.getFullYear();
      if (age < 18) tier1Errors.push('Applicant must be at least 18 years old');
    } else {
      tier1Errors.push('Invalid Date of Birth');
    }

    // 10th Mandatory
    const has10th = appData.educationHistory.some(e => e.level === EducationLevel.TENTH);
    if (!has10th) tier1Errors.push('10th grade education details are mandatory');

    // Path specific validation
    const has12th = appData.educationHistory.some(e => e.level === EducationLevel.TWELFTH);
    const hasDiploma = appData.educationHistory.some(e => e.level === EducationLevel.DIPLOMA);
    const hasUG = appData.educationHistory.some(e => e.level === EducationLevel.UG);

    if (appData.educationPath === EducationPath.PATH_A && hasUG && !has12th) {
      tier1Errors.push('Path A requires 12th grade details before UG');
    }
    if (appData.educationPath === EducationPath.PATH_B && hasUG && !hasDiploma) {
      tier1Errors.push('Path B requires Diploma details before UG');
    }

    // Chronological years & Score validation
    const sortedEdu = [...appData.educationHistory].sort((a, b) => a.yearOfPassing - b.yearOfPassing);
    for (let i = 0; i < sortedEdu.length; i++) {
      const edu = sortedEdu[i];
      
      // Chronological check
      if (i > 0 && edu.yearOfPassing < sortedEdu[i-1].yearOfPassing) {
        tier1Errors.push(`Chronological error: ${edu.level} passing year (${edu.yearOfPassing}) cannot be before ${sortedEdu[i-1].level} (${sortedEdu[i-1].yearOfPassing})`);
      }

      // Score range check
      if (edu.scoreScale === 'Percentage' && edu.score > 100) {
        tier1Errors.push(`Invalid score: Percentage for ${edu.level} cannot exceed 100`);
      } else if (edu.scoreScale === 'CGPA (out of 10)' && edu.score > 10) {
        tier1Errors.push(`Invalid score: CGPA for ${edu.level} cannot exceed 10`);
      } else if (edu.scoreScale === 'CGPA (out of 4)' && edu.score > 4) {
        tier1Errors.push(`Invalid score: CGPA for ${edu.level} cannot exceed 4`);
      }
    }

    // Work Experience Dates Validation
    appData.workExperience.forEach((work, idx) => {
      const start = new Date(work.startDate);
      const end = work.isCurrent ? new Date() : (work.endDate ? new Date(work.endDate) : new Date());
      
      if (isNaN(start.getTime())) tier1Errors.push(`Invalid start date for work experience ${idx + 1}`);
      if (!work.isCurrent && work.endDate && isNaN(end.getTime())) tier1Errors.push(`Invalid end date for work experience ${idx + 1}`);
      
      if (start > end) {
        tier1Errors.push(`Chronological error: Work experience ${idx + 1} start date cannot be after end date`);
      }
    });
  }

  // Tier 2: Flags
  if (tier1Errors.length === 0) {
    appData.educationHistory.forEach(edu => {
      if (edu.gapMonths > 24) tier2Flags.push(`Significant education gap (>24 months) after ${edu.level}`);
      if (edu.backlogs && edu.backlogs > 0) tier2Flags.push(`Active backlogs reported in ${edu.level}`);
      
      const normalizedScore = normalizeScore(edu.score, edu.scoreScale);
      if (normalizedScore < 50) tier2Flags.push(`Low academic score (<50%) in ${edu.level}`);
    });

    // Work Exp Flags
    let domains = new Set<string>();
    appData.workExperience.forEach((work, idx) => {
      domains.add(work.domain);
      
      if (idx > 0) {
        const prevEnd = appData.workExperience[idx-1].isCurrent ? new Date() : new Date(appData.workExperience[idx-1].endDate || '');
        const currStart = new Date(work.startDate);
        if (!isNaN(prevEnd.getTime()) && !isNaN(currStart.getTime())) {
          const gapMonths = (currStart.getFullYear() - prevEnd.getFullYear()) * 12 + (currStart.getMonth() - prevEnd.getMonth());
          if (gapMonths > 6) tier2Flags.push(`Career gap of ${gapMonths} months before joining ${work.company}`);
        }
      }
    });

    if (domains.size > 3) tier2Flags.push(`High career volatility: ${domains.size} different domains`);

    // No work exp but > 3 years since last education
    if (appData.workExperience.length === 0 && appData.educationHistory.length > 0) {
      const lastEdu = [...appData.educationHistory].sort((a, b) => b.yearOfPassing - a.yearOfPassing)[0];
      const yearsSinceEdu = new Date().getFullYear() - lastEdu.yearOfPassing;
      if (yearsSinceEdu > 3) tier2Flags.push(`No work experience reported despite ${yearsSinceEdu} years since last education`);
    }
  }

  // Tier 3: Enrichment & Scoring
  const normalizedScores = normalizeAllScores(appData.educationHistory || []);
  const riskScore = calculateRiskScore(appData, tier2Flags, normalizedScores);
  const category = getCategory(riskScore);
  const totalExp = calculateTotalExperience(appData.workExperience || []);
  const domainExp = calculateDomainExperience(appData.workExperience || []);

  const status = tier1Errors.length > 0 ? 'REJECT' : (tier2Flags.length > 0 ? 'FLAG' : 'SUCCESS');

  if (status !== 'REJECT' && appData.personalInfo?.email && appData.personalInfo?.phone) {
    submittedApplications.add(`${appData.personalInfo.email.toLowerCase()}|${appData.personalInfo.phone}`);
  }

  return {
    status,
    tier1Errors,
    tier2Flags,
    tier3Enrichment: {
      riskScore,
      category,
      totalExperienceMonths: totalExp,
      domainRelevantExperienceMonths: domainExp,
      completeness: calculateCompleteness(appData),
      normalizedScores
    },
    explanation: generateExplanation(tier1Errors, tier2Flags, riskScore)
  };
}

function normalizeScore(score: number, scale: string): number {
  if (scale === 'Percentage') return score;
  if (scale === 'CGPA (out of 10)') return score * 9.5;
  if (scale === 'CGPA (out of 4)') return (score / 4) * 100;
  if (scale === 'Grade') return 75; // Arbitrary average for grade
  return score;
}

function normalizeAllScores(edu: any[]): Record<string, number> {
  const norm: Record<string, number> = {};
  edu.forEach(e => {
    norm[e.level] = normalizeScore(e.score, e.scoreScale);
  });
  return norm;
}

function calculateRiskScore(data: ApplicationData, flags: string[], normalizedScores: Record<string, number>): number {
  let score = 0;
  
  // Base risk from flags
  score += flags.length * 15;
  
  // Academic trend risk
  const scores = Object.values(normalizedScores);
  if (scores.length > 1) {
    const variance = Math.max(...scores) - Math.min(...scores);
    if (variance > 20) score += 10; // High variance in academics
    
    // Downward trend
    if (scores[scores.length - 1] < scores[0] - 15) score += 15;
  }

  // Experience risk
  const totalExp = calculateTotalExperience(data.workExperience || []);
  if (totalExp === 0 && data.educationHistory) {
     const lastEdu = [...data.educationHistory].sort((a, b) => b.yearOfPassing - a.yearOfPassing)[0];
     if (lastEdu && (new Date().getFullYear() - lastEdu.yearOfPassing) > 2) {
       score += 20; // Gap without experience
     }
  }

  return Math.min(Math.round(score), 100);
}

function getCategory(riskScore: number): 'Strong Fit' | 'Needs Review' | 'Weak Fit' {
  if (riskScore < 30) return 'Strong Fit';
  if (riskScore < 60) return 'Needs Review';
  return 'Weak Fit';
}

function calculateTotalExperience(work: any[]): number {
  if (!work || !Array.isArray(work)) return 0;
  return work.reduce((acc, job) => {
    if (!job.startDate) return acc;
    const start = new Date(job.startDate);
    const end = (job.isCurrent || !job.endDate) ? new Date() : new Date(job.endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return acc;
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return acc + Math.max(0, months);
  }, 0);
}

function calculateDomainExperience(work: any[]): number {
  if (!work || !Array.isArray(work)) return 0;
  return work.reduce((acc, job) => {
    if (job.domain !== 'IT') return acc; // Assuming IT is the relevant domain
    if (!job.startDate) return acc;
    const start = new Date(job.startDate);
    const end = (job.isCurrent || !job.endDate) ? new Date() : new Date(job.endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return acc;
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return acc + Math.max(0, months);
  }, 0);
}

function calculateCompleteness(data: any): number {
  let fields = 0;
  let filled = 0;
  if (!data) return 0;
  
  if (data.personalInfo) { 
    fields += 4; 
    if (data.personalInfo.fullName) filled++; 
    if (data.personalInfo.email) filled++;
    if (data.personalInfo.phone) filled++;
    if (data.personalInfo.dateOfBirth) filled++;
  }
  
  if (data.educationHistory) {
    fields += data.educationHistory.length * 5;
    data.educationHistory.forEach((e: any) => {
      if (e.boardUniversity) filled++;
      if (e.yearOfPassing) filled++;
      if (e.score) filled++;
      if (e.scoreScale) filled++;
      if (e.level) filled++;
    });
  }

  if (data.workExperience) {
    fields += data.workExperience.length * 5;
    data.workExperience.forEach((w: any) => {
      if (w.company) filled++;
      if (w.role) filled++;
      if (w.startDate) filled++;
      if (w.domain) filled++;
      if (w.employmentType) filled++;
    });
  }

  if (fields === 0) return 0;
  return Math.round((filled / fields) * 100);
}

function generateExplanation(errors: string[], flags: string[], score: number): string {
  if (errors.length > 0) return `Application rejected due to critical errors: ${errors[0]}${errors.length > 1 ? ` and ${errors.length - 1} more` : ''}.`;
  if (flags.length > 0) return `Application accepted but flagged for manual review (Risk Score: ${score}). Flags include: ${flags[0]}.`;
  return `Application successfully validated. Strong candidate profile with a low risk score of ${score}.`;
}
