

export type Note = 'C' | 'Db' | 'D' | 'Eb' | 'E' | 'F' | 'F#' | 'G' | 'Ab' | 'A' | 'Bb' | 'B';
export type MusicKey = 'C' | 'G' | 'D' | 'A' | 'E' | 'B' | 'F#' | 'Db' | 'Ab' | 'Eb' | 'Bb' | 'F';
export type Key = MusicKey | 'Random';
export type ScaleType = 'Major' | 'Minor';
export type DrillMode = 'Key Conjurer' | 'Note Professor' | 'Practice' | 'Time Attack' | 'BPM Challenge' | 'Nashville Numbers' | 'Degree Training' | 'Key Notes' | 'Intervals' | 'Scale Detective' | 'Chord Builder' | 'Randomizer Roulette' | 'BPM Roulette' | 'Simon Memory Game' | 'Galaxy Constructor' | 'ScaleSweeper' | 'Degree Dash' | 'Degree Dash Pro';
export type InputMethod = 'Touch' | 'MIDI' | 'Mic';
export type Instrument = 'Piano' | 'Guitar' | 'Bass';
export type Handedness = 'Right' | 'Left';
export type ActiveView = 'drill' | 'report' | 'guide' | 'tuner' | 'chord' | 'dictionary';
export type SweeperPhase = 'discovery' | 'time_attack' | 'intermission';
export type DegreeDashPhase = 'fill_in' | 'timed_finale' | 'intermission';
export type DeviceType = 'mobile' | 'desktop';
export type NoteDiscoveryRound = 1 | 2 | 3 | 4 | 5;
export type QuizPhase = 'loading' | 'info' | 'countdown' | 'active' | 'animation' | 'intermission' | 'pre-round-animation';
export type VoicingType = 'close' | 'spread' | 'open';

export type ChordTypeName =
  // Dyads
  | 'Power Chord' | 'Perfect Fifth' | 'Major Third Dyad' | 'Minor Third Dyad'
  // Triads
  | 'Major' | 'Minor' | 'Diminished' | 'Augmented'
  | 'Suspended 2' | 'Suspended 4' | 'Flat Five'
  // Sevenths
  | 'Dominant 7th' | 'Major 7th' | 'Minor 7th'
  | 'Minor Major 7th' | 'Diminished 7th' | 'Half-Diminished 7th'
  | 'Augmented 7th' | 'Augmented Major 7th'
  // Extended
  | 'Major 6th' | 'Minor 6th'
  | 'Dominant 9th' | 'Major 9th' | 'Minor 9th'
  | 'Dominant 11th' | 'Major 11th' | 'Minor 11th'
  | 'Dominant 13th' | 'Major 13th' | 'Minor 13th'
  // Altered
  | 'Dominant 7th b5' | 'Dominant 7th #5' | 'Dominant 7th b9' | 'Dominant 7th #9' | 'Altered Dominant'
  // Added
  | 'add2' | 'add9' | 'add11' | 'Major 6th/9th'
  // Special
  | 'Quartal';

export interface DrillSettings {
  level: number;
  key: Key;
  scaleType: ScaleType;
  drillMode: DrillMode;
  inputMethod: InputMethod;
  instrument: Instrument;
  handedness: Handedness;
  bpm: number; 
  practiceKeys: Note[];
  practiceDegrees: number[]; // For Degree Training mode
  totalBeats: number;
  beatAward: number;
  beatPenalty: number;
  micSensitivity: number; // for Mic input gate
  micGain: number;
  micCompressionThreshold: number;
  micCompressionRatio: number;
  audioInputDeviceId: string | null;
  questionCount: number; // Added to standardize drill length
  pianoShuffle: boolean;
}

export interface Scale {
  key: MusicKey;
  type: ScaleType;
  notes: Note[];
}

export interface Question {
  id: number;
  prompt: string;
  degree?: number;
  correctAnswers: string[]; // For Simon Memory Game, this is the pool of notes
  contextNotes?: Note[];
  key: MusicKey;
  scaleType: ScaleType;
  intervalName?: string;
  chordType?: 'Major' | 'Minor';
  drillMode: DrillMode;
  rootUniqueId?: string; // Optional: provides octave context for specific challenges
}

export interface FretboardNote {
  note: Note;
  string: number;
  fret: number;
}

// --- Tuner Types ---
export interface TuningNote {
  note: Note;
  octave: number;
  frequency: number;
}

export interface TuningPreset {
  name: string;
  notes: TuningNote[];
}

// --- Chord Types ---
export interface ChordDefinition {
  name: ChordTypeName;
  symbol: string;
  formula: number[]; // semitones from root
}

export interface Chord {
  root: Note;
  name: string; // e.g., "C Major 7th" or a custom name
  notes: Note[]; // Note names like 'C', 'E', 'G' for display
  intervals: string[];
}

export interface UserChord {
    id: string;
    name: string;
    notes: string[]; // Unique IDs like "C4", "E4", "G4" to preserve voicing
}

export interface InstanceState {
  instrument: Instrument;
  transpose: number;
  octaveShift: number;
  inversion: number;
  voicing: VoicingType;
  playbackStyle: 'arpeggio' | 'box';
  playbackNoteDuration: '1/4' | '1/2' | '4/4';
}

export interface SuggestedChord {
    name: string; // e.g., "G7"
    root: Note;
    type: ChordTypeName;
}


// --- User Data and Performance Tracking ---

export interface PerformanceStat {
  correct: number;
  incorrect: number;
}

export interface PerformanceData {
  byKey: Partial<Record<MusicKey, PerformanceStat>>;
  byScale: Partial<Record<ScaleType, PerformanceStat>>;
  byDegree: Partial<Record<number, PerformanceStat>>;
  byInterval: Partial<Record<string, PerformanceStat>>;
  byChord: Partial<Record<'Major' | 'Minor', PerformanceStat>>;
  byDrillMode: Partial<Record<DrillMode, PerformanceStat>>;
}

export interface UserData {
  unlockedLevel: number;
  isKeySelectionUnlocked: boolean;
  performance: PerformanceData;
  unlockedModes: DrillMode[];
  preDrillInfoSeen: Partial<Record<DrillMode, boolean>>;
  simonHighScore: number;
  hasCompletedTutorial: boolean;
  userChords: UserChord[];
  recentChords: string[]; // e.g., "C-Maj7"
  isQuietMode: boolean;
}

export interface PerformanceUpdate {
  key?: MusicKey;
  scaleType?: ScaleType;
  degree?: number;
  intervalName?: string;
  chordType?: 'Major' | 'Minor';
  isCorrect: boolean;
  rootUniqueId?: string;
  drillMode?: DrillMode;
}

export interface DrillCompletionResult {
    score: number;
    totalQuestions: number;
    level: number;
    success: boolean;
    drillMode: DrillMode;
    bpmLevel?: number;
}