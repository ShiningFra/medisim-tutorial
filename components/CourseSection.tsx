import React from 'react';
import { ArrowLeft, Book, FileText, MessageCircle } from 'lucide-react';

interface CourseSectionProps {
  onBack: () => void;
}

export const CourseSection: React.FC<CourseSectionProps> = ({ onBack }) => {
  return (
    <div className="max-w-5xl mx-auto p-8 h-full overflow-y-auto">
      <button 
        onClick={onBack}
        className="flex items-center text-slate-500 hover:text-teal-600 mb-8 transition-colors font-medium"
      >
        <ArrowLeft size={20} className="mr-2"/> Retour au tableau de bord
      </button>

      <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">L'Art de la Consultation</h1>
          <p className="text-slate-500">Modules d'apprentissage pour structurer votre démarche clinique.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
          
          {/* Module 1 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 mb-4">
                  <MessageCircle size={24}/>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">1. L'Anamnèse</h3>
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                  L'interrogatoire constitue 70% du diagnostic. Apprenez à écouter activement, à caractériser une plainte (SOCRATES) et à rechercher les antécédents pertinents sans interrompre le patient prématurément.
              </p>
              <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700">
                  <span className="font-bold block mb-1">Point clé :</span>
                  Toujours commencer par une question ouverte : "Qu'est-ce qui vous amène aujourd'hui ?"
              </div>
          </div>

          {/* Module 2 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  <FileText size={24}/>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">2. Le Raisonnement Clinique</h3>
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                  Passer du symptôme au diagnostic demande une méthode. Utilisez le système 1 (intuitif) et le système 2 (analytique). Apprenez à générer des hypothèses précoces et à les tester.
              </p>
              <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700">
                  <span className="font-bold block mb-1">Point clé :</span>
                  Toujours éliminer les urgences vitales ("Red Flags") avant de confirmer un diagnostic bénin.
              </div>
          </div>

          {/* Module 3 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600 mb-4">
                  <Book size={24}/>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">3. L'Examen Physique</h3>
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                  L'examen confirme ou infirme vos hypothèses. Il doit être orienté par l'anamnèse. Inspection, Palpation, Percussion, Auscultation.
              </p>
              <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700">
                  <span className="font-bold block mb-1">Point clé :</span>
                  Soyez systématique mais adapté au contexte. Ne faites pas un examen neurologique complet pour une entorse de cheville.
              </div>
          </div>

      </div>
    </div>
  );
};