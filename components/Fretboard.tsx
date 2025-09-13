
import React, { useMemo, useRef } from 'react';
import { Note, Handedness, Scale, DrillMode, QuizPhase } from '../types';
import { getFretboardNotes } from '../services/music';
import { GUITAR_TUNING, BASS_TUNING } from '../constants';
import Fret from './Fret';

interface FretboardProps {
  instrument: 'Guitar' | 'Bass';
  onNotePlayed: (note: string, event?: React.MouseEvent) => void;
  highlightedNotes?: string[];
  correctNotes?: string[];
  incorrectNote?: string | null;
  handedness: Handedness;
  labelMode: 'notes' | 'degrees';
  scale: Scale | null;
  noteLabels?: { [uniqueId: string]: string | number };
  disabledNotes?: string[];
  disabled?: boolean;
  range?: { startFret: number; fretCount: number };
  liveVolume?: number;
  mineNotes?: string[];
  activeNotes?: string[];
  revealedNoteNames?: Set<Note>;
  drillMode?: DrillMode;
  quizPhase?: QuizPhase;
  animatingSacrifice?: Set<Note>;
  size?: 'default' | 'small' | 'compact';
  dimUnfocusedNotes?: boolean;
  multiColorNotes?: Map<string, string[]>;
  containerRef?: React.RefObject<HTMLDivElement>;
}

const Fretboard: React.FC<FretboardProps> = ({ instrument, onNotePlayed, highlightedNotes = [], correctNotes = [], incorrectNote = null, handedness, labelMode, scale, noteLabels, disabledNotes, disabled, range, liveVolume, mineNotes = [], activeNotes, revealedNoteNames, drillMode, quizPhase, animatingSacrifice, size = 'default', dimUnfocusedNotes = false, multiColorNotes, containerRef }) => {
  const fretRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const tuning = instrument === 'Guitar' ? GUITAR_TUNING : BASS_TUNING;
  const totalFretCount = 24;
  const allNotes = getFretboardNotes(tuning, totalFretCount);
  const stringThicknessMap = instrument === 'Guitar' ? [1.5, 1.8, 2.2, 3.0, 3.8, 4.5] : [2.5, 3.2, 4.0, 4.8];
  const fretMarkers = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
  const isCompact = size === 'compact';
  
  const startFret = range?.startFret ?? 0;
  const fretCount = range?.fretCount ?? 12;

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

  return (
      <div ref={containerRef} className="w-full p-2 sm:p-4 rounded-lg overflow-x-auto">
        <div className={`flex min-w-max ${handedness === 'Left' ? 'flex-row-reverse' : ''}`}>
            <div className="bg-gradient-to-r from-[#4a2e20] to-[#6f4533] rounded-md">
                <div className="relative flex flex-col">
                    {tuning.map((_, stringIndex) => {
                        const inlayStringIndex = instrument === 'Guitar' ? 2 : 1;
                        
                        return (
                        <div key={stringIndex} className={`relative flex items-center h-10 ${handedness === 'Left' ? 'flex-row-reverse' : ''}`}>
                            <div className="absolute w-full bg-gradient-to-r from-gray-500 to-gray-400 z-0" style={{ height: `${stringThicknessMap[stringIndex]}px`}}></div>
                            
                            <div className="flex-1 flex h-full">
                                {Array.from({ length: fretCount + 1 }).map((_, fretIndex) => {
                                    const fretNum = startFret + fretIndex;
                                    const noteInfo = allNotes.find(n => n.string === stringIndex && n.fret === fretNum);
                                    if (!noteInfo) return null;
                                    
                                    const uniqueFretId = `${noteInfo.note}-${stringIndex}-${fretNum}`;
                                    const isActiveFret = activeNotes ? activeNotes.includes(uniqueFretId) : true;
                                    const isCorrectFret = correctUniqueIds.has(uniqueFretId) || correctNoteNames.has(noteInfo.note);
                                    const isIncorrectKey = incorrectNote ? (/\d/.test(incorrectNote) || incorrectNote.includes('-') ? incorrectNote === uniqueFretId : incorrectNote === noteInfo.note) : false;
                                    const isHighlightedFret = highlightedUniqueIds.has(uniqueFretId) || highlightedNoteNames.has(noteInfo.note);
                                    const isMineFret = mineNotes.includes(uniqueFretId);
                                    const isRevealedFret = revealedNoteNames?.has(noteInfo.note) ?? false;
                                    const isSacrificedFret = animatingSacrifice?.has(noteInfo.note) ?? false;
                                    const colors = multiColorNotes?.get(uniqueFretId);

                                    return (
                                        <div key={fretNum} className={`flex-1 relative flex items-center justify-center ${isCompact ? 'min-w-[2rem]' : 'min-w-[3rem]'}`}>
                                            <Fret
                                                ref={el => { fretRefs.current[uniqueFretId] = el; }}
                                                note={noteInfo.note}
                                                fretNum={fretNum}
                                                uniqueFretId={uniqueFretId}
                                                isHighlighted={isHighlightedFret}
                                                isCorrect={isCorrectFret}
                                                isIncorrect={isIncorrectKey}
                                                onClick={(e) => onNotePlayed(uniqueFretId, e)}
                                                showInlay={stringIndex === inlayStringIndex && fretMarkers.includes(fretNum)}
                                                labelMode={labelMode}
                                                scale={scale}
                                                customLabel={noteLabels?.[uniqueFretId]}
                                                isDisabled={disabled || disabledNotes?.includes(uniqueFretId)}
                                                liveVolume={liveVolume}
                                                isMine={isMineFret}
                                                isActive={isActiveFret}
                                                isRevealed={isRevealedFret}
                                                drillMode={drillMode}
                                                quizPhase={quizPhase}
                                                isSacrificed={isSacrificedFret}
                                                size={size}
                                                dimUnfocusedNotes={dimUnfocusedNotes}
                                                colors={colors}
                                            />
                                            {fretNum > 0 && <div className="absolute top-0 h-full w-0.5 bg-gradient-to-b from-gray-400 via-gray-300 to-gray-400 z-0" style={handedness === 'Right' ? { right: 0 } : { left: 0 }}></div>}
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
  );
};

export default Fretboard;
