import React, { useState } from 'react';
import { CLINICAL_CASES } from './constants';
import { ClinicalCase, Message, AppState, DiagnosisSubmission, TutorFeedback, UserProfile } from './types';
import { geminiService } from './services/geminiService';
import { Dashboard } from './components/Dashboard';
import { CaseSelection } from './components/CaseSelection';
import { QuizSection } from './components/QuizSection';
import { CourseSection } from './components/CourseSection';
import { ChatInterface } from './components/ChatInterface';
import { VitalsPanel } from './components/VitalsPanel';
import { Stethoscope, ClipboardCheck, ArrowLeft, SendHorizontal, AlertCircle, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  // Navigation State
  const [appState, setAppState] = useState<AppState>(AppState.DASHBOARD_HOME);
  
  // User Profile State (Mock data for demo)
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "Étudiant",
    level: "Externe (4ème année)",
    xp: 350,
    maxXp: 1000,
    casesCompleted: 3,
    averageScore: 72
  });

  // Clinical Case State
  const [currentCase, setCurrentCase] = useState<ClinicalCase | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);
  
  // Diagnosis Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Feedback State
  const [feedback, setFeedback] = useState<TutorFeedback | null>(null);

  // --- Navigation Handlers ---

  const handleNavigateFromDashboard = (destination: 'cases' | 'quiz' | 'courses') => {
    if (destination === 'cases') setAppState(AppState.CASE_SELECTION);
    if (destination === 'quiz') setAppState(AppState.QUIZ_SECTION);
    if (destination === 'courses') setAppState(AppState.COURSE_SECTION);
  };

  const handleSelectCase = (selectedCase: ClinicalCase) => {
    setCurrentCase(selectedCase);
    setAppState(AppState.CONSULTATION);
    setMessages([]);
    setFeedback(null);
    setDiagnosis('');
    setReasoning('');
    setShowDiagnosisForm(false);
    
    // Initialize Gemini
    geminiService.initializeCase(selectedCase);
    
    // Initial message
    setMessages([{
      id: 'init',
      role: 'model',
      text: "Bonjour docteur.",
      timestamp: new Date()
    }]);
  };

  const handleBackToDashboard = () => {
    setAppState(AppState.DASHBOARD_HOME);
    setCurrentCase(null);
  };

  const handleBackToCaseSelection = () => {
    setAppState(AppState.CASE_SELECTION);
    setCurrentCase(null);
  };

  // --- Chat & Diagnosis Handlers ---

  const handleSendMessage = async (text: string) => {
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      const responseText = await geminiService.sendMessageToPatient(text);
      const newBotMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newBotMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleHintRequest = async () => {
      const hint = await geminiService.getHint(messages);
      const hintMsg: Message = {
          id: Date.now().toString(),
          role: 'system',
          text: `Indice Tuteur: ${hint}`,
          timestamp: new Date()
      };
      setMessages(prev => [...prev, hintMsg]);
  };

  const handleSubmitDiagnosis = async () => {
    if (!diagnosis || !reasoning) return;
    setIsSubmitting(true);
    
    const submission: DiagnosisSubmission = {
      mainDiagnosis: diagnosis,
      reasoning: reasoning
    };

    const feedbackResult = await geminiService.getTutorFeedback(messages, submission);
    setFeedback(feedbackResult);
    setAppState(AppState.FEEDBACK);
    setIsSubmitting(false);

    // Update User Profile with Mock Logic
    setUserProfile(prev => ({
        ...prev,
        xp: prev.xp + 100 + (feedbackResult.score > 80 ? 50 : 0),
        casesCompleted: prev.casesCompleted + 1,
        averageScore: Math.round(((prev.averageScore * prev.casesCompleted) + feedbackResult.score) / (prev.casesCompleted + 1))
    }));
  };

  // ---------------- RENDER ----------------

  if (appState === AppState.DASHBOARD_HOME) {
    return <Dashboard user={userProfile} onNavigate={handleNavigateFromDashboard} />;
  }

  if (appState === AppState.CASE_SELECTION) {
    return <CaseSelection cases={CLINICAL_CASES} onSelectCase={handleSelectCase} onBack={handleBackToDashboard} />;
  }

  if (appState === AppState.QUIZ_SECTION) {
    return <QuizSection onBack={handleBackToDashboard} />;
  }

  if (appState === AppState.COURSE_SECTION) {
    return <CourseSection onBack={handleBackToDashboard} />;
  }

  // --- Feedback View ---
  if (appState === AppState.FEEDBACK && feedback) {
    return (
      <div className="h-full bg-slate-50 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-teal-700 p-8 text-white">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-3xl font-bold">Évaluation du Tuteur</h2>
               <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                 <span className="text-sm uppercase tracking-wide opacity-80">Score</span>
                 <span className="text-2xl font-bold">{feedback.score}/100</span>
               </div>
            </div>
            <p className="text-teal-100 text-lg">
                Cas: {currentCase?.title}
            </p>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="prose prose-slate max-w-none">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <ClipboardCheck className="text-teal-600"/>
                    Synthèse
                </h3>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                    {feedback.finalComment}
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                        <CheckCircle2 size={20}/>
                        Points Forts
                    </h4>
                    <ul className="space-y-2">
                        {feedback.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                                {s}
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-rose-700 mb-3 flex items-center gap-2">
                        <AlertCircle size={20}/>
                        Points à améliorer
                    </h4>
                    <ul className="space-y-2">
                        {feedback.weaknesses.map((w, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                                {w}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {feedback.missedQuestions.length > 0 && (
                 <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
                    <h4 className="font-semibold text-amber-800 mb-3">Questions clés manquées</h4>
                    <ul className="list-disc list-inside space-y-1 text-amber-900/80">
                        {feedback.missedQuestions.map((q, i) => (
                            <li key={i}>{q}</li>
                        ))}
                    </ul>
                </div>
            )}
            
            <div className="border-t border-slate-100 pt-6">
                <p className="text-sm text-slate-500 mb-2">Diagnostic correct :</p>
                <p className="font-bold text-slate-800">{currentCase?.correctDiagnosis}</p>
            </div>
            
            <div className="flex justify-end pt-4">
                <button 
                    onClick={handleBackToCaseSelection}
                    className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                    <ArrowLeft size={18}/>
                    Retour aux cas
                </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Consultation View (Chat) ---
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden relative">
      {/* Sidebar - Patient Info & Vitals */}
      <div className="w-80 bg-white border-r border-slate-200 hidden md:flex flex-col p-6 z-10 overflow-y-auto">
        <button onClick={handleBackToCaseSelection} className="flex items-center text-slate-500 hover:text-teal-600 mb-8 text-sm font-medium transition-colors">
            <ArrowLeft size={16} className="mr-1"/> Quitter le cas
        </button>

        <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                <Stethoscope size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 text-center">{currentCase?.patientProfile.name}</h2>
            <p className="text-sm text-slate-500">{currentCase?.patientProfile.age} ans • {currentCase?.patientProfile.occupation}</p>
        </div>
        
        {currentCase && <VitalsPanel vitals={currentCase.patientProfile.vitals} />}
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-auto">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Motif de consultation</h4>
            <p className="text-sm text-slate-700 italic">"{currentCase?.patientProfile.chiefComplaint}"</p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        <div className="flex-1 p-4 md:p-6 overflow-hidden">
             <ChatInterface 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                isTyping={isTyping}
                onHintRequest={handleHintRequest}
             />
        </div>
        
        {/* Floating Diagnosis Button */}
        <div className="absolute bottom-24 right-8 md:right-12 z-20">
             {!showDiagnosisForm && (
                 <button 
                    onClick={() => setShowDiagnosisForm(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 rounded-full px-6 py-3 font-semibold flex items-center gap-2 transition-transform hover:scale-105"
                 >
                    <ClipboardCheck size={20}/>
                    Conclure le diagnostic
                 </button>
             )}
        </div>
      </div>

      {/* Diagnosis Overlay Modal */}
      {showDiagnosisForm && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800">Soumettre le diagnostic</h3>
                      <button onClick={() => setShowDiagnosisForm(false)} className="text-slate-400 hover:text-slate-600">
                          ✕
                      </button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Diagnostic Principal</label>
                          <input 
                            type="text" 
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="ex: Appendicite aiguë..."
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Justification & Raisonnement</label>
                          <textarea 
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none h-32 resize-none"
                            placeholder="Pourquoi ce diagnostic ? Quels signes cliniques vous ont orienté ?"
                            value={reasoning}
                            onChange={(e) => setReasoning(e.target.value)}
                          />
                      </div>
                      <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg flex gap-2">
                        <AlertCircle size={16} className="shrink-0"/>
                        Une fois soumis, la consultation se termine et le tuteur IA évaluera votre performance.
                      </div>
                  </div>
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                      <button 
                        onClick={() => setShowDiagnosisForm(false)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                      >
                          Annuler
                      </button>
                      <button 
                        onClick={handleSubmitDiagnosis}
                        disabled={isSubmitting || !diagnosis || !reasoning}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                          {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : <SendHorizontal size={18}/>}
                          Envoyer
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// Helper for loading icon in buttons above
const Loader2 = ({ size, className }: { size: number, className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

export default App;