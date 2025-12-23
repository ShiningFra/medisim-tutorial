
import React, { useState, useEffect } from 'react';
import { ClinicalCase, Message, AppState, DiagnosisSubmission, TutorFeedback, UserProfile } from './types';
import { geminiService } from './services/geminiService';
import { Dashboard } from './components/Dashboard';
import { CaseSelection } from './components/CaseSelection';
import { QuizSection } from './components/QuizSection';
import { CourseSection } from './components/CourseSection';
import { ChatInterface } from './components/ChatInterface';
import { VitalsPanel } from './components/VitalsPanel';
import { Stethoscope, ClipboardCheck, ArrowLeft, Loader2, Trophy, Lightbulb, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.DASHBOARD_HOME);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [availableCases, setAvailableCases] = useState<ClinicalCase[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);

  useEffect(() => {
    refreshProfile();
  }, []);

  const refreshProfile = async () => {
    const profile = await geminiService.getStudentProfile();
    setUserProfile(profile);
  };

  const [currentCase, setCurrentCase] = useState<ClinicalCase | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<TutorFeedback | null>(null);
  const [xpGain, setXpGain] = useState(0);

  const handleNavigateFromDashboard = async (destination: 'cases' | 'quiz' | 'courses') => {
    if (destination === 'cases') {
      setAppState(AppState.CASE_SELECTION);
      setLoadingCases(true);
      try {
        const cases = await geminiService.getDynamicCases(userProfile?.levelNumber || 1);
        setAvailableCases(cases);
      } catch (err) { alert("Erreur génération cas"); }
      setLoadingCases(false);
    }
    if (destination === 'quiz') setAppState(AppState.QUIZ_SECTION);
    if (destination === 'courses') setAppState(AppState.COURSE_SECTION);
  };

  const handleSelectCase = (selectedCase: ClinicalCase) => {
    setCurrentCase(selectedCase);
    setAppState(AppState.CONSULTATION);
    setMessages([{ 
      id: 'init', role: 'model', 
      text: `Bonjour Docteur. Je m'appelle ${selectedCase.patientProfile.name}. Je ne me sens vraiment pas bien...`, 
      timestamp: new Date() 
    }]);
    geminiService.initializeCase(selectedCase);
    setDiagnosis('');
    setReasoning('');
    setFeedback(null);
  };

  const handleSendMessage = async (text: string) => {
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);
    try {
      const responseText = await geminiService.sendMessageToPatient(text, [...messages, newUserMsg]);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: new Date() }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: 'err', role: 'system', text: "Liaison patient perdue.", timestamp: new Date() }]);
    } finally { setIsTyping(false); }
  };

  const handleHintRequest = async () => {
    try {
      const hintText = await geminiService.getHint(messages);
      const hintMsg: Message = { 
        id: `hint-${Date.now()}`, role: 'system', 
        text: `💡 CONSEIL DU TUTEUR : ${hintText}`, timestamp: new Date() 
      };
      setMessages(prev => [...prev, hintMsg]);
    } catch (err) { console.error(err); }
  };

  const handleSubmitDiagnosis = async () => {
    if (!diagnosis.trim()) return;
    setIsSubmitting(true);
    try {
      const result = await geminiService.getTutorFeedback(messages, { mainDiagnosis: diagnosis, reasoning });
      setFeedback(result.feedback);
      setXpGain(result.xpGain);
      setAppState(AppState.FEEDBACK);
      await refreshProfile();
    } catch (err) { alert("Erreur évaluation"); }
    finally { setIsSubmitting(false); setShowDiagnosisForm(false); }
  };

  if (!userProfile) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;

  if (appState === AppState.DASHBOARD_HOME) return <Dashboard user={userProfile} onNavigate={handleNavigateFromDashboard} />;
  
  if (appState === AppState.CASE_SELECTION) {
    if (loadingCases) return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-teal-600 mb-4" size={50} />
        <p className="text-xl font-bold text-slate-700">L'IA prépare des dossiers patients adaptés à votre niveau...</p>
        <p className="text-slate-400">Génération de cas pour un {userProfile.level}...</p>
      </div>
    );
    return <CaseSelection cases={availableCases} onSelectCase={handleSelectCase} onBack={() => setAppState(AppState.DASHBOARD_HOME)} />;
  }

  if (appState === AppState.QUIZ_SECTION) return <QuizSection onBack={() => setAppState(AppState.DASHBOARD_HOME)} />;
  if (appState === AppState.COURSE_SECTION) return <CourseSection onBack={() => setAppState(AppState.DASHBOARD_HOME)} />;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden relative">
      <div className="w-80 bg-white border-r border-slate-200 hidden md:flex flex-col p-6 z-10 overflow-y-auto">
        <button onClick={() => setAppState(AppState.CASE_SELECTION)} className="flex items-center text-slate-500 mb-8 text-sm font-medium hover:text-teal-600">
           <ArrowLeft size={16} className="mr-1"/> Quitter Simulation
        </button>
        <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-teal-600 mb-4 border-2 border-slate-100">
                <Stethoscope size={40} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 text-center">{currentCase?.patientProfile.name}</h2>
            <div className="flex gap-2 mt-1">
              <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{currentCase?.patientProfile.age} ans</span>
              <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{currentCase?.patientProfile.gender}</span>
            </div>
        </div>
        {currentCase && <VitalsPanel vitals={currentCase.patientProfile.vitals} />}
      </div>

      <div className="flex-1 flex flex-col h-full relative p-4">
        <ChatInterface 
          messages={messages} onSendMessage={handleSendMessage} 
          isTyping={isTyping} onHintRequest={handleHintRequest} 
        />
        <div className="absolute bottom-24 right-10">
            <button onClick={() => setShowDiagnosisForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg rounded-full px-8 py-4 font-bold flex items-center gap-2 transform hover:scale-105 transition-all">
                <ClipboardCheck size={22}/> Poser le Diagnostic
            </button>
        </div>
      </div>

      {showDiagnosisForm && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-8 w-full max-w-xl shadow-2xl">
                  <h3 className="font-bold text-slate-800 text-2xl mb-6 flex items-center gap-2"><ClipboardCheck/> Soumettre votre bilan</h3>
                  <div className="space-y-4">
                    <input type="text" placeholder="Diagnostic Principal" className="w-full p-4 border rounded-xl" value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} />
                    <textarea placeholder="Raisonnement" className="w-full p-4 border rounded-xl h-40" value={reasoning} onChange={e=>setReasoning(e.target.value)} />
                  </div>
                  <div className="flex justify-end gap-3 mt-8">
                      <button onClick={()=>setShowDiagnosisForm(false)} className="px-6 py-3 text-slate-500">Annuler</button>
                      <button onClick={handleSubmitDiagnosis} className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-bold shadow-lg" disabled={isSubmitting || !diagnosis.trim()}>
                        {isSubmitting ? <Loader2 className="animate-spin"/> : "Valider"}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {appState === AppState.FEEDBACK && feedback && (
          <div className="absolute inset-0 bg-slate-50 z-[60] p-4 md:p-10 overflow-y-auto animate-in fade-in duration-500">
              <div className="max-w-3xl mx-auto">
                  <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
                      <div className="bg-indigo-600 p-10 text-white text-center relative">
                          <div className="absolute top-4 right-4 bg-yellow-400 text-indigo-900 px-4 py-2 rounded-full font-black flex items-center gap-2 animate-bounce">
                             <Sparkles size={16}/> +{xpGain} XP
                          </div>
                          <Trophy size={40} className="mx-auto mb-4" />
                          <h2 className="text-4xl font-extrabold mb-2">Score : {feedback.score}/100</h2>
                          <p className="italic text-indigo-100">"{feedback.finalComment}"</p>
                      </div>
                      <div className="p-10 grid md:grid-cols-2 gap-8">
                          <div>
                            <h4 className="text-green-600 font-bold mb-3">Points Forts</h4>
                            {feedback.strengths.map((s, i) => <div key={i} className="text-sm bg-green-50 p-3 rounded-lg border-l-4 border-green-500 mb-2">{s}</div>)}
                          </div>
                          <div>
                            <h4 className="text-red-600 font-bold mb-3">Points Critiques</h4>
                            {feedback.weaknesses.map((w, i) => <div key={i} className="text-sm bg-red-50 p-3 rounded-lg border-l-4 border-red-500 mb-2">{w}</div>)}
                          </div>
                      </div>
                      <div className="px-10 py-8 bg-slate-50 border-t flex justify-center">
                          <button onClick={() => setAppState(AppState.DASHBOARD_HOME)} className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-bold shadow-lg">Continuer</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
