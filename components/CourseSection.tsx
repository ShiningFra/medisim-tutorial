import React, { useState, useEffect } from 'react';
import { ArrowLeft, Book, Loader2, Sparkles } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { CourseModule } from '../types';

interface CourseSectionProps {
  onBack: () => void;
}

export const CourseSection: React.FC<CourseSectionProps> = ({ onBack }) => {
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      const data = await geminiService.generateDynamicCourses();
      setModules(data);
      setLoading(false);
    };
    loadCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 size={48} className="text-amber-600 animate-spin" />
        <p className="text-slate-500 font-medium">L'IA rédige vos cours personnalisés...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 h-full overflow-y-auto">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-teal-600 mb-8 font-medium transition-colors">
        <ArrowLeft size={20} className="mr-2"/> Retour Dashboard
      </button>

      <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            <Sparkles size={16}/> Généré par IA Médico-Pédagogique
          </div>
          <h1 className="text-4xl font-extrabold text-slate-800 mb-3">L'Art de la Consultation</h1>
          <p className="text-slate-500 text-lg">Maîtrisez la relation médecin-patient et le diagnostic clinique.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((mod, i) => (
              <div key={i} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-shadow flex flex-col">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-6 font-bold text-xl">
                      {i+1}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-4">{mod.title}</h3>
                  <p className="text-slate-600 text-sm mb-6 leading-relaxed flex-1">
                      {mod.description}
                  </p>
                  <div className="bg-slate-50 p-4 rounded-2xl border-l-4 border-amber-500 text-xs text-slate-700">
                      <span className="font-bold text-amber-700 block mb-1 uppercase tracking-wider">Point Méthodique :</span>
                      {mod.keyPoint}
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};