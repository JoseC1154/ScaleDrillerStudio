import React, { useState, useCallback, useEffect } from 'react';
import { DrillSettings, Note } from '../types';
import { useMidi } from '../hooks/useMidi';
import { useAudioPitch } from '../hooks/useAudioPitch';
import { Piano } from './Piano';
import Fretboard from './Fretboard';
import { playNoteSound } from '../services/sound';

interface InputTesterProps {
  settings: DrillSettings;
  onQuit: () => void;
  onSettingChange: <K extends keyof DrillSettings>(key: K, value: DrillSettings[K]) => void;
  isQuietMode?: boolean;
}

const InputTester: React.FC<InputTesterProps> = ({ settings, onQuit, onSettingChange, isQuietMode = false }) => {
  const [lastNote, setLastNote] = useState<string | null>(null);
  const [lastNoteVolume, setLastNoteVolume] = useState(0);

  const handleNotePlayed = useCallback((note: string) => {
    setLastNote(note);
    // For Touch/MIDI, we don't have a decaying volume, so just set to full
    if (settings.inputMethod !== 'Mic') {
      setLastNoteVolume(1);
    }
  }, [settings.inputMethod]);
  
  const handleNotePlayedWithSound = useCallback(async (note: string) => {
    if (settings.inputMethod === 'Touch') {
      await playNoteSound(note, settings.instrument, isQuietMode);
    }
    handleNotePlayed(note);
  }, [handleNotePlayed, settings.inputMethod, settings.instrument, isQuietMode]);


  const { midiError } = useMidi(
    settings.inputMethod === 'MIDI',
    handleNotePlayed
  );

  const { status, audioError, lastDetectedNote, currentVolume, audioDeviceLabel, resume } = useAudioPitch(
    settings.inputMethod === 'Mic',
    handleNotePlayed,
    settings.audioInputDeviceId,
    settings.micSensitivity,
    settings.micGain,
    settings.micCompressionThreshold,
    settings.micCompressionRatio
  );
  
  // This effect manages the visual state for the Mic input's live glow
  useEffect(() => {
    if (settings.inputMethod === 'Mic') {
        if (lastDetectedNote) {
            // A note is actively being detected
            const noteId = `${lastDetectedNote.note}${lastDetectedNote.octave}`;
            setLastNote(noteId);
            setLastNoteVolume(currentVolume);
        } else {
            // No note detected, use the decaying volume from the hook for the fade-out effect
            setLastNoteVolume(currentVolume);
        }
    }
  }, [lastDetectedNote, currentVolume, settings.inputMethod]);

  // Effect to clear the note from view once it has fully faded out
  useEffect(() => {
    if (settings.inputMethod === 'Mic' && lastNote && lastNoteVolume < 0.05) {
        const timer = setTimeout(() => {
            // Check again in case volume went back up
            if (lastNoteVolume < 0.05) {
                setLastNote(null);
            }
        }, 150); // Give it a moment to avoid flickering
        return () => clearTimeout(timer);
    }
  }, [lastNote, lastNoteVolume, settings.inputMethod]);


  const getNoteName = (uniqueId: string | null): string => {
      if (!uniqueId) return '...';
      return uniqueId.replace(/-?\d.*$/, '');
  }

  const highlightedNotes = lastNote ? [lastNote] : [];
  // Only apply the live volume effect for Mic input.
  const liveVolume = (settings.inputMethod === 'Mic') ? lastNoteVolume : undefined;
  
  const renderInstrument = () => {
    switch (settings.instrument) {
      case 'Piano':
        return <Piano onNotePlayed={handleNotePlayedWithSound} highlightedNotes={highlightedNotes} liveVolume={liveVolume} range={{ startMidi: 36, keyCount: 49 }} />;
      case 'Guitar':
      case 'Bass':
        return <Fretboard instrument={settings.instrument} onNotePlayed={handleNotePlayedWithSound} highlightedNotes={highlightedNotes} handedness={settings.handedness} labelMode="notes" scale={null} liveVolume={liveVolume} />;
      default:
        return null;
    }
  };

  const renderStatus = () => {
    if (settings.inputMethod === 'MIDI') {
      return midiError ? <p className="text-red-400">{midiError}</p> : <p className="text-green-400">MIDI input is active. Play a note on your device.</p>;
    }
    if (settings.inputMethod === 'Mic') {
        switch(status) {
            case 'running':
                return <p className="text-green-400">{audioDeviceLabel || 'Default Microphone'} is active. Play or sing a note.</p>;
            case 'suspended':
                return <p className="text-yellow-400">Mic usage paused. Click Resume or return to this tab.</p>;
            case 'denied':
                return <p className="text-red-400">Mic access denied. Enable it in your browser's site settings (lock icon 🔒).</p>;
            case 'error':
                 return <p className="text-red-400">{audioError || 'An unknown microphone error occurred.'}</p>;
            case 'permission_requested':
                return <p className="text-yellow-400">Waiting for microphone permission...</p>;
            case 'unavailable':
                 return <p className="text-red-400">Microphone input is not available on this browser.</p>;
            case 'idle':
            default:
                return <p className="text-stone-400">Initializing microphone...</p>;
        }
    }
    return <p className="text-stone-400">Using touch input. Click a note to test.</p>;
  };

  const renderMicSettings = () => {
      if (settings.inputMethod !== 'Mic') return null;
      
      const volumePercent = (currentVolume || 0) * 100;
      const isMicReady = status === 'running' || status === 'suspended';

      return (
          <div className="bg-black/20 p-4 rounded-lg mt-4 transition-opacity duration-300 relative">
              <h3 className="text-lg font-semibold mb-2 text-stone-200">Microphone Calibration</h3>
              {isMicReady ? (
                <div className={`space-y-4 ${status === 'suspended' ? 'opacity-30' : ''}`}>
                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-2">Live Input Volume</label>
                        <div className="w-full bg-stone-700 rounded-full h-4 relative overflow-hidden border border-stone-600">
                            <div className="bg-green-500 h-full rounded-full transition-all duration-100" style={{ width: `${volumePercent}%` }}></div>
                            <div 
                                className="absolute top-0 bottom-0 border-r-2 border-orange-500" 
                                style={{ left: `${settings.micSensitivity}%` }}
                                title="Sensitivity Threshold"
                            ></div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="micSensitivity" className="block text-sm font-medium text-stone-300 mb-1">Noise Gate: <span className="font-bold text-orange-400">{settings.micSensitivity}</span></label>
                        <p className="text-xs text-stone-400 mb-2">Adjust to ignore background noise. Increase if silent noise triggers notes. Decrease if your notes aren't being picked up.</p>
                        <input 
                            id="micSensitivity" 
                            type="range" 
                            min="1" max="100" 
                            value={settings.micSensitivity} 
                            onChange={e => onSettingChange('micSensitivity', parseInt(e.target.value, 10))} 
                            className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            disabled={status === 'suspended'}
                        />
                    </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-stone-400">
                    <p>
                        {status === 'denied' ? 'Mic access failed.' :
                         status === 'permission_requested' ? 'Awaiting permission...' :
                         'Connecting to microphone...'}
                    </p>
                </div>
              )}
               {status === 'suspended' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <button onClick={resume} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg">
                        Resume Mic
                    </button>
                </div>
              )}
          </div>
      );
  };

  return (
    <div className="bg-stone-900/70 backdrop-blur-lg border border-stone-700/50 p-6 sm:p-8 rounded-xl shadow-2xl w-full mx-auto">
      <h2 className="text-2xl font-bold text-center mb-4">Input Tester</h2>
      <div className="text-center p-4 mb-4 bg-black/30 rounded-lg min-h-[120px] flex flex-col justify-center">
        <p className="text-stone-400 text-sm">Last Note Detected</p>
        <p className="text-5xl font-bold text-orange-400 h-16 flex items-center justify-center">{getNoteName(lastNote)}</p>
        {renderStatus()}
      </div>
      
      <div className="w-full">
        {renderMicSettings()}
      </div>

      <div className="my-6 h-48 overflow-hidden rounded-lg">
        {renderInstrument()}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={onQuit}
          className="bg-stone-600 hover:bg-stone-500 text-white font-bold py-2 px-6 rounded-lg transition"
        >
          Back to Settings
        </button>
      </div>
    </div>
  );
};

export default InputTester;