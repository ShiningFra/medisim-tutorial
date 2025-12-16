import React from 'react';
import { ClinicalCase } from '../types';
import { Users, Activity, Brain, ArrowRight } from 'lucide-react';

interface DashboardProps {
  cases: ClinicalCase[];
  onSelectCase: (c: ClinicalCase) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ cases, onSelectCase }) => {
  const getIcon = (specialty: string) => {
    switch (specialty) {
      case 'Cardiologie': return <Activity className="text-rose-500" />;
      case 'Neurologie': return <Brain className="text-indigo-500" />;
      default: return <Users className="text-teal-500" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8 h-full overflow-y-auto">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-slate-800 mb-4 tracking-tight">MediSim Tutor</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Plateforme de simulation médicale intelligente. Choisissez un cas clinique, interrogez le patient virtuel, et affinez vos compétences diagnostiques avec notre tuteur IA.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((clinicalCase) => (
          <div 
            key={clinicalCase.id}
            className="group bg-white rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
            onClick={() => onSelectCase(clinicalCase)}
          >
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-teal-50 transition-colors">
                  {getIcon(clinicalCase.specialty)}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  clinicalCase.difficulty === 'Débutant' ? 'bg-green-100 text-green-700' :
                  clinicalCase.difficulty === 'Intermédiaire' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {clinicalCase.difficulty}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-teal-600 transition-colors">
                {clinicalCase.title}
              </h3>
              <p className="text-slate-500 text-sm line-clamp-3 mb-4">
                {clinicalCase.description}
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between group-hover:bg-teal-600 transition-colors">
              <span className="text-sm font-medium text-slate-600 group-hover:text-white">Démarrer la consultation</span>
              <ArrowRight size={18} className="text-slate-400 group-hover:text-white transform group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};