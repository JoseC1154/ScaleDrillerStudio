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

export const playNoteSound = async (uniqueId: string, instrument: Instrument) => {
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

export const playCorrectSound = async () => {
    const context = await getAudioContext();
    if (!context) return;

    try {
        const osc1 = context.createOscillator();
        const osc2 = context.createOscillator();
        const gainNode = context.createGain();

        osc1.frequency.value = 880; // A5
        osc2.frequency.value = 1318.51; // E6 (a perfect fifth above)
        osc1.type = 'sine';
        osc2.type = 'sine';

        gainNode.gain.setValueAtTime(0, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.3);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(context.destination);

        osc1.start(context.currentTime);
        osc2.start(context.currentTime);
        osc1.stop(context.currentTime + 0.3);
        osc2.stop(context.currentTime + 0.3);
    } catch (e) {
        console.error("Failed to play correct sound:", e);
    }
};

export const playIncorrectSound = async () => {
    const context = await getAudioContext();
    if (!context) return;
    
    try {
        const osc = context.createOscillator();
        const gainNode = context.createGain();

        osc.frequency.setValueAtTime(160, context.currentTime); // Low buzz
        osc.type = 'sawtooth';

        gainNode.gain.setValueAtTime(0, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.25);

        osc.connect(gainNode);
        gainNode.connect(context.destination);

        osc.start(context.currentTime);
        osc.stop(context.currentTime + 0.25);
    } catch (e) {
        console.error("Failed to play incorrect sound:", e);
    }
};

export const playBeatSound = async () => {
    const context = await getAudioContext();
    if (!context) return;

    try {
        const osc = context.createOscillator();
        const gainNode = context.createGain();

        osc.frequency.setValueAtTime(1000, context.currentTime); // High-pitched tick
        osc.type = 'triangle'; // Softer than sine for a tick

        gainNode.gain.setValueAtTime(0, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.02, context.currentTime + 0.01); // Very low volume, quick attack
        gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.1); // Quick decay

        osc.connect(gainNode);
        gainNode.connect(context.destination);

        osc.start(context.currentTime);
        osc.stop(context.currentTime + 0.1);
    } catch (e) {
        console.error("Failed to play beat sound:", e);
    }
};

export const playUIClick = async () => {
    const context = await getAudioContext();
    if (!context) return;
    try {
        const osc = context.createOscillator();
        const gainNode = context.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, context.currentTime); // High-pitched but soft
        osc.frequency.exponentialRampToValueAtTime(400, context.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.03, context.currentTime + 0.01); // Very quiet
        gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.1);

        osc.connect(gainNode);
        gainNode.connect(context.destination);

        osc.start(context.currentTime);
        osc.stop(context.currentTime + 0.1);
    } catch (e) {
        console.error("Failed to play UI click sound:", e);
    }
};

export const playUIToggle = async () => {
    const context = await getAudioContext();
    if (!context) return;
    try {
        const osc = context.createOscillator();
        const gainNode = context.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, context.currentTime + 0.08);

        gainNode.gain.setValueAtTime(0, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.04, context.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.08);

        osc.connect(gainNode);
        gainNode.connect(context.destination);

        osc.start(context.currentTime);
        osc.stop(context.currentTime + 0.08);
    } catch (e) {
        console.error("Failed to play UI toggle sound:", e);
    }
};

export const playDrillSuccess = async () => {
    const context = await getAudioContext();
    if (!context) return;
    try {
        const now = context.currentTime;
        const gainNode = context.createGain();
        gainNode.connect(context.destination);

        // Arpeggio
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        freqs.forEach((freq, i) => {
            const osc = context.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            osc.connect(gainNode);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.3);
        });

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.8);
    } catch (e) {
        console.error("Failed to play drill success sound:", e);
    }
};

export const playLevelUpSound = async () => {
    const context = await getAudioContext();
    if (!context) return;
    try {
        const now = context.currentTime;
        const gainNode = context.createGain();
        gainNode.connect(context.destination);

        // More complex, sweeping arpeggio
        const baseFreq = 440; // A4
        for (let i = 0; i < 8; i++) {
            const osc = context.createOscillator();
            osc.type = 'sawtooth';
            const freq = baseFreq * Math.pow(2, (i * 2) / 12); // Whole steps
            osc.frequency.setValueAtTime(freq, now + i * 0.05);
            osc.connect(gainNode);
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.4);
        }

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.12, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 1.2);

    } catch (e) {
        console.error("Failed to play level up sound:", e);
    }
};