
import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from "@google/genai";
import mysql from 'mysql2/promise';
import 'dotenv/config';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'medisim',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function callGemini(modelName, parameters) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    const response = await ai.models.generateContent({
      model: modelName,
      ...parameters
    });
    return response;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}

function getMedicalRank(level) {
  if (level <= 2) return "Externe en Médecine";
  if (level <= 5) return "Interne des Hôpitaux";
  if (level <= 9) return "Chef de Clinique Assistant";
  return "Praticien Hospitalier Sénior";
}

app.get('/api/student/:id', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM students WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Étudiant non trouvé" });
    const s = rows[0];
    const level = Math.floor(s.xp / 1000) + 1;
    res.json({
      name: s.name,
      level: getMedicalRank(level),
      levelNumber: level,
      xp: s.xp % 1000,
      totalXp: s.xp,
      maxXp: 1000,
      casesCompleted: s.cases_completed,
      averageScore: s.average_score
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/cases/generate', async (req, res) => {
  const { studentLevel } = req.body;
  const difficulty = studentLevel <= 2 ? 'Débutant' : studentLevel <= 5 ? 'Intermédiaire' : 'Avancé';
  
  try {
    const response = await callGemini('gemini-3-flash-preview', {
      contents: `Génère 3 cas cliniques médicaux réels et variés de difficulté ${difficulty}.`,
      config: {
        systemInstruction: "Tu es un expert en pédagogie médicale. Réponds uniquement en JSON avec des cas complets.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              specialty: { type: Type.STRING },
              description: { type: Type.STRING },
              patientProfile: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  age: { type: Type.NUMBER },
                  gender: { type: Type.STRING },
                  occupation: { type: Type.STRING },
                  chiefComplaint: { type: Type.STRING },
                  vitals: {
                    type: Type.OBJECT,
                    properties: {
                      heartRate: { type: Type.STRING },
                      bloodPressure: { type: Type.STRING },
                      temperature: { type: Type.STRING },
                      respiratoryRate: { type: Type.STRING },
                      oxygenSaturation: { type: Type.STRING }
                    }
                  }
                }
              },
              internalScenario: { type: Type.STRING },
              correctDiagnosis: { type: Type.STRING }
            }
          }
        }
      }
    });
    res.json(JSON.parse(response.text));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/hint', async (req, res) => {
  const { transcript, caseData } = req.body;
  try {
    const prompt = `L'étudiant est en consultation pour le cas : ${caseData.title}. Pathologie réelle : ${caseData.correctDiagnosis}. 
    Voici la discussion : ${transcript}. 
    Donne un indice pédagogique subtil pour l'aider à avancer sans donner la réponse.`;
    const response = await callGemini('gemini-3-flash-preview', {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { systemInstruction: "Tu es un tuteur médical bienveillant et expert." }
    });
    res.json({ hint: response.text });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/evaluate', async (req, res) => {
  const { studentId, transcript, submission, caseData } = req.body;
  try {
    const response = await callGemini('gemini-3-pro-preview', {
      contents: `Cas: ${caseData.title}. Diagnostic proposé: ${submission.mainDiagnosis}. Raisonnement: ${submission.reasoning}. Consultation: ${transcript}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            missedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            finalComment: { type: Type.STRING }
          },
          required: ["score", "strengths", "weaknesses", "missedQuestions", "finalComment"]
        }
      }
    });
    const feedback = JSON.parse(response.text);
    const xpGain = Math.floor(feedback.score * 2.5);

    await pool.query(
      "UPDATE students SET xp = xp + ?, average_score = ((average_score * cases_completed) + ?) / (cases_completed + 1), cases_completed = cases_completed + 1 WHERE id = ?",
      [xpGain, feedback.score, studentId]
    );

    res.json({ feedback, xpGain });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/quiz', async (req, res) => {
  try {
    const response = await callGemini('gemini-3-flash-preview', {
      contents: "Génère un quiz de 5 questions médicales variées (sémiologie, urgences, clinique).",
      config: {
        systemInstruction: "Tu es un professeur de médecine. Génère un quiz rigoureux. L'index 'correct' doit correspondre exactement à la bonne réponse dans la liste des options.",
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
    res.json(JSON.parse(response.text));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/quiz/reward', async (req, res) => {
  const { studentId, score, total } = req.body;
  const xpGain = Math.floor((score / total) * 150);
  try {
    await pool.query("UPDATE students SET xp = xp + ? WHERE id = ?", [xpGain, studentId]);
    res.json({ xpGain });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/chat', async (req, res) => {
  const { message, history, systemInstruction } = req.body;
  try {
    const response = await callGemini('gemini-3-flash-preview', {
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      config: { systemInstruction }
    });
    res.json({ text: response.text });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.listen(port, () => console.log(`🚀 Serveur MediSim prêt sur http://localhost:${port}`));
