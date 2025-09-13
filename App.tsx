import React, { useState, useCallback, useEffect } from 'react';
import { DEFAULT_DRILL_SETTINGS, LEVEL_MODES } from './constants';
import { DrillSettings as DrillSettingsType, UserData, PerformanceUpdate, DrillMode, DrillCompletionResult, ActiveView, InstanceState, Language } from './types';
import { loadUserData, saveUserData, updatePerformanceStat } from './services/userData';
import { Settings } from './components/Settings';
import Drill from './components/Quiz';
import InputTester from './components/InputTester';
import MenuView from './components/MenuView';
import InfoModal from './components/InfoModal';
import PerformanceModal from './components/PerformanceModal';
import BottomNavBar from './components/BottomNavBar';
import Tuner from './components/Tuner';
import InteractiveGuide from './components/InteractiveGuide';
import ChordWorkspace from './components/ChordWorkspace';
// FIX: Changed to a named import to resolve the "Module has no default export" error.
import { Dictionary } from './components/Dictionary';
import { useDevice } from './hooks/useDevice';
import { getAudioContext, playUIClick, playDrillSuccess, playLevelUpSound } from './services/sound';
import { createTranslator } from './services/translations';

type AppState = 'settings' | 'drill' | 'input_tester';

const getDrillRules = (mode: DrillMode): Partial<DrillSettingsType> => {
  // Base rules for a standard "endless" survival mode
  const baseRules: Partial<DrillSettingsType> = {
    questionCount: 200, // High count for a near-endless feel
    beatAward: 5,
    beatPenalty: 5,
    totalBeats: 30,
    bpm: 70,
  };

  switch (mode) {
    case 'Key Conjurer':
      // This is now a standard survival drill. Master all 12 notes before beats run out.
      // Question count is 1 because it manages its own loop.
      return { ...baseRules, questionCount: 1, totalBeats: 40 };
    case 'Note Professor':
      // A relaxed, educational mode. No time pressure.
      return { questionCount: 12, totalBeats: 999, bpm: 40, beatAward: 0, beatPenalty: 0 };
    case 'Galaxy Constructor':
      // An introductory, educational mode. No pressure.
      return { questionCount: 5, totalBeats: 999, bpm: 0, beatAward: 0, beatPenalty: 0 };
    case 'Simon Memory Game':
      // This mode manages its own progression. The settings are for the very first round.
      return { ...baseRules, questionCount: 1, totalBeats: 15, bpm: 70, beatAward: 5, beatPenalty: 10 };
    case 'Degree Dash':
      // This mode manages its own rounds and timing. Initial setup is for the non-timed rounds.
      return { ...baseRules, questionCount: 1, totalBeats: 999, bpm: 0, beatAward: 0, beatPenalty: 5 };
    case 'Degree Dash Pro':
      // Same as Degree Dash, just without hints (handled in Quiz component).
      return { ...baseRules, questionCount: 1, totalBeats: 999, bpm: 0, beatAward: 0, beatPenalty: 5 };
    case 'Key Notes':
      // An endurance mode. More starting health, faster pace.
      return { ...baseRules, totalBeats: 50, bpm: 80 };
    case 'Scale Detective':
      // This mode is for leveling up, so it has a fixed length. Generous beats to encourage completion.
      return { ...baseRules, questionCount: 40, totalBeats: 40, bpm: 70, beatAward: 10, beatPenalty: 5 };
    case 'ScaleSweeper':
      // Manages its own rounds/keys. High starting beats for the discovery phase.
      return { ...baseRules, questionCount: 1, totalBeats: 100, bpm: 90, beatAward: 5, beatPenalty: 10 };
    case 'Randomizer Roulette':
      // The L4 gatekeeper needs a fixed length to be completable.
      return { ...baseRules, questionCount: 40, totalBeats: 40, bpm: 80 };
    case 'Time Attack':
      // A frantic, high-pressure start.
      return { ...baseRules, totalBeats: 20, bpm: 100 };
    case 'BPM Challenge':
      // Starts fast and gets faster.
      return { ...baseRules, totalBeats: 30, bpm: 90 };
    case 'BPM Roulette':
        return { ...baseRules, totalBeats: 30, bpm: 90 };
    case 'Practice':
    case 'Nashville Numbers':
    case 'Degree Training':
    case 'Intervals':
    case 'Chord Builder':
    default:
      // Standard survival modes all share these balanced starting rules.
      return baseRules;
  }
};


const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('settings');
  const [settings, setSettings] = useState<DrillSettingsType>(DEFAULT_DRILL_SETTINGS);
  const [activeDrillSettings, setActiveDrillSettings] = useState<DrillSettingsType | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(!!document.fullscreenElement);
  const [activeView, setActiveView] = useState<ActiveView>('drill');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isDevModeUnlocked, setIsDevModeUnlocked] = useState(true);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [selectedChordIds, setSelectedChordIds] = useState<string[]>([]);
  const [instanceStates, setInstanceStates] = useState<Record<string, InstanceState>>({});
  const deviceType = useDevice();
  const [language, setLanguage] = useState<Language>('en');
  const t = createTranslator(language);


  useEffect(() => {
    const loadedData = loadUserData();
    setUserData(loadedData);
    setLanguage(loadedData.language || 'en');
    setSettings(prev => ({ ...prev, language: loadedData.language || 'en' }));
    // if (!loadedData.hasCompletedTutorial) { ... }
  }, []);

  // Effect to unlock audio context on first user interaction for mobile compatibility
  useEffect(() => {
    const unlockAudio = () => {
      getAudioContext(); // This will create/resume the context
      // This listener can stay to handle cases where the browser suspends audio again
    };
    
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Add/remove class to body for drill-specific global styles (e.g., landscape layout)
  useEffect(() => {
    if (appState === 'drill') {
      document.body.classList.add('in-drill');
    } else {
      document.body.classList.remove('in-drill');
    }
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('in-drill');
    }
  }, [appState]);

  const handleSettingChange = useCallback(<K extends keyof DrillSettingsType>(key: K, value: DrillSettingsType[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleDevModeToggle = useCallback(() => {
    setIsDevModeUnlocked(prev => !prev);
  }, []);

  const handleStartDrill = useCallback(() => {
    playUIClick();
    if (!userData || isTutorialActive) return;
    if (!isDevModeUnlocked && !userData.unlockedModes.includes(settings.drillMode)) return;

    // When dev mode is unlocked, we use the settings as they are, respecting the user's
    // choices from the new calibration card. Otherwise, we apply the default rules.
    const finalSettings: DrillSettingsType = isDevModeUnlocked 
      ? settings 
      : {
          ...settings,
          ...getDrillRules(settings.drillMode),
        };
    
    setActiveDrillSettings(finalSettings);
    setAppState('drill');
  }, [settings, userData, isDevModeUnlocked, isTutorialActive]);


  const handleStartInputTester = useCallback(() => {
    playUIClick();
    setAppState('input_tester');
    setActiveView('drill');
  }, []);

  const handleQuit = useCallback(() => {
    playUIClick();
    setAppState('settings');
    setActiveView('drill'); // Always return to drill settings screen on quit
  }, []);

  const handleFullScreenToggle = useCallback(() => {
    playUIClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);
  
  const handlePerformanceUpdate = useCallback((update: PerformanceUpdate) => {
      setUserData(prevData => {
          if (!prevData) return null;
          const newData = updatePerformanceStat(prevData, update);
          saveUserData(newData);
          return newData;
      });
  }, []);

  const handleUserDataUpdate = useCallback((newUserData: UserData) => {
    saveUserData(newUserData);
    setUserData(newUserData);
  }, []);
  
  const handleToggleSkipPreDrillInfo = useCallback((drillMode: DrillMode, skip: boolean) => {
    setUserData(prevData => {
        if (!prevData) return null;
        const newSeen = { ...prevData.preDrillInfoSeen, [drillMode]: skip };
        const newData = { ...prevData, preDrillInfoSeen: newSeen };
        saveUserData(newData);
        return newData;
    });
  }, []);

  const handleLanguageChange = useCallback((newLanguage: Language) => {
    setLanguage(newLanguage);
    setSettings(prev => ({ ...prev, language: newLanguage }));
    setUserData(prevData => {
        if (!prevData) return null;
        const newData = { ...prevData, language: newLanguage };
        saveUserData(newData);
        return newData;
    });
  }, []);


  const handleDrillComplete = useCallback((result: DrillCompletionResult) => {
    if (result.success) {
      playDrillSuccess();
    }
    setUserData(prevData => {
        if (!prevData) return null;

        let newData = { ...prevData };
        
        // Always handle high score updates
        if (result.drillMode === 'Simon Memory Game' && result.score > newData.simonHighScore) {
            newData = { ...newData, simonHighScore: result.score };
        }

        if (result.success) {
            // Unlock "Note Discovery" (Key Conjurer) after mastering "Note Professor"
            if (result.drillMode === 'Note Professor' && !newData.unlockedModes.includes('Key Conjurer')) {
                const newUnlockedModes: DrillMode[] = Array.from(new Set([...newData.unlockedModes, 'Key Conjurer']));
                newData = { ...newData, unlockedModes: newUnlockedModes };
                alert(t('unlockedNoteDiscovery'));
            }

            const currentUnlockedLevel = newData.unlockedLevel;
            let nextLevel = currentUnlockedLevel;
            let leveledUp = false;

            // Gatekeeper logic: complete a specific drill to unlock the next level
            if (result.drillMode === 'Key Conjurer' && currentUnlockedLevel === 1) {
                nextLevel = 2;
                leveledUp = true;
            } else if (result.drillMode === 'Scale Detective' && currentUnlockedLevel === 2) {
                nextLevel = 3;
                leveledUp = true;
            } else if (result.drillMode === 'ScaleSweeper' && currentUnlockedLevel === 3) {
                nextLevel = 4;
                leveledUp = true;
            } else if (result.drillMode === 'Randomizer Roulette' && currentUnlockedLevel === 4) {
                nextLevel = 5;
                leveledUp = true;
            }

            if (leveledUp) {
                playLevelUpSound();
                const modesForNewLevel: DrillMode[] = (LEVEL_MODES[nextLevel] || []).map(m => m.mode);
                const newUnlockedModes: DrillMode[] = Array.from(new Set([...newData.unlockedModes, ...modesForNewLevel]));
                
                newData = {
                    ...newData,
                    unlockedLevel: nextLevel,
                    unlockedModes: newUnlockedModes,
                };
                alert(t('levelUp', { level: nextLevel }));
            }
        }

        saveUserData(newData);
        return newData;
    });
  }, [t]);

  const handleTutorialComplete = useCallback(() => {
    setIsTutorialActive(false);
    setUserData(prevData => {
        if (!prevData) return null;
        const newData = { ...prevData, hasCompletedTutorial: true };
        saveUserData(newData);
        return newData;
    });
  }, []);

  useEffect(() => {
    const onFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullScreenChange);
  }, []);

  const onViewChange = useCallback((view: ActiveView) => {
    setActiveView(currentView => {
        // If tapping the active icon of a "modal-like" view, toggle it off by returning to the drill view.
        if (view === currentView && ['report', 'guide', 'tuner', 'chord', 'dictionary', 'menu'].includes(view)) {
            return 'drill';
        }
        // Otherwise, switch to the new view.
        return view;
    });
  }, []);

  const handleStartTutorial = useCallback(() => {
    playUIClick();
    // Close the info modal first by setting view back to the main screen
    onViewChange('guide');
    // Start the tutorial after a short delay to allow the modal to animate out
    setTimeout(() => {
        setIsTutorialActive(true);
    }, 300);
  }, [onViewChange]);


  const renderDrillContent = () => {
    if (!userData) return <div className="text-center">{t('loading')}</div>;

    switch (appState) {
      case 'drill':
        return <Drill settings={activeDrillSettings!} onQuit={handleQuit} userData={userData} onUpdatePerformance={handlePerformanceUpdate} onDrillComplete={handleDrillComplete} onToggleSkipPreDrillInfo={handleToggleSkipPreDrillInfo} />;
      case 'input_tester':
        return <InputTester settings={settings} onQuit={handleQuit} onSettingChange={handleSettingChange} language={language} />;
      case 'settings':
      default:
        return <Settings settings={settings} onSettingChange={handleSettingChange} onStartDrill={handleStartDrill} userData={userData} isDevModeUnlocked={isDevModeUnlocked} onDevModeToggle={handleDevModeToggle} language={language} />;
    }
  };

  const showHeader = appState === 'settings' && activeView === 'drill';

  return (
    <div className="text-stone-100 h-screen w-screen flex flex-col">
      <div className="flex-1 flex flex-col min-w-0 min-h-0 pt-[env(safe-area-inset-top)]">
        {/* MAIN CONTENT */}
        <main className="flex-1 w-full overflow-y-auto px-2 sm:px-4 py-2 flex flex-col items-center">
          {showHeader && (
              <header className="text-center mb-4 sm:mb-8 flex-shrink-0 pt-8">
              <h1 className="text-4xl sm:text-5xl font-bold text-orange-400 tracking-tighter drop-shadow-lg">
                  {t('scaleDriller')}
              </h1>
              <p className="text-stone-300 mt-1 sm:mt-2 text-base sm:text-lg">
                  {t('personalTrainer')}
              </p>
              </header>
          )}
          
          <div className={`w-full flex-1 flex items-center justify-center min-h-0`}>
              {activeView === 'drill' && renderDrillContent()}
              {activeView === 'tuner' && <Tuner settings={settings} onSettingChange={handleSettingChange} language={language} />}
              {activeView === 'chord' && userData && <ChordWorkspace 
                  settings={settings} 
                  userData={userData} 
                  onUserDataUpdate={handleUserDataUpdate} 
                  language={language}
                  selectedChordIds={selectedChordIds}
                  setSelectedChordIds={setSelectedChordIds}
                  instanceStates={instanceStates}
                  setInstanceStates={setInstanceStates}
              />}
              {activeView === 'dictionary' && userData && <Dictionary userData={userData} onUserDataUpdate={handleUserDataUpdate} language={language} />}
              {activeView === 'menu' && (
                <MenuView
                    onNavigate={onViewChange}
                    onStartInputTester={handleStartInputTester}
                    onToggleFullscreen={handleFullScreenToggle}
                    isFullScreen={isFullScreen}
                    deviceType={deviceType}
                    settings={settings}
                    onSettingChange={handleSettingChange}
                    language={language}
                    onLanguageChange={handleLanguageChange}
                />
              )}
          </div>
        </main>
      </div>

      <BottomNavBar activeView={activeView} onViewChange={onViewChange} id="tutorial-bottom-nav" language={language} />

      {isTutorialActive && <InteractiveGuide onComplete={handleTutorialComplete} language={language} />}

      {activeView === 'guide' && (
        <InfoModal
            isOpen={true}
            onClose={() => onViewChange('guide')}
            onStartTutorial={handleStartTutorial}
            language={language}
        />
      )}
      {activeView === 'report' && (
        <PerformanceModal
            isOpen={true}
            onClose={() => onViewChange('report')}
            userData={userData}
            language={language}
        />
      )}
    </div>
  );
};

export default App;