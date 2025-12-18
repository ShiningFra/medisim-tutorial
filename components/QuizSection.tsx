import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
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
    setShowResult(true);
  };

  const nextQuestion = () => {
    if (activeQuestion < questions.length - 1) {
      setActiveQuestion(activeQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      onBack();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 size={48} className="text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">L'IA prépare vos questions de quiz...</p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
          <AlertTriangle size={32} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Impossible de générer le quiz</h3>
          <p className="text-slate-500 max-w-md">L'IA de génération est temporairement indisponible ou a rencontré une erreur de format.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={onBack} className="px-6 py-2 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-colors">Retour</button>
          <button onClick={loadQuiz} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">Réessayer</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[activeQuestion];

  return (
    <div className="max-w-3xl mx-auto p-8 h-full overflow-y-auto">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-teal-600 mb-8 font-medium transition-colors">
        <ArrowLeft size={20} className="mr-2"/> Quitter
      </button>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
            <h2 className="text-xl font-bold">Quiz Dynamique</h2>
            <span className="bg-indigo-500 px-3 py-1 rounded-full text-sm">{activeQuestion + 1}/{questions.length}</span>
        </div>

        <div className="p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6">{currentQ.question}</h3>
            <div className="space-y-3">
                {currentQ.options.map((option, idx) => {
                    let btnClass = "w-full text-left p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all font-medium text-slate-700";
                    if (showResult) {
                        if (idx === currentQ.correct) btnClass = "w-full text-left p-4 rounded-xl border border-green-200 bg-green-50 text-green-800 font-bold";
                        else if (idx === selectedAnswer && idx !== currentQ.correct) btnClass = "w-full text-left p-4 rounded-xl border border-red-200 bg-red-50 text-red-800";
                        else btnClass = "w-full text-left p-4 rounded-xl border border-slate-100 text-slate-400 opacity-50";
                    }
                    return (
                        <button key={idx} onClick={() => handleAnswer(idx)} className={btnClass} disabled={showResult}>
                            <div className="flex items-center justify-between">
                                <span>{option}</span>
                                {showResult && idx === currentQ.correct && <CheckCircle2 size={20} className="text-green-600"/>}
                                {showResult && idx === selectedAnswer && idx !== currentQ.correct && <XCircle size={20} className="text-red-600"/>}
                            </div>
                        </button>
                    );
                })}
            </div>
            {showResult && (
                <div className="mt-8 bg-slate-50 p-4 rounded-xl border-l-4 border-indigo-500">
                    <p className="font-bold text-slate-800 mb-1">Explication :</p>
                    <p className="text-slate-600">{currentQ.explanation}</p>
                    <div className="mt-4 flex justify-end">
                         <button onClick={nextQuestion} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium">
                            {activeQuestion < questions.length - 1 ? "Suivant" : "Terminer"}
                         </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};