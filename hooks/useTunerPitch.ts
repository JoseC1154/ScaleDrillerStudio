
import { useState, useEffect, useRef, useCallback } from 'react';
import { TuningNote } from '../types';
import { getClosestNote } from '../services/music';

export type AudioPitchStatus = 'idle' | 'permission_requested' | 'running' | 'suspended' | 'denied' | 'error' | 'unavailable';

export interface TunerResult {
  targetNote: TuningNote;
  centsOff: number;
}

const NOTE_STABILITY_THRESHOLD = 3; // Number of consecutive frames to confirm a note
const DECAY_FACTOR = 0.98; // Slower decay

export const useTunerPitch = (
    enabled: boolean, 
    tuningNotes: TuningNote[],
    deviceId: string | null = null, 
    sensitivity: number,
    micGain: number,
    micCompressionThreshold: number,
    micCompressionRatio: number
) => {
  const [status, setStatus] = useState<AudioPitchStatus>('idle');
  const [audioError, setAudioError] = useState<string | null>(null);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [audioDeviceLabel, setAudioDeviceLabel] = useState<string>('');
  const [tunerResult, setTunerResult] = useState<TunerResult | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sensitivityRef = useRef(sensitivity);
  
  const smoothedCentsRef = useRef(0);
  const lastTargetNoteRef = useRef<TuningNote | null>(null);
  const stableNoteCandidateRef = useRef<{ note: TuningNote; count: number } | null>(null);
  const isMounted = useRef(false);

  const gainNodeRef = useRef<GainNode | null>(null);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const tunerClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  useEffect(() => {
    isMounted.current = true;
    return () => {
        isMounted.current = false;
        if (tunerClearTimeoutRef.current) {
            clearTimeout(tunerClearTimeoutRef.current);
        }
    }
  }, []);

  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

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
      if (tunerClearTimeoutRef.current) clearTimeout(tunerClearTimeoutRef.current);
      
      const context = audioContextRef.current;
      if (context) {
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
          
          peakVolumeRef.current = Math.max(peak, peakVolumeRef.current * DECAY_FACTOR);
          if (isMounted.current) setCurrentVolume(peakVolumeRef.current);

          const volumeThreshold = sensitivityRef.current / 100.0;
          let noteFound = false;

          if (peakVolumeRef.current > volumeThreshold) {
              // --- ROBUST PITCH DETECTION (NORMALIZED SQUARED DIFFERENCE) ---
              const windowSize = 2048;
              const minOffset = 80;
              const maxOffset = 2000;

              let minNormalizedDifference = Infinity;
              let bestOffset = -1;

              for (let offset = minOffset; offset < maxOffset; offset++) {
                if (windowSize + offset >= buffer.length) break;
                let difference = 0;
                let energy = 0;
                for (let i = 0; i < windowSize; i++) {
                  const delta = buffer[i] - buffer[i + offset];
                  difference += delta * delta;
                  energy += buffer[i] * buffer[i] + buffer[i + offset] * buffer[i + offset];
                }
                const normalizedDifference = difference / (energy || 1);
                if (normalizedDifference < minNormalizedDifference) {
                  minNormalizedDifference = normalizedDifference;
                  bestOffset = offset;
                }
              }

              if (bestOffset !== -1 && minNormalizedDifference < 0.25 && context.sampleRate) {
                const frequency = context.sampleRate / bestOffset;
                const result = getClosestNote(frequency, tuningNotes);

                if (result) {
                    noteFound = true;
                    // Clear any pending timeout because we have a new note
                    if (tunerClearTimeoutRef.current) {
                        clearTimeout(tunerClearTimeoutRef.current);
                        tunerClearTimeoutRef.current = null;
                    }

                    // --- UPDATE NOTE STABILITY CANDIDATE ---
                    if (stableNoteCandidateRef.current?.note.note !== result.note.note || stableNoteCandidateRef.current?.note.octave !== result.note.octave) {
                        stableNoteCandidateRef.current = { note: result.note, count: 1 };
                    } else {
                        stableNoteCandidateRef.current.count++;
                    }

                    // --- UPDATE UI STATE BASED ON STABILITY ---
                    // Promote candidate to stable note if threshold is met
                    if (stableNoteCandidateRef.current.count >= NOTE_STABILITY_THRESHOLD) {
                        const stableNote = stableNoteCandidateRef.current.note;
                        const isNewStableNote = !lastTargetNoteRef.current || lastTargetNoteRef.current.note !== stableNote.note || lastTargetNoteRef.current.octave !== stableNote.octave;
                        
                        if (isNewStableNote) {
                            lastTargetNoteRef.current = stableNote;
                            smoothedCentsRef.current = result.cents; // Reset smoothing
                        }
                    }
                    
                    // If we have a stable note, update the needle smoothly towards the current reading
                    if (lastTargetNoteRef.current) {
                        const alpha = 0.2; // Smoothing factor
                        smoothedCentsRef.current = alpha * result.cents + (1 - alpha) * smoothedCentsRef.current;
                        if (isMounted.current) {
                            setTunerResult({ targetNote: lastTargetNoteRef.current, centsOff: smoothedCentsRef.current });
                        }
                    }
                }
              }
          }

          // --- HANDLE NO SOUND / NO PITCH ---
          if (!noteFound) {
            stableNoteCandidateRef.current = null; // Reset candidate if pitch is lost
            // If there's a note on screen, decay its needle to center
            if (lastTargetNoteRef.current) {
                smoothedCentsRef.current *= DECAY_FACTOR;
                if (isMounted.current) {
                    setTunerResult({ targetNote: lastTargetNoteRef.current, centsOff: smoothedCentsRef.current });
                }
            }
            // Start a timeout to clear the tuner if there's currently a result displayed
            // and no timeout is already scheduled.
            if (tunerResult && !tunerClearTimeoutRef.current) {
                tunerClearTimeoutRef.current = setTimeout(() => {
                    if (isMounted.current) {
                        setTunerResult(null);
                        lastTargetNoteRef.current = null;
                        smoothedCentsRef.current = 0;
                    }
                    tunerClearTimeoutRef.current = null; // Clear the ref after it has run
                }, 10000);
            }
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
          setTunerResult(null);
          setAudioDeviceLabel('');
          setCurrentVolume(0);
      }
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cleanup();
    };
  }, [enabled, deviceId, tuningNotes]);

  return { status, audioError, currentVolume, audioDeviceLabel, resume, tunerResult };
};
