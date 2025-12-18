import { ClinicalCase } from './types';

// CONFIGURATION DU BACKEND LOCAL
export const LOCAL_LLM_URL = ""; // À remplir par l'utilisateur pour son LLM local (ex: http://localhost:11434/api/generate)

export const CLINICAL_CASES: ClinicalCase[] = [
  {
    id: 'case-001',
    title: 'Douleur thoracique aiguë',
    difficulty: 'Intermédiaire',
    specialty: 'Cardiologie',
    description: 'Un homme de 55 ans se présente aux urgences avec une douleur thoracique opprimante.',
    patientProfile: {
      name: 'Jean Dupont',
      age: 55,
      gender: 'Homme',
      occupation: 'Comptable',
      chiefComplaint: 'Douleur dans la poitrine qui irradie vers le bras gauche.',
      vitals: {
        heartRate: '105 bpm',
        bloodPressure: '150/95 mmHg',
        temperature: '37.2°C',
        respiratoryRate: '22 /min',
        oxygenSaturation: '96%'
      }
    },
    internalScenario: `
      Tu es Jean Dupont, 55 ans. Tu as une douleur thoracique intense ("comme un éléphant sur la poitrine") depuis 1 heure. 
      La douleur irradie dans la mâchoire et le bras gauche. Tu es en sueur et nauséeux.
      Antécédents: Tabagisme (20 paquets-années), Hypertension, Diabète de type 2.
      Père décédé d'un infarctus à 60 ans.
      Diagnostic réel : Infarctus du myocarde (STEMI).
    `,
    correctDiagnosis: 'Infarctus du myocarde (STEMI)'
  },
  {
    id: 'case-002',
    title: 'Fièvre et céphalées',
    difficulty: 'Débutant',
    specialty: 'Infectiologie',
    description: 'Une étudiante de 22 ans consulte pour une fièvre élevée brutale.',
    patientProfile: {
      name: 'Sarah Martin',
      age: 22,
      gender: 'Femme',
      occupation: 'Étudiante en droit',
      chiefComplaint: 'Mal à la tête terrible et fièvre.',
      vitals: {
        heartRate: '110 bpm',
        bloodPressure: '110/70 mmHg',
        temperature: '39.5°C',
        respiratoryRate: '20 /min',
        oxygenSaturation: '98%'
      }
    },
    internalScenario: `Tu es Sarah Martin. Fièvre brutale, photophobie, raideur de nuque. Diagnostic: Méningite.`,
    correctDiagnosis: 'Méningite bactérienne'
  }
];

export const SYSTEM_INSTRUCTION_PATIENT = `
  Tu joues le rôle d'un patient simulé. Reste strictement dans ton personnage. 
  Ne donne jamais le diagnostic. Sois concis (2-3 phrases).
`;

export const SYSTEM_INSTRUCTION_TUTOR = `
  Tu es un Professeur de Médecine. Évalue la consultation. 
  Prends en compte le diagnostic du LLM expert local s'il est fourni.
  Génère un JSON avec : score (0-100), strengths, weaknesses, missedQuestions, finalComment.
`;

export const SYSTEM_INSTRUCTION_QUIZ = `
  Génère un quiz médical de 3 questions à choix multiples sur la sémiologie et le diagnostic.
  Format JSON : array d'objets avec question, options (array de 4), correct (index 0-3), explanation.
`;

export const SYSTEM_INSTRUCTION_COURSE = `
  Génère un cours structuré sur l'art de la consultation médicale.
  Inclus 3 modules avec titre, description, et un point clé.
  Format JSON : array d'objets avec title, description, keyPoint.
`;