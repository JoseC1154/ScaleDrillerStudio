


import { UserData, PerformanceStat, MusicKey, ScaleType, PerformanceUpdate, DrillMode } from '../types.ts';

const USER_DATA_KEY = 'scale-driller-userData';

export const getInitialUserData = (): UserData => ({
  unlockedLevel: 1,
  isKeySelectionUnlocked: false,
  unlockedModes: ['Key Conjurer'], // Start with only Key Conjurer unlocked
  performance: {
    byKey: {},
    byScale: {},
    byDegree: {},
    byInterval: {},
    byChord: {},
    byDrillMode: {},
  },
  preDrillInfoSeen: {},
  simonHighScore: 0,
  hasCompletedTutorial: false,
});

export const loadUserData = (): UserData => {
  try {
    const data = localStorage.getItem(USER_DATA_KEY);
    if (data) {
      const parsedData: any = JSON.parse(data);
      // Basic validation and merging with default to handle schema changes
      const initialData = getInitialUserData();
      
      // Migration for old preQuizInfoSeen property
      if (parsedData.preQuizInfoSeen && !parsedData.preDrillInfoSeen) {
          parsedData.preDrillInfoSeen = parsedData.preQuizInfoSeen;
          delete parsedData.preQuizInfoSeen;
      }
      
      // Migration for old performance.byQuizMode property
      if (parsedData.performance && parsedData.performance.byQuizMode && !parsedData.performance.byDrillMode) {
          parsedData.performance.byDrillMode = parsedData.performance.byQuizMode;
          delete parsedData.performance.byQuizMode;
      }
      
      // Migration from Key Explorer to Key Conjurer/Note Professor
      if (parsedData.unlockedModes?.includes('Key Explorer')) {
        parsedData.unlockedModes = parsedData.unlockedModes.filter((m: string) => m !== 'Key Explorer');
        if (!parsedData.unlockedModes.includes('Key Conjurer')) {
            parsedData.unlockedModes.push('Key Conjurer');
        }
        if (parsedData.unlockedLevel > 1 && !parsedData.unlockedModes.includes('Note Professor')) {
            parsedData.unlockedModes.push('Note Professor');
        }
      }


      return {
        ...initialData,
        ...parsedData,
        performance: {
          ...initialData.performance,
          ...(parsedData.performance || {}),
        },
        // Ensure new users or corrupted data get the correct starting modes
        unlockedModes: Array.isArray(parsedData.unlockedModes) && parsedData.unlockedModes.length > 0 ? parsedData.unlockedModes : initialData.unlockedModes,
        preDrillInfoSeen: parsedData.preDrillInfoSeen || {},
        simonHighScore: parsedData.simonHighScore || 0,
        hasCompletedTutorial: parsedData.hasCompletedTutorial || false,
      };
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
  return getInitialUserData();
};

export const saveUserData = (userData: UserData): void => {
  try {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

export const updatePerformanceStat = (currentData: UserData, update: PerformanceUpdate): UserData => {
  const newData = { ...currentData, performance: { ...currentData.performance } };

  const updateStat = (obj: any, key: string | number) => {
    const stat = obj[key] || { correct: 0, incorrect: 0 };
    if (update.isCorrect) {
      stat.correct++;
    } else {
      stat.incorrect++;
    }
    obj[key] = stat;
  };

  if (update.key) {
    const byKey = { ...newData.performance.byKey };
    updateStat(byKey, update.key);
    newData.performance.byKey = byKey;
  }
  if (update.scaleType) {
    const byScale = { ...newData.performance.byScale };
    updateStat(byScale, update.scaleType);
    newData.performance.byScale = byScale;
  }
  if (update.degree) {
    const byDegree = { ...newData.performance.byDegree };
    updateStat(byDegree, update.degree);
    newData.performance.byDegree = byDegree;
  }
  if (update.intervalName) {
      const byInterval = { ...newData.performance.byInterval };
      updateStat(byInterval, update.intervalName);
      newData.performance.byInterval = byInterval;
  }
  if (update.chordType) {
      const byChord = { ...newData.performance.byChord };
      updateStat(byChord, update.chordType);
      newData.performance.byChord = byChord;
  }
  if (update.drillMode) {
      const byDrillMode = { ...newData.performance.byDrillMode };
      updateStat(byDrillMode, update.drillMode);
      newData.performance.byDrillMode = byDrillMode;
  }

  return newData;
};

export const getAccuracy = (stat: PerformanceStat | undefined): number => {
  if (!stat || (stat.correct === 0 && stat.incorrect === 0)) return -1; // -1 to indicate not practiced
  return Math.round((stat.correct / (stat.correct + stat.incorrect)) * 100);
};

export const getAccuracyColor = (accuracy: number): string => {
  if (accuracy < 0) return 'text-stone-500'; // Not practiced
  if (accuracy < 50) return 'text-red-400';
  if (accuracy < 80) return 'text-yellow-400';
  return 'text-green-400';
};

export const getAccuracyBgColor = (accuracy: number): string => {
  if (accuracy < 0) return 'bg-stone-700';
  if (accuracy < 50) return 'bg-red-500';
  if (accuracy < 80) return 'bg-yellow-500';
  return 'bg-green-500';
};