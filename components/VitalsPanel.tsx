import React from 'react';
import { Vitals } from '../types';
import { Heart, Activity, Thermometer, Wind, Droplet } from 'lucide-react';

interface VitalsPanelProps {
  vitals: Vitals;
}

export const VitalsPanel: React.FC<VitalsPanelProps> = ({ vitals }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Constantes Vitales</h3>
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
        
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
            <Heart size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Fréq. Cardiaque</p>
            <p className="text-sm font-semibold text-slate-800">{vitals.heartRate}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
            <Activity size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Tension Art.</p>
            <p className="text-sm font-semibold text-slate-800">{vitals.bloodPressure}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-50 rounded-lg text-orange-500">
            <Thermometer size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Température</p>
            <p className="text-sm font-semibold text-slate-800">{vitals.temperature}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-50 rounded-lg text-teal-500">
            <Wind size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Fréq. Respi.</p>
            <p className="text-sm font-semibold text-slate-800">{vitals.respiratoryRate}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
           <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500">
            <Droplet size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500">SpO2</p>
            <p className="text-sm font-semibold text-slate-800">{vitals.oxygenSaturation}</p>
          </div>
        </div>

      </div>
    </div>
  );
};