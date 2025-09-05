
import { useState, useEffect, useRef, useCallback } from 'react';
import { Note } from '../types';
import { frequencyToNote } from '../services/music';

const STABLE_NOTE_THRESHOLD = 3; // Number of consecutive frames a note must be detected to be considered "played"

export type AudioPitchStatus = 'idle' | 'permission_requested' | 'running' | 'suspended' | 'denied' | 'error' | 'unavailable';

export const useAudioPitch = (
    enabled: boolean, 
    onNotePlayed: (note: string) => void, 
    deviceId: string | null = null, 
    sensitivity: number,
    micGain: number,
    micCompressionThreshold: number,
    micCompressionRatio: number
) => {
  const [status, setStatus] = useState<AudioPitchStatus>('idle');
  const [audioError, setAudioError] = useState<string | null>(null);
  const [lastDetectedNote, setLastDetectedNote] = useState<{ note: Note, octave: number, centsOff: number } | null>(null);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [audioDeviceLabel, setAudioDeviceLabel] = useState<string>('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const onNotePlayedRef = useRef(onNotePlayed);
  const sensitivityRef = useRef(sensitivity);
  
  const stableNoteRef = useRef<{ note: string; count: number } | null>(null);
  const lastSentNoteRef = useRef<{ note: string } | null>(null);
  const isMounted = useRef(false);

  const gainNodeRef = useRef<GainNode | null>(null);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
        isMounted.current = false;
    }
  }, []);

  useEffect(() => {
    onNotePlayedRef.current = onNotePlayed;
    sensitivityRef.current = sensitivity;
  }, [onNotePlayed, sensitivity]);

  // Effects to update audio node parameters on the fly
  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
        gainNodeRef.current.gain.setTargetAtTime(micGain, audioContextRef.current.currentTime, 0.01);
    }
  }, [micGain]);

  useEffect(() => {
    if (compressorNodeRef.current && audioContextRef.current) {
        compressorNodeRef.current.threshold.setTargetAtTime(micCompressionThreshold, audioContextRef.current.currentTime, 0.01);
    }
  }, [micCompressionThreshold]);

  useEffect(() => {
    if (compressorNodeRef.current && audioContextRef.current) {
        compressorNodeRef.current.ratio.setTargetAtTime(micCompressionRatio, audioContextRef.current.currentTime, 0.01);
    }
  }, [micCompressionRatio]);


  const resume = useCallback(async () => {
    const context = audioContextRef.current;
    if (context && context.state === 'suspended') {
      try {
        await context.resume();
      } catch (err) {
        console.error("Failed to resume audio context:", err);
        if (isMounted.current) {
            setStatus('error');
            setAudioError("Could not resume microphone. Please try interacting with the page again.");
        }
      }
    }
  }, []);

  useEffect(() => {
    let streamRef: MediaStream | null = null;
    let animationFrameId: number | undefined;

    const cleanup = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (streamRef) streamRef.getTracks().forEach(track => track.stop());
      
      const context = audioContextRef.current;
      if (context) {
        // Remove listeners to prevent memory leaks
        context.onstatechange = null;
        if (context.state !== 'closed') {
            context.close().catch(console.error);
        }
        audioContextRef.current = null;
      }
    };
    
    const startAudio = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (isMounted.current) setStatus('unavailable');
        return;
      }
      
      try {
        if (navigator.permissions?.query) {
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            if (permissionStatus.state === 'denied') {
              if (isMounted.current) setStatus('denied');
              return;
            }
        }
        if (isMounted.current) setStatus('permission_requested');

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
          video: false,
        });

        if (!isMounted.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        streamRef = stream;
        const audioTrack = stream.getAudioTracks()[0];
        if(audioTrack) {
            setAudioDeviceLabel(audioTrack.label || 'Default Microphone');
        }

        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const context = audioContextRef.current;
        
        // Handle iOS audio interruption
        context.onstatechange = () => {
            if (isMounted.current) {
                setStatus(context.state as AudioPitchStatus);
            }
        };

        if (context.state === 'suspended') {
          await context.resume();
        }
        
        const source = context.createMediaStreamSource(stream);
        
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(micCompressionThreshold, context.currentTime);
        compressor.knee.setValueAtTime(40, context.currentTime);
        compressor.ratio.setValueAtTime(micCompressionRatio, context.currentTime);
        compressor.attack.setValueAtTime(0.003, context.currentTime);
        compressor.release.setValueAtTime(0.25, context.currentTime);
        compressorNodeRef.current = compressor;
        
        const gainNode = context.createGain();
        gainNode.gain.setValueAtTime(micGain, context.currentTime);
        gainNodeRef.current = gainNode;
        
        const analyser = context.createAnalyser();
        analyser.fftSize = 4096;

        source.connect(compressor);
        compressor.connect(gainNode);
        gainNode.connect(analyser);

        const buffer = new Float32Array(analyser.fftSize);
        const peakVolumeRef = { current: 0 };
        
        if (isMounted.current) {
            setStatus(context.state as AudioPitchStatus);
            setAudioError(null);
        }

        const processAudio = () => {
          if (!isMounted.current || !analyser || context.state !== 'running') {
            if (isMounted.current) animationFrameId = requestAnimationFrame(processAudio);
            return;
          }
          analyser.getFloatTimeDomainData(buffer);
          
          let peak = 0;
          for (let i = 0; i < buffer.length; i++) {
              const absValue = Math.abs(buffer[i]);
              if (absValue > peak) peak = absValue;
          }
          
          peakVolumeRef.current = Math.max(peak, peakVolumeRef.current * 0.98); // Slower decay for more sustain
          if (isMounted.current) setCurrentVolume(peakVolumeRef.current);

          const volumeThreshold = sensitivityRef.current / 100.0;

          if (peakVolumeRef.current < volumeThreshold) {
            if (isMounted.current) setLastDetectedNote(null);
            stableNoteRef.current = null;
            animationFrameId = requestAnimationFrame(processAudio);
            return;
          }

          // --- ROBUST PITCH DETECTION (NORMALIZED SQUARED DIFFERENCE) ---
          const windowSize = 2048; // Larger window for better low-frequency analysis
          const minOffset = 80;    // Corresponds to ~600Hz (D5)
          const maxOffset = 2000;  // Corresponds to ~24Hz (G0), covering piano/bass range

          let minNormalizedDifference = Infinity;
          let bestOffset = -1;

          for (let offset = minOffset; offset < maxOffset; offset++) {
            if (windowSize + offset >= buffer.length) break;

            let difference = 0;
            let energy = 0; // The energy of the two frames being compared
            for (let i = 0; i < windowSize; i++) {
              const delta = buffer[i] - buffer[i + offset];
              difference += delta * delta;
              energy += buffer[i] * buffer[i] + buffer[i + offset] * buffer[i + offset];
            }

            // Normalize to get a value between 0 (perfect match) and 2.
            const normalizedDifference = difference / (energy || 1);

            if (normalizedDifference < minNormalizedDifference) {
              minNormalizedDifference = normalizedDifference;
              bestOffset = offset;
            }
          }

          let noteFound = false;
          // Use a confidence threshold to reject noise / non-pitched sounds.
          // Increased to 0.25 to be more forgiving of natural instrument harmonics.
          if (bestOffset !== -1 && minNormalizedDifference < 0.25 && context.sampleRate) {
            const frequency = context.sampleRate / bestOffset;
            const noteInfo = frequencyToNote(frequency);
            if (noteInfo && Math.abs(noteInfo.centsOff) < 40) {
                noteFound = true;
                if (isMounted.current) setLastDetectedNote(noteInfo);
                
                const uniqueNote = `${noteInfo.note}${noteInfo.octave}`;

                if (!stableNoteRef.current || stableNoteRef.current.note !== uniqueNote) {
                    stableNoteRef.current = { note: uniqueNote, count: 1 };
                } else {
                    stableNoteRef.current.count++;
                }

                if (stableNoteRef.current.count === STABLE_NOTE_THRESHOLD && lastSentNoteRef.current?.note !== uniqueNote) {
                    onNotePlayedRef.current(uniqueNote);
                    lastSentNoteRef.current = { note: uniqueNote };
                }
            }
          }

          if (!noteFound) {
            if (isMounted.current) setLastDetectedNote(null);
            stableNoteRef.current = null;
          }
          
          animationFrameId = requestAnimationFrame(processAudio);
        };
        processAudio();

      } catch (err) {
        console.error("Error accessing microphone:", err);
        if (!isMounted.current) return;
        
        if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
            setStatus('denied');
            setAudioError("Microphone access was denied.");
        } else {
            setStatus('error');
            setAudioError(err instanceof Error ? err.message : "An unknown error occurred.");
        }
        cleanup();
      }
    };
    
    // Page Visibility Handler
    const handleVisibilityChange = () => {
        const context = audioContextRef.current;
        if (!context || !isMounted.current) return;

        if (document.hidden) {
            if (context.state === 'running') context.suspend();
        } else {
            if (context.state === 'suspended') context.resume().catch(() => {});
        }
    };

    if (enabled) {
      startAudio();
      document.addEventListener('visibilitychange', handleVisibilityChange);
    } else {
      cleanup();
      if (isMounted.current) {
          setStatus('idle');
          setLastDetectedNote(null);
          setAudioDeviceLabel('');
          setCurrentVolume(0);
      }
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cleanup();
    };
  }, [enabled, deviceId]);

  return { status, audioError, lastDetectedNote, currentVolume, audioDeviceLabel, resume };
};