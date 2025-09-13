import React, { useState, useEffect, memo, forwardRef } from 'react';
import { Note, Scale, DrillMode, QuizPhase } from '../types';
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
    size?: 'default' | 'small' | 'compact';
    dimUnfocusedNotes?: boolean;
    colors?: string[];
}

const Fret = forwardRef<HTMLButtonElement, FretProps>(({ note, fretNum, uniqueFretId, isHighlighted, isCorrect, isIncorrect, onClick, showInlay, labelMode, scale, customLabel, isDisabled, liveVolume, isMine, isActive = true, isRevealed, drillMode, quizPhase, isSacrificed, size = 'default', dimUnfocusedNotes = false, colors }, ref) => {
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
    
    const isDoubleMarkerFret = fretNum === 12 || fretNum === 24;
    const fretStyle: React.CSSProperties = {};
    const useLiveGlow = isHighlighted && !isCorrect && !isFlashing && liveVolume !== undefined;

    const baseClasses = `
        ${isCompact ? 'w-4 h-4 sm:w-5 sm:h-5' : isSmall ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-7 h-7 sm:w-8 sm:h-8'}
        rounded-full flex items-center justify-center 
        ${isCompact ? 'text-[9px]' : isSmall ? 'text-xs' : 'text-sm'}
        font-semibold transition-all duration-150 z-10
    `;
    let stateClasses = ``;
    const isMultiColor = colors && colors.length > 0;
    const isAnyActiveState = isMine || isCorrect || isFlashing || isHighlighted || isMultiColor;
    const isDimmed = dimUnfocusedNotes && !isAnyActiveState && !isRevealed;

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

    // State Priority: Mine > Correct > Flashing > Multi-Color > Highlighted > Revealed > Dimmed > Placeholder > Default
    if (isMine) {
        stateClasses = '!bg-red-500 !text-white ring-2 ring-white transform scale-105';
    } else if (isCorrect) {
        stateClasses = '!bg-green-400 !text-black ring-2 ring-white transform scale-105';
    } else if (isFlashing) {
        stateClasses = '!bg-red-500 !text-black ring-2 ring-white transform scale-105';
    } else if (isMultiColor) {
        stateClasses = '!text-black shadow-lg transform scale-105 ring-2 ring-white/80';
        if (colors.length === 1) {
            fretStyle.backgroundColor = colors[0];
        } else {
            const step = 100 / colors.length;
            const gradient = colors.map((color, i) => `${color} ${i * step}% ${(i + 1) * step}%`).join(', ');
            fretStyle.background = `conic-gradient(from 90deg, ${gradient})`;
        }
    } else if (isHighlighted && !useLiveGlow) {
        stateClasses = '!bg-orange-400 !text-black shadow-lg transform scale-105 ring-2 ring-orange-600';
    } else if (isRevealed) {
        stateClasses = '!bg-purple-700 !text-white shadow-sm';
    } else if (isDimmed) {
        stateClasses = 'bg-transparent text-transparent opacity-40';
    } else if (isPlaceholder) {
        stateClasses = 'bg-transparent text-transparent hover:bg-white/10';
    } else {
        stateClasses = `bg-transparent text-stone-400 hover:bg-white/20 hover:text-white`;
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
    if (drillMode === 'Degree Dash' || quizPhase === 'pre-round-animation' || isSacrificed) {
        shouldShowContent = !!isRevealed || !!customLabel;
    } else if (drillMode === 'Key Conjurer') {
        // In this mode, labels are shown for revealed notes (hints or earned)
        shouldShowContent = isRevealed;
    }

    const singleInlayClasses = `absolute bg-gray-200 bg-opacity-40 rounded-full z-0 ${isSmall ? 'w-1.5 h-1.5 sm:w-2 sm:h-2' : 'w-2 h-2 sm:w-2.5 sm:h-2.5'}`;
    const doubleInlayTopClasses = `absolute bg-gray-200 bg-opacity-40 rounded-full z-0 ${isSmall ? '-translate-y-2 w-1.5 h-1.5 sm:-translate-y-2.5 sm:w-2 sm:h-2' : '-translate-y-3 w-2 h-2 sm:w-2.5 sm:h-2.5'}`;
    const doubleInlayBottomClasses = `absolute bg-gray-200 bg-opacity-40 rounded-full z-0 ${isSmall ? 'translate-y-2 w-1.5 h-1.5 sm:translate-y-2.5 sm:w-2 sm:h-2' : 'translate-y-3 w-2 h-2 sm:w-2.5 sm:h-2.5'}`;


    return (
        <div className="relative flex-1 flex items-center justify-center h-full">
            {/* Inlays */}
            {showInlay && !isDoubleMarkerFret && (
                <div className={singleInlayClasses}></div>
            )}
            {showInlay && isDoubleMarkerFret && (
                <>
                    <div className={doubleInlayTopClasses}></div>
                    <div className={doubleInlayBottomClasses}></div>
                </>
            )}

            {/* Note Marker Button */}
            <button
                ref={ref}
                id={`fret-${uniqueFretId}`}
                onClick={(e) => !isDisabled && onClick(e)}
                aria-label={`Play note ${note}`}
                className={`${baseClasses} ${stateClasses}`}
                style={fretStyle}
            >
              <span className={labelAnimationClass}>
                {isMine ? <XMarkIcon className={isSmall ? 'h-4 w-4' : 'h-5 w-5'} /> : (shouldShowContent && displayLabel)}
              </span>
            </button>
        </div>
    );
});


export default memo(Fret);
