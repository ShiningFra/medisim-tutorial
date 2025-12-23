
import { 
  ClinicalCase, Message, DiagnosisSubmission, TutorFeedback, 
  QuizQuestion, CourseModule, UserProfile 
} from '../types';

const API_BASE_URL = "http://localhost:3000/api";

class BackendService {
  private currentCase: ClinicalCase | null = null;
  private studentId: number = 1;

  public async getStudentProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/student/${this.studentId}`);
    return res.json();
  }

  public async getDynamicCases(level: number): Promise<ClinicalCase[]> {
    const res = await fetch(`${API_BASE_URL}/cases/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentLevel: level })
    });
    return res.json();
  }

  public initializeCase(clinicalCase: ClinicalCase) {
    this.currentCase = clinicalCase;
  }

  public async sendMessageToPatient(message: string, history: Message[]): Promise<string> {
    const formattedHistory = history
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: formattedHistory,
        systemInstruction: `Tu es le patient: ${this.currentCase?.internalScenario}. Reste dans ton rôle de patient profane.`
      })
    });
    const data = await res.json();
    return data.text;
  }

  public async getHint(chatHistory: Message[]): Promise<string> {
    const transcript = chatHistory
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? 'Étudiant' : 'Patient'}: ${m.text}`)
      .join('\n');

    const res = await fetch(`${API_BASE_URL}/hint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, caseData: this.currentCase })
    });
    const data = await res.json();
    return data.hint;
  }

  public async getTutorFeedback(chatHistory: Message[], submission: DiagnosisSubmission): Promise<{ feedback: TutorFeedback, xpGain: number }> {
    const transcript = chatHistory
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? 'Dr' : 'Patient'}: ${m.text}`)
      .join('\n');
      
    const res = await fetch(`${API_BASE_URL}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: this.studentId, transcript, submission, caseData: this.currentCase })
    });
    return res.json();
  }

  public async generateDynamicQuiz(): Promise<QuizQuestion[]> {
    const res = await fetch(`${API_BASE_URL}/quiz`);
    return res.json();
  }

  public async submitQuizResult(score: number, total: number): Promise<number> {
    const res = await fetch(`${API_BASE_URL}/quiz/reward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: this.studentId, score, total })
    });
    const data = await res.json();
    return data.xpGain;
  }

  public async generateDynamicCourses(): Promise<CourseModule[]> {
    return [
      { title: "Sémiologie Cardiaque", description: "Comprendre les irradiations.", keyPoint: "Éliminer l'urgence vitale." },
      { title: "Anamnèse", description: "Structure de l'interrogatoire.", keyPoint: "Écoute active." }
    ];
  }
}

export const geminiService = new BackendService();
