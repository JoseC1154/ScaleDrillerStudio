import React, { useState } from 'react';
import { Instrument, VoicingType, Language } from '../types';
import {
  ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon,
  PianoIcon, GuitarIcon, BassIcon, SettingsIcon, CenterIcon, TrashIcon,
  ArpeggioIcon, BoxChordIcon, PlayIcon
} from './Icons';
import { createTranslator } from '../services/translations';

interface ChordInstanceToolbarProps {
  instrument: Instrument;
  setInstrument: (instrument: Instrument) => void;
  transpose: (delta: number) => void;
  shiftOctave: (delta: number) => void;
  cycleInversion: () => void;
  voicing: VoicingType;
  setVoicing: (voicing: VoicingType) => void;
  playbackStyle: 'arpeggio' | 'box';
  onPlaybackStyleChange: (style: 'arpeggio' | 'box') => void;
  playbackNoteDuration: '1/4' | '1/2' | '4/4';
  onPlaybackNoteDurationChange: (duration: '1/4' | '1/2' | '4/4') => void;
  onCenter: () => void;
  onPlay?: () => void;
  onDelete?: () => void;
  language: Language;
}

const ToolButton: React.FC<{ onClick: () => void, children: React.ReactNode, label: string, active?: boolean }> = ({ onClick, children, label, active = false }) => (
  <button
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`p-2 rounded-md transition-colors ${active ? 'bg-orange-500 text-white' : 'bg-stone-700 hover:bg-stone-600 text-stone-200'}`}
  >
    {children}
  </button>
);

const ChordInstanceToolbar: React.FC<ChordInstanceToolbarProps> = ({
  instrument, setInstrument, transpose, shiftOctave, cycleInversion, voicing, setVoicing, 
  playbackStyle, onPlaybackStyleChange, playbackNoteDuration, onPlaybackNoteDurationChange,
  onCenter, onPlay, onDelete, language
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = createTranslator(language);

  const mainTools = (
    <>
      {onPlay && <ToolButton onClick={onPlay} label={t('playChord')}><PlayIcon className="h-5 w-5" /></ToolButton>}
      <div className="flex gap-1 p-1 bg-stone-800 rounded-lg">
        <ToolButton onClick={() => setInstrument('Piano')} label={t('switchToPiano')} active={instrument === 'Piano'}><PianoIcon className="h-5 w-5" /></ToolButton>
        <ToolButton onClick={() => setInstrument('Guitar')} label={t('switchToGuitar')} active={instrument === 'Guitar'}><GuitarIcon className="h-5 w-5" /></ToolButton>
        <ToolButton onClick={() => setInstrument('Bass')} label={t('switchToBass')} active={instrument === 'Bass'}><BassIcon className="h-5 w-5" /></ToolButton>
      </div>
      <ToolButton onClick={onCenter} label={t('centerChord')}><CenterIcon className="h-5 w-5" /></ToolButton>
    </>
  );

  const expansionTools = (
    <>
      <div className="flex gap-1 items-center">
        <ToolButton onClick={() => transpose(-1)} label={t('transposeDown')}><ChevronLeftIcon className="h-5 w-5" /></ToolButton>
        <span className="text-xs font-semibold text-stone-300 w-16 text-center">{t('transpose')}</span>
        <ToolButton onClick={() => transpose(1)} label={t('transposeUp')}><ChevronRightIcon className="h-5 w-5" /></ToolButton>
      </div>
      <div className="flex gap-1 items-center">
        <ToolButton onClick={() => shiftOctave(-1)} label={t('octaveDown')}><ChevronDownIcon className="h-5 w-5" /></ToolButton>
        <span className="text-xs font-semibold text-stone-300 w-16 text-center">{t('octave')}</span>
        <ToolButton onClick={() => shiftOctave(1)} label={t('octaveUp')}><ChevronUpIcon className="h-5 w-5" /></ToolButton>
      </div>
       <div className="flex gap-1 items-center">
        <ToolButton onClick={() => cycleInversion()} label={t('cycleInversion')}><span className="font-bold text-lg leading-none">Inv</span></ToolButton>
        <div className="flex p-1 bg-stone-800 rounded-lg">
            <ToolButton onClick={() => setVoicing('close')} label={t('closeVoicing')} active={voicing === 'close'}><span className="text-xs px-1">{t('closeVoicing')}</span></ToolButton>
            <ToolButton onClick={() => setVoicing('spread')} label={t('spreadVoicing')} active={voicing === 'spread'}><span className="text-xs px-1">{t('spreadVoicing')}</span></ToolButton>
        </div>
      </div>
      <div className="flex items-center gap-1 p-1 bg-stone-800 rounded-lg">
        <ToolButton onClick={() => onPlaybackStyleChange('arpeggio')} label={t('arpeggio')} active={playbackStyle === 'arpeggio'}><ArpeggioIcon className="h-4 w-4" /></ToolButton>
        <ToolButton onClick={() => onPlaybackStyleChange('box')} label={t('boxChord')} active={playbackStyle === 'box'}><BoxChordIcon className="h-4 w-4" /></ToolButton>
      </div>
      <div className="flex items-center gap-1 p-1 bg-stone-800 rounded-lg">
        <ToolButton onClick={() => onPlaybackNoteDurationChange('1/4')} label={t('quarterNote')} active={playbackNoteDuration === '1/4'}><span className="text-xs px-1">1/4</span></ToolButton>
        <ToolButton onClick={() => onPlaybackNoteDurationChange('1/2')} label={t('halfNote')} active={playbackNoteDuration === '1/2'}><span className="text-xs px-1">1/2</span></ToolButton>
        <ToolButton onClick={() => onPlaybackNoteDurationChange('4/4')} label={t('wholeNote')} active={playbackNoteDuration === '4/4'}><span className="text-xs px-1">4/4</span></ToolButton>
      </div>
       {onDelete && <ToolButton onClick={onDelete} label={t('deleteChord')}><TrashIcon className="h-5 w-5 text-red-400" /></ToolButton>}
    </>
  );


  return (
    <div className="bg-black/30 rounded-t-lg p-2 space-y-2">
      <div className="flex gap-2 items-center">
        <div className="hidden md:flex gap-2 flex-wrap">{mainTools}</div>
        <div className="hidden md:flex gap-2 flex-wrap">{expansionTools}</div>
        
        {/* Mobile Layout */}
        <div className="flex md:hidden gap-2 items-center flex-grow">
            {mainTools}
            <ToolButton onClick={() => setIsExpanded(!isExpanded)} label={t('moreTools')} active={isExpanded}>
                <SettingsIcon className="h-5 w-5"/>
            </ToolButton>
             {onDelete && <ToolButton onClick={onDelete} label={t('deleteChord')}><TrashIcon className="h-5 w-5 text-red-400" /></ToolButton>}
        </div>
      </div>
      {isExpanded && (
          <div className="md:hidden flex flex-col gap-2 items-start p-2 border-t border-stone-700">
            {expansionTools}
          </div>
      )}
    </div>
  );
};

export default ChordInstanceToolbar;