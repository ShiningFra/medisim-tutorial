import React from 'react';
import { UserProfile } from '../types';
import { Stethoscope, GraduationCap, BookOpen, Trophy, TrendingUp, Activity } from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  onNavigate: (destination: 'cases' | 'quiz' | 'courses') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const progressPercentage = Math.min(100, (user.xp / user.maxXp) * 100);

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 h-full overflow-y-auto">
      {/* Header Profile Section */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-10 flex flex-col md:flex-row items-center md:items-start gap-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 border-4 border-white shadow-lg">
            <span className="text-3xl font-bold">{user.name.charAt(0)}</span>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-amber-400 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white">
            Niv. {Math.floor(user.xp / 1000) + 1}
          </div>
        </div>

        <div className="flex-1 w-full text-center md:text-left">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Bienvenue, Dr. {user.name}</h1>
          <p className="text-slate-500 font-medium mb-4">{user.level}</p>

          <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
            <div 
              className="bg-teal-500 h-3 rounded-full transition-all duration-1000" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>{user.xp} XP</span>
            <span>{user.maxXp} XP pour le prochain rang</span>
          </div>
        </div>

        <div className="flex gap-4 md:gap-8 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 pl-0 md:pl-8 mt-4 md:mt-0 w-full md:w-auto justify-center md:justify-start">
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-800">{user.casesCompleted}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Cas Résolus</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-indigo-600">{user.averageScore}%</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Score Moyen</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card: Consultations */}
        <div 
          onClick={() => onNavigate('cases')}
          className="group bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-teal-500 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Stethoscope size={120} className="text-teal-600 transform rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-6 group-hover:scale-110 transition-transform">
            <Activity size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Consultations</h3>
          <p className="text-slate-500 text-sm mb-6">
            Diagnostiquez des patients virtuels en temps réel. Accédez à la banque de cas cliniques.
          </p>
          <span className="text-teal-600 font-semibold text-sm flex items-center gap-2 group-hover:translate-x-2 transition-transform">
            Lancer une simulation →
          </span>
        </div>

        {/* Card: Quiz */}
        <div 
          onClick={() => onNavigate('quiz')}
          className="group bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-500 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Trophy size={120} className="text-indigo-600 transform -rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
            <Trophy size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Quiz Médicaux</h3>
          <p className="text-slate-500 text-sm mb-6">
            Testez vos connaissances rapides sur la sémiologie, la pharmacologie et l'anatomie.
          </p>
          <span className="text-indigo-600 font-semibold text-sm flex items-center gap-2 group-hover:translate-x-2 transition-transform">
            Démarrer un quiz →
          </span>
        </div>

        {/* Card: Cours */}
        <div 
          onClick={() => onNavigate('courses')}
          className="group bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-amber-500 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BookOpen size={120} className="text-amber-600 transform rotate-6 translate-x-4 -translate-y-4" />
          </div>
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform">
            <GraduationCap size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">L'Art de la Consultation</h3>
          <p className="text-slate-500 text-sm mb-6">
            Modules théoriques sur l'anamnèse, l'examen physique et la communication patient.
          </p>
          <span className="text-amber-600 font-semibold text-sm flex items-center gap-2 group-hover:translate-x-2 transition-transform">
            Accéder aux cours →
          </span>
        </div>

      </div>
    </div>
  );
};