


import { ALL_NOTES, SCALE_FORMULAS, DEGREE_NAMES, MUSIC_KEYS, NASHVILLE_DEGREE_NAMES, INTERVALS, INTERVAL_NAMES, CHORD_TYPES, CHORD_FORMULAS, SCALE_TYPES } from '../constants.ts';
import { Note, MusicKey, ScaleType, Scale, Question, FretboardNote, DrillSettings, PerformanceData, DrillMode, TuningNote, Key } from '../types.ts';

const getNoteIndex = (note: Note): number => ALL_NOTES.indexOf(note);

const getNoteFromIndex = (index: number): Note => ALL_NOTES[index % ALL_NOTES.length];

export const getScale = (key: MusicKey, scaleType: ScaleType): Scale => {
  const rootIndex = getNoteIndex(key);
  const formula = SCALE_FORMULAS[scaleType];
  const scaleNotes: Note[] = [key];
  let currentIndex = rootIndex;

  for (const interval of formula.slice(0, -1)) {
    currentIndex += interval;
    scaleNotes.push(getNoteFromIndex(currentIndex));
  }
  
  return { key, type: scaleType, notes: scaleNotes };
};

export const getIntervalSequenceForScale = (scaleType: ScaleType): string[] => {
    const formula = SCALE_FORMULAS[scaleType];
    const semitoneToIntervalName = Object.fromEntries(Object.entries(INTERVALS).map(([name, semitones]) => [semitones, name]));
    return formula.map(semitones => semitoneToIntervalName[semitones]).filter(Boolean);
};


export const getDegreeFromNote = (note: Note, scale: Scale): number | null => {
    const degreeIndex = scale.notes.indexOf(note);
    if (degreeIndex !== -1) {
        return degreeIndex + 1;
    }
    return null;
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getNoteNameFromUniqueId = (id: string | null): MusicKey => {
    return (id ? id.replace(/-?\d.*$/, '') : 'C') as MusicKey;
}

const getWeightedRandom = <T,>(items: T[], performanceData: Record<string | number, {correct: number, incorrect: number}>, keyExtractor: (item: T) => string | number): T => {
    if (items.length === 0) throw new Error("Cannot select from an empty array.");
    if (items.length === 1) return items[0];

    const weights = items.map(item => {
        const key = keyExtractor(item);
        const stat = performanceData[key] || { correct: 0, incorrect: 0 };
        return (stat.incorrect + 1) / (stat.correct + 1);
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return items[i];
        }
    }

    return items[items.length - 1]; // Fallback
};

const noteAnecdotes: Record<Note, string[]> = {
    'C': [
        "C is often the first note musicians learn. On a piano, find the white key just to the left of any group of two black keys.",
        "This is Middle C, the center of the piano and the anchor for musical notation. A truly foundational note!"
    ],
    'Db': [
        "This is D-flat, also known as C-sharp. It's the black key between C and D. It adds a bit of spice, doesn't it?",
        "Fun fact: The key of D-flat Major is a favorite of composers like Chopin for its warm, rich sound on the piano."
    ],
    'D': [
        "This is D. It sits right between the two black keys. A very common and strong-sounding note.",
        "The note D is often associated with triumph and celebration. Many fanfares and royal marches start on D!"
    ],
    'Eb': [
        "E-flat, or D-sharp. This black key has a soulful, bluesy feel. Find it between D and E.",
        "Mozart's famous Symphony No. 39 is in E-flat major, showcasing its noble and grand character."
    ],
    'E': [
        "Here's E, the white key to the right of the two-black-key group. It has a bright, clear sound.",
        "The lowest note on a standard-tuned guitar is E. It's a cornerstone of rock and folk music."
    ],
    'F': [
        "Let's find F. It's the white key just to the left of the group of three black keys. A great landmark!",
        "The French Horn, a majestic orchestral instrument, is naturally pitched in the key of F."
    ],
    'F#': [
        "F-sharp, also called G-flat. It's the first black key in the group of three. It can sound mysterious or exciting.",
        "Many dramatic film scores use the key of F-sharp minor to create a sense of tension and adventure."
    ],
    'G': [
        "This is G, nestled between the first two black keys of the three-key group. A very versatile note.",
        "The 'G-clef' or treble clef, which most melodies are written in, curls around the G line on the musical staff."
    ],
    'Ab': [
        "A-flat, or G-sharp. The middle black key in the group of three. It has a dark, romantic quality.",
        "Beethoven's famous 'Pathétique' Sonata begins with a powerful, somber chord in a key that heavily features A-flat."
    ],
    'A': [
        "Here is A. It's found between the second and third black keys of the three-key group.",
        "Orchestras all tune to the note A (specifically A4 at 440 Hz) before a performance to ensure everyone is playing in harmony."
    ],
    'Bb': [
        "B-flat, or A-sharp. The last black key in the group of three. It's a staple in jazz and blues music.",
        "Many wind instruments, like the clarinet and trumpet, are 'B-flat instruments', meaning a written C for them sounds like a B-flat."
    ],
    'B': [
        "And finally, B. The white key to the very right of the three-black-key group, right before the next C.",
        "The note B is often used to create a feeling of suspense or longing, as it's just one half-step away from resolving to C."
    ]
};

export const generateDrillQuestions = (
  settings: Pick<DrillSettings, 'key' | 'scaleType' | 'drillMode' | 'practiceKeys' | 'practiceDegrees' | 'questionCount'>,
  performance?: PerformanceData
): Question[] => {
  const { drillMode, questionCount } = settings;
  
  const keysToUse: MusicKey[] = (settings.practiceKeys && settings.practiceKeys.length > 0 
      ? settings.practiceKeys
      : MUSIC_KEYS) as MusicKey[];

  const isPracticeMode = ['Practice', 'Nashville Numbers', 'Degree Training', 'Intervals', 'Chord Builder', 'Galaxy Constructor'].includes(drillMode);

  const getRandomKey = (): MusicKey => {
      if (isPracticeMode && performance) {
          return getWeightedRandom(keysToUse, performance.byKey, k => k);
      }
      return keysToUse[Math.floor(Math.random() * keysToUse.length)];
  };
  
  if (drillMode === 'Key Conjurer') {
    const notesToIdentify = shuffleArray([...ALL_NOTES]);
    return notesToIdentify.slice(0, questionCount).map((note, i) => ({
      id: i,
      prompt: "What note is this?",
      correctAnswers: [note],
      key: 'C', // Not relevant, but required by type
      scaleType: 'Major',
      drillMode: 'Key Conjurer',
    }));
  }

  if (drillMode === 'Note Professor') {
    const questions: Question[] = [];
    const notesToTeach = ALL_NOTES; // Teach in chromatic order C, Db, D...

    for (let i = 0; i < notesToTeach.length; i++) {
        const note = notesToTeach[i];
        const anecdotes = noteAnecdotes[note];
        const anecdote = anecdotes[Math.floor(Math.random() * anecdotes.length)];
        
        questions.push({
            id: i,
            prompt: `Professor says: "${anecdote}" Now, find a ${note}.`,
            correctAnswers: [note],
            key: 'C', // Not relevant, but required by type
            scaleType: 'Major', // Not relevant
            drillMode: 'Note Professor',
        });
    }
    return questions;
  }

  if (drillMode === 'ScaleSweeper') {
        const questionKey = getRandomKey();
        const scaleType = settings.scaleType === 'Major' || settings.scaleType === 'Minor' ? settings.scaleType : 'Major';
        const scale = getScale(questionKey, scaleType);
        
        return [{
            id: 0,
            prompt: `Sweep for the ${questionKey} ${scaleType} scale`,
            correctAnswers: scale.notes,
            key: questionKey,
            scaleType,
            drillMode,
        }];
  }

  if (drillMode === 'Simon Memory Game') {
      const questionKey = getRandomKey();
      const scaleType = 'Major';
      const scale = getScale(questionKey, scaleType);
      
      return [{
          id: 0,
          prompt: `Memorize the sequence from ${questionKey} ${scaleType}`,
          correctAnswers: scale.notes,
          key: questionKey,
          scaleType,
          drillMode: 'Simon Memory Game',
      }];
  } else {
    const questions: Question[] = [];
    for (let i = 0; i < questionCount; i++) {
      let questionKey: MusicKey;
      if (settings.key && settings.key !== 'Random') {
        questionKey = settings.key;
      } else {
        questionKey = getRandomKey();
      }
      
      let rootUniqueId: string | undefined = questionKey;
      let scaleType = settings.scaleType;

      if ((!settings.practiceKeys || settings.practiceKeys.length === 0) && ['Time Attack', 'Key Notes', 'BPM Challenge', 'BPM Roulette', 'Scale Detective'].includes(drillMode)) {
        scaleType = SCALE_TYPES[Math.floor(Math.random() * SCALE_TYPES.length)];
      }
      
      let question: Question | null = null;
      let currentDrillMode = drillMode;
      
      if (drillMode === 'Randomizer Roulette' || drillMode === 'BPM Roulette') {
          const availableModes: ('Degree Training' | 'Nashville Numbers' | 'Intervals' | 'Chord Builder')[] = ['Degree Training', 'Nashville Numbers', 'Intervals', 'Chord Builder'];
          currentDrillMode = availableModes[Math.floor(Math.random() * availableModes.length)];
      }

      switch(currentDrillMode) {
        case 'Key Notes': {
          const scale = getScale(questionKey, scaleType);
          question = {
            id: i,
            prompt: `Find all notes in ${questionKey} ${scaleType}`,
            correctAnswers: scale.notes,
            key: questionKey,
            scaleType,
            drillMode: currentDrillMode,
          };
          break;
        }
        case 'Galaxy Constructor': {
            const scale = getScale(questionKey, scaleType);
            question = {
                id: i,
                prompt: `Construct the ${questionKey} ${scaleType} Galaxy`,
                correctAnswers: scale.notes,
                key: questionKey,
                scaleType,
                drillMode: currentDrillMode,
            };
            break;
        }
        case 'Chord Builder': {
          const rootNote = questionKey;
          const chordType = performance ? getWeightedRandom(CHORD_TYPES, performance.byChord, t => t) : CHORD_TYPES[Math.floor(Math.random() * CHORD_TYPES.length)];
          const formula = CHORD_FORMULAS[chordType];
          const rootIndex = getNoteIndex(rootNote);
          const chordNotes = formula.map(interval => getNoteFromIndex(rootIndex + interval));

          question = {
            id: i,
            prompt: `Build the ${rootNote} ${chordType} chord`,
            correctAnswers: chordNotes,
            key: rootNote,
            scaleType,
            chordType,
            drillMode: currentDrillMode,
            rootUniqueId
          };
          break;
        }
        case 'Scale Detective': {
          const scale = getScale(questionKey, scaleType);
          const missingNoteIndex = Math.floor(Math.random() * scale.notes.length);
          const missingNote = scale.notes[missingNoteIndex];
          const contextNotes = scale.notes.filter((_, index) => index !== missingNoteIndex);

          question = {
              id: i,
              prompt: 'Find the missing note in the scale.',
              correctAnswers: [missingNote],
              contextNotes: contextNotes,
              key: questionKey,
              scaleType: scaleType,
              drillMode: currentDrillMode,
          };
          break;
        }
        case 'Intervals': {
          const rootNote = questionKey;
          const intervalName = performance ? getWeightedRandom(INTERVAL_NAMES, performance.byInterval, name => name) : INTERVAL_NAMES[Math.floor(Math.random() * INTERVAL_NAMES.length)];
          const semitones = INTERVALS[intervalName];
          const rootIndex = getNoteIndex(rootNote);
          const intervalNote = getNoteFromIndex(rootIndex + semitones);

          question = {
            id: i,
            prompt: `Play the ${intervalName} of ${rootNote}`,
            correctAnswers: [intervalNote],
            key: rootNote,
            scaleType,
            intervalName,
            drillMode: currentDrillMode,
            rootUniqueId
          };
          break;
        }
        default: { // All single-note degree modes, including Degree Dash
          const scale = getScale(questionKey, scaleType);
          const degreesToPractice = 
            (currentDrillMode === 'Degree Training' && settings.practiceDegrees && settings.practiceDegrees.length > 0)
            ? settings.practiceDegrees
            : Array.from({ length: 7 }, (_, i) => i + 1);

          const degree = performance ? getWeightedRandom(degreesToPractice, performance.byDegree, d => d) : degreesToPractice[Math.floor(Math.random() * degreesToPractice.length)];
          const correctAnswer = scale.notes[degree - 1];

          let promptText: string;
          if (currentDrillMode === 'Nashville Numbers') {
              const degreeName = NASHVILLE_DEGREE_NAMES[scaleType][degree];
              promptText = `Play the ${degreeName} of ${questionKey} ${scaleType}`;
          } else { // Catches Practice, Degree Training, Degree Dash, Degree Dash Pro
              promptText = `Play the ${DEGREE_NAMES[degree]} of ${questionKey} ${scaleType}`;
          }

          question = {
            id: i,
            prompt: promptText,
            degree,
            correctAnswers: [correctAnswer],
            key: questionKey,
            scaleType,
            drillMode: currentDrillMode,
            rootUniqueId
          };
          break;
        }
      }
      if (question) {
        questions.push(question);
      }
    }

    return shuffleArray(questions);
  }
};

export const getFretboardNotes = (tuning: Note[], fretCount: number = 12): FretboardNote[] => {
    const notes: FretboardNote[] = [];
    tuning.forEach((openNote, stringIndex) => {
        const openNoteIndex = getNoteIndex(openNote);
        for (let fret = 0; fret <= fretCount; fret++) {
            const noteIndex = openNoteIndex + fret;
            notes.push({
                note: getNoteFromIndex(noteIndex),
                string: stringIndex,
                fret: fret
            });
        }
    });
    return notes;
};

export const frequencyToNote = (frequency: number): { note: Note, octave: number, centsOff: number } | null => {
    if (frequency <= 0) return null;
    
    const A4 = 440;
    const A4_INDEX = getNoteIndex('A');
    const semitonesFromA4 = 12 * Math.log2(frequency / A4);
    const noteIndexRaw = A4_INDEX + semitonesFromA4;
    const roundedNoteIndex = Math.round(noteIndexRaw);
    
    const centsOff = Math.round(100 * (noteIndexRaw - roundedNoteIndex));
    
    const octave = Math.floor(roundedNoteIndex / 12) + 4;
    const note = getNoteFromIndex(roundedNoteIndex);

    return { note, octave, centsOff };
};

// --- Tuner Helpers ---
export const getCentsOff = (freq: number, targetFreq: number): number => {
    if (freq <= 0 || targetFreq <= 0) return 0;
    return 1200 * Math.log2(freq / targetFreq);
};

export const getClosestNote = (
    frequency: number,
    tuningNotes: TuningNote[]
): { note: TuningNote; cents: number } | null => {
    if (frequency <= 0 || !tuningNotes || tuningNotes.length === 0) return null;

    let closestNote: TuningNote | null = null;
    let smallestDifference = Infinity;

    for (const targetNote of tuningNotes) {
        const centsOff = getCentsOff(frequency, targetNote.frequency);
        const absDifference = Math.abs(centsOff);

        if (absDifference < smallestDifference) {
            smallestDifference = absDifference;
            closestNote = targetNote;
        }
    }

    // Only return a match if it's within a reasonable range (e.g., a bit more than a semitone)
    // to avoid matching very distant notes. ~70 cents is a good threshold.
    if (closestNote && smallestDifference < 70) {
        const finalCentsOff = getCentsOff(frequency, closestNote.frequency);
        return { note: closestNote, cents: finalCentsOff };
    }

    return null;
};


// --- Unique Note ID Helpers ---

// Converts a unique note ID like 'C4' or 'F#3' to a MIDI number
const noteIdToMidi = (noteId: string): number => {
    const match = noteId.match(/([A-G][b#]?)(-?\d+)/);
    if (!match) return 0;
    const [, noteName, octaveStr] = match;
    const octave = parseInt(octaveStr, 10);
    const noteIndex = ALL_NOTES.indexOf(noteName as Note);
    return (octave + 1) * 12 + noteIndex;
};

// Converts a MIDI number to a unique note ID like 'C4'
const midiToNoteId = (midiNumber: number): string => {
    const noteName = ALL_NOTES[midiNumber % 12];
    const octave = Math.floor(midiNumber / 12) - 1;
    return `${noteName}${octave}`;
};

/**
 * Calculates the concrete, unique answers (e.g., ['G4']) for a given question
 * based on its abstract correct answers (e.g., ['G']) and its root context.
 */
export const getUniqueAnswersForQuestion = (question: Question): string[] => {
    if (!question.rootUniqueId || !/\d/.test(question.rootUniqueId)) {
        // For non-octave-specific questions, or questions where the root is just a note name,
        // the answers are just the note names.
        return question.correctAnswers;
    }
    
    const rootMidi = noteIdToMidi(question.rootUniqueId);
    const rootNoteName = getNoteNameFromUniqueId(question.rootUniqueId);
    const rootNoteIndex = ALL_NOTES.indexOf(rootNoteName);

    return question.correctAnswers.map(answerNoteName => {
        const answerNoteIndex = ALL_NOTES.indexOf(answerNoteName as Note);
        let semitoneDifference = answerNoteIndex - rootNoteIndex;
        // Adjust for notes that cross the octave boundary (e.g., root is B, answer is C)
        if (semitoneDifference < -6) { // Heuristic: if more than a tritone away, it's probably the next octave up
            semitoneDifference += 12;
        } else if (semitoneDifference > 6) { // Heuristic: if more than a tritone away down, it's the octave down
            semitoneDifference -= 12;
        }
        const targetMidi = rootMidi + semitoneDifference;
        return midiToNoteId(targetMidi);
    });
};