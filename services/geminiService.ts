import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
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
   * APPEL AU LLM LOCAL (Modèle Expert)
   * On utilise un timeout pour ne pas bloquer l'app si le serveur local est éteint.
   */
  private async callLocalExpertModel(transcript: string): Promise<string> {
    if (!LOCAL_LLM_URL) return "Expert local non configuré (URL vide).";
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(LOCAL_LLM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "expert-medical", // Nom générique, à adapter selon votre LLM local
          prompt: `Analyse ce cas clinique et propose un diagnostic précis :\n${transcript}`,
          stream: false
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      return data.response || data.content || "Réponse vide de l'expert local.";
    } catch (e) {
      console.warn("Lien LLM Local : Serveur injoignable ou timeout.");
      return "Indisponible (Vérifiez votre serveur local).";
    }
  }

  public initializeCase(clinicalCase: ClinicalCase) {
    this.currentCase = clinicalCase;
    const combinedSystemInstruction = `${SYSTEM_INSTRUCTION_PATIENT}\n\nPATIENT INFO: ${clinicalCase.patientProfile.name}, ${clinicalCase.patientProfile.age} ans.\nOBJECTIF SECRET: ${clinicalCase.internalScenario}`;

    this.patientChat = this.ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: { 
        systemInstruction: combinedSystemInstruction,
        temperature: 0.8,
      },
    });
  }

  public async sendMessageToPatient(userMessage: string): Promise<string> {
    if (!this.patientChat) throw new Error("Consultation non initialisée");
    try {
      const response = await this.patientChat.sendMessage({ message: userMessage });
      return response.text || "Le patient reste silencieux...";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Désolé, j'ai du mal à m'exprimer (Erreur technique).";
    }
  }

  public async getTutorFeedback(chatHistory: Message[], submission: DiagnosisSubmission): Promise<TutorFeedback> {
    if (!this.currentCase) throw new Error("Aucun cas actif");
    const transcript = chatHistory.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
    
    // On récupère l'avis du LLM local avant de demander la synthèse à Gemini
    const localExpertOpinion = await this.callLocalExpertModel(transcript);

    const prompt = `
      CONTEXTE DU CAS : ${this.currentCase.title}
      DIAGNOSTIC ATTENDU : ${this.currentCase.correctDiagnosis}
      AVIS EXPERT LOCAL : ${localExpertOpinion}
      
      TRANSCRIPT DE LA CONSULTATION :
      ${transcript}
      
      RÉPONSE DE L'ÉTUDIANT :
      Diagnostic : ${submission.mainDiagnosis}
      Raisonnement : ${submission.reasoning}
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_TUTOR,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              missedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              finalComment: { type: Type.STRING }
            },
            required: ["score", "strengths", "weaknesses", "missedQuestions", "finalComment"]
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Feedback Error:", error);
      return { 
        score: 50, 
        strengths: ["Consultation effectuée"], 
        weaknesses: ["Erreur de génération du rapport"], 
        missedQuestions: [], 
        finalComment: "Le tuteur n'a pas pu générer une analyse détaillée, mais votre démarche a été enregistrée." 
      };
    }
  }

  public async generateDynamicQuiz(): Promise<QuizQuestion[]> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Génère 3 questions de quiz médical variées.",
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_QUIZ,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correct: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correct", "explanation"]
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Quiz Generation Error:", e);
      return [];
    }
  }

  public async generateDynamicCourses(): Promise<CourseModule[]> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Génère 3 modules de cours sur la consultation.",
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_COURSE,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                keyPoint: { type: Type.STRING }
              },
              required: ["title", "description", "keyPoint"]
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Course Generation Error:", e);
      return [];
    }
  }

  public async getHint(chatHistory: Message[]): Promise<string> {
    if (!this.currentCase) return "Aucun cas en cours.";
    const transcript = chatHistory.slice(-5).map(m => `${m.role}: ${m.text}`).join('\n');
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `En tant que tuteur discret, donne un seul petit conseil pour aider l'étudiant à avancer dans ce cas (${this.currentCase.correctDiagnosis}) sans lui donner la réponse. Transcript récent:\n${transcript}`
      });
      return response.text || "Continuez à interroger le patient sur ses antécédents.";
    } catch (e) {
      return "Explorez les facteurs de risque.";
    }
  }
}

export const geminiService = new GeminiService();