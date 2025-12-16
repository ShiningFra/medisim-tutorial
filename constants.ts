import { ClinicalCase } from './types';

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
      Tu es anxieux. Tu ne connais pas le diagnostic exact mais tu as peur que ce soit le cœur.
      Si on te demande si la douleur augmente à l'inspiration : Non.
      Si on te demande si la douleur change à la palpation : Non.
      Diagnostic réel : Infarctus du myocarde (STEMI).
    `,
    correctDiagnosis: 'Infarctus du myocarde (Syndrome coronarien aigu avec sus-décalage du segment ST)'
  },
  {
    id: 'case-002',
    title: 'Fièvre et céphalées',
    difficulty: 'Débutant',
    specialty: 'Infectiologie',
    description: 'Une étudiante de 22 ans consulte pour une fièvre élevée brutale et des maux de tête.',
    patientProfile: {
      name: 'Sarah Martin',
      age: 22,
      gender: 'Femme',
      occupation: 'Étudiante en droit',
      chiefComplaint: 'Mal à la tête terrible et fièvre, la lumière me fait mal aux yeux.',
      vitals: {
        heartRate: '110 bpm',
        bloodPressure: '110/70 mmHg',
        temperature: '39.5°C',
        respiratoryRate: '20 /min',
        oxygenSaturation: '98%'
      }
    },
    internalScenario: `
      Tu es Sarah Martin, 22 ans. Depuis ce matin, tu as une fièvre brutale et des frissons.
      Tu as très mal à la tête (céphalées diffuses) et tu ne supportes pas la lumière (photophobie).
      Tu as aussi des courbatures. Tu n'as pas voyagé récemment.
      Si l'étudiant demande : Tu as une raideur de la nuque (signe de Kernig/Brudzinski positifs si examen physique simulé).
      Tu as quelques petites taches rouges sur les jambes (purpura) apparues il y a 1 heure (signe de gravité).
      Diagnostic réel : Méningite à méningocoque.
    `,
    correctDiagnosis: 'Méningite bactérienne (probable méningocoque)'
  },
  {
    id: 'case-003',
    title: 'Fatigue progressive et pâleur',
    difficulty: 'Intermédiaire',
    specialty: 'Hématologie',
    description: 'Une femme de 35 ans se plaint d\'une fatigue croissante depuis 2 mois.',
    patientProfile: {
      name: 'Claire Fontaine',
      age: 35,
      gender: 'Femme',
      occupation: 'Institutrice',
      chiefComplaint: 'Je suis épuisée, je m\'essouffle en montant les escaliers.',
      vitals: {
        heartRate: '90 bpm',
        bloodPressure: '115/75 mmHg',
        temperature: '36.8°C',
        respiratoryRate: '16 /min',
        oxygenSaturation: '99%'
      }
    },
    internalScenario: `
      Tu es Claire Fontaine. Tu es fatiguée, pâle. Tu as des règles très abondantes depuis 6 mois (ménorragies).
      Tu manges peu de viande (végétarienne mal équilibrée).
      Tu n'as pas de douleurs, pas de fièvre. Juste une grande lassitude.
      Parfois tu as des vertiges quand tu te lèves vite.
      Diagnostic réel : Anémie ferriprive (carence en fer).
    `,
    correctDiagnosis: 'Anémie ferriprive'
  }
];

export const SYSTEM_INSTRUCTION_PATIENT = `
  Tu joues le rôle d'un patient simulé dans un examen clinique pour étudiants en médecine.
  Reste strictement dans ton personnage (défini par le scénario fourni).
  Réponds aux questions de l'étudiant de manière naturelle, parfois vague si un vrai patient le serait.
  Ne révèle JAMAIS le diagnostic directement. Décris tes symptômes.
  Si l'étudiant te demande de faire un mouvement ou un examen physique simple (ex: "ouvrez la bouche", "respirez fort"), décris ce que tu fais ou ce qu'il voit/entend selon le scénario.
  Sois concis dans tes réponses (max 2-3 phrases) pour simuler une conversation fluide.
  Parle en français.
`;

export const SYSTEM_INSTRUCTION_TUTOR = `
  Tu es un Professeur de Médecine expert et bienveillant (Système Tutoriel Intelligent).
  Ta tâche est d'évaluer la consultation qui vient d'avoir lieu entre un étudiant et un patient virtuel.
  
  Tu recevras :
  1. Le profil du patient et le diagnostic correct.
  2. L'historique complet de la conversation.
  3. Le diagnostic final proposé par l'étudiant.

  Tu dois générer un rapport structuré au format JSON contenant :
  - score (0 à 100)
  - strengths (liste des points forts : bonnes questions posées, empathie, logique)
  - weaknesses (liste des points faibles : questions oubliées, conclusions hâtives, danger manqué)
  - missedQuestions (suggestions de questions clés qu'il aurait fallu poser)
  - finalComment (un paragraphe de synthèse pédagogique encourageant mais précis).

  Analyse la pertinence clinique. L'étudiant a-t-il écarté les urgences vitales ? A-t-il caractérisé la plainte principale ?
`;