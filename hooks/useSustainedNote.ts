import { useRef, useCallback, useEffect } from 'react';
import { Instrument, Note } from '../types';
import { ALL_NOTES, GUITAR_STANDARD_TUNING_NOTES, BASS_STANDARD_TUNING_NOTES } from '../constants';
import { getAudioContext } from '../services/sound';

// --- Frequency Calculation Helpers (self-contained to avoid complex dependencies) ---

const noteToMidi = (noteName: Note, octave: number): number => {
    const noteIndex = ALL_NOTES.indexOf(noteName as Note);
    return (octave + 1) * 12 + noteIndex;
}

const midiToFrequency = (midiNumber: number): number => {
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

const getFrequencyForNoteId = (uniqueId: string, instrument: Instrument): number | null => {
    let midiNumber: number | null = null;
    if (instrument === 'Piano') {
        midiNumber = getMidiForPianoKey(uniqueId);
    } else if (instrument === 'Guitar' || instrument === 'Bass') {
        midiNumber = getMidiForFret(uniqueId, instrument);
    }
    if (midiNumber === null) return null;
    return midiToFrequency(midiNumber);
}


/**
 * Manages a sustained Web Audio API note with a proper ADSR envelope.
 * Ensures only one note is sustained at a time (monophonic).
 * @param instrument The current instrument, used for frequency calculation.
 */
export const useSustainedNote = (instrument: Instrument, isQuietMode?: boolean) => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorsRef = useRef<OscillatorNode[]>([]);
    const masterGainNodeRef = useRef<GainNode | null>(null);

    const stopNote = useCallback((fadeDuration = 0.4) => {
        const context = audioContextRef.current;
        const gainNode = masterGainNodeRef.current;
        const oscillators = oscillatorsRef.current;
        if (context && gainNode && oscillators.length > 0) {
            const now = context.currentTime;
            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.setTargetAtTime(0, now, fadeDuration / 4);
            
            oscillators.forEach(osc => {
                try {
                    osc.stop(now + fadeDuration);
                } catch(e) {
                    // It's fine if the oscillator is already stopped.
                }
            });

            oscillatorsRef.current = [];
            masterGainNodeRef.current = null;
        }
    }, []);

    const playNote = useCallback(async (noteId: string) => {
        if (isQuietMode) return;
        stopNote(0.1); // Stop previous note very quickly

        const fundamentalFreq = getFrequencyForNoteId(noteId, instrument);
        if (fundamentalFreq === null) return;
        
        const context = await getAudioContext();
        if (!context) return;

        audioContextRef.current = context; // Store the context for stopNote to use

        const masterGain = context.createGain();
        masterGain.connect(context.destination);

        // --- Sweeter, Softer Harmonics ---
        // Fundamental and an octave for a pure, sweet sound.
        const harmonicRatios = [1, 2];
        const harmonicGains = [1, 0.4];
        
        const activeOscillators: OscillatorNode[] = [];

        harmonicRatios.forEach((ratio, index) => {
            const osc = context.createOscillator();
            const gain = context.createGain();
            
            osc.connect(gain);
            gain.connect(masterGain);
            
            osc.type = 'sine';
            osc.frequency.value = fundamentalFreq * ratio;
            
            gain.gain.value = harmonicGains[index] || 0;
            
            osc.start(context.currentTime);
            activeOscillators.push(osc);
        });

        // --- Feathered, Lower Volume Sustain Envelope ---
        const now = context.currentTime;
        const peakGain = 0.04; // Lowered for a softer undertone
        const attackTimeConstant = 0.02; // Slightly longer feather-in time

        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.setTargetAtTime(peakGain, now, attackTimeConstant);

        oscillatorsRef.current = activeOscillators;
        masterGainNodeRef.current = masterGain;

    }, [instrument, stopNote, isQuietMode]);
    
    // Cleanup audio resources when the component unmounts
    useEffect(() => {
        return () => {
            stopNote(0.01); // Stop immediately
        }
    }, [stopNote]);

    return { playNote, stopNote };
}