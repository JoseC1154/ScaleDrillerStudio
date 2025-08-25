


import { Note, Key, MusicKey, ScaleType, DrillSettings, DrillMode, TuningNote, TuningPreset, KeyTheme } from './types.ts';

export const ALL_NOTES: Note[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export const MUSIC_KEYS: MusicKey[] = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
export const KEYS: Key[] = [...MUSIC_KEYS, 'Random'];


export const SCALE_TYPES: ScaleType[] = ['Major', 'Minor'];

export const SCALE_FORMULAS: Record<ScaleType, number[]> = {
  Major: [2, 2, 1, 2, 2, 2, 1], // W-W-H-W-W-W-H
  Minor: [2, 1, 2, 2, 1, 2, 2], // W-H-W-W-H-W-W
};

// Standard tuning from thinnest string to thickest
export const GUITAR_TUNING: Note[] = ['E', 'B', 'G', 'D', 'A', 'E'];
export const BASS_TUNING: Note[] = ['G', 'D', 'A', 'E'];

export const DEGREE_NAMES: { [key: number]: string } = {
  1: '1st',
  2: '2nd',
  3: '3rd',
  4: '4th',
  5: '5th',
  6: '6th',
  7: '7th',
};

export const NASHVILLE_DEGREE_NAMES: {
  Major: { [key: number]: string };
  Minor: { [key: number]: string };
} = {
  Major: {
    1: '1',
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    7: '7',
  },
  Minor: {
    1: '1',
    2: '2',
    3: 'b3',
    4: '4',
    5: '5',
    6: 'b6',
    7: 'b7',
  },
};

export const DEFAULT_DRILL_SETTINGS: DrillSettings = {
  level: 1,
  key: 'C',
  scaleType: 'Major',
  drillMode: 'Key Conjurer',
  inputMethod: 'Touch',
  instrument: 'Piano',
  handedness: 'Right',
  bpm: 70,
  practiceKeys: ['C'],
  practiceDegrees: [1, 2, 3, 4, 5, 6, 7],
  totalBeats: 30,
  beatAward: 5,
  beatPenalty: 5,
  micSensitivity: 20,
  micGain: 1.5,
  micCompressionThreshold: -65,
  micCompressionRatio: 15,
  audioInputDeviceId: null,
  questionCount: 40,
  pianoShuffle: true,
};

export const INTERVALS: { [name: string]: number } = {
    'Minor 2nd': 1,
    'Major 2nd': 2,
    'Minor 3rd': 3,
    'Major 3rd': 4,
    'Perfect 4th': 5,
    'Tritone': 6,
    'Perfect 5th': 7,
    'Minor 6th': 8,
    'Major 6th': 9,
    'Minor 7th': 10,
    'Major 7th': 11,
};
export const INTERVAL_NAMES = Object.keys(INTERVALS);

export const INTERVAL_STEP_NAMES: Record<string, 'Whole' | 'Half'> = {
    'Minor 2nd': 'Half',
    'Major 2nd': 'Whole',
};

export const CHORD_TYPES: ('Major' | 'Minor')[] = ['Major', 'Minor'];
export const CHORD_FORMULAS: Record<'Major' | 'Minor', number[]> = {
    Major: [0, 4, 7], // Root, Major 3rd, Perfect 5th
    Minor: [0, 3, 7], // Root, Minor 3rd, Perfect 5th
};


export const LEVEL_KEYS: { [level: number]: MusicKey[] } = {
  1: ['C', 'G', 'F'],
  2: ['D', 'A', 'Bb', 'Eb'],
  3: ['E', 'B', 'F#', 'Db', 'Ab'],
  4: MUSIC_KEYS,
  5: MUSIC_KEYS,
};

export const LEVEL_MODES: { [level: number]: { mode: DrillMode, name: string }[] } = {
  1: [
    { mode: 'Key Conjurer', name: 'Note Discovery' },
    { mode: 'Galaxy Constructor', name: 'Galaxy Builder' },
    { mode: 'Degree Dash', name: 'Degree Dash' },
  ],
  2: [
    { mode: 'Note Professor', name: 'Note Professor' },
    { mode: 'Simon Memory Game', name: 'Simon Game' },
    { mode: 'Key Notes', name: 'Key Notes' },
    { mode: 'Scale Detective', name: 'Detective'},
    { mode: 'Practice', name: 'Practice' },
    { mode: 'Time Attack', name: 'Time Attack' },
    { mode: 'BPM Challenge', name: 'BPM' },
    { mode: 'Nashville Numbers', name: 'Nashville' },
    { mode: 'Degree Training', name: 'Degrees' },
  ],
  3: [
    { mode: 'Intervals', name: 'Intervals' }, 
    { mode: 'Chord Builder', name: 'Chords' },
    { mode: 'ScaleSweeper', name: 'Scale Sweeper' },
    { mode: 'Degree Dash Pro', name: 'Degree Dash Pro' },
  ],
  4: [
    { mode: 'Randomizer Roulette', name: 'Roulette' }
  ],
  5: [
      { mode: 'BPM Roulette', name: 'BPM Roulette' }
  ]
};

// --- Tuner Constants ---
export const GUITAR_STANDARD_TUNING_NOTES: TuningNote[] = [
  { note: 'E', octave: 4, frequency: 329.63 },
  { note: 'B', octave: 3, frequency: 246.94 },
  { note: 'G', octave: 3, frequency: 196.00 },
  { note: 'D', octave: 3, frequency: 146.83 },
  { note: 'A', octave: 2, frequency: 110.00 },
  { note: 'E', octave: 2, frequency: 82.41 },
];

export const BASS_STANDARD_TUNING_NOTES: TuningNote[] = [
  { note: 'G', octave: 2, frequency: 98.00 },
  { note: 'D', octave: 2, frequency: 73.42 },
  { note: 'A', octave: 1, frequency: 55.00 },
  { note: 'E', octave: 1, frequency: 41.20 },
];

export const TUNING_PRESETS: TuningPreset[] = [
    { name: 'Guitar Standard', notes: GUITAR_STANDARD_TUNING_NOTES },
    { name: 'Bass Standard', notes: BASS_STANDARD_TUNING_NOTES },
];

// --- Global Theming ---
export const DEFAULT_THEME: KeyTheme = {
    background: 'from-stone-800/80 to-stone-900/90',
    foreground: 'text-stone-200',
    accent: 'text-orange-400',
};

export const KEY_THEMES: Record<MusicKey, KeyTheme> = {
    'C':  { background: 'from-white/20 to-yellow-100/20', foreground: 'text-stone-100', accent: 'text-yellow-400' },
    'G':  { background: 'from-orange-500/20 to-orange-300/20', foreground: 'text-stone-100', accent: 'text-orange-300' },
    'D':  { background: 'from-sky-500/20 to-sky-300/20', foreground: 'text-stone-100', accent: 'text-sky-300' },
    'A':  { background: 'from-red-600/20 to-red-400/20', foreground: 'text-stone-100', accent: 'text-red-400' },
    'E':  { background: 'from-purple-600/20 to-purple-400/20', foreground: 'text-stone-100', accent: 'text-purple-400' },
    'B':  { background: 'from-emerald-500/20 to-emerald-300/20', foreground: 'text-stone-100', accent: 'text-emerald-300' },
    'F#': { background: 'from-pink-500/20 to-pink-300/20', foreground: 'text-stone-100', accent: 'text-pink-300' },
    'Db': { background: 'from-slate-400/20 to-slate-200/20', foreground: 'text-stone-100', accent: 'text-slate-300' },
    'Ab': { background: 'from-indigo-600/20 to-indigo-400/20', foreground: 'text-stone-100', accent: 'text-indigo-400' },
    'Eb': { background: 'from-amber-500/20 to-amber-300/20', foreground: 'text-stone-100', accent: 'text-amber-300' },
    'Bb': { background: 'from-blue-700/20 to-blue-500/20', foreground: 'text-stone-100', accent: 'text-blue-400' },
    'F':  { background: 'from-green-700/20 to-green-500/20', foreground: 'text-stone-100', accent: 'text-green-400' },
};