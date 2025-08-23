

import React, { useState, useCallback } from 'react';
import { DrillSettings, TuningPreset } from '../types';
import { TUNING_PRESETS } from '../constants';
import { useTunerPitch } from '../hooks/useTunerPitch';
import TuningPresetSelector from './TuningPresetSelector';
import TuningDisplay from './TuningDisplay';
import TunerNeedle from './TunerNeedle';

interface TunerProps {
  settings: DrillSettings;
  onSettingChange: <K extends keyof DrillSettings>(key: K, value: DrillSettings[K]) => void;
}

const Tuner: React.FC<TunerProps> = ({ settings, onSettingChange }) => {
  const [activePreset, setActivePreset] = useState<TuningPreset>(TUNING_PRESETS[0]);

  const { status, audioError, currentVolume, audioDeviceLabel, resume, tunerResult } = useTunerPitch(
    true, // Tuner is always enabled when this component is mounted
    activePreset.notes,
    settings.audioInputDeviceId,
    settings.micSensitivity,
    settings.micGain,
    settings.micCompressionThreshold,
    settings.micCompressionRatio
  );
  
  const isAudible = (currentVolume || 0) * 100 > settings.micSensitivity;

  const renderStatusMessage = () => {
    switch(status) {
        case 'running':
            return <p className="text-green-400 text-sm">{audioDeviceLabel || 'Default Microphone'} is active.</p>;
        case 'suspended':
            return <p className="text-yellow-400 text-sm">Mic usage paused. Click Resume or return to this tab.</p>;
        case 'denied':
            return <p className="text-red-400 text-sm">Mic access denied. Enable it in your browser's site settings (lock icon 🔒).</p>;
        case 'error':
            return <p className="text-red-400 text-sm">{audioError || 'An unknown microphone error occurred.'}</p>;
        case 'permission_requested':
            return <p className="text-yellow-400 text-sm">Waiting for microphone permission...</p>;
        case 'unavailable':
            return <p className="text-red-400 text-sm">Microphone input is not available on this browser.</p>;
        case 'idle':
        default:
            return <p className="text-stone-400 text-sm">Initializing microphone...</p>;
    }
  };

  const isMicReady = status === 'running' || status === 'suspended';

  return (
    <div className="bg-stone-900/70 backdrop-blur-lg border border-stone-700/50 p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-lg mx-auto flex flex-col gap-4">
        <header className="text-center">
            <h2 className="text-3xl font-bold text-orange-400">Instrument Tuner</h2>
            <TuningPresetSelector
                presets={TUNING_PRESETS}
                activePreset={activePreset}
                onPresetChange={setActivePreset}
            />
        </header>

        <main className="flex flex-col items-center justify-center gap-6 p-4 bg-black/30 rounded-lg min-h-[300px]">
            {isMicReady ? (
                <>
                    <TuningDisplay tunerResult={tunerResult} isAudible={isAudible} />
                    <TunerNeedle centsOff={tunerResult?.centsOff ?? 0} />
                </>
            ) : (
                <div className="text-center text-stone-300">
                    <p>Waiting for microphone...</p>
                </div>
            )}
        </main>
        
        <footer className="space-y-3 relative">
            {isMicReady ? (
                <div className={`space-y-3 ${status === 'suspended' ? 'opacity-30' : ''}`}>
                    <div>
                        <label className="block text-xs font-medium text-stone-300">Live Input Volume</label>
                        <div className="w-full bg-stone-700 rounded-full h-2.5 relative overflow-hidden border border-stone-600 mt-1">
                            <div className="bg-green-500 h-full rounded-full transition-all duration-100" style={{ width: `${(currentVolume || 0) * 100}%` }}></div>
                            <div 
                                className="absolute top-0 bottom-0 border-r-2 border-orange-500/80" 
                                style={{ left: `${settings.micSensitivity}%` }}
                                title="Noise Gate Threshold"
                            ></div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="micSensitivity" className="block text-xs font-medium text-stone-300 mb-1">Noise Gate: <span className="font-bold text-orange-400">{settings.micSensitivity}</span></label>
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
                <div className="h-full flex items-center justify-center text-stone-400 min-h-[90px]">
                    {renderStatusMessage()}
                </div>
            )}
            {status === 'suspended' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <button onClick={resume} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg">
                        Resume Mic
                    </button>
                </div>
              )}
        </footer>
    </div>
  );
};

export default Tuner;