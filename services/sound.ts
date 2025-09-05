import { Instrument } from '../types';
import { noteIdToMidi, fretIdToMidi } from './music';

// This will hold the single AudioContext for the entire application.
let audioContext: AudioContext | null = null;

/**
 * Gets the singleton AudioContext, creating and resuming it if necessary.
 * This MUST be called from a user-initiated event to work on all browsers.
 * @returns {Promise<AudioContext | null>} A promise that resolves with the active AudioContext.
 */
export const getAudioContext = async (): Promise<AudioContext | null> => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!audioContext || audioContext.state === 'closed') {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error('Web Audio API is not supported in this browser.');
      return null;
    }
  }

  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
    } catch (e) {
      console.error('Failed to resume AudioContext. User interaction might be required.', e);
      return null; // Can't proceed if context is suspended and can't be resumed.
    }
  }

  return audioContext;
};


const midiToFrequency = (midiNumber: number): number => {
    // A4 = 440 Hz = MIDI note 69
    return 440 * Math.pow(2, (midiNumber - 69) / 12);
}

export const playNoteSound = async (uniqueId: string, instrument: Instrument, isQuietMode?: boolean) => {
    if (isQuietMode) return;

    const context = await getAudioContext();
    
    if (!context) {
        console.warn('AudioContext not available or running. Sound aborted.');
        return;
    }
    
    try {
        let midiNumber: number | null = null;

        if (instrument === 'Piano') {
            midiNumber = noteIdToMidi(uniqueId);
        } else if (instrument === 'Guitar' || instrument === 'Bass') {
            midiNumber = fretIdToMidi(uniqueId, instrument);
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