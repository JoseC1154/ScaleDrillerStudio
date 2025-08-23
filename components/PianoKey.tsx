

import React, { useMemo, useRef, useState, useEffect, memo, forwardRef } from 'react';
import { Note, Scale, DrillMode, QuizPhase } from '../types';
import { XMarkIcon } from './Icons';

interface PianoKeyProps {
  note: Note;
  isBlack: boolean;
  isHighlighted: boolean;

  isCorrect: boolean;
  isIncorrect: boolean;
  onClick: (note: string, event: React.MouseEvent) => void;
  octave?: number;
  labelMode?: 'notes' | 'degrees';
  scale?: Scale | null;
  uniqueKey: string;
  customLabel?: string | number;
  isDisabled?: boolean;
  isActive?: boolean;
  isJustRevealed?: boolean;
  liveVolume?: number;
  isMine?: boolean;
  isRevealed?: boolean;
  drillMode?: DrillMode;
  quizPhase?: QuizPhase;
  isSacrificed?: boolean;
}

const PianoKey = forwardRef<HTMLDivElement, PianoKeyProps>(({ note, isBlack, isHighlighted, isCorrect, isIncorrect, onClick, octave, labelMode, scale, uniqueKey, customLabel, isDisabled, isActive = true, isJustRevealed, liveVolume, isMine, isRevealed, drillMode, quizPhase, isSacrificed }, ref) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const isPlaceholder = !isActive;

  useEffect(() => {
    if (isIncorrect) {
      setIsFlashing(true);
      const timer1 = setTimeout(() => setIsFlashing(false), 150);
      const timer2 = setTimeout(() => setIsFlashing(true), 300);
      const timer3 = setTimeout(() => setIsFlashing(false), 450);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isIncorrect]);

  const useLiveGlowEffect = isHighlighted && liveVolume !== undefined && !isCorrect && !isIncorrect;
  const keyStyle: React.CSSProperties = {};

  if (useLiveGlowEffect && liveVolume !== undefined) {
      const brightness = Math.max(0.1, liveVolume);
      const lightness = 25 + (brightness * 30);
      const color = `hsl(32, 96%, ${lightness}%)`;
      keyStyle.backgroundColor = color;
      keyStyle.borderColor = `hsl(32, 96%, ${lightness - 10}%)`;
      keyStyle.color = brightness > 0.4 ? 'black' : 'rgba(255,255,255,0.7)';
      keyStyle.boxShadow = `0 0 ${brightness * 15}px 0px ${color}`;
      keyStyle.transition = 'all 50ms ease-out';
  }

  const keyClasses = [
    'relative', 'border-stone-800', 'transition-all', 'duration-100', 'flex', 'items-end', 'justify-center', 'pb-2',
    isBlack ? 'h-28 w-7 -ml-3.5 -mr-3.5 z-10 rounded-b-md' : 'h-48 w-12',
    
    // State Colors (highest priority)
    isMine ? (isBlack ? '!bg-red-600 !border-red-700 text-white' : '!bg-red-500 !border-red-600 text-white')
    : isCorrect ? (isBlack ? '!bg-green-400 !border-green-400 text-black' : '!bg-green-300 !border-green-300 text-black')
    : isFlashing ? (isBlack ? '!bg-red-500 !border-red-500 text-black' : '!bg-red-400 !border-red-400 text-black')
    : !useLiveGlowEffect && isHighlighted ? '!bg-orange-400 !border-orange-600 text-black'
    : isRevealed ? (isBlack ? '!bg-sky-800 text-white' : '!bg-sky-200 text-black')
    
    // Base color
    : isPlaceholder ? (isBlack ? 'bg-stone-900' : 'bg-black border border-stone-800')
    : (isBlack ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black') + ' border',

    // Interactivity
    isDisabled ? 'opacity-50 filter grayscale cursor-not-allowed' : 'cursor-pointer',
    !isDisabled && (isPlaceholder ? 'hover:bg-stone-700' : (isBlack ? 'hover:bg-gray-700' : 'hover:bg-gray-200')),

    // Animation
    isJustRevealed ? 'animate-key-appear' : ''
  ].filter(Boolean).join(' ');


  let displayLabel: string | number = customLabel || note;
  let showOctaveNumber = note === 'C' && octave !== undefined;

  // Only show label if the key is not a placeholder, or has a specific reason to be shown
  let shouldShowLabel = !isPlaceholder || customLabel || isMine || isCorrect || isRevealed;

  if (labelMode === 'degrees' && scale && !customLabel) {
    const degreeIndex = scale.notes.indexOf(note);
    if (degreeIndex !== -1) {
      displayLabel = (degreeIndex + 1).toString();
      showOctaveNumber = false;
    }
  }

  let labelAnimationClass = '';
  if (quizPhase === 'pre-round-animation') labelAnimationClass = 'animate-note-fall';
  else if (isSacrificed) labelAnimationClass = 'animate-note-sacrifice-fall';
  
  if (drillMode === 'Key Conjurer' || drillMode === 'Degree Dash' || quizPhase === 'pre-round-animation' || isSacrificed) {
    shouldShowLabel = !!isRevealed || !!customLabel;
    if (isRevealed || customLabel) {
        showOctaveNumber = note === 'C' && octave !== undefined && drillMode !== 'Degree Dash';
    } else {
        showOctaveNumber = false;
    }
  }

  return (
    <div ref={ref} id={uniqueKey} className={keyClasses} style={keyStyle} onClick={(e) => !isDisabled && onClick(uniqueKey, e)}>
        {isMine ? (
            <XMarkIcon className="h-5 w-5" />
        ) : shouldShowLabel && (
          <div className={`flex flex-col items-center ${labelAnimationClass}`}>
            <span className={`font-semibold ${displayLabel.toString().length > 1 ? 'text-xs' : 'text-sm'}`}>
              {displayLabel === '❌' ? (
                <XMarkIcon className="h-5 w-5 text-red-400" />
              ) : displayLabel}
            </span>
            {showOctaveNumber && (
              <span className={`text-[10px] mt-0.5 font-medium ${isHighlighted || isCorrect || isIncorrect ? 'text-black opacity-70' : 'text-gray-500'}`}>
                C{octave}
              </span>
            )}
          </div>
      )}
    </div>
  );
});

export default memo(PianoKey);
