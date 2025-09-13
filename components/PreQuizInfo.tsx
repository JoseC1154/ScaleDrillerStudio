import React, { useState } from 'react';
import { DrillMode, Language } from '../types';
import { createTranslator, TKey } from '../services/translations';

interface PreQuizInfoProps {
  drillMode: DrillMode;
  onReady: () => void;
  onSkipChange: (skip: boolean) => void;
  language: Language;
}

const getModeInfo = (mode: DrillMode, t: (key: TKey, replacements?: Record<string, string | number>) => string): { title: string; description: string } => {
  const modeKey = `desc${mode.replace(/\s/g, '')}` as TKey;
  const description = t(modeKey) || t('descDefault');
  return { 
    title: t(mode as TKey), 
    description 
  };
};


const EnhancedKeyboardIntroVisualization = ({ t }: { t: (key: TKey) => string }) => {
    return (
      <div className="bg-stone-800 p-4 rounded-lg my-4 overflow-x-auto">
        <div className="relative h-40 w-full min-w-[400px] mx-auto flex select-none mt-6">
          {/* White Keys with Labels */}
          {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((note) => (
            <div key={note} className="flex-1 border-2 border-stone-900 bg-white rounded-b-md flex items-end justify-center pb-2">
              <span className="font-bold text-black">{note}</span>
            </div>
          ))}
          
          {/* Black Keys with Labels */}
          <div className="absolute h-24 w-8 bg-black rounded-b-md top-0 flex flex-col items-center justify-end pb-1 text-white text-xs text-center leading-tight" style={{ left: '10.5%' }}>
            <div>C♯</div><div>D♭</div>
          </div>
          <div className="absolute h-24 w-8 bg-black rounded-b-md top-0 flex flex-col items-center justify-end pb-1 text-white text-xs text-center leading-tight" style={{ left: '25%' }}>
            <div>D♯</div><div>E♭</div>
          </div>
          <div className="absolute h-24 w-8 bg-black rounded-b-md top-0 flex flex-col items-center justify-end pb-1 text-white text-xs text-center leading-tight" style={{ left: '53.5%' }}>
            <div>F♯</div><div>G♭</div>
          </div>
          <div className="absolute h-24 w-8 bg-black rounded-b-md top-0 flex flex-col items-center justify-end pb-1 text-white text-xs text-center leading-tight" style={{ left: '68%' }}>
            <div>G♯</div><div>A♭</div>
          </div>
          <div className="absolute h-24 w-8 bg-black rounded-b-md top-0 flex flex-col items-center justify-end pb-1 text-white text-xs text-center leading-tight" style={{ left: '82.5%' }}>
            <div>A♯</div><div>B♭</div>
          </div>

          {/* Group Annotations */}
          <div className="absolute -top-6 left-[10%] w-[22%] text-center">
            <div className="text-xs text-cyan-300">{t('preQuizVizGroup2')}</div>
            <div className="h-2 border-l border-r border-b border-cyan-300 mx-2"></div>
          </div>
          <div className="absolute -top-6 left-[53%] w-[36%] text-center">
            <div className="text-xs text-lime-300">{t('preQuizVizGroup3')}</div>
            <div className="h-2 border-l border-r border-b border-lime-300 mx-2"></div>
          </div>

           {/* Step annotations */}
          {/* 1 Step (half-step) - G to G# */}
          <div className="absolute text-center" style={{ left: '61.5%', bottom: '6rem', width: '9.5%' }}>
              <svg viewBox="0 0 100 50" className="w-full h-auto overflow-visible">
                  <path d="M 5 50 C 25 0, 75 0, 95 50" stroke="#f97316" fill="none" strokeWidth="8" strokeLinecap="round"/>
                  <path d="M 85 40 L 95 50 L 85 60" stroke="#f97316" fill="none" strokeWidth="8" strokeLinecap="round"/>
              </svg>
              <p className="text-xs font-bold text-orange-300 whitespace-nowrap mt-1" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                {t('preQuizViz1Step')}
              </p>
          </div>
          
          {/* 2 steps (whole-step) - C to D */}
          <div className="absolute text-center" style={{ left: '5.5%', bottom: '3rem', width: '16.5%' }}>
              <svg viewBox="0 0 100 50" className="w-full h-auto overflow-visible">
                  <path d="M 5 50 C 25 0, 75 0, 95 50" stroke="#fbbf24" fill="none" strokeWidth="8" strokeLinecap="round"/>
                  <path d="M 85 40 L 95 50 L 85 60" stroke="#fbbf24" fill="none" strokeWidth="8" strokeLinecap="round"/>
              </svg>
              <p className="text-xs font-bold text-amber-300 whitespace-nowrap mt-1" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                {t('preQuizViz2Steps')}
              </p>
          </div>
        </div>
      </div>
    );
};


const PreQuizInfo: React.FC<PreQuizInfoProps> = ({ drillMode, onReady, onSkipChange, language }) => {
  const [skip, setSkip] = useState(false);
  const t = createTranslator(language);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkip(e.target.checked);
    onSkipChange(e.target.checked);
  };

  if (drillMode === 'Key Conjurer') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 max-w-lg w-full text-center shadow-2xl max-h-[90vh] flex flex-col">
          <h2 className="text-3xl font-bold text-orange-400 mb-4">{t('preQuizKeyConjurerTitle')}</h2>
          
          <div className="overflow-y-auto pr-4 text-left space-y-4 text-stone-300 text-sm sm:text-base">
      
            <div>
              <h3 className="font-bold text-orange-300 text-lg mb-2">{t('preQuizKeyConjurerSection1Title')}</h3>
              <p>{t('preQuizKeyConjurerSection1Text')}</p>
            </div>

            <div>
              <h3 className="font-bold text-orange-300 text-lg mb-2">{t('preQuizKeyConjurerSection2Title')}</h3>
              <p>{t('preQuizKeyConjurerSection2Text')}</p>
            </div>

            <div>
              <h3 className="font-bold text-orange-300 text-lg mb-2">{t('preQuizKeyConjurerSection3Title')}</h3>
              <p>
                {t('preQuizKeyConjurerSection3Text1')}
                <b className="text-white">{t('preQuizKeyConjurerSection3_1step')}</b>
                {t('preQuizKeyConjurerSection3Text2')}
                <b className="text-white">{t('preQuizKeyConjurerSection3_halfStep')}</b>
                {t('preQuizKeyConjurerSection3Text3')}
                <b className="text-white">{t('preQuizKeyConjurerSection3_wholeStep')}</b>
                {t('preQuizKeyConjurerSection3Text4')}
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-orange-300 text-lg mb-2">{t('preQuizKeyConjurerSection4Title')}</h3>
              <p>{t('preQuizKeyConjurerSection4Text')}</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-stone-400">
                  <li>
                    {t('preQuizKeyConjurerSection4ListItem1_1')}
                    <b className="text-white">{t('preQuizKeyConjurerSection4_sharp')}</b>.
                  </li>
                  <li>
                    {t('preQuizKeyConjurerSection4ListItem2_1')}
                    <b className="text-white">{t('preQuizKeyConjurerSection4_flat')}</b>.
                  </li>
              </ul>
              <p className="mt-2">{t('preQuizKeyConjurerSection4Example')}</p>
            </div>
            
            <EnhancedKeyboardIntroVisualization t={t} />

            <p className="font-semibold text-orange-200 italic !my-4 text-center">
              {t('preQuizKeyConjurerQuote')}
            </p>
          </div>
          
          <div className="mt-6 flex-shrink-0">
            <button
              onClick={onReady}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg text-xl transition-transform transform hover:scale-105"
            >
              {t('ready')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default view for all other drills
  const { title, description } = getModeInfo(drillMode, t);
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
