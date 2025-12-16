import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { ClinicalCase, Message, DiagnosisSubmission, TutorFeedback } from '../types';
import { SYSTEM_INSTRUCTION_PATIENT, SYSTEM_INSTRUCTION_TUTOR } from '../constants';

const API_KEY = process.env.API_KEY || '';

class GeminiService {
  private ai: GoogleGenAI;
  private patientChat: Chat | null = null;
  private currentCase: ClinicalCase | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  public initializeCase(clinicalCase: ClinicalCase) {
    this.currentCase = clinicalCase;
    
    // Combine general instructions with specific case scenario
    const combinedSystemInstruction = `
      ${SYSTEM_INSTRUCTION_PATIENT}
      
      --- PROFIL PATIENT ACTUEL ---
      Nom: ${clinicalCase.patientProfile.name}
      Âge: ${clinicalCase.patientProfile.age}
      Genre: ${clinicalCase.patientProfile.gender}
      
      SCÉNARIO SPÉCIFIQUE (CONFIDENTIEL):
      ${clinicalCase.internalScenario}
    `;

    this.patientChat = this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: combinedSystemInstruction,
        temperature: 0.7, // A bit of creativity for realistic roleplay
      },
    });
  }

  public async sendMessageToPatient(userMessage: string): Promise<string> {
    if (!this.patientChat) {
      throw new Error("Consultation not initialized");
    }

    try {
      const response: GenerateContentResponse = await this.patientChat.sendMessage({
        message: userMessage
      });
      return response.text || "Je ne sais pas comment répondre à cela.";
    } catch (error) {
      console.error("Error sending message to patient:", error);
      return "Désolé, je ne me sens pas très bien... (Erreur de simulation)";
    }
  }

  public async getTutorFeedback(
    chatHistory: Message[],
    submission: DiagnosisSubmission
  ): Promise<TutorFeedback> {
    if (!this.currentCase) {
      throw new Error("No active case");
    }

    // Prepare the transcript for the Tutor
    const transcript = chatHistory
      .map(m => `${m.role.toUpperCase()}: ${m.text}`)
      .join('\n');

    const prompt = `
      --- DONNÉES DU CAS ---
      Cas: ${this.currentCase.title}
      Diagnostic Réel: ${this.currentCase.correctDiagnosis}
      
      --- TRANSCRIPT CONSULTATION ---
      ${transcript}
      
      --- SOUMISSION ÉTUDIANT ---
      Diagnostic proposé: ${submission.mainDiagnosis}
      Raisonnement: ${submission.reasoning}
      
      Génère le rapport d'évaluation au format JSON STRICT.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash', // Using flash for speed, sufficient for structured feedback
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_TUTOR,
          responseMimeType: "application/json",
        }
      });

      const jsonText = response.text || "{}";
      const feedback = JSON.parse(jsonText) as TutorFeedback;
      return feedback;

    } catch (error) {
      console.error("Error getting tutor feedback:", error);
      return {
        score: 0,
        strengths: [],
        weaknesses: ["Erreur lors de la génération du feedback."],
        missedQuestions: [],
        finalComment: "Une erreur technique a empêché l'évaluation par le tuteur IA."
      };
    }
  }
  
  public async getHint(chatHistory: Message[]): Promise<string> {
      if (!this.currentCase) return "Aucun cas actif.";
      
      const transcript = chatHistory
      .map(m => `${m.role.toUpperCase()}: ${m.text}`)
      .join('\n');
      
      const prompt = `
        L'étudiant est bloqué. Analyse la conversation ci-dessous.
        Sans donner la réponse (Diagnostic: ${this.currentCase.correctDiagnosis}),
        donne un indice subtil ou suggère une direction d'investigation (examen clinique ou question d'anamnèse) qu'il a négligé.
        Sois bref (1 phrase).
        
        Transcript:
        ${transcript}
      `;
      
      try {
           const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "Tu es un mentor médical qui aide un étudiant bloqué. Ne donne jamais la réponse directement."
            }
          });
          return response.text || "Essayez de revoir les constantes vitales.";
      } catch (e) {
          return "Concentrez-vous sur la plainte principale.";
      }
  }
}

export const geminiService = new GeminiService();