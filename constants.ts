

import { Note, Key, MusicKey, ScaleType, DrillSettings, DrillMode, TuningNote, TuningPreset, ChordTypeName, ChordDefinition } from './types';

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

export const CHORD_DEFINITIONS: Record<ChordTypeName, Omit<ChordDefinition, 'name'>> = {
  // --- Dyads ---
  'Power Chord': { symbol: '5', formula: [0, 7] },
  'Perfect Fifth': { symbol: 'P5', formula: [0, 7] },
  'Major Third Dyad': { symbol: 'M3', formula: [0, 4] },
  'Minor Third Dyad': { symbol: 'm3', formula: [0, 3] },
  
  // --- Triads ---
  'Major': { symbol: '', formula: [0, 4, 7] },
  'Minor': { symbol: 'm', formula: [0, 3, 7] },
  'Diminished': { symbol: 'dim', formula: [0, 3, 6] },
  'Augmented': { symbol: 'aug', formula: [0, 4, 8] },
  'Suspended 2': { symbol: 'sus2', formula: [0, 2, 7] },
  'Suspended 4': { symbol: 'sus4', formula: [0, 5, 7] },
  'Flat Five': { symbol: 'b5', formula: [0, 4, 6] },

  // --- Sevenths ---
  'Dominant 7th': { symbol: '7', formula: [0, 4, 7, 10] },
  'Major 7th': { symbol: 'Maj7', formula: [0, 4, 7, 11] },
  'Minor 7th': { symbol: 'm7', formula: [0, 3, 7, 10] },
  'Minor Major 7th': { symbol: 'm(Maj7)', formula: [0, 3, 7, 11] },
  'Diminished 7th': { symbol: 'dim7', formula: [0, 3, 6, 9] },
  'Half-Diminished 7th': { symbol: 'm7b5', formula: [0, 3, 6, 10] },
  'Augmented 7th': { symbol: 'aug7', formula: [0, 4, 8, 10] },
  'Augmented Major 7th': { symbol: 'Maj7#5', formula: [0, 4, 8, 11] },
  
  // --- Added Tone ---
  'Major 6th': { symbol: '6', formula: [0, 4, 7, 9] },
  'Minor 6th': { symbol: 'm6', formula: [0, 3, 7, 9] },
  'add2': { symbol: 'add2', formula: [0, 2, 4, 7] },
  'add9': { symbol: 'add9', formula: [0, 4, 7, 14] },
  'add11': { symbol: 'add11', formula: [0, 4, 7, 17] },
  'Major 6th/9th': { symbol: '6/9', formula: [0, 4, 7, 9, 14] },

  // --- Extended ---
  'Dominant 9th': { symbol: '9', formula: [0, 4, 7, 10, 14] },
  'Major 9th': { symbol: 'Maj9', formula: [0, 4, 7, 11, 14] },
  'Minor 9th': { symbol: 'm9', formula: [0, 3, 7, 10, 14] },
  'Dominant 11th': { symbol: '11', formula: [0, 4, 7, 10, 14, 17] },
  'Major 11th': { symbol: 'Maj11', formula: [0, 4, 7, 11, 14, 17] },
  'Minor 11th': { symbol: 'm11', formula: [0, 3, 7, 10, 14, 17] },
  'Dominant 13th': { symbol: '13', formula: [0, 4, 7, 10, 14, 21] },
  'Major 13th': { symbol: 'Maj13', formula: [0, 4, 7, 11, 14, 21] },
  'Minor 13th': { symbol: 'm13', formula: [0, 3, 7, 10, 14, 21] },
  
  // --- Altered ---
  'Dominant 7th b5': { symbol: '7b5', formula: [0, 4, 6, 10] },
  'Dominant 7th #5': { symbol: '7#5', formula: [0, 4, 8, 10] },
  'Dominant 7th b9': { symbol: '7b9', formula: [0, 4, 7, 10, 13] },
  'Dominant 7th #9': { symbol: '7#9', formula: [0, 4, 7, 10, 15] },
  'Altered Dominant': { symbol: '7alt', formula: [0, 4, 6, 10, 13] }, // R, 3, b5, b7, b9

  // --- Special ---
  'Quartal': { symbol: 'quartal', formula: [0, 5, 10] },
};

export const CHORD_TYPE_NAMES = Object.keys(CHORD_DEFINITIONS) as ChordTypeName[];


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
    { mode: 'Degree Dash Pro', name: 'Degree Dash Pro' }
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