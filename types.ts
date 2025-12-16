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
  // Hidden from user, used for prompting the Patient Persona
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
  isThinking?: boolean;
}

export interface UserProfile {
  name: string;
  level: string; // ex: "Externe", "Interne", "Résident"
  xp: number;
  maxXp: number;
  casesCompleted: number;
  averageScore: number;
}

export enum AppState {
  DASHBOARD_HOME,    // Le nouveau hub central
  CASE_SELECTION,    // La liste des cas (ancien dashboard)
  CONSULTATION,      // Le chat
  FEEDBACK,          // Résultats
  QUIZ_SECTION,      // Nouvelle section
  COURSE_SECTION     // Nouvelle section
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