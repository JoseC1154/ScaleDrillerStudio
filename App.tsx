import React, { useState, useCallback, useEffect } from 'react';
import { DEFAULT_DRILL_SETTINGS, LEVEL_MODES } from './constants';
import { DrillSettings as DrillSettingsType, UserData, PerformanceUpdate, DrillMode, DrillCompletionResult, ActiveView, InstanceState } from './types';
import { loadUserData, saveUserData, updatePerformanceStat } from './services/userData';
import { Settings } from './components/Settings';
import Drill from './components/Quiz';
import InputTester from './components/InputTester';
import GlobalSettingsModal from './components/GlobalSettingsModal';
import InfoModal from './components/InfoModal';
import PerformanceModal from './components/PerformanceModal';
import BottomNavBar from './components/BottomNavBar';
import Tuner from './components/Tuner';
import InteractiveGuide from './components/InteractiveGuide';
import ChordWorkspace from './components/ChordWorkspace';
import Dictionary from './components/Dictionary';
import { useDevice } from './hooks/useDevice';
import { getAudioContext } from './services/sound';

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
      // The new L1 gatekeeper. Educational, reveal all 12 notes.
      return { questionCount: 12, totalBeats: 999, bpm: 0, beatAward: 0, beatPenalty: 0 };
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
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('drill');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isDevModeUnlocked, setIsDevModeUnlocked] = useState(true);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [selectedChordIds, setSelectedChordIds] = useState<string[]>([]);
  const [instanceStates, setInstanceStates] = useState<Record<string, InstanceState>>({});
  const deviceType = useDevice();

  useEffect(() => {
    const loadedData = loadUserData();
    setUserData(loadedData);
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
    setAppState('input_tester');
    setActiveView('drill');
  }, []);

  const handleStartInputTesterAndCloseModal = useCallback(() => {
    handleStartInputTester();
    setIsGlobalSettingsOpen(false);
  }, [handleStartInputTester]);

  const handleQuit = useCallback(() => {
    setAppState('settings');
  }, []);

  const handleFullScreenToggle = useCallback(() => {
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

  const handleToggleQuietMode = useCallback(() => {
    setUserData(prevData => {
        if (!prevData) return null;
        const newData = { ...prevData, isQuietMode: !prevData.isQuietMode };
        saveUserData(newData);
        return newData;
    });
  }, []);


  const handleDrillComplete = useCallback((result: DrillCompletionResult) => {
    setUserData(prevData => {
        if (!prevData) return null;

        let newData = { ...prevData };
        
        // Always handle high score updates
        if (result.drillMode === 'Simon Memory Game' && result.score > newData.simonHighScore) {
            newData = { ...newData, simonHighScore: result.score };
        }

        if (result.success) {
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
                const modesForNewLevel: DrillMode[] = (LEVEL_MODES[nextLevel] || []).map(m => m.mode);
                const newUnlockedModes: DrillMode[] = Array.from(new Set([...newData.unlockedModes, ...modesForNewLevel]));
                
                newData = {
                    ...newData,
                    unlockedLevel: nextLevel,
                    unlockedModes: newUnlockedModes,
                };
                alert(`Congratulations! You've unlocked Level ${nextLevel}!`);
            }
        }

        saveUserData(newData);
        return newData;
    });
  }, []);

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
        // When switching away from a modal view, return to the drill
        if (['report', 'guide', 'tuner', 'chord', 'dictionary'].includes(currentView)) {
            if (view === currentView) { // if tapping the active icon
                return 'drill'; // go back to drill
            } else {
                return view;
            }
        } else {
            return view;
        }
    });
  }, []);

  const handleMenuNavigation = useCallback((view: ActiveView) => {
      setActiveView(view);
      setIsGlobalSettingsOpen(false); // Close modal after navigation
  }, []);

  const handleStartTutorial = useCallback(() => {
    // Close the info modal first by setting view back to the main screen
    onViewChange('guide');
    // Start the tutorial after a short delay to allow the modal to animate out
    setTimeout(() => {
        setIsTutorialActive(true);
    }, 300);
  }, [onViewChange]);


  const renderDrillContent = () => {
    if (!userData) return <div className="text-center">Loading user data...</div>;

    switch (appState) {
      case 'drill':
        return <Drill settings={activeDrillSettings!} onQuit={handleQuit} userData={userData} onUpdatePerformance={handlePerformanceUpdate} onDrillComplete={handleDrillComplete} onToggleSkipPreDrillInfo={handleToggleSkipPreDrillInfo} isQuietMode={userData.isQuietMode} />;
      case 'input_tester':
        return <InputTester settings={settings} onQuit={handleQuit} onSettingChange={handleSettingChange} isQuietMode={userData.isQuietMode} />;
      case 'settings':
      default:
        return <Settings settings={settings} onSettingChange={handleSettingChange} onStartDrill={handleStartDrill} userData={userData} isDevModeUnlocked={isDevModeUnlocked} onDevModeToggle={handleDevModeToggle} />;
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
                  Scale Driller
              </h1>
              <p className="text-stone-300 mt-1 sm:mt-2 text-base sm:text-lg">
                  Your personal music theory trainer.
              </p>
              </header>
          )}
          
          <div className={`w-full flex-1 flex items-center justify-center min-h-0`}>
              {activeView === 'drill' && renderDrillContent()}
              {activeView === 'tuner' && <Tuner settings={settings} onSettingChange={handleSettingChange} />}
              {activeView === 'chord' && userData && <ChordWorkspace 
                  settings={settings} 
                  userData={userData} 
                  onUserDataUpdate={handleUserDataUpdate} 
                  isQuietMode={userData.isQuietMode}
                  selectedChordIds={selectedChordIds}
                  setSelectedChordIds={setSelectedChordIds}
                  instanceStates={instanceStates}
                  setInstanceStates={setInstanceStates}
              />}
              {activeView === 'dictionary' && userData && <Dictionary userData={userData} onUserDataUpdate={handleUserDataUpdate} />}
          </div>
        </main>
      </div>

      <BottomNavBar activeView={activeView} onViewChange={onViewChange} onMenuClick={() => setIsGlobalSettingsOpen(true)} id="tutorial-bottom-nav" />

      <GlobalSettingsModal
        isOpen={isGlobalSettingsOpen}
        onClose={() => setIsGlobalSettingsOpen(false)}
        onNavigate={handleMenuNavigation}
        onStartInputTester={handleStartInputTesterAndCloseModal}
        onToggleFullscreen={handleFullScreenToggle}
        isFullScreen={isFullScreen}
        deviceType={deviceType}
        settings={settings}
        onSettingChange={handleSettingChange}
        isQuietMode={userData?.isQuietMode ?? false}
        onToggleQuietMode={handleToggleQuietMode}
      />

      {isTutorialActive && <InteractiveGuide onComplete={handleTutorialComplete} />}

      {activeView === 'guide' && (
        <InfoModal
            isOpen={true}
            onClose={() => onViewChange('guide')}
            onStartTutorial={handleStartTutorial}
        />
      )}
      {activeView === 'report' && (
        <PerformanceModal
            isOpen={true}
            onClose={() => onViewChange('report')}
            userData={userData}
        />
      )}
    </div>
  );
};

export default App;