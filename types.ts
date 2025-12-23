
export interface ClinicalCase {
  id: string;
  title: string;
  difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé';
  specialty: string;
  description: string;
  patientProfile: {
    name: string;
    age: number;
    gender: string;
    occupation: string;
    chiefComplaint: string;
    vitals: Vitals;
  };
  internalScenario: string;
  correctDiagnosis: string;
}

export interface Vitals {
  heartRate: string;
  bloodPressure: string;
  temperature: string;
  respiratoryRate: string;
  oxygenSaturation: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
}

export interface UserProfile {
  name: string;
  level: string;
  levelNumber: number;
  xp: number;
  totalXp: number;
  maxXp: number;
  casesCompleted: number;
  averageScore: number;
}

export enum AppState {
  DASHBOARD_HOME,
  CASE_SELECTION,
  CONSULTATION,
  FEEDBACK,
  QUIZ_SECTION,
  COURSE_SECTION
}

export interface DiagnosisSubmission {
  mainDiagnosis: string;
  reasoning: string;
}

export interface TutorFeedback {
  score: number;
  strengths: string[];
  weaknesses: string[];
  missedQuestions: string[];
  finalComment: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface CourseModule {
  title: string;
  description: string;
  keyPoint: string;
}
