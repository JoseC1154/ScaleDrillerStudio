import React, { useEffect } from 'react';
import {
  DrillIcon, ChordIcon, DictionaryIcon, MenuIcon,
  HelpIcon, ToggleDegreesIcon, QuitIcon, CloseIcon
} from './Icons';
import { Language } from '../types';
import { createTranslator } from '../services/translations';

interface SectionProps { title: string; children: React.ReactNode; }
const Section: React.FC<SectionProps> = ({ title, children }) => (
  <section>
    <h3 className="text-xl font-bold text-orange-400 mb-3 border-b-2 border-orange-500/30 pb-2">{title}</h3>
    <div className="space-y-4 text-stone-300">{children}</div>
  </section>
);

interface IconRowProps { icon: React.ReactNode; title: string; children: React.ReactNode; }
const IconRow: React.FC<IconRowProps> = ({ icon, title, children }) => (
  <div className="flex items-start gap-4">
    <div className="text-orange-400 mt-1 flex-shrink-0">{icon}</div>
    <div>
      <h4 className="font-semibold text-stone-100">{title}</h4>
      <p className="text-sm text-stone-400">{children}</p>
    </div>
  </div>
);

interface ModeDescProps { title: string; children: React.ReactNode; gatekeeper?: boolean; language: Language; }
const ModeDesc: React.FC<ModeDescProps> = ({ title, children, gatekeeper=false, language }) => {
    const t = createTranslator(language);
    return (
        <div>
            <h4 className="font-semibold text-stone-100">
                {title}
                {gatekeeper && <span className="ml-2 text-xs font-bold uppercase text-orange-400 bg-orange-900/50 px-2 py-1 rounded">{t('guideGatekeeper')}</span>}
            </h4>
            <div className="text-sm text-stone-400">{children}</div>
        </div>
    );
}

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTutorial: () => void;
  language: Language;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, onStartTutorial, language }) => {
  const t = createTranslator(language);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-stone-700 rounded-lg max-w-2xl w-full shadow-2xl flex flex-col max-h-[calc(100vh-3rem)]" onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="p-4 border-b border-stone-700/50 flex-shrink-0 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-orange-400">{t('guideTitle')}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          <Section title={t('guideSection1Title')}>
            <p>{t('guideSection1Para1')}</p>
            <ol className="list-decimal list-inside space-y-2 text-stone-400">
                <li><strong className="text-stone-200">{t('guideSection1Step1')}</strong> {t('guideSection1Step1Text')}</li>
                <li><strong className="text-stone-200">{t('guideSection1Step2')}</strong> {t('guideSection1Step2Text')}</li>
                <li><strong className="text-stone-200">{t('guideSection1Step3')}</strong> {t('guideSection1Step3Text')}</li>
                <li><strong className="text-stone-200">{t('guideSection1Step4')}</strong> {t('guideSection1Step4Text')}</li>
                <li><strong className="text-stone-200">{t('guideSection1Step5')}</strong> {t('guideSection1Step5Text')}</li>
                <li><strong className="text-stone-200">{t('guideSection1Step6')}</strong> {t('guideSection1Step6Text')}</li>
            </ol>
          </Section>

          <Section title={t('guideSection2Title')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                    <h4 className="text-lg font-semibold text-stone-200 mb-3">{t('guideSection2Subtitle1')}</h4>
                    <div className="space-y-4">
                      <IconRow icon={<DrillIcon className="h-6 w-6" />} title={t('drill')}>{t('guideDrillDesc')}</IconRow>
                      <IconRow icon={<ChordIcon className="h-6 w-6" />} title={t('chordWorkspace')}>{t('guideChordWorkspaceDesc')}</IconRow>
                      <IconRow icon={<DictionaryIcon className="h-6 w-6" />} title={t('dictionary')}>{t('guideDictionaryDesc')}</IconRow>
                      <IconRow icon={<MenuIcon className="h-6 w-6" />} title={t('menu')}>{t('guideMenuDesc')}</IconRow>
                    </div>
                </div>
                 <div>
                    <h4 className="text-lg font-semibold text-stone-200 mb-3">{t('guideSection2Subtitle2')}</h4>
                    <div className="space-y-4">
                      <IconRow icon={<HelpIcon className="h-5 w-5" />} title={t('guideHelp')}>{t('guideHelpDesc')}</IconRow>
                      <IconRow icon={<ToggleDegreesIcon className="h-5 w-5" />} title={t('guideToggleLabels')}>{t('guideToggleLabelsDesc')}</IconRow>
                      <IconRow icon={<QuitIcon className="h-5 w-5" />} title={t('guideQuit')}>{t('guideQuitDesc')}</IconRow>
                    </div>
                </div>
            </div>
          </Section>

          <Section title={t('guideSection3Title')}>
            <h4 className="text-lg font-semibold text-stone-200">{t('guideLvl1')}</h4>
            <ModeDesc title={t('Key Conjurer')} language={language} gatekeeper>{t('descKeyConjurer')}</ModeDesc>
            <ModeDesc title={t('Galaxy Constructor')} language={language}>{t('descGalaxyConstructor')}</ModeDesc>
            <ModeDesc title={t('Degree Dash')} language={language}>{t('descDegreeDash')}</ModeDesc>
            
            <h4 className="text-lg font-semibold text-stone-200 mt-6">{t('guideLvl2')}</h4>
            <ModeDesc title={t('Note Professor')} language={language}>{t('descNoteProfessor')}</ModeDesc>
            <ModeDesc title={t('Simon Memory Game')} language={language}>{t('descSimonMemory')}</ModeDesc>
            <ModeDesc title={t('Key Notes')} language={language}>{t('descKeyNotes')}</ModeDesc>
            <ModeDesc title={t('Scale Detective')} language={language} gatekeeper>{t('descScaleDetective')}</ModeDesc>

            <h4 className="text-lg font-semibold text-stone-200 mt-6">{t('guideLvl3')}</h4>
            <ModeDesc title={`${t('Intervals')} & ${t('Chord Builder')}`} language={language}>{t('descKeyNotes')}</ModeDesc>
            <ModeDesc title={t('Degree Dash Pro')} language={language}>{t('descDegreeDashPro')}</ModeDesc>
            <ModeDesc title={t('ScaleSweeper')} language={language} gatekeeper>{t('descScaleSweeper')}</ModeDesc>
            
            <h4 className="text-lg font-semibold text-stone-200 mt-6">{t('guideLvl4')}</h4>
            <ModeDesc title={t('Randomizer Roulette')} language={language} gatekeeper>{t('descRandomizerRoulette')}</ModeDesc>
            
            <h4 className="text-lg font-semibold text-stone-200 mt-6">{t('guideLvl5')}</h4>
            <ModeDesc title={t('BPM Roulette')} language={language}>{t('descDefault')}</ModeDesc>
          </Section>
        </div>
        
        {/* Modal Footer */}
        <footer className="p-4 border-t border-stone-700/50 flex-shrink-0">
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
            <button
              onClick={onStartTutorial}
              className="w-full sm:w-auto bg-stone-600 hover:bg-stone-500 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              {t('guideReplayTutorial')}
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              {t('guideClose')}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default InfoModal;
