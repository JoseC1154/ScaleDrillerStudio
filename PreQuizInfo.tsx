import React, { useState } from 'react';
import { DrillMode, Language } from '../types';
import { createTranslator, TKey } from '../services/translations';

interface PreQuizInfoProps {
  drillMode: DrillMode;
  onReady: () => void;
  onSkipChange: (skip: boolean) => void;
  language: Language;
}

const getModeInfo = (mode: DrillMode, t: (key: TKey) => string): { title: string; description: string } => {
  const modeKey = `desc${mode.replace(/\s/g, '')}` as TKey;
  const description = t(modeKey) || t('descDefault');
  return { 
    title: t(mode as TKey), 
    description 
  };
};

const PreQuizInfo: React.FC<PreQuizInfoProps> = ({ drillMode, onReady, onSkipChange, language }) => {
  const [skip, setSkip] = useState(false);
  const t = createTranslator(language);
  const { title, description } = getModeInfo(drillMode, t);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkip(e.target.checked);
    onSkipChange(e.target.checked);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-xl p-8 max-w-lg w-full text-center shadow-2xl">
        <h2 className="text-3xl font-bold text-orange-400 mb-3">{t('howToPlay')}: {title}</h2>
        <p className="text-stone-300 mb-8 text-lg">{description}</p>
        
        <button
          onClick={onReady}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg text-xl transition-transform transform hover:scale-105"
        >
          {t('ready')}
        </button>

        <div className="mt-6">
            <label className="flex items-center justify-center gap-2 text-stone-400 cursor-pointer">
                <input
                    type="checkbox"
                    checked={skip}
                    onChange={handleCheckboxChange}
                    className="h-5 w-5 rounded bg-stone-700 border-stone-600 text-orange-600 focus:ring-orange-500"
                />
                {t('dontShowAgain')}
            </label>
        </div>
      </div>
    </div>
  );
};

export default PreQuizInfo;
