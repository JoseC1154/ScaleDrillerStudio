import React, { useState, useRef, useEffect } from 'react';
import { DrillSettings, Instrument, Handedness } from '../types';
import { PianoIcon, GuitarIcon, BassIcon } from './Icons';

const OptionButton: React.FC<{ value: any, current: any, onClick: () => void, children: React.ReactNode, disabled?: boolean, small?: boolean }> = ({ value, current, onClick, children, disabled, small }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 rounded-md font-medium transition-all duration-200 w-full flex items-center gap-2 justify-center ${small ? 'text-xs' : 'text-sm'} ${
        current === value ? 'bg-orange-500 text-white shadow-md' : 'bg-stone-800 hover:bg-stone-700'
      }`}
    >
      {children}
    </button>
);


interface InstrumentSelectorProps {
  settings: DrillSettings;
  onSettingChange: <K extends keyof DrillSettings>(key: K, value: DrillSettings[K]) => void;
}

const InstrumentSelector: React.FC<InstrumentSelectorProps> = ({ settings, onSettingChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const { instrument, handedness } = settings;

    const handleInstrumentChange = (newInstrument: Instrument) => {
        onSettingChange('instrument', newInstrument);
        if (newInstrument === 'Piano') {
            setIsOpen(false);
        }
    };

    const handleHandednessChange = (newHandedness: Handedness) => {
        onSettingChange('handedness', newHandedness);
        setIsOpen(false);
    };

    const getMainIcon = (instr: Instrument) => {
        switch (instr) {
            case 'Piano': return <PianoIcon className="h-8 w-8" />;
            case 'Guitar': return <GuitarIcon className="h-8 w-8" />;
            case 'Bass': return <BassIcon className="h-8 w-8" />;
            default: return null;
        }
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)
            ) {
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

    return (
        <div id="tutorial-instrument-selector" className="relative">
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(prev => !prev)}
                className="p-2 rounded-full text-green-200 transition-colors"
                style={{ filter: 'drop-shadow(0 0 2px #4ade80) drop-shadow(0 0 6px #4ade80)'}}
                title={`Selected Instrument: ${instrument}`}
            >
                {getMainIcon(instrument)}
            </button>

            {isOpen && (
                <div
                    ref={popoverRef}
                    className="absolute top-full mt-2 left-0 bg-stone-900/80 backdrop-blur-lg border border-stone-700 rounded-lg p-4 shadow-2xl w-56 z-50 space-y-4"
                >
                    <div>
                        <label className="block text-xs font-medium text-stone-400 mb-2">Instrument</label>
                        <div className="space-y-2">
                             <OptionButton value="Piano" current={instrument} onClick={() => handleInstrumentChange('Piano')}>
                                <PianoIcon className="h-5 w-5" /> <span>Piano</span>
                            </OptionButton>
                            <OptionButton value="Guitar" current={instrument} onClick={() => handleInstrumentChange('Guitar')}>
                                <GuitarIcon className="h-5 w-5" /> <span>Guitar</span>
                            </OptionButton>
                            <OptionButton value="Bass" current={instrument} onClick={() => handleInstrumentChange('Bass')}>
                                <BassIcon className="h-5 w-5" /> <span>Bass</span>
                            </OptionButton>
                        </div>
                    </div>

                    {(instrument === 'Guitar' || instrument === 'Bass') && (
                        <div className="border-t border-stone-700 pt-3 mt-3">
                            <label className="block text-xs font-medium text-stone-400 mb-2">Handedness</label>
                            <div className="grid grid-cols-2 gap-2">
                                <OptionButton value="Right" current={handedness} onClick={() => handleHandednessChange('Right')} small>Right</OptionButton>
                                <OptionButton value="Left" current={handedness} onClick={() => handleHandednessChange('Left')} small>Left</OptionButton>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default InstrumentSelector;
