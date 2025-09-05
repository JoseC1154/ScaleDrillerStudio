import React, { useState } from 'react';
import { Chord, Instrument, Note, VoicingType, UserChord } from '../types';
import { playNoteSound } from '../services/sound';
import { ChevronLeftIcon, ChevronRightIcon, InfoIcon, ChevronUpIcon, ChevronDownIcon, SettingsIcon } from './Icons';
import IntervalInfoModal from './IntervalInfoModal';
import { ALL_NOTES } from '../constants';

interface ChordInfoPanelProps {
  chord: Chord | null;
  instrument: Instrument;
  chordVoicingNotes: string[];
  onTranspose: (semitones: number) => void;
  onOctaveChange: (direction: number) => void;
  isCustom?: boolean;
  selectedUserChords?: UserChord[];
  chordColorMap?: Map<string, string>;
  onInvertUp: () => void;
  onInvertDown: () => void;
  voicingType: VoicingType;
  onVoicingChange: (type: VoicingType) => void;
  isQuietMode?: boolean;
}

const ChordInfoPanel: React.FC<ChordInfoPanelProps> = ({ chord, instrument, chordVoicingNotes, onTranspose, onOctaveChange, isCustom = false, selectedUserChords = [], chordColorMap, onInvertUp, onInvertDown, voicingType, onVoicingChange, isQuietMode = false }) => {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [showTools, setShowTools] = useState(false);
  
  if (!chord) {
    return (
        <div className="bg-black/30 rounded-lg p-3 sm:p-4 flex items-center justify-center text-stone-400 min-h-[98px]">
            {isCustom ? 'Select or create a chord to view its details.' : 'Select some notes to begin...'}
        </div>
    );
  }

  const handlePlayChord = () => {
    chordVoicingNotes.forEach((uniqueId, index) => {
        setTimeout(() => {
            playNoteSound(uniqueId, instrument, isQuietMode);
        }, index * 100); // Faster Arpeggiation
    });
  };
  
  const displayName = isCustom || !chord.name.startsWith(chord.root)
    ? chord.name
    : `${chord.root} ${chord.name.replace(chord.root, '').trim()}`;

  const VoicingTools = () => (
    <>
        <div className="flex items-center gap-1">
            <button onClick={onInvertDown} className="p-2 rounded-full bg-stone-700 hover:bg-stone-600 text-white" aria-label="Invert Down">
                <ChevronDownIcon className="h-5 w-5" />
            </button>
            <span className="text-xs font-semibold text-stone-300 w-16 text-center">Inversion</span>
            <button onClick={onInvertUp} className="p-2 rounded-full bg-stone-700 hover:bg-stone-600 text-white" aria-label="Invert Up">
                <ChevronUpIcon className="h-5 w-5" />
            </button>
        </div>
        <div className="flex items-center gap-1">
            <button onClick={() => onTranspose(-1)} className="p-2 rounded-full bg-stone-700 hover:bg-stone-600 text-white" aria-label="Transpose Down">
                <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <span className="text-xs font-semibold text-stone-300 w-16 text-center">Transpose</span>
            <button onClick={() => onTranspose(1)} className="p-2 rounded-full bg-stone-700 hover:bg-stone-600 text-white" aria-label="Transpose Up">
                <ChevronRightIcon className="h-5 w-5" />
            </button>
        </div>
        <div className="flex items-center gap-1">
            <button onClick={() => onOctaveChange(-1)} className="p-2 rounded-full bg-stone-700 hover:bg-stone-600 text-white" aria-label="Octave Down">
                <ChevronDownIcon className="h-5 w-5" />
            </button>
            <span className="text-xs font-semibold text-stone-300 w-16 text-center">Octave</span>
            <button onClick={() => onOctaveChange(1)} className="p-2 rounded-full bg-stone-700 hover:bg-stone-600 text-white" aria-label="Octave Up">
                <ChevronUpIcon className="h-5 w-5" />
            </button>
        </div>
    </>
  );

  const isMultiSelect = selectedUserChords.length > 1;

  if (isMultiSelect) {
      return (
        <div className="bg-black/30 rounded-lg p-3 sm:p-4 flex flex-col gap-3">
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-orange-400">Multiple Chords</h3>
            <div className="mt-2 space-y-1 overflow-y-auto max-h-24 pr-2">
              {selectedUserChords.map(c => {
                  const color = chordColorMap?.get(c.id);
                  return (
                      <div key={c.id} className="flex items-center gap-2 text-sm">
                          {color && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />}
                          <span className="font-semibold text-stone-200 truncate">{c.name}</span>
                      </div>
                  );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center flex-wrap justify-center sm:justify-end gap-2">
                <button 
                    onClick={() => setShowTools(s => !s)} 
                    className={`md:hidden flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${showTools ? 'bg-orange-500 text-white' : 'bg-stone-700 hover:bg-stone-600 text-white'}`}
                >
                    <SettingsIcon className="h-4 w-4" /> Voicing Tools
                </button>
                <button onClick={handlePlayChord} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-semibold text-sm">
                    Play All
                </button>
            </div>
            <div className={`flex-col gap-2 ${showTools ? 'flex' : 'hidden'} md:flex md:flex-row md:flex-wrap md:justify-end`}>
                <VoicingTools />
            </div>
          </div>
        </div>
      );
  }

  return (
    <>
      <div className="bg-black/30 rounded-lg p-3 sm:p-4 flex flex-col gap-3">
        {/* Chord Info */}
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-xl sm:text-2xl font-bold text-orange-400">{displayName}</h3>
          <div className="mt-1 flex flex-wrap justify-center sm:justify-start items-center gap-x-2 gap-y-1">
            <div className="flex items-baseline flex-wrap justify-center sm:justify-start gap-x-3 gap-y-1">
            {chord.notes.map((note, index) => (
                <div key={index} className="flex items-baseline">
                <span className="font-semibold text-stone-100 text-lg">{note}</span>
                <span className="text-xs text-stone-400 ml-1">({chord.intervals[index]})</span>
                </div>
            ))}
            <button 
                onClick={() => setIsInfoModalOpen(true)}
                className="text-stone-400 hover:text-white p-1 rounded-full hover:bg-stone-700/50"
                aria-label="About interval abbreviations"
            >
                <InfoIcon className="h-5 w-5" />
            </button>
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col gap-2">
            {/* Main Controls - always visible */}
            <div className="flex items-center flex-wrap justify-center sm:justify-end gap-2">
                {!isCustom && (
                    <div className="flex items-center">
                        <button onClick={() => onVoicingChange('close')} className={`px-3 py-1.5 rounded-l-md text-xs font-semibold transition-colors ${voicingType === 'close' ? 'bg-orange-500 text-white' : 'bg-stone-700 hover:bg-stone-600 text-white'}`}>
                            Close
                        </button>
                        <button onClick={() => onVoicingChange('spread')} className={`px-3 py-1.5 rounded-r-md text-xs font-semibold transition-colors ${voicingType === 'spread' ? 'bg-orange-500 text-white' : 'bg-stone-700 hover:bg-stone-600 text-white'}`}>
                            Spread
                        </button>
                    </div>
                )}
                <button 
                    onClick={() => setShowTools(s => !s)} 
                    className={`md:hidden flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${showTools ? 'bg-orange-500 text-white' : 'bg-stone-700 hover:bg-stone-600 text-white'}`}
                >
                    <SettingsIcon className="h-4 w-4" /> Voicing Tools
                </button>
                <button onClick={handlePlayChord} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-semibold text-sm">
                    Play Chord
                </button>
            </div>

            {/* Hidden Tools for Mobile */}
            <div className={`flex-col gap-2 ${showTools ? 'flex' : 'hidden'} md:flex md:flex-row md:flex-wrap md:justify-end`}>
                <VoicingTools />
            </div>
        </div>
      </div>

      {isInfoModalOpen && <IntervalInfoModal onClose={() => setIsInfoModalOpen(false)} />}
    </>
  );
};

export default ChordInfoPanel;