
import { ALL_NOTES, GUITAR_STANDARD_TUNING_NOTES, BASS_STANDARD_TUNING_NOTES } from '../constants.ts';
import { Instrument, Note } from '../types.ts';

let audioContext: AudioContext;
const getAudioContext = () => {
    if (!audioContext || audioContext.state === 'closed') {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // For iOS and some browsers, audio context might be suspended until a user interaction.
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return audioContext;
};

const noteToMidi = (noteName: Note, octave: number): number => {
    const noteIndex = ALL_NOTES.indexOf(noteName as Note);
    // MIDI note number formula: 12 * (octave + 1) + note_index
    return (octave + 1) * 12 + noteIndex;
}

const midiToFrequency = (midiNumber: number): number => {
    // A4 = 440 Hz = MIDI note 69
    return 440 * Math.pow(2, (midiNumber - 69) / 12);
}

const getMidiForPianoKey = (uniqueId: string): number | null => {
    const match = uniqueId.match(/([A-G][b#]?)(-?\d+)/);
    if (!match) return null;
    const [, noteName, octaveStr] = match;
    return noteToMidi(noteName as Note, parseInt(octaveStr, 10));
}

const getMidiForFret = (uniqueId: string, instrument: Instrument): number | null => {
    const parts = uniqueId.split('-');
    if (parts.length !== 3) return null;
    const [, stringIndexStr, fretStr] = parts;
    const stringIndex = parseInt(stringIndexStr, 10);
    const fret = parseInt(fretStr, 10);

    const tuning = instrument === 'Guitar' ? GUITAR_STANDARD_TUNING_NOTES : BASS_STANDARD_TUNING_NOTES;
    if (stringIndex < 0 || stringIndex >= tuning.length) return null;

    const openStringNote = tuning[stringIndex];
    const openStringMidi = noteToMidi(openStringNote.note, openStringNote.octave);
    
    return openStringMidi + fret;
}

export const playNoteSound = (uniqueId: string, instrument: Instrument) => {
    try {
        const context = getAudioContext();
        let midiNumber: number | null = null;

        if (instrument === 'Piano') {
            midiNumber = getMidiForPianoKey(uniqueId);
        } else if (instrument === 'Guitar' || instrument === 'Bass') {
            midiNumber = getMidiForFret(uniqueId, instrument);
        }

        if (midiNumber === null) {
            console.warn(`Could not determine MIDI number for note: ${uniqueId}`);
            return;
        }
        
        const fundamentalFreq = midiToFrequency(midiNumber);
        
        const masterGain = context.createGain();
        masterGain.connect(context.destination);

        // --- Additive synthesis for a sweeter, matching tone ---
        const harmonicRatios = [1, 2]; // Fundamental and octave
        const harmonicGains = [1, 0.4]; // Octave is softer

        harmonicRatios.forEach((ratio, index) => {
            const osc = context.createOscillator();
            osc.type = 'sine'; // Use pure sine waves to match sustained note
            osc.frequency.value = fundamentalFreq * ratio;
            
            const oscGain = context.createGain();
            oscGain.gain.value = harmonicGains[index] || 0;
            
            osc.connect(oscGain);
            oscGain.connect(masterGain);
            
            osc.start(context.currentTime);
            // The main envelope is on the masterGain, so we just stop the oscillators
            osc.stop(context.currentTime + 1.0); // Stop after 1 second
        });

        // --- Softer, more gentle percussive envelope ---
        const now = context.currentTime;
        const peakGain = 0.08; // Significantly reduced from 0.15
        const attackTime = 0.015; // A very quick but not instant attack
        const decayTime = 0.8; // A nice long, gentle decay

        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(peakGain, now + attackTime);
        masterGain.gain.exponentialRampToValueAtTime(0.00001, now + attackTime + decayTime);

    } catch (e) {
        console.error("Failed to play note sound:", e);
    }
}