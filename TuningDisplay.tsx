import React, { memo } from 'react';
import { TunerResult } from '../hooks/useTunerPitch';
import { Language } from '../types';
import { createTranslator } from '../services/translations';

interface TuningDisplayProps {
  tunerResult: TunerResult | null;
  isAudible: boolean;
  language: Language;
}

const TuningDisplay: React.FC<TuningDisplayProps> = ({ tunerResult, isAudible, language }) => {
  const t = createTranslator(language);

  if (!tunerResult || !tunerResult.targetNote) {
    return (
      <div className="text-center font-sans">
        <div className="text-8xl font-bold text-stone-600 opacity-50">--</div>
        <div className="text-lg text-stone-500">Play a note</div>
      </div>
    );
  }

  const { targetNote, centsOff } = tunerResult;
  const inTuneThreshold = 5; // Cents
  let statusText = '...';
  let colorClass = 'text-stone-400';
  let pulseClass = '';

  if (isAudible) {
    if (Math.abs(centsOff) <= inTuneThreshold) {
      statusText = 'In Tune';
      colorClass = 'text-green-400';
      pulseClass = 'animate-pulse';
    } else if (centsOff < 0) {
      statusText = 'Flat';
      colorClass = 'text-red-400';
    } else {
      statusText = 'Sharp';
      colorClass = 'text-yellow-400';
    }
  }

  return (
    <div className={`text-center font-sans transition-colors duration-200 ${colorClass}`}>
      <div className={`text-8xl font-bold flex items-baseline justify-center ${pulseClass}`} style={{textShadow: '0 0 15px currentColor'}}>
        <span>{targetNote.note}</span>
        <span className="text-5xl font-semibold opacity-80">{targetNote.octave}</span>
      </div>
      <div className="text-lg font-semibold">{statusText}</div>
    </div>
  );
};

export default memo(TuningDisplay);
