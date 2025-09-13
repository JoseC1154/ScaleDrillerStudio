import { UserData, PerformanceStat, MusicKey, ScaleType, PerformanceUpdate, DrillMode, UserChord, Language } from '../types';

const USER_DATA_KEY = 'scale-driller-userData';

export const getInitialUserData = (): UserData => ({
  unlockedLevel: 1,
  isKeySelectionUnlocked: false,
  unlockedModes: ['Key Conjurer', 'Note Professor'], // Start with Level 1 drills unlocked
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
  userChords: [
    { id: 'seed-cmaj7', name: 'Cmaj7', notes: ['C4', 'E4', 'G4', 'B4'] },
    { id: 'seed-dm9', name: 'Dm9', notes: ['D4', 'F4', 'A4', 'C5', 'E5'] },
    { id: 'seed-g13', name: 'G13', notes: ['G3', 'B3', 'D4', 'F4', 'A4', 'E5'] },
    { id: 'seed-fsm7b5e', name: 'F#m7b5/E', notes: ['E3', 'F#3', 'A3', 'C4'] },
  ],
  recentChords: [],
  language: 'en',
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

      const finalData = {
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
        userChords: parsedData.userChords || [],
        recentChords: parsedData.recentChords || [],
        language: parsedData.language || 'en',
      };

      // If a returning user has no chords, give them the seed data.
      if (!finalData.userChords || finalData.userChords.length === 0) {
          finalData.userChords = initialData.userChords;
      }
      
      return finalData;

    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
  return getInitialUserData();
};

export const saveUserData = (userData: UserData): void => {
  try {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  } catch (error) {    console.error('Error saving user data:', error);
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

// --- Custom Chord Helpers ---

export const addUserChord = (userData: UserData, newChordData: Omit<UserChord, 'id'>): { newUserData: UserData, newChord: UserChord } => {
    const newChord: UserChord = { ...newChordData, id: new Date().toISOString() + Math.random() };
    const newUserChords = [...userData.userChords, newChord];
    return {
        newUserData: { ...userData, userChords: newUserChords },
        newChord: newChord
    };
};

export const addUserChords = (userData: UserData, newChordsData: Omit<UserChord, 'id'>[]): { newUserData: UserData, newChords: UserChord[] } => {
    const newChordsWithIds: UserChord[] = newChordsData.map((chord, index) => ({
        ...chord,
        id: new Date().toISOString() + Math.random() + index
    }));
    const newUserChords = [...userData.userChords, ...newChordsWithIds];
    return {
        newUserData: { ...userData, userChords: newUserChords },
        newChords: newChordsWithIds
    };
};


export const deleteUserChord = (userData: UserData, chordId: string): UserData => {
    const newUserChords = userData.userChords.filter(c => c.id !== chordId);
    return { ...userData, userChords: newUserChords };
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