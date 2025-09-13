import React, { useState, useEffect, memo, forwardRef } from 'react';
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
  size?: 'default' | 'small' | 'compact';
  dimUnfocusedNotes?: boolean;
  colors?: string[];
}

const PianoKey = forwardRef<HTMLDivElement, PianoKeyProps>(({ note, isBlack, isHighlighted, isCorrect, isIncorrect, onClick, octave, labelMode, scale, uniqueKey, customLabel, isDisabled, isActive = true, isJustRevealed, liveVolume, isMine, isRevealed, drillMode, quizPhase, isSacrificed, size = 'default', dimUnfocusedNotes = false, colors }, ref) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const isPlaceholder = !isActive;
  const isSmall = size === 'small';
  const isCompact = size === 'compact';

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

  const hasMultiColor = colors && colors.length > 0;
  if (hasMultiColor) {
      if (colors.length === 1) {
          keyStyle.backgroundColor = colors[0];
      } else {
          const step = 100 / colors.length;
          const gradient = colors.map((color, i) => `${color} ${i * step}% ${(i + 1) * step}%`).join(', ');
          keyStyle.background = `conic-gradient(from 90deg, ${gradient})`;
      }
  }
  
  const isAnyActiveState = isMine || isCorrect || isFlashing || (!useLiveGlowEffect && isHighlighted) || hasMultiColor;
  const isDimmed = dimUnfocusedNotes && !isAnyActiveState && !isRevealed;

  let baseClassOverride = '';
  if (isMine) baseClassOverride = '!bg-red-500 text-white';
  else if (isCorrect) baseClassOverride = '!bg-green-300 text-black';
  else if (isFlashing) baseClassOverride = '!bg-red-400 text-black';
  else if (hasMultiColor) baseClassOverride = 'text-black';
  else if (!useLiveGlowEffect && isHighlighted) baseClassOverride = '!bg-orange-400 text-black';
  else if (isRevealed) baseClassOverride = isBlack ? '!bg-purple-800 text-white' : '!bg-purple-300 text-black';
  else if (isPlaceholder) baseClassOverride = isBlack ? 'bg-stone-900 border border-black' : 'bg-black';
  else baseClassOverride = isBlack ? 'bg-gray-800 text-white border border-black' : 'bg-gray-100 text-black';


  const keyClasses = [
    'relative', 'transition-all', 'duration-100', 'flex', 'items-end', 'justify-center', 'border', 'rounded-b-md',
    isCompact ? 'pb-1' : (isSmall ? 'pb-1' : 'pb-2'),
    isBlack 
      ? (isCompact ? 'h-20 w-4 -ml-2 -mr-2 z-10' : (isSmall ? 'h-24 w-5 -ml-2.5 -mr-2.5 z-10' : 'h-36 w-7 -ml-3.5 -mr-3.5 z-10')) 
      : (isCompact ? 'h-32 w-7' : (isSmall ? 'h-40 w-9' : 'h-48 w-12')),
    
    // Consistent Outline for all active states
    isAnyActiveState ? 'ring-1 sm:ring-2 ring-black/50' : '',

    // Dimmed state for focus mode
    isDimmed ? 'opacity-40' : '',

    // State Colors (highest priority)
    baseClassOverride,

    // Interactivity
    isDisabled ? 'opacity-50 filter grayscale cursor-not-allowed' : 'cursor-pointer',
    !isAnyActiveState && (isPlaceholder ? 'hover:bg-stone-700' : (isBlack ? 'hover:bg-gray-700' : 'hover:bg-gray-200')),

    // Animation
    isJustRevealed ? 'animate-key-appear' : '',
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
  
  if (drillMode === 'Degree Dash' || quizPhase === 'pre-round-animation' || isSacrificed) {
    shouldShowLabel = !!isRevealed || !!customLabel;
    if (isRevealed || customLabel) {
        showOctaveNumber = note === 'C' && octave !== undefined && drillMode !== 'Degree Dash';
    } else {
        showOctaveNumber = false;
    }
  }

  if (drillMode === 'Key Conjurer') {
    // In this mode, labels are shown for revealed notes (hints or earned)
    shouldShowLabel = isRevealed;
    showOctaveNumber = false; // Keep it clean
  }

  const getFontSize = () => {
    const labelLength = displayLabel.toString().length;
    if (isCompact) return labelLength > 1 ? 'text-[8px]' : 'text-[10px]';
    if (isSmall) return labelLength > 1 ? 'text-[10px]' : 'text-xs';
    return labelLength > 1 ? 'text-xs' : 'text-sm';
  }

  return (
    <div ref={ref} id={uniqueKey} className={keyClasses} style={keyStyle} onClick={(e) => !isDisabled && onClick(uniqueKey, e)}>
        {isMine ? (
            <XMarkIcon className={isCompact ? 'h-3 w-3' : (isSmall ? 'h-4 w-4' : 'h-5 w-5')} />
        ) : shouldShowLabel && (
          <div className={`flex flex-col items-center ${labelAnimationClass}`}>
            <span className={`font-semibold ${getFontSize()}`}>
              {displayLabel === '❌' ? (
                <XMarkIcon className={`text-red-400 ${isCompact ? 'h-3 w-3' : (isSmall ? 'h-4 w-4' : 'h-5 w-5')}`} />
              ) : displayLabel}
            </span>
            {showOctaveNumber && (
              <span className={`mt-0.5 font-medium ${isHighlighted || isCorrect || isIncorrect || hasMultiColor ? 'text-black opacity-70' : 'text-gray-500'} ${isCompact ? 'text-[7px]' : (isSmall ? 'text-[8px]' : 'text-[10px]')}`}>
                C{octave}
              </span>
            )}
          </div>
      )}
    </div>
  );
});

export default memo(PianoKey);
