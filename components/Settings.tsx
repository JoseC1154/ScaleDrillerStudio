import React, { useState } from 'react';
import { SCALE_TYPES, MUSIC_KEYS, DEGREE_NAMES, LEVEL_MODES, CHORD_TYPES } from '../constants';
import { DrillSettings, DrillMode, UserData, Note, Language } from '../types';
import PracticeKeySelector from './PracticeKeySelector';
import { LockIcon } from './Icons';
import DevSettingsCard from './DevSettingsCard';
import { createTranslator, TKey } from '../services/translations';
import { playUIClick, playUIToggle } from '../services/sound';

interface SettingsProps {
  settings: DrillSettings;
  onSettingChange: <K extends keyof DrillSettings>(key: K, value: DrillSettings[K]) => void;
  onStartDrill: () => void;
  userData: UserData;
  isDevModeUnlocked: boolean;
  onDevModeToggle: () => void;
  language: Language;
}

const OptionButton: React.FC<{ value: any, current: any, onClick: () => void, children: React.ReactNode, disabled?: boolean, title?: string }> = ({ value, current, onClick, children, disabled, title }) => (
    <button
      onClick={() => { onClick(); playUIClick(); }}
      disabled={disabled}
      title={title}
      className={`px-3 py-2 sm:px-4 rounded-md text-sm font-medium transition-all duration-200 w-full disabled:bg-stone-800 disabled:text-stone-500 disabled:cursor-not-allowed relative ${
        current === value ? 'bg-orange-500 text-white shadow-md transform scale-105' : 'bg-stone-800 hover:bg-stone-700'
      }`}
    >
      {children}
    </button>
);

interface ModeDescriptionProps {
    title: string;
    description: string;
    language: Language;
}

const ModeDescription: React.FC<ModeDescriptionProps> = ({ title, description, language }) => {
    const t = createTranslator(language);
    return (
        <div className="text-center p-3 sm:p-4 bg-stone-800/50 rounded-lg text-stone-400">
            <h4 className="font-bold text-base sm:text-lg text-orange-400 mb-2">{title}</h4>
            <p className="text-xs sm:text-sm">{description}</p>
        </div>
    );
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSettingChange, onStartDrill, userData, isDevModeUnlocked, onDevModeToggle, language }) => {
  const { unlockedLevel, unlockedModes } = userData;
  const [isCalibrationVisible, setIsCalibrationVisible] = useState(false);
  const t = createTranslator(language);

  const handleSettingChange = <K extends keyof DrillSettings,>(key: K, value: DrillSettings[K]) => {
    onSettingChange(key, value);
  };

  const handleLevelChange = (level: number) => {
    if (!isDevModeUnlocked && level > unlockedLevel) return;
    onSettingChange('level', level);
    
    const modesForNewLevel = LEVEL_MODES[level] || [];
    const availableModes = modesForNewLevel.filter(m => isDevModeUnlocked || unlockedModes.includes(m.mode));
    
    if (!availableModes.some(m => m.mode === settings.drillMode)) {
        const defaultMode = availableModes.length > 0 ? availableModes[0].mode : LEVEL_MODES[1][0].mode;
        onSettingChange('drillMode', defaultMode);
    }
  };
  
  const handlePracticeDegreeToggle = (degreeToToggle: number) => {
    playUIClick();
    const currentDegrees = settings.practiceDegrees || [];
    const isSelected = currentDegrees.includes(degreeToToggle);
    let newDegrees;
    if (isSelected) {
        newDegrees = currentDegrees.filter(d => d !== degreeToToggle);
    } else {
        newDegrees = [...currentDegrees, degreeToToggle].sort((a,b) => a - b);
    }

    if (newDegrees.length === 0) {
        return;
    }

    onSettingChange('practiceDegrees', newDegrees);
  };

  const modesForSelectedLevel = LEVEL_MODES[settings.level] || [];
  const isCurrentModeDisabled = !modesForSelectedLevel.some(m => m.mode === settings.drillMode) || (!isDevModeUnlocked && !unlockedModes.includes(settings.drillMode));

  const getDrillDescription = (mode: DrillMode): { title: string; description: string } => {
    const modeKey = `desc${mode.replace(/\s/g, '')}` as TKey;
    const description = t(modeKey);
    const title = t(mode as TKey);
    return { title, description };
  };

  const renderModeSpecificSettings = () => {
    
    if(isCurrentModeDisabled) {
        return (
            <div className="text-center p-8 bg-stone-800/50 rounded-lg text-stone-400">
                <p className="font-semibold text-stone-200 text-lg mb-2">{t('drillLocked')}</p>
                <p>{t('selectLevelToSeeDrills')}</p>
            </div>
        );
    }

    const { title, description } = getDrillDescription(settings.drillMode);

    const showPracticeOptions = ['Practice', 'Degree Training', 'Intervals', 'Chord Builder', 'Nashville Numbers', 'Galaxy Constructor', 'ScaleSweeper', 'Degree Dash', 'Degree Dash Pro'].includes(settings.drillMode);
    
    return (
        <div className="space-y-4">
            <ModeDescription title={title} description={description} language={language} />

            {showPracticeOptions && (
                 <div className="space-y-4 pt-4 border-t border-stone-800">
                    {settings.drillMode === 'Degree Training' && (
                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-2">
                        {t('degreesToPractice')}
                        </label>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {Object.keys(DEGREE_NAMES).map(d => parseInt(d, 10)).map(degree => (
                            <button
                            key={degree}
                            onClick={() => handlePracticeDegreeToggle(degree)}
                            className={`py-2 px-2 rounded-md text-sm font-semibold transition-colors duration-200 w-full ${
                                (settings.practiceDegrees || []).includes(degree)
                                ? 'bg-orange-500 text-white shadow-md'
                                : 'bg-stone-800 hover:bg-stone-700'
                            }`}
                            >
                            {DEGREE_NAMES[degree]}
                            </button>
                        ))}
                        </div>
                    </div>
                    )}
                    
                    {['Practice', 'Degree Training', 'Galaxy Constructor', 'ScaleSweeper', 'Degree Dash', 'Degree Dash Pro'].includes(settings.drillMode) && (
                    <div>
                        <label htmlFor="scale" className="block text-sm font-medium text-stone-300 mb-2">{t('scaleType')}</label>
                        <select id="scale" value={settings.scaleType} onChange={e => handleSettingChange('scaleType', e.target.value as DrillSettings['scaleType'])} className="w-full bg-stone-800 border border-stone-700 rounded-md px-3 py-2 text-white focus:ring-orange-500 focus:border-orange-500">
                        {SCALE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    )}
                    
                    {settings.drillMode === 'Chord Builder' && (
                    <div>
                        <label htmlFor="chord-type" className="block text-sm font-medium text-stone-300 mb-2">{t('chordType')}</label>
                        <select id="chord-type" value={settings.scaleType} onChange={e => handleSettingChange('scaleType', e.target.value as DrillSettings['scaleType'])} className="w-full bg-stone-800 border border-stone-700 rounded-md px-3 py-2 text-white focus:ring-orange-500 focus:border-orange-500">
                        {CHORD_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    )}
                </div>
            )}
        </div>
    );
  };

  const getUnlockTooltip = (level: number) => {
    if (level <= unlockedLevel || isDevModeUnlocked) return undefined;
    const requiredLevel = level - 1;
    if (requiredLevel === 1) return t('unlockLvl2');
    if (requiredLevel === 2) return t('unlockLvl3');
    if (requiredLevel === 3) return t('unlockLvl4');
    if (requiredLevel === 4) return t('unlockLvl5');
    return t('unlockGatekeeper', { level: requiredLevel });
  };

  const getModeUnlockTooltip = (mode: DrillMode): string | undefined => {
    if (isDevModeUnlocked || unlockedModes.includes(mode)) return undefined;

    let modeLevel = 0;
    for (const levelStr in LEVEL_MODES) {
        const level = parseInt(levelStr, 10);
        if (LEVEL_MODES[level].some(m => m.mode === mode)) {
            modeLevel = level;
            break;
        }
    }

    if (modeLevel === 0) return t('unlockByPlaying');

    if (modeLevel > unlockedLevel) {
        if (modeLevel === 2) return t('unlockLvl2');
        if (modeLevel === 3) return t('unlockLvl3');
        if (modeLevel === 4) return t('unlockLvl4');
        if (modeLevel === 5) return t('unlockLvl5');
    }

    return t('unlockPreviousLevel');
  };

  return (
    <div className="bg-stone-900/70 backdrop-blur-lg border border-stone-700/50 p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-lg h-full flex flex-col">
      <div className="flex-1 space-y-4 sm:space-y-6 overflow-y-auto pr-2">
        <div>
          <label className="block text-sm font-medium text-stone-300 mb-2">{t('level')}</label>
          <div id="tutorial-level-selector" className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map(level => (
              <OptionButton key={level} value={level} current={settings.level} onClick={() => handleLevelChange(level)} disabled={!isDevModeUnlocked && level > unlockedLevel} title={getUnlockTooltip(level)}>
                {!isDevModeUnlocked && level > unlockedLevel ? <LockIcon className="h-4 w-4 mr-1 inline-block" /> : null}{level}
              </OptionButton>
            ))}
          </div>
        </div>

        <div className="border-t border-stone-800 pt-4 sm:pt-6">
          <label className="block text-sm font-medium text-stone-300 mb-2">{t('drills')}</label>
          {modesForSelectedLevel.length > 0 ? (
            <div id="tutorial-drill-selector" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {modesForSelectedLevel.map(({ mode }) => {
                const isLocked = !isDevModeUnlocked && !unlockedModes.includes(mode);
                const name = t(mode as TKey);
                return (
                  <OptionButton 
                    key={mode} 
                    value={mode} 
                    current={settings.drillMode} 
                    onClick={() => handleSettingChange('drillMode', mode)} 
                    disabled={isLocked}
                    title={getModeUnlockTooltip(mode)}
                  >
                    {isLocked ? <><LockIcon className="h-4 w-4 mr-1 inline-block"/>{name}</> : name}
                  </OptionButton>
                );
              })}
            </div>
          ) : (
             <div className="text-center p-4 bg-stone-800/50 rounded-lg text-stone-400">
                <p>{t('moreDrillsComingSoon')}</p>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
            {renderModeSpecificSettings()}
        </div>
      </div>
      
      <div className="flex-shrink-0 mt-4 pt-4 border-t border-stone-700 flex flex-col gap-3">
        <button
          id="tutorial-start-button"
          onClick={onStartDrill}
          disabled={isCurrentModeDisabled}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 disabled:bg-stone-600 disabled:cursor-not-allowed disabled:transform-none"
        >
          {t('startDrilling')}
        </button>

        <div className="pt-3 border-t border-stone-800 space-y-2">
            <div className="bg-stone-800 p-2 sm:p-3 rounded-lg flex justify-between items-center">
                <label htmlFor="dev-unlock" className="text-stone-200 text-sm font-medium select-none">{t('unlockAllFeatures')}</label>
                <button
                    id="dev-unlock"
                    onClick={() => { onDevModeToggle(); playUIToggle(); }}
                    className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 ease-in-out ${isDevModeUnlocked ? 'bg-green-500' : 'bg-stone-600'}`}
                    aria-pressed={isDevModeUnlocked}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${isDevModeUnlocked ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>

            {isDevModeUnlocked && (
                 <div className="bg-stone-800 rounded-lg overflow-hidden transition-all duration-300">
                    <div className="p-2 sm:p-3 flex justify-between items-center cursor-pointer" onClick={() => { setIsCalibrationVisible(p => !p); playUIToggle(); }}>
                         <label className="text-stone-200 text-sm font-medium select-none cursor-pointer">{t('drillCalibration')}</label>
                         <button
                            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 ease-in-out ${isCalibrationVisible ? 'bg-green-500' : 'bg-stone-600'}`}
                            aria-pressed={isCalibrationVisible}
                            aria-label="Toggle Drill Calibration"
                         >
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${isCalibrationVisible ? 'translate-x-6' : 'translate-x-1'}`} />
                         </button>
                    </div>
                    {isCalibrationVisible && <DevSettingsCard settings={settings} onSettingChange={onSettingChange} language={language} />}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
