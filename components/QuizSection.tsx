import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

interface QuizSectionProps {
  onBack: () => void;
}

export const QuizSection: React.FC<QuizSectionProps> = ({ onBack }) => {
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Mock Data for Quiz
  const questions = [
    {
      question: "Quel est le signe clinique caractéristique de la méningite ?",
      options: ["Signe de Babinski", "Signe de Kernig", "Signe de Murphy", "Signe de Homans"],
      correct: 1,
      explanation: "Le signe de Kernig (douleur/résistance à l'extension de la jambe) est typique de l'irritation méningée."
    },
    {
      question: "Dans l'infarctus du myocarde, la douleur irradie typiquement vers :",
      options: ["La fosse iliaque droite", "Le bras droit", "La mâchoire et le bras gauche", "Les lombaires"],
      correct: 2,
      explanation: "L'irradiation classique de l'angor est vers l'épaule gauche, le bras gauche et la mâchoire."
    },
    {
        question: "Une dyspnée de Kussmaul est souvent associée à :",
        options: ["Une acidose métabolique", "Une insuffisance cardiaque", "Une crise d'asthme", "Une pleurésie"],
        correct: 0,
        explanation: "La dyspnée de Kussmaul est une hyperventilation compensatrice d'une acidose métabolique sévère (ex: acidocétose)."
      }
  ];

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
      // End of quiz demo
      onBack();
    }
  };

  const currentQ = questions[activeQuestion];

  return (
    <div className="max-w-3xl mx-auto p-8 h-full overflow-y-auto">
      <button 
        onClick={onBack}
        className="flex items-center text-slate-500 hover:text-teal-600 mb-8 transition-colors font-medium"
      >
        <ArrowLeft size={20} className="mr-2"/> Quitter le Quiz
      </button>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
            <h2 className="text-xl font-bold">Quiz Rapide : Sémiologie</h2>
            <span className="bg-indigo-500 px-3 py-1 rounded-full text-sm">Question {activeQuestion + 1}/{questions.length}</span>
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
                    } else if (selectedAnswer === idx) {
                        btnClass = "w-full text-left p-4 rounded-xl border-2 border-indigo-500 bg-indigo-50 text-indigo-700 font-bold";
                    }

                    return (
                        <button 
                            key={idx}
                            onClick={() => handleAnswer(idx)}
                            className={btnClass}
                            disabled={showResult}
                        >
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
                <div className="mt-8 bg-slate-50 p-4 rounded-xl border-l-4 border-indigo-500 animate-fade-in-up">
                    <p className="font-bold text-slate-800 mb-1">Explication :</p>
                    <p className="text-slate-600">{currentQ.explanation}</p>
                    <div className="mt-4 flex justify-end">
                         <button 
                            onClick={nextQuestion}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                         >
                            {activeQuestion < questions.length - 1 ? "Question Suivante" : "Terminer"}
                         </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};