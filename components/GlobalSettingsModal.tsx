

import React, { useState, useEffect, useCallback } from 'react';
import { CloseIcon, TouchIcon, MidiIcon, MicIcon, PianoIcon, GuitarIcon, BassIcon, TunerIcon, ReportIcon, InfoIcon, EnterFullscreenIcon, ExitFullscreenIcon } from './Icons';
import { ActiveView, DeviceType, DrillSettings, InputMethod, Instrument, Handedness } from '../types';

interface GlobalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ActiveView) => void;
  onStartInputTester: () => void;
  onToggleFullscreen: () => void;
  isFullScreen: boolean;
  deviceType: DeviceType;
  settings: DrillSettings;
  onSettingChange: <K extends keyof DrillSettings>(key: K, value: DrillSettings[K]) => void;
  isQuietMode: boolean;
  onToggleQuietMode: () => void;
}

const OptionButton: React.FC<{ value: any, current: any, onClick: () => void, children: React.ReactNode, disabled?: boolean, title?: string }> = ({ value, current, onClick, children, disabled, title }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-3 py-2 rounded-md font-medium transition-all duration-200 w-full flex items-center gap-2 justify-center text-sm ${
        current === value ? 'bg-orange-500 text-white shadow-md' : 'bg-stone-800 hover:bg-stone-700'
      }`}
    >
      {children}
    </button>
);

const MenuButton: React.FC<{ onClick: () => void, children: React.ReactNode }> = ({ onClick, children }) => (
    <button
      onClick={onClick}
      className="px-3 py-2 rounded-md font-medium transition-all duration-200 w-full flex items-center gap-3 justify-start text-sm text-stone-200 bg-stone-800 hover:bg-stone-700"
    >
      {children}
    </button>
);


const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({ isOpen, onClose, onNavigate, onStartInputTester, onToggleFullscreen, isFullScreen, deviceType, settings, onSettingChange, isQuietMode, onToggleQuietMode }) => {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | 'idle' | 'unavailable' | 'prompt' | 'error'>('idle');

  const enumerateAndSetDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
        setDevicesError("Device enumeration is not supported by this browser.");
        setPermissionStatus('unavailable');
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
        setAudioDevices(audioInputDevices);
        setDevicesError(null);
        setPermissionStatus('granted');

        if ((!settings.audioInputDeviceId || !audioInputDevices.some(d => d.deviceId === settings.audioInputDeviceId)) && audioInputDevices.length > 0) {
          onSettingChange('audioInputDeviceId', audioInputDevices[0].deviceId);
        }
        stream.getTracks().forEach(track => track.stop());
    } catch (err) {
        console.error("Error enumerating devices:", err);
        if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
            setDevicesError("Microphone permission denied.");
            setPermissionStatus('denied');
        } else {
            setDevicesError("Could not access audio devices.");
            setPermissionStatus('error');
        }
    }
  }, [onSettingChange, settings.audioInputDeviceId]);

  useEffect(() => {
    if (isOpen && settings.inputMethod === 'Mic') {
        if (navigator.permissions?.query) {
            navigator.permissions.query({ name: 'microphone' as PermissionName }).then(status => {
                setPermissionStatus(status.state);
                if (status.state === 'granted') {
                    enumerateAndSetDevices();
                }
                status.onchange = () => {
                    setPermissionStatus(status.state);
                    if (status.state === 'granted') {
                        enumerateAndSetDevices();
                    } else {
                        setAudioDevices([]);
                    }
                };
            });
        } else {
            enumerateAndSetDevices();
        }
    }
  }, [isOpen, settings.inputMethod, enumerateAndSetDevices]);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-stone-700 rounded-lg max-w-md w-full shadow-2xl flex flex-col max-h-[calc(100vh-3rem)]" onClick={e => e.stopPropagation()}>
        <header className="p-6 flex justify-between items-center flex-shrink-0 border-b border-stone-800">
            <h2 className="text-2xl font-bold text-orange-400">Menu & Settings</h2>
            <button onClick={onClose} className="text-stone-400 hover:text-white">
                <CloseIcon className="h-6 w-6" />
            </button>
        </header>

        <main className="overflow-y-auto p-6 space-y-6">
            <section id="navigation" className="space-y-2">
                <h3 className="text-lg font-semibold text-stone-200 mb-2">Navigation</h3>
                <MenuButton onClick={() => onNavigate('tuner')}><TunerIcon className="h-5 w-5 text-orange-400" /> Tuner</MenuButton>
                <MenuButton onClick={() => onNavigate('report')}><ReportIcon className="h-5 w-5 text-orange-400" /> Performance Report</MenuButton>
                <MenuButton onClick={() => onNavigate('guide')}><InfoIcon className="h-5 w-5 text-orange-400" /> App Guide</MenuButton>
            </section>
            
             <section id="audio-settings" className="space-y-2 pt-6 border-t border-stone-800">
                <h3 className="text-lg font-semibold text-stone-200 mb-2">Audio</h3>
                <div className="bg-stone-800 p-3 rounded-lg flex justify-between items-center">
                    <div className="flex flex-col">
                        <label htmlFor="quiet-mode" className="text-stone-200 text-sm font-medium select-none">Quiet Mode</label>
                        <p className="text-xs text-stone-400">Mute all sounds, keep haptics on.</p>
                    </div>
                    <button
                        id="quiet-mode"
                        onClick={onToggleQuietMode}
                        className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 ease-in-out flex-shrink-0 ${isQuietMode ? 'bg-green-500' : 'bg-stone-600'}`}
                        aria-pressed={isQuietMode}
                    >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${isQuietMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </section>

            <section id="tutorial-input-selector" className="space-y-4 pt-6 border-t border-stone-800">
                <div>
                    <h3 className="text-lg font-semibold text-stone-200 mb-2">Input Settings</h3>
                    <div className="grid grid-cols-3 gap-2">
                        <OptionButton value="Touch" current={settings.inputMethod} onClick={() => onSettingChange('inputMethod', 'Touch')}><TouchIcon className="h-5 w-5" /> Touch</OptionButton>
                        <OptionButton value="MIDI" current={settings.inputMethod} onClick={() => onSettingChange('inputMethod', 'MIDI')}><MidiIcon className="h-5 w-5" /> MIDI</OptionButton>
                        <OptionButton value="Mic" current={settings.inputMethod} onClick={() => onSettingChange('inputMethod', 'Mic')}><MicIcon className="h-5 w-5" /> Mic</OptionButton>
                    </div>
                </div>
                {settings.inputMethod === 'Mic' && (
                    <div className="pl-2 border-l-2 border-stone-800">
                        <label htmlFor="audio-device" className="block text-sm font-medium text-stone-400 mb-2">Audio Device</label>
                        {permissionStatus === 'granted' && audioDevices.length > 0 && (
                            <select
                                id="audio-device"
                                value={settings.audioInputDeviceId || ''}
                                onChange={e => onSettingChange('audioInputDeviceId', e.target.value)}
                                className="w-full bg-stone-800 border border-stone-700 rounded-md px-3 py-2 text-white focus:ring-orange-500 focus:border-orange-500 text-sm"
                            >
                                {audioDevices.map(device => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
                                    </option>
                                ))}
                            </select>
                        )}
                        {permissionStatus === 'granted' && audioDevices.length === 0 && (
                            <p className="text-sm text-stone-400">No audio input devices found.</p>
                        )}
                         {(permissionStatus === 'denied' || permissionStatus === 'error') && (
                            <p className="text-sm text-red-400">{devicesError}</p>
                        )}
                        {(permissionStatus === 'prompt' || permissionStatus === 'idle') && (
                             <button onClick={enumerateAndSetDevices} className="text-sm text-yellow-400 hover:text-yellow-300 w-full text-left bg-yellow-900/50 p-2 rounded-md text-center">
                                Connect Microphone
                            </button>
                        )}
                         {permissionStatus === 'unavailable' && (
                            <p className="text-sm text-red-400">{devicesError}</p>
                        )}
                    </div>
                )}
            </section>
            
            <section id="tutorial-instrument-selector" className="space-y-4">
                 <div>
                     <div className="grid grid-cols-3 gap-2">
                        <OptionButton value="Piano" current={settings.instrument} onClick={() => onSettingChange('instrument', 'Piano')}><PianoIcon className="h-5 w-5" /> Piano</OptionButton>
                        <OptionButton value="Guitar" current={settings.instrument} onClick={() => onSettingChange('instrument', 'Guitar')}><GuitarIcon className="h-5 w-5" /> Guitar</OptionButton>
                        <OptionButton value="Bass" current={settings.instrument} onClick={() => onSettingChange('instrument', 'Bass')}><BassIcon className="h-5 w-5" /> Bass</OptionButton>
                    </div>
                </div>
                 {(settings.instrument === 'Guitar' || settings.instrument === 'Bass') && (
                    <div className="pl-2 border-l-2 border-stone-800">
                        <h3 className="text-sm font-medium text-stone-400 mb-2">Handedness</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <OptionButton value="Right" current={settings.handedness} onClick={() => onSettingChange('handedness', 'Right')}>Right</OptionButton>
                            <OptionButton value="Left" current={settings.handedness} onClick={() => onSettingChange('handedness', 'Left')}>Left</OptionButton>
                        </div>
                    </div>
                )}
            </section>


            <section className="pt-6 border-t border-stone-800">
                <h3 className="text-lg font-semibold text-stone-200 mb-1">Tools & Diagnostics</h3>
                <p className="text-sm text-stone-400 mb-4">Detected Device Type: <span className="font-bold text-orange-400 capitalize">{deviceType}</span></p>
                <div className="space-y-2">
                  <MenuButton onClick={onStartInputTester}>Test Input</MenuButton>
                  {deviceType === 'desktop' && (
                    <MenuButton onClick={onToggleFullscreen}>
                      {isFullScreen ? <ExitFullscreenIcon className="h-5 w-5 text-orange-400" /> : <EnterFullscreenIcon className="h-5 w-5 text-orange-400" />}
                      {isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                    </MenuButton>
                  )}
                </div>
            </section>
        </main>
      </div>
    </div>
  );
};

export default GlobalSettingsModal;