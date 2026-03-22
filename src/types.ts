/**
 * AdmitGuard v2 - Core Type Definitions
 */

export enum EducationLevel {
  TENTH = '10th',
  TWELFTH = '12th',
  DIPLOMA = 'Diploma',
  ITI = 'ITI',
  UG = 'UG',
  PG = 'PG',
  PHD = 'PhD'
}

export enum EducationPath {
  PATH_A = '10th -> 12th -> UG -> PG',
  PATH_B = '10th -> Diploma -> UG',
  PATH_C = '10th -> ITI -> Diploma -> UG'
}

export interface EducationEntry {
  level: EducationLevel;
  boardUniversity: string;
  stream?: string;
  yearOfPassing: number;
  score: number;
  scoreScale: 'Percentage' | 'CGPA (out of 10)' | 'CGPA (out of 4)' | 'Grade';
  backlogs?: number; // Only for UG/PG
  gapMonths: number;
}

export interface WorkExperience {
  company: string;
  role: string;
  domain: 'IT' | 'Non-IT' | 'Government' | 'Startup' | 'Freelance' | 'Other';
  startDate: string;
  endDate?: string; // Empty if 'Present'
  isCurrent: boolean;
  employmentType: 'Full-time' | 'Part-time' | 'Internship' | 'Contract' | 'Freelance';
  skills: string[];
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
}

export interface ApplicationData {
  personalInfo: PersonalInfo;
  educationPath: EducationPath;
  educationHistory: EducationEntry[];
  workExperience: WorkExperience[];
}

export interface ValidationResult {
  status: 'REJECT' | 'FLAG' | 'SUCCESS';
  tier1Errors: string[];
  tier2Flags: string[];
  tier3Enrichment: {
    riskScore: number;
    category: 'Strong Fit' | 'Needs Review' | 'Weak Fit';
    totalExperienceMonths: number;
    domainRelevantExperienceMonths: number;
    completeness: number;
    normalizedScores: Record<string, number>;
  };
  aiInsights?: {
    summary: string;
    alignment: string;
    strengths: string;
  };
  explanation: string;
}

export interface StoredApplication {
  id: string;
  submittedAt: string;
  data: ApplicationData;
  validationResult: ValidationResult;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
  directorNote?: string;
  approvedBy?: string;
  approvedAt?: string;
}
