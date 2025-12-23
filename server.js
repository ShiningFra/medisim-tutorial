
import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from "@google/genai";
import mysql from 'mysql2/promise';
import 'dotenv/config';

const app = express();
const port = 3000;

// Configuration IA - Utilise la clé API de l'environnement
const API_KEY = process.env.GOOGLE_API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

app.use(cors());
app.use(express.json());

// Configuration de la connexion MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'medisim',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// --- ROUTES API ---

// 1. Récupérer le profil étudiant
app.get('/api/student/:id', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM students WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Étudiant non trouvé" });
    
    // On s'assure que les noms de colonnes correspondent au type UserProfile attendu par le front
    const student = rows[0];
    res.json({
      name: student.name,
      level: student.level,
      xp: student.xp,
      maxXp: student.maxXp,
      casesCompleted: student.cases_completed,
      averageScore: student.average_score
    });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Chat avec le Patient (Gemini)
app.post('/api/chat', async (req, res) => {
  const { message, history, systemInstruction } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      config: { 
        systemInstruction,
        temperature: 0.7,
        topP: 0.95
      }
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({ error: "Erreur lors de la communication avec le patient virtuel" });
  }
});

// 3. Évaluation par le Tuteur + Mise à jour DB MySQL
app.post('/api/evaluate', async (req, res) => {
  const { studentId, transcript, submission, caseData } = req.body;
  
  try {
    const prompt = `Cas clinique: ${caseData.title}. 
    Transcript de la consultation:
    ${transcript}
    
    Diagnostic soumis par l'étudiant: ${submission.mainDiagnosis}
    Raisonnement: ${submission.reasoning}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Utilisation du modèle Pro pour une meilleure évaluation
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "Tu es un éminent Professeur de Médecine. Évalue la prestation de l'étudiant. Sois rigoureux mais constructif. Réponds uniquement en JSON valide.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Score sur 100" },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Points forts" },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Points à améliorer" },
            missedQuestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Questions cruciales oubliées" },
            finalComment: { type: Type.STRING, description: "Commentaire pédagogique global" }
          },
          required: ["score", "strengths", "weaknesses", "missedQuestions", "finalComment"]
        }
      }
    });

    const feedback = JSON.parse(response.text);

    // Mise à jour de l'étudiant dans MySQL
    await pool.query(`
      UPDATE students 
      SET xp = xp + ?, 
          average_score = ((average_score * cases_completed) + ?) / (cases_completed + 1),
          cases_completed = cases_completed + 1
      WHERE id = ?`, 
      [100, feedback.score, studentId]
    );

    res.json({ feedback });
  } catch (error) {
    console.error("Evaluation Error:", error);
    res.status(500).json({ error: "Erreur lors de l'évaluation pédagogique" });
  }
});

// 4. Génération de Quiz Dynamique
app.get('/api/quiz', async (req, res) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Génère un quiz de 3 questions sur la sémiologie médicale.",
      config: {
        systemInstruction: "Génère un quiz médical de 3 questions. Format JSON strict.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correct: { type: Type.NUMBER, description: "Index de la bonne réponse (0-3)" },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correct", "explanation"]
          }
        }
      }
    });
    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error("Quiz Generation Error:", error);
    res.status(500).json({ error: "Erreur lors de la génération du quiz" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Serveur MediSim démarré sur http://localhost:${port}`);
});
