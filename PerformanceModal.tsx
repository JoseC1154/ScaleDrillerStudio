
import React from 'react';
import { UserData, PerformanceStat, Language } from '../types';
import { MUSIC_KEYS, SCALE_TYPES, DEGREE_NAMES, INTERVAL_NAMES, CHORD_TYPES } from '../constants';
import { getAccuracy, getAccuracyColor } from '../services/userData';
import { createTranslator } from '../services/translations';

interface PerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserData | null;
  language: Language;
}

const StatRow: React.FC<{ label: string; stat: PerformanceStat | undefined, attemptsText: string }> = ({ label, stat, attemptsText }) => {
  const accuracy = getAccuracy(stat);
  const total = stat ? stat.correct + stat.incorrect : 0;
  return (
    <div className="flex justify-between items-center bg-stone-800 p-2 rounded-md">
      <span className="font-semibold text-stone-200">{label}</span>
      <div className="text-right">
        <span className={`font-bold text-lg ${getAccuracyColor(accuracy)}`}>
          {accuracy >= 0 ? `${accuracy}%` : 'N/A'}
        </span>
        <span className="text-xs text-stone-400 ml-2">({total} {attemptsText})</span>
      </div>
    </div>
  );
};


const PerformanceModal: React.FC<PerformanceModalProps> = ({ isOpen, onClose, userData, language }) => {
  const t = createTranslator(language);
  if (!isOpen || !userData) return null;
  const { performance } = userData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-stone-700 rounded-lg max-w-4xl w-full shadow-2xl flex flex-col max-h-[calc(100vh-3rem)]" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-stone-700/50 flex-shrink-0 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-orange-400">{t('performanceReport')}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main className="overflow-y-auto p-6 space-y-6">
          <p className="text-stone-400">This report shows your accuracy on different musical concepts. The app will use this data to give you more practice on your weak spots!</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <section>
              <h3 className="text-xl font-bold text-orange-400 mb-3">By Key</h3>
              <div className="space-y-2">
                {MUSIC_KEYS.map(key => (
                  <StatRow key={key} label={key} stat={performance.byKey[key]} attemptsText="attempts" />
                ))}
              </div>
            </section>
            
            <section>
              <h3 className="text-xl font-bold text-orange-400 mb-3">By Scale Degree</h3>
               <div className="space-y-2">
                {Object.keys(DEGREE_NAMES).map(d => parseInt(d,10)).map(degree => (
                  <StatRow key={degree} label={`${DEGREE_NAMES[degree]} Degree`} stat={performance.byDegree[degree]} attemptsText="attempts" />
                ))}
              </div>
               <h3 className="text-xl font-bold text-orange-400 mb-3 mt-6">By Scale & Chord Type</h3>
               <div className="space-y-2">
                {SCALE_TYPES.map(type => (
                  <StatRow key={type} label={type} stat={performance.byScale[type]} attemptsText="attempts" />
                ))}
                {CHORD_TYPES.map(type => (
                  <StatRow key={type} label={`${type} Chord`} stat={performance.byChord[type]} attemptsText="attempts" />
                ))}
              </div>
            </section>
            
            <section>
                <h3 className="text-xl font-bold text-orange-400 mb-3">By Interval</h3>
                 <div className="space-y-2">
                    {INTERVAL_NAMES.map(name => (
                        <StatRow key={name} label={name} stat={performance.byInterval[name]} attemptsText="attempts" />
                    ))}
                </div>
            </section>

          </div>
        </main>

        <footer className="p-4 border-t border-stone-700/50 flex-shrink-0">
          <button onClick={onClose} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition">
            {t('guideClose')}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PerformanceModal;
