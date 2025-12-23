
import React, { useState, useEffect } from 'react';
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
  const [appState, setAppState] = useState<AppState>(AppState.DASHBOARD_HOME);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Charger le profil depuis le backend SQL
    geminiService.getStudentProfile().then(profile => {
      setUserProfile(profile);
    });
  }, []);

  const [currentCase, setCurrentCase] = useState<ClinicalCase | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<TutorFeedback | null>(null);

  if (!userProfile) return <div className="h-screen flex items-center justify-center">Chargement du profil...</div>;

  const handleNavigateFromDashboard = (destination: 'cases' | 'quiz' | 'courses') => {
    if (destination === 'cases') setAppState(AppState.CASE_SELECTION);
    if (destination === 'quiz') setAppState(AppState.QUIZ_SECTION);
    if (destination === 'courses') setAppState(AppState.COURSE_SECTION);
  };

  const handleSelectCase = (selectedCase: ClinicalCase) => {
    setCurrentCase(selectedCase);
    setAppState(AppState.CONSULTATION);
    setMessages([{ id: 'init', role: 'model', text: "Bonjour docteur.", timestamp: new Date() }]);
    geminiService.initializeCase(selectedCase);
  };

  const handleSendMessage = async (text: string) => {
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);
    try {
      const responseText = await geminiService.sendMessageToPatient(text, [...messages, newUserMsg]);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: responseText, timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmitDiagnosis = async () => {
    setIsSubmitting(true);
    const feedbackResult = await geminiService.getTutorFeedback(messages, { mainDiagnosis: diagnosis, reasoning });
    setFeedback(feedbackResult);
    setAppState(AppState.FEEDBACK);
    setIsSubmitting(false);
    // Rafraîchir le profil
    const updatedProfile = await geminiService.getStudentProfile();
    setUserProfile(updatedProfile);
  };

  // Les autres vues (Feedback, Quiz, etc.) restent identiques
  if (appState === AppState.DASHBOARD_HOME) return <Dashboard user={userProfile} onNavigate={handleNavigateFromDashboard} />;
  if (appState === AppState.CASE_SELECTION) return <CaseSelection cases={CLINICAL_CASES} onSelectCase={handleSelectCase} onBack={() => setAppState(AppState.DASHBOARD_HOME)} />;
  if (appState === AppState.QUIZ_SECTION) return <QuizSection onBack={() => setAppState(AppState.DASHBOARD_HOME)} />;
  if (appState === AppState.COURSE_SECTION) return <CourseSection onBack={() => setAppState(AppState.DASHBOARD_HOME)} />;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden relative">
      <div className="w-80 bg-white border-r border-slate-200 hidden md:flex flex-col p-6 z-10 overflow-y-auto">
        <button onClick={() => setAppState(AppState.CASE_SELECTION)} className="text-slate-500 mb-8 text-sm font-medium transition-colors hover:text-teal-600">
           <ArrowLeft size={16} className="inline mr-1"/> Quitter le cas
        </button>
        <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                <Stethoscope size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 text-center">{currentCase?.patientProfile.name}</h2>
            <p className="text-sm text-slate-500">{currentCase?.patientProfile.age} ans</p>
        </div>
        {currentCase && <VitalsPanel vitals={currentCase.patientProfile.vitals} />}
      </div>
      <div className="flex-1 flex flex-col h-full relative p-4">
        <ChatInterface messages={messages} onSendMessage={handleSendMessage} isTyping={isTyping} onHintRequest={() => {}} />
        <div className="absolute bottom-24 right-8">
            <button onClick={() => setShowDiagnosisForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-3 font-semibold flex items-center gap-2">
                <ClipboardCheck size={20}/> Conclure
            </button>
        </div>
      </div>
      {showDiagnosisForm && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
                  <h3 className="font-bold text-slate-800 mb-4 text-xl">Soumettre le diagnostic</h3>
                  <input type="text" placeholder="Diagnostic principal" className="w-full p-3 border rounded-lg mb-4" value={diagnosis} onChange={e=>setDiagnosis(e.target.value)}/>
                  <textarea placeholder="Raisonnement" className="w-full p-3 border rounded-lg mb-4 h-32" value={reasoning} onChange={e=>setReasoning(e.target.value)}/>
                  <div className="flex justify-end gap-2">
                      <button onClick={()=>setShowDiagnosisForm(false)} className="px-4 py-2">Annuler</button>
                      <button onClick={handleSubmitDiagnosis} className="bg-teal-600 text-white px-6 py-2 rounded-lg" disabled={isSubmitting}>Confirmer</button>
                  </div>
              </div>
          </div>
      )}
      {appState === AppState.FEEDBACK && feedback && (
          <div className="absolute inset-0 bg-slate-50 z-[60] p-8 overflow-y-auto">
              <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl">
                  <h2 className="text-3xl font-bold mb-4">Résultat : {feedback.score}/100</h2>
                  <p className="mb-6">{feedback.finalComment}</p>
                  <button onClick={() => setAppState(AppState.DASHBOARD_HOME)} className="bg-teal-600 text-white px-8 py-3 rounded-xl">Retour au Dashboard</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
