
import { 
  ClinicalCase, Message, DiagnosisSubmission, TutorFeedback, 
  QuizQuestion, CourseModule, UserProfile 
} from '../types';

const API_BASE_URL = "http://localhost:3000/api";

class BackendService {
  private currentCase: ClinicalCase | null = null;
  private studentId: number = 1; // Fixé pour la démo

  public async getStudentProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/student/${this.studentId}`);
    return res.json();
  }

  public initializeCase(clinicalCase: ClinicalCase) {
    this.currentCase = clinicalCase;
  }

  public async sendMessageToPatient(message: string, history: Message[]): Promise<string> {
    const formattedHistory = history.map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }]
    }));

    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: formattedHistory,
        systemInstruction: `Tu es le patient: ${this.currentCase?.internalScenario}`
      })
    });
    const data = await res.json();
    return data.text;
  }

  public async getTutorFeedback(chatHistory: Message[], submission: DiagnosisSubmission): Promise<TutorFeedback> {
    const transcript = chatHistory.map(m => `${m.role}: ${m.text}`).join('\n');
    const res = await fetch(`${API_BASE_URL}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: this.studentId,
        transcript,
        submission,
        caseData: this.currentCase
      })
    });
    const data = await res.json();
    return data.feedback;
  }

  public async generateDynamicQuiz(): Promise<QuizQuestion[]> {
    const res = await fetch(`${API_BASE_URL}/quiz`);
    return res.json();
  }

  public async generateDynamicCourses(): Promise<CourseModule[]> {
    // Similaire au quiz
    return [
      { title: "L'anamnèse", description: "Comment poser les bonnes questions.", keyPoint: "Écoute active" }
    ];
  }

  public async getHint(chatHistory: Message[]): Promise<string> {
    return "Posez des questions sur ses antécédents familiaux.";
  }
}

export const geminiService = new BackendService();
