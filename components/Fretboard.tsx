


import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Note, Handedness, Scale, DrillMode, QuizPhase } from '../types.ts';
import { getFretboardNotes } from '../services/music.ts';
import { GUITAR_TUNING, BASS_TUNING } from '../constants.ts';
import Fret from './Fret.tsx';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons.tsx';

interface FretboardProps {
  instrument: 'Guitar' | 'Bass';
  onNotePlayed: (note: string, event?: React.MouseEvent) => void;
  highlightedNotes?: string[];
  correctNotes?: string[];
  incorrectNotes?: string[];
  handedness: Handedness;
  labelMode: 'notes' | 'degrees';
  scale: Scale | null;
  noteLabels?: { [uniqueId: string]: string | number };
  disabledNotes?: string[];
  visibleFretRange?: { start: number; end: number };
  liveVolume?: number;
  mineNotes?: string[];
  activeNotes?: string[];
  revealedNoteNames?: Set<Note>;
  drillMode?: DrillMode;
  quizPhase?: QuizPhase;
  animatingSacrifice?: Set<Note>;
  keyRefCallback?: (refs: Record<string, HTMLElement | null>) => void;
  isEndless?: boolean;
  scrollPosition?: number;
}

const Fretboard: React.FC<FretboardProps> = ({ instrument, onNotePlayed, highlightedNotes = [], correctNotes = [], incorrectNotes = [], handedness, labelMode, scale, noteLabels, disabledNotes, visibleFretRange, liveVolume, mineNotes = [], activeNotes, revealedNoteNames, drillMode, quizPhase, animatingSacrifice, keyRefCallback, isEndless = false, scrollPosition = 0 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fretRefs = useRef<Record<string, HTMLElement | null>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const tuning = instrument === 'Guitar' ? GUITAR_TUNING : BASS_TUNING;
  const fretCount = isEndless ? 60 : 12;
  const allNotes = getFretboardNotes(tuning, fretCount);
  const stringThicknessMap = instrument === 'Guitar' ? [1.5, 1.8, 2.2, 3.0, 3.8, 4.5] : [2.5, 3.2, 4.0, 4.8];
  const fretMarkers = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

  // When frets are rendered, report the refs up to the parent
  useEffect(() => {
    if (keyRefCallback) {
        // A timeout ensures all refs are populated after the render cycle
        const timer = setTimeout(() => keyRefCallback(fretRefs.current), 0);
        return () => clearTimeout(timer);
    }
  }, [keyRefCallback, allNotes]);


  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (el) {
      const scrollableWidth = el.scrollWidth - el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 5);
      setCanScrollRight(el.scrollLeft < scrollableWidth - 5);
    }
  }, []);

  useEffect(() => {
    if (isEndless) return;
    const el = containerRef.current;
    if (el) {
      checkScroll();
      el.addEventListener('scroll', checkScroll, { passive: true });
      const resizeObserver = new ResizeObserver(checkScroll);
      resizeObserver.observe(el);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        resizeObserver.unobserve(el);
      };
    }
  }, [checkScroll, isEndless]);

  const { correctUniqueIds, correctNoteNames } = useMemo(() => {
    const uniqueIds = new Set<string>();
    const noteNames = new Set<string>();
    correctNotes.forEach(cn => {
        if (cn.includes('-')) {
            uniqueIds.add(cn);
        } else {
            noteNames.add(cn);
        }
    });
    return { correctUniqueIds: uniqueIds, correctNoteNames: noteNames };
  }, [correctNotes]);

  const { highlightedUniqueIds, highlightedNoteNames } = useMemo(() => {
    const uniqueIds = new Set<string>();
    const noteNames = new Set<string>();
    highlightedNotes.forEach(hn => {
        if (hn.includes('-')) {
            uniqueIds.add(hn);
        } else {
            noteNames.add(hn);
        }
    });
    return { highlightedUniqueIds: uniqueIds, highlightedNoteNames: noteNames };
  }, [highlightedNotes]);

  const startFret = visibleFretRange?.start ?? 0;
  const endFret = visibleFretRange?.end ?? fretCount;

  return (
    <div className="relative w-full">
      {!isEndless && canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center justify-center bg-gradient-to-r from-stone-900 via-stone-900/70 to-transparent pointer-events-none w-12 transition-opacity duration-300">
          <ChevronLeftIcon className="h-8 w-8 text-white opacity-50" />
        </div>
      )}
      <div 
        ref={containerRef}
        className={`bg-stone-900/70 backdrop-blur-lg border border-stone-700/50 p-2 sm:p-4 rounded-lg shadow-lg w-full ${!isEndless ? 'overflow-x-auto' : 'overflow-hidden'}`}
      >
        <div className={`flex ${handedness === 'Left' ? 'flex-row-reverse' : ''}`} style={{ transform: isEndless ? `translateX(${scrollPosition}px)` : undefined, transition: isEndless ? 'transform 0.05s linear' : undefined }}>
            {/* Fretboard Neck */}
            <div className="min-w-max bg-gradient-to-r from-[#4a2e20] to-[#6f4533] rounded-md">
                <div className="relative flex flex-col">
                    {tuning.map((openNote, stringIndex) => {
                        const inlayStringIndex = instrument === 'Guitar' ? 2 : 1;
                        const uniqueOpenNoteId = `${openNote}-${stringIndex}-0`;
                        const isActiveOpenString = activeNotes ? activeNotes.includes(uniqueOpenNoteId) : true;
                        const isCorrectOpenString = correctUniqueIds.has(uniqueOpenNoteId) || correctNoteNames.has(openNote);
                        const isHighlightedOpenString = highlightedUniqueIds.has(uniqueOpenNoteId) || highlightedNoteNames.has(openNote);
                        const isIncorrectOpenString = incorrectNotes.includes(uniqueOpenNoteId);
                        const isOpenStringMine = mineNotes.includes(uniqueOpenNoteId);
                        const isRevealedOpenString = revealedNoteNames?.has(openNote) ?? false;
                        const isOpenStringSacrificed = animatingSacrifice?.has(openNote) ?? false;

                        const isVisible = !visibleFretRange || (visibleFretRange.start <= 0);
                        const isDisabled = disabledNotes?.includes(uniqueOpenNoteId);

                        const openStringStyle: React.CSSProperties = {};
                        const useLiveGlowEffect = isHighlightedOpenString && liveVolume !== undefined && !isCorrectOpenString && !isIncorrectOpenString;

                        const baseOpenStringClasses = 'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-150 z-20';
                        let stateOpenStringClasses = `bg-transparent text-stone-300 ${!isDisabled ? 'group-hover:bg-white/20 group-hover:text-white' : ''}`;
                        
                        if (isOpenStringMine) {
                            stateOpenStringClasses = '!bg-red-500 !text-white ring-2 ring-white transform scale-105';
                        } else if (isCorrectOpenString) {
                            stateOpenStringClasses = '!bg-green-400 !text-black ring-2 ring-white transform scale-105';
                        } else if (isIncorrectOpenString) {
                            stateOpenStringClasses = '!bg-red-500 !text-black ring-2 ring-white transform scale-105';
                        } else if (isHighlightedOpenString && !useLiveGlowEffect) {
                            stateOpenStringClasses = '!bg-orange-400 !text-black shadow-lg transform scale-105 ring-2 ring-orange-600';
                        } else if (isRevealedOpenString) {
                            stateOpenStringClasses = '!bg-sky-700 !text-white shadow-sm';
                        }
                        
                        if (useLiveGlowEffect && liveVolume !== undefined) {
                            const brightness = Math.max(0.1, liveVolume);
                            const lightness = 25 + (brightness * 30);
                            const color = `hsl(32, 96%, ${lightness}%)`;
                            openStringStyle.backgroundColor = color;
                            openStringStyle.color = brightness > 0.4 ? '#1c1917' : 'rgba(245, 245, 244, 0.8)';
                            openStringStyle.boxShadow = `0 0 ${brightness * 15}px ${color}`;
                            openStringStyle.transform = `scale(${1 + brightness * 0.05})`;
                            openStringStyle.transition = 'all 50ms ease-out';
                        }

                        if (isDisabled) {
                            stateOpenStringClasses += ' opacity-30 !cursor-not-allowed';
                        }

                        let openStringLabel: string | number = noteLabels?.[uniqueOpenNoteId] || openNote;
                        if (labelMode === 'degrees' && scale && !noteLabels?.[uniqueOpenNoteId]) {
                            const degreeIndex = scale.notes.indexOf(openNote);
                            if (degreeIndex !== -1) {
                                openStringLabel = (degreeIndex + 1).toString();
                            }
                        }

                        let shouldShowOpenStringLabel = isActiveOpenString || isRevealedOpenString || !!noteLabels?.[uniqueOpenNoteId];
                        if (drillMode === 'Key Conjurer' || drillMode === 'Degree Dash' || quizPhase === 'animation') {
                            shouldShowOpenStringLabel = !!isRevealedOpenString || !!noteLabels?.[uniqueOpenNoteId];
                        }
                        
                        let labelAnimationClass = '';
                        if (quizPhase === 'animation') labelAnimationClass = 'animate-note-fall';
                        else if (isOpenStringSacrificed) labelAnimationClass = 'animate-note-sacrifice-fall';

                        return (
                        <div key={stringIndex} className={`relative flex items-center h-10 sm:h-12 ${handedness === 'Left' ? 'flex-row-reverse' : ''}`}>
                            <div className="absolute w-full bg-gradient-to-r from-gray-500 to-gray-400 z-0" style={{ height: `${stringThicknessMap[stringIndex]}px`}}></div>
                            
                            <div
                                className="relative w-12 flex items-center justify-center h-full group"
                                onClick={(e) => isVisible && !isDisabled && onNotePlayed(uniqueOpenNoteId, e)}
                                style={isVisible && !isDisabled ? { cursor: 'pointer' } : {}}
                            >
                                <div className="absolute top-0 bottom-0 w-1.5 bg-gradient-to-b from-gray-100 via-gray-300 to-gray-100 z-10" style={handedness === 'Right' ? { right: 0 } : { left: 0 }}></div>
                                {isVisible && (
                                    <button
                                        ref={el => { fretRefs.current[uniqueOpenNoteId] = el; }}
                                        id={`fret-${uniqueOpenNoteId}`}
                                        aria-label={`Play open string ${openNote}`}
                                        className={`${baseOpenStringClasses} ${stateOpenStringClasses} pointer-events-none`}
                                        style={openStringStyle}
                                        tabIndex={-1}
                                    >
                                      <span className={labelAnimationClass}>
                                        {shouldShowOpenStringLabel ? openStringLabel : ''}
                                      </span>
                                    </button>
                                )}
                            </div>

                            <div className="flex">
                                {Array.from({ length: endFret - startFret + 1 }).map((_, fretIndex) => {
                                    const fretNum = startFret + fretIndex;
                                    const noteInfo = allNotes.find(n => n.string === stringIndex && n.fret === fretNum);
                                    if (!noteInfo) return null;
                                    
                                    const uniqueFretId = `${noteInfo.note}-${stringIndex}-${fretNum}`;
                                    const isActiveFret = activeNotes ? activeNotes.includes(uniqueFretId) : true;
                                    const isCorrectFret = correctUniqueIds.has(uniqueFretId) || correctNoteNames.has(noteInfo.note);
                                    const isHighlightedFret = highlightedUniqueIds.has(uniqueFretId) || highlightedNoteNames.has(noteInfo.note);
                                    const isIncorrectFret = incorrectNotes.includes(uniqueFretId);
                                    const isMineFret = mineNotes.includes(uniqueFretId);
                                    const isRevealedFret = revealedNoteNames?.has(noteInfo.note) ?? false;
                                    const isSacrificedFret = animatingSacrifice?.has(noteInfo.note) ?? false;

                                    return (
                                        <div key={fretNum} className="w-16 sm:w-20 relative flex items-center justify-center">
                                            <Fret
                                                ref={el => { fretRefs.current[uniqueFretId] = el; }}
                                                note={noteInfo.note}
                                                fretNum={fretNum}
                                                uniqueFretId={uniqueFretId}
                                                isHighlighted={isHighlightedFret}
                                                isCorrect={isCorrectFret}
                                                isIncorrect={isIncorrectFret}
                                                onClick={(e) => onNotePlayed(uniqueFretId, e)}
                                                showInlay={stringIndex === inlayStringIndex && fretMarkers.includes(fretNum)}
                                                labelMode={labelMode}
                                                scale={scale}
                                                customLabel={noteLabels?.[uniqueFretId]}
                                                isDisabled={disabledNotes?.includes(uniqueFretId)}
                                                liveVolume={liveVolume}
                                                isMine={isMineFret}
                                                isActive={isActiveFret}
                                                isRevealed={isRevealedFret}
                                                drillMode={drillMode}
                                                quizPhase={quizPhase}
                                                isSacrificed={isSacrificedFret}
                                            />
                                            <div className="absolute top-0 h-full w-0.5 bg-gradient-to-b from-gray-400 via-gray-300 to-gray-400 z-0" style={handedness === 'Right' ? { right: 0 } : { left: 0 }}></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>
       {!isEndless && canScrollRight && (
         <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center bg-gradient-to-l from-stone-900 via-stone-900/70 to-transparent pointer-events-none w-12 transition-opacity duration-300">
          <ChevronRightIcon className="h-8 w-8 text-white opacity-50" />
        </div>
      )}
    </div>
  );
};

export default Fretboard;