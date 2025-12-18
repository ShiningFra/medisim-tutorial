import { GoogleGenAI, GenerateContentResponse, Chat, Type } from "@google/genai";
import { 
  ClinicalCase, Message, DiagnosisSubmission, TutorFeedback, 
  QuizQuestion, CourseModule 
} from '../types';
import { 
  SYSTEM_INSTRUCTION_PATIENT, SYSTEM_INSTRUCTION_TUTOR, 
  SYSTEM_INSTRUCTION_QUIZ, SYSTEM_INSTRUCTION_COURSE,
  LOCAL_LLM_URL 
} from '../constants';

const API_KEY = process.env.API_KEY || '';

class GeminiService {
  private ai: GoogleGenAI;
  private patientChat: Chat | null = null;
  private currentCase: ClinicalCase | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  /** 
   * APPEL AU LLM LOCAL (Modèle Expert de Diagnostic)
   * Ce modèle sert de guide de vérité pour corriger l'élève.
   */
  private async callLocalExpertModel(transcript: string): Promise<string> {
    if (!LOCAL_LLM_URL) return "LLM Local non configuré.";
    
    try {
      const response = await fetch(LOCAL_LLM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `En tant qu'expert médical, analyse ce transcript et donne le diagnostic le plus probable : ${transcript}`,
          stream: false
        })
      });
      const data = await response.json();
      return data.response || "Erreur de réponse du LLM local.";
    } catch (e) {
      console.warn("Échec de connexion au LLM local:", e);
      return "Indisponible.";
    }
  }

  public initializeCase(clinicalCase: ClinicalCase) {
    this.currentCase = clinicalCase;
    const combinedSystemInstruction = `${SYSTEM_INSTRUCTION_PATIENT}\nPROFIL: ${clinicalCase.patientProfile.name}, ${clinicalCase.patientProfile.age} ans.\nSCÉNARIO: ${clinicalCase.internalScenario}`;

    this.patientChat = this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: { systemInstruction: combinedSystemInstruction, temperature: 0.7 },
    });
  }

  public async sendMessageToPatient(userMessage: string): Promise<string> {
    if (!this.patientChat) throw new Error("Consultation not initialized");
    try {
      const response: GenerateContentResponse = await this.patientChat.sendMessage({ message: userMessage });
      return response.text || "Pas de réponse.";
    } catch (error) {
      return "Erreur de communication.";
    }
  }

  public async getTutorFeedback(chatHistory: Message[], submission: DiagnosisSubmission): Promise<TutorFeedback> {
    if (!this.currentCase) throw new Error("No active case");
    const transcript = chatHistory.map(m => `${m.role}: ${m.text}`).join('\n');
    
    // Appel au LLM Local pour obtenir son "avis expert" pour la correction
    const localExpertOpinion = await this.callLocalExpertModel(transcript);

    const prompt = `
      Diagnostic Réel attendu: ${this.currentCase.correctDiagnosis}
      Avis du LLM Expert Local: ${localExpertOpinion}
      
      Transcript: ${transcript}
      Soumission Élève: ${submission.mainDiagnosis} (${submission.reasoning})
      
      Évalue l'élève en comparant avec l'avis expert.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_TUTOR,
          responseMimeType: "application/json",
        }
      });
      return JSON.parse(response.text || "{}") as TutorFeedback;
    } catch (error) {
      return { score: 0, strengths: [], weaknesses: ["Erreur évaluation"], missedQuestions: [], finalComment: "Erreur technique." };
    }
  }

  public async generateDynamicQuiz(): Promise<QuizQuestion[]> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: "Génère un nouveau quiz.",
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_QUIZ,
          responseMimeType: "application/json",
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return [];
    }
  }

  public async generateDynamicCourses(): Promise<CourseModule[]> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: "Génère les modules de cours.",
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_COURSE,
          responseMimeType: "application/json",
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return [];
    }
  }

  public async getHint(chatHistory: Message[]): Promise<string> {
    if (!this.currentCase) return "Indice non disponible.";
    const transcript = chatHistory.map(m => `${m.role}: ${m.text}`).join('\n');
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-latest',
      contents: `Donne un indice subtil sans dire le diagnostic (${this.currentCase.correctDiagnosis}) pour ce transcript: ${transcript}`
    });
    return response.text || "Pensez à l'examen physique.";
  }
}

export const geminiService = new GeminiService();