

import React, { useState, useEffect, useCallback } from 'react';
import { TouchIcon, MidiIcon, MicIcon, PianoIcon, GuitarIcon, BassIcon, TunerIcon, ReportIcon, InfoIcon, EnterFullscreenIcon, ExitFullscreenIcon } from './Icons';
import { ActiveView, DeviceType, DrillSettings, InputMethod, Instrument, Handedness, Language } from '../types';
import { createTranslator } from '../services/translations';

interface MenuViewProps {
  onNavigate: (view: ActiveView) => void;
  onStartInputTester: () => void;
  onToggleFullscreen: () => void;
  isFullScreen: boolean;
  deviceType: DeviceType;
  settings: DrillSettings;
  onSettingChange: <K extends keyof DrillSettings>(key: K, value: DrillSettings[K]) => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
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


const MenuView: React.FC<MenuViewProps> = ({ onNavigate, onStartInputTester, onToggleFullscreen, isFullScreen, deviceType, settings, onSettingChange, language, onLanguageChange }) => {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | 'idle' | 'unavailable' | 'prompt' | 'error'>('idle');
  const t = createTranslator(language);

  const enumerateAndSetDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
        setDevicesError(t('micNotSupported'));
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
            setDevicesError(t('micPermissionDenied'));
            setPermissionStatus('denied');
        } else {
            setDevicesError(t('micAccessError'));
            setPermissionStatus('error');
        }
    }
  }, [onSettingChange, settings.audioInputDeviceId, t]);

  useEffect(() => {
    if (settings.inputMethod === 'Mic') {
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
  }, [settings.inputMethod, enumerateAndSetDevices]);
  
  return (
    <div className="bg-stone-900/70 backdrop-blur-lg border border-stone-700/50 p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-lg mx-auto h-full flex flex-col">
        <header className="pb-4 flex justify-between items-center flex-shrink-0 border-b border-stone-800">
            <h2 className="text-2xl font-bold text-orange-400">{t('menuAndSettings')}</h2>
        </header>

        <main className="overflow-y-auto mt-4 pr-2 space-y-6">
            <section id="navigation" className="space-y-2">
                <h3 className="text-lg font-semibold text-stone-200 mb-2">{t('navigation')}</h3>
                <MenuButton onClick={() => onNavigate('tuner')}><TunerIcon className="h-5 w-5 text-orange-400" /> {t('tuner')}</MenuButton>
                <MenuButton onClick={() => onNavigate('report')}><ReportIcon className="h-5 w-5 text-orange-400" /> {t('performanceReport')}</MenuButton>
                <MenuButton onClick={() => onNavigate('guide')}><InfoIcon className="h-5 w-5 text-orange-400" /> {t('appGuide')}</MenuButton>
            </section>
            
             <section id="language-settings" className="space-y-2 pt-6 border-t border-stone-800">
                <h3 className="text-lg font-semibold text-stone-200 mb-2">{t('language')}</h3>
                <div className="grid grid-cols-2 gap-2">
                    <OptionButton value="en" current={language} onClick={() => onLanguageChange('en')}>{t('english')}</OptionButton>
                    <OptionButton value="es" current={language} onClick={() => onLanguageChange('es')}>{t('spanish')}</OptionButton>
                </div>
            </section>

            <section id="tutorial-input-selector" className="space-y-4 pt-6 border-t border-stone-800">
                <div>
                    <h3 className="text-lg font-semibold text-stone-200 mb-2">{t('inputSettings')}</h3>
                    <div className="grid grid-cols-3 gap-2">
                        <OptionButton value="Touch" current={settings.inputMethod} onClick={() => onSettingChange('inputMethod', 'Touch')}><TouchIcon className="h-5 w-5" /> {t('touch')}</OptionButton>
                        <OptionButton value="MIDI" current={settings.inputMethod} onClick={() => onSettingChange('inputMethod', 'MIDI')}><MidiIcon className="h-5 w-5" /> {t('midi')}</OptionButton>
                        <OptionButton value="Mic" current={settings.inputMethod} onClick={() => onSettingChange('inputMethod', 'Mic')}><MicIcon className="h-5 w-5" /> {t('mic')}</OptionButton>
                    </div>
                </div>
                {settings.inputMethod === 'Mic' && (
                    <div className="pl-2 border-l-2 border-stone-800">
                        <label htmlFor="audio-device" className="block text-sm font-medium text-stone-400 mb-2">{t('audioDevice')}</label>
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
                                {t('connectMicrophone')}
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
                        <OptionButton value="Piano" current={settings.instrument} onClick={() => onSettingChange('instrument', 'Piano')}><PianoIcon className="h-5 w-5" /> {t('piano')}</OptionButton>
                        <OptionButton value="Guitar" current={settings.instrument} onClick={() => onSettingChange('instrument', 'Guitar')}><GuitarIcon className="h-5 w-5" /> {t('guitar')}</OptionButton>
                        <OptionButton value="Bass" current={settings.instrument} onClick={() => onSettingChange('instrument', 'Bass')}><BassIcon className="h-5 w-5" /> {t('bass')}</OptionButton>
                    </div>
                </div>
                 {(settings.instrument === 'Guitar' || settings.instrument === 'Bass') && (
                    <div className="pl-2 border-l-2 border-stone-800">
                        <h3 className="text-sm font-medium text-stone-400 mb-2">{t('handedness')}</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <OptionButton value="Right" current={settings.handedness} onClick={() => onSettingChange('handedness', 'Right')}>{t('right')}</OptionButton>
                            <OptionButton value="Left" current={settings.handedness} onClick={() => onSettingChange('handedness', 'Left')}>{t('left')}</OptionButton>
                        </div>
                    </div>
                )}
            </section>


            <section className="pt-6 border-t border-stone-800">
                <h3 className="text-lg font-semibold text-stone-200 mb-1">{t('toolsAndDiagnostics')}</h3>
                <p className="text-sm text-stone-400 mb-4">{t('detectedDevice')}: <span className="font-bold text-orange-400 capitalize">{deviceType}</span></p>
                <div className="space-y-2">
                  <MenuButton onClick={onStartInputTester}>{t('testInput')}</MenuButton>
                  {deviceType === 'desktop' && (
                    <MenuButton onClick={onToggleFullscreen}>
                      {isFullScreen ? <ExitFullscreenIcon className="h-5 w-5 text-orange-400" /> : <EnterFullscreenIcon className="h-5 w-5 text-orange-400" />}
                      {isFullScreen ? t('exitFullscreen') : t('enterFullscreen')}
                    </MenuButton>
                  )}
                </div>
            </section>
        </main>
      </div>
  );
};

export default MenuView;
