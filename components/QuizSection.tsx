
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { QuizQuestion } from '../types';

interface QuizSectionProps {
  onBack: () => void;
}

export const QuizSection: React.FC<QuizSectionProps> = ({ onBack }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await geminiService.generateDynamicQuiz();
      if (data && data.length > 0) {
        setQuestions(data);
      } else {
        setError(true);
      }
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    if (index === questions[activeQuestion].correct) {
      setCorrectCount(prev => prev + 1);
    }
    setShowResult(true);
  };

  const handleNext = async () => {
    if (activeQuestion < questions.length - 1) {
      setActiveQuestion(activeQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setIsFinishing(true);
      const gain = await geminiService.submitQuizResult(correctCount, questions.length);
      setXpEarned(gain);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 size={48} className="text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium text-center">L'IA prépare vos questions de quiz médical...</p>
      </div>
    );
  }

  if (xpEarned !== null) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in zoom-in duration-300">
        <div className="bg-white rounded-3xl p-10 shadow-2xl max-w-md w-full border border-slate-100">
          <div className="w-20 h-20 bg-yellow-400 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
            <Sparkles size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Quiz Terminé !</h2>
          <p className="text-slate-500 mb-6 text-lg">Score : <span className="font-bold text-indigo-600">{correctCount}/{questions.length}</span></p>
          <div className="bg-indigo-50 text-indigo-700 font-bold py-4 rounded-2xl mb-8 border border-indigo-100">
            +{xpEarned} XP Gagnés
          </div>
          <button onClick={onBack} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105">
            Retourner au Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center"><AlertTriangle size={32} /></div>
        <h3 className="text-xl font-bold text-slate-800">Erreur de chargement du quiz</h3>
        <button onClick={loadQuiz} className="bg-indigo-600 text-white px-8 py-2 rounded-lg font-medium">Réessayer</button>
      </div>
    );
  }

  const currentQ = questions[activeQuestion];

  return (
    <div className="max-w-3xl mx-auto p-8 h-full overflow-y-auto">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-8 font-medium transition-colors">
        <ArrowLeft size={20} className="mr-2"/> Quitter
      </button>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Quiz Médical Dynamique</h2>
              <p className="text-indigo-100 text-xs">Test de connaissances cliniques</p>
            </div>
            <span className="bg-indigo-500 px-4 py-1.5 rounded-full text-sm font-bold">{activeQuestion + 1} / {questions.length}</span>
        </div>

        <div className="p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-8 leading-tight">{currentQ.question}</h3>
            <div className="space-y-3">
                {currentQ.options.map((option, idx) => {
                    let btnClass = "w-full text-left p-5 rounded-2xl border-2 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all font-medium text-slate-700 flex items-center justify-between";
                    if (showResult) {
                        if (idx === currentQ.correct) btnClass = "w-full text-left p-5 rounded-2xl border-2 border-green-500 bg-green-50 text-green-800 font-bold flex items-center justify-between shadow-sm shadow-green-100";
                        else if (idx === selectedAnswer && idx !== currentQ.correct) btnClass = "w-full text-left p-5 rounded-2xl border-2 border-red-500 bg-red-50 text-red-800 flex items-center justify-between";
                        else btnClass = "w-full text-left p-5 rounded-2xl border-2 border-slate-50 text-slate-400 opacity-50 flex items-center justify-between";
                    }
                    return (
                        <button key={idx} onClick={() => handleAnswer(idx)} className={btnClass} disabled={showResult}>
                            <span>{option}</span>
                            {showResult && idx === currentQ.correct && <CheckCircle2 size={24} className="text-green-600 flex-shrink-0 ml-2"/>}
                            {showResult && idx === selectedAnswer && idx !== currentQ.correct && <XCircle size={24} className="text-red-600 flex-shrink-0 ml-2"/>}
                        </button>
                    );
                })}
            </div>
            
            {showResult && (
                <div className="mt-8 bg-slate-50 p-6 rounded-2xl border-l-8 border-indigo-500 animate-in slide-in-from-bottom-2">
                    <p className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-widest text-indigo-600">Explication pédagogique</p>
                    <p className="text-slate-600 text-sm leading-relaxed">{currentQ.explanation}</p>
                    <div className="mt-6 flex justify-end">
                         <button 
                          onClick={handleNext} 
                          disabled={isFinishing}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
                         >
                            {isFinishing ? <Loader2 className="animate-spin" size={20}/> : (activeQuestion < questions.length - 1 ? "Question Suivante" : "Terminer le Quiz")}
                         </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
