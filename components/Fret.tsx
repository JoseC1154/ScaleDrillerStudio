

import React, { useMemo, useState, useEffect, memo, forwardRef } from 'react';
import { Note, Handedness, Scale, DrillMode, QuizPhase } from '../types';
import { XMarkIcon } from './Icons';

interface FretProps {
    note: Note;
    fretNum: number;
    uniqueFretId: string;
    isHighlighted: boolean;
    isCorrect: boolean;
    isIncorrect: boolean;
    onClick: (event: React.MouseEvent) => void;
    showInlay: boolean;
    labelMode: 'notes' | 'degrees';
    scale: Scale | null;
    customLabel?: string | number;
    isDisabled?: boolean;
    liveVolume?: number;
    isMine?: boolean;
    isActive?: boolean;
    isRevealed?: boolean;
    drillMode?: DrillMode;
    quizPhase?: QuizPhase;
    isSacrificed?: boolean;
}

const Fret = forwardRef<HTMLButtonElement, FretProps>(({ note, fretNum, uniqueFretId, isHighlighted, isCorrect, isIncorrect, onClick, showInlay, labelMode, scale, customLabel, isDisabled, liveVolume, isMine, isActive = true, isRevealed, drillMode, quizPhase, isSacrificed }, ref) => {
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
    
    const isDoubleMarkerFret = fretNum === 12;
    const fretStyle: React.CSSProperties = {};
    const useLiveGlow = isHighlighted && !isCorrect && !isFlashing && liveVolume !== undefined;

    const baseClasses = 'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-150 z-10';
    let stateClasses = ``;

    if (isPlaceholder) {
        stateClasses = 'bg-transparent text-transparent group-hover:bg-white/10';
    } else {
        stateClasses = `bg-transparent text-stone-400 group-hover:bg-white/20 group-hover:text-white`;
    }

    // Override with specific states
    if (isMine) {
        stateClasses = '!bg-red-500 !text-white ring-2 ring-white transform scale-105';
    } else if (isCorrect) {
        stateClasses = '!bg-green-400 !text-black ring-2 ring-white transform scale-105';
    } else if (isFlashing) {
        stateClasses = '!bg-red-500 !text-black ring-2 ring-white transform scale-105';
    } else if (isHighlighted && !useLiveGlow) {
        stateClasses = '!bg-orange-400 !text-black shadow-lg transform scale-105 ring-2 ring-orange-600';
    } else if (isRevealed) {
        stateClasses = '!bg-sky-700 !text-white shadow-sm';
    }


    if (useLiveGlow && liveVolume !== undefined) {
        const brightness = Math.max(0.1, liveVolume);
        const lightness = 25 + (brightness * 30);
        const color = `hsl(32, 96%, ${lightness}%)`;
        fretStyle.backgroundColor = color;
        fretStyle.color = brightness > 0.4 ? '#1c1917' : 'rgba(245, 245, 244, 0.8)';
        fretStyle.boxShadow = `0 0 ${brightness * 15}px ${color}`;
        fretStyle.transform = `scale(${1 + brightness * 0.05})`;
        fretStyle.transition = 'all 50ms ease-out';
    }


    if (isDisabled) {
        stateClasses += ' opacity-30 !cursor-not-allowed';
    }

    let displayLabel: string | number = customLabel || note;
    if (labelMode === 'degrees' && scale && !customLabel) {
        const degreeIndex = scale.notes.indexOf(note);
        if (degreeIndex !== -1) {
            displayLabel = (degreeIndex + 1).toString();
        }
    }
    
    let labelAnimationClass = '';
    if (quizPhase === 'pre-round-animation') labelAnimationClass = 'animate-note-fall';
    else if (isSacrificed) labelAnimationClass = 'animate-note-sacrifice-fall';

    let shouldShowContent = !isPlaceholder || customLabel || isMine || isCorrect || isRevealed;
    if (drillMode === 'Key Conjurer' || drillMode === 'Degree Dash' || quizPhase === 'pre-round-animation' || isSacrificed) {
        shouldShowContent = !!isRevealed || !!customLabel;
    }

    return (
        <div 
          className="relative flex-1 flex items-center justify-center h-10 sm:h-12 group"
          onClick={(e) => !isDisabled && onClick(e)}
          style={!isDisabled ? { cursor: 'pointer' } : {}}
        >
            {/* Inlays */}
            {showInlay && !isDoubleMarkerFret && (
                <div className="absolute w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gray-200 bg-opacity-40 rounded-full z-0"></div>
            )}
            {showInlay && isDoubleMarkerFret && (
                <>
                    <div className="absolute -translate-y-3 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gray-200 bg-opacity-40 rounded-full z-0"></div>
                    <div className="absolute translate-y-3 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gray-200 bg-opacity-40 rounded-full z-0"></div>
                </>
            )}

            {/* Note Marker Button */}
            <button
                ref={ref}
                id={`fret-${uniqueFretId}`}
                aria-label={`Play note ${note}`}
                className={`${baseClasses} ${stateClasses} pointer-events-none`}
                style={fretStyle}
                tabIndex={-1}
            >
              <span className={labelAnimationClass}>
                {isMine ? <XMarkIcon className="h-5 w-5" /> : (shouldShowContent && displayLabel)}
              </span>
            </button>
        </div>
    );
});


export default memo(Fret);