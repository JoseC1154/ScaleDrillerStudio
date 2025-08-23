
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DrillSettings, InputMethod } from '../types';
import { TouchIcon, MidiIcon, MicIcon } from './Icons';

const OptionButton: React.FC<{ value: any, current: any, onClick: () => void, children: React.ReactNode, disabled?: boolean }> = ({ value, current, onClick, children, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 rounded-md font-medium transition-all duration-200 w-full flex items-center gap-2 justify-center text-sm ${
        current === value ? 'bg-orange-500 text-white shadow-md' : 'bg-stone-800 hover:bg-stone-700'
      }`}
    >
      {children}
    </button>
);

interface InputSelectorProps {
  settings: DrillSettings;
  onSettingChange: <K extends keyof DrillSettings>(key: K, value: DrillSettings[K]) => void;
}

const InputSelector: React.FC<InputSelectorProps> = ({ settings, onSettingChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [devicesError, setDevicesError] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<PermissionState | 'idle' | 'unavailable' | 'prompt' | 'error'>('idle');

    const handleMethodChange = (method: InputMethod) => {
        onSettingChange('inputMethod', method);
        if (method !== 'Mic') {
            setIsOpen(false);
        }
    };

    const handleDeviceChange = (deviceId: string) => {
        onSettingChange('audioInputDeviceId', deviceId);
        setIsOpen(false);
    };

    const getMainIcon = (method: InputMethod) => {
        switch (method) {
          case 'Touch': return <TouchIcon className="h-8 w-8" />;
          case 'MIDI': return <MidiIcon className="h-8 w-8" />;
          case 'Mic': return <MicIcon className="h-8 w-8" />;
          default: return null;
        }
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const enumerateAndSetDevices = useCallback(async () => {
        if (!navigator.mediaDevices?.enumerateDevices) {
            setDevicesError("Device enumeration is not supported by this browser.");
            setPermissionStatus('unavailable');
            return;
        }

        try {
            // This will trigger a permission prompt if not already granted.
            // We need a stream to get device labels.
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
            setAudioDevices(audioInputDevices);
            setDevicesError(null);
            setPermissionStatus('granted');

            // If no device is selected, or the selected one is gone, select the first available one.
            if ((!settings.audioInputDeviceId || !audioInputDevices.some(d => d.deviceId === settings.audioInputDeviceId)) && audioInputDevices.length > 0) {
              onSettingChange('audioInputDeviceId', audioInputDevices[0].deviceId);
            }
            // Stop the stream now we have the labels
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
                // Fallback for browsers that don't support Permissions API
                enumerateAndSetDevices();
            }
        }
    }, [isOpen, settings.inputMethod, enumerateAndSetDevices]);

    return (
        <div id="tutorial-input-selector" className="relative">
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(prev => !prev)}
                className="p-2 rounded-full text-green-200 transition-colors"
                style={{ filter: 'drop-shadow(0 0 2px #4ade80) drop-shadow(0 0 6px #4ade80)' }}
                title={`Selected Input: ${settings.inputMethod}`}
            >
                {getMainIcon(settings.inputMethod)}
            </button>

            {isOpen && (
                <div
                    ref={popoverRef}
                    className="absolute top-full mt-2 left-0 bg-stone-900/80 backdrop-blur-lg border border-stone-700 rounded-lg p-4 shadow-2xl w-64 z-50 space-y-4"
                >
                    <div>
                        <label className="block text-xs font-medium text-stone-400 mb-2">Input Method</label>
                        <div className="space-y-2">
                            <OptionButton value="Touch" current={settings.inputMethod} onClick={() => handleMethodChange('Touch')}>
                                <TouchIcon className="h-5 w-5" /> <span>Touch</span>
                            </OptionButton>
                            <OptionButton value="MIDI" current={settings.inputMethod} onClick={() => handleMethodChange('MIDI')}>
                                <MidiIcon className="h-5 w-5" /> <span>MIDI</span>
                            </OptionButton>
                            <OptionButton value="Mic" current={settings.inputMethod} onClick={() => handleMethodChange('Mic')}>
                                <MicIcon className="h-5 w-5" /> <span>Microphone</span>
                            </OptionButton>
                        </div>
                    </div>

                    {settings.inputMethod === 'Mic' && (
                        <div className="border-t border-stone-700 pt-3 mt-3">
                            <label htmlFor="audio-device" className="block text-xs font-medium text-stone-400 mb-2">Audio Device</label>
                            {permissionStatus === 'granted' && audioDevices.length > 0 && (
                                <select
                                    id="audio-device"
                                    value={settings.audioInputDeviceId || ''}
                                    onChange={e => handleDeviceChange(e.target.value)}
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
                </div>
            )}
        </div>
    );
};

export default InputSelector;