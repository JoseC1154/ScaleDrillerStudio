import React, { useState } from 'react';
import { Chord, Instrument, Note, VoicingType, UserChord, Language } from '../types';
import { playNoteSound } from '../services/sound';
import { ChevronLeftIcon, ChevronRightIcon, InfoIcon, ChevronUpIcon, ChevronDownIcon, SettingsIcon } from './Icons';
import IntervalInfoModal from './IntervalInfoModal';
import { ALL_NOTES } from '../constants';
import { createTranslator } from '../services/translations';
import ChordInstanceToolbar from './ChordInstanceToolbar';

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
  language: Language;
}

const ChordInfoPanel: React.FC<ChordInfoPanelProps> = ({ chord, instrument, chordVoicingNotes, onTranspose, onOctaveChange, isCustom = false, selectedUserChords = [], chordColorMap, onInvertUp, onInvertDown, voicingType, onVoicingChange, language }) => {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const t = createTranslator(language);
  
  if (!chord) {
    return (
        <div className="bg-black/30 rounded-lg p-3 sm:p-4 flex items-center justify-center text-stone-400 min-h-[98px]">
            {isCustom ? t('selectOrCreateChord') : t('selectNotesToBegin')}
        </div>
    );
  }

  const handlePlayChord = () => {
    chordVoicingNotes.forEach((uniqueId, index) => {
        setTimeout(() => {
            playNoteSound(uniqueId, instrument);
        }, index * 100); // Faster Arpeggiation
    });
  };
  
  const displayName = isCustom || !chord.name.startsWith(chord.root)
    ? chord.name
    : `${chord.root} ${chord.name.replace(chord.root, '').trim()}`;

  const VoicingTools = () => (
    <ChordInstanceToolbar
        instrument={instrument}
        setInstrument={() => {}} // This is a view-only panel for now
        transpose={onTranspose}
        shiftOctave={onOctaveChange}
        cycleInversion={onInvertUp} // Use up for cycling
        voicing={voicingType}
        setVoicing={onVoicingChange}
        playbackStyle='arpeggio'
        onPlaybackStyleChange={() => {}}
        playbackNoteDuration='4/4'
        onPlaybackNoteDurationChange={() => {}}
        onCenter={() => {}}
        onPlay={handlePlayChord}
        language={language}
    />
  );

  const isMultiSelect = selectedUserChords.length > 1;

  if (isMultiSelect) {
      return (
        <div className="bg-black/30 rounded-lg p-3 sm:p-4 flex flex-col gap-3">
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-orange-400">{t('multipleChords')}</h3>
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
                aria-label={t('aboutIntervals')}
            >
                <InfoIcon className="h-5 w-5" />
            </button>
            </div>
          </div>
        </div>
      </div>

      {isInfoModalOpen && <IntervalInfoModal onClose={() => setIsInfoModalOpen(false)} language={language} />}
    </>
  );
};

export default ChordInfoPanel;