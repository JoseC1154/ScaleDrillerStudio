

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Note, Scale, DrillMode, QuizPhase } from '../types';
import { ALL_NOTES } from '../constants';
import PianoKey from './PianoKey';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface PianoProps {
  onNotePlayed: (note: string, event?: React.MouseEvent) => void;
  highlightedNotes?: string[];
  correctNotes?: string[];
  incorrectNote?: string | null;
  labelMode?: 'notes' | 'degrees';
  scale?: Scale | null;
  noteLabels?: { [uniqueId: string]: string | number };
  disabledNotes?: string[];
  activeNotes?: string[];
  justRevealedNotes?: string[];
  liveVolume?: number;
  mineNotes?: string[];
  revealedNoteNames?: Set<Note>;
  drillMode?: DrillMode;
  quizPhase?: QuizPhase;
  animatingSacrifice?: Set<Note>;
}

const START_MIDI_NOTE = 24; // Start from C1
const NUMBER_OF_KEYS = 61; // 5 octaves

const Piano: React.FC<PianoProps> = ({ onNotePlayed, highlightedNotes = [], correctNotes = [], incorrectNote = null, labelMode = 'notes', scale = null, noteLabels, disabledNotes, activeNotes, justRevealedNotes, liveVolume, mineNotes = [], revealedNoteNames, drillMode, quizPhase, animatingSacrifice }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const keyRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (el) {
      const scrollableWidth = el.scrollWidth - el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 5); // Add a small buffer
      setCanScrollRight(el.scrollLeft < scrollableWidth - 5);
    }
  }, []);

  useEffect(() => {
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
  }, [checkScroll]);

  const pianoKeys = useMemo(() => {
    const keys: { note: Note; octave: number; uniqueKey: string }[] = [];
    for (let i = 0; i < NUMBER_OF_KEYS; i++) {
        const midiNumber = START_MIDI_NOTE + i;
        if (midiNumber > 108) break; // C8 is MIDI 108
        const note = ALL_NOTES[midiNumber % 12];
        const octave = Math.floor(midiNumber / 12) - 1;
        keys.push({
            note,
            octave,
            uniqueKey: `${note}${octave}`,
        });
    }
    return keys;
  }, []);

  const { correctUniqueIds, correctNoteNames } = useMemo(() => {
    const uniqueIds = new Set<string>();
    const noteNames = new Set<string>();
    correctNotes.forEach(cn => {
        // A unique piano ID will always have a digit. A note name won't.
        if (/\d/.test(cn)) {
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
        if (/\d/.test(hn)) {
            uniqueIds.add(hn);
        } else {
            noteNames.add(hn);
        }
    });
    return { highlightedUniqueIds: uniqueIds, highlightedNoteNames: noteNames };
  }, [highlightedNotes]);
  
  return (
    <div className="relative w-full">
       {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center justify-center bg-gradient-to-r from-stone-900 via-stone-900/70 to-transparent pointer-events-none w-12 transition-opacity duration-300">
          <ChevronLeftIcon className="h-8 w-8 text-white opacity-50" />
        </div>
      )}
      <div className="flex justify-center w-full">
        <div ref={containerRef} className="p-4 bg-stone-900/70 backdrop-blur-lg rounded-lg overflow-x-auto">
          <div className="flex flex-nowrap min-w-max">
            {pianoKeys.map(({ note, octave, uniqueKey }) => {
              const isCorrect = correctUniqueIds.has(uniqueKey) || correctNoteNames.has(note);
              const isHighlighted = highlightedUniqueIds.has(uniqueKey) || highlightedNoteNames.has(note);
              const isActive = activeNotes ? activeNotes.includes(uniqueKey) : true;
              const isJustRevealed = justRevealedNotes?.includes(uniqueKey);
              const isMine = mineNotes.includes(uniqueKey);
              const isRevealed = revealedNoteNames?.has(note) ?? false;
              const isSacrificed = animatingSacrifice?.has(note) ?? false;
              
              return (
                <PianoKey
                  key={uniqueKey}
                  ref={el => { keyRefs.current[uniqueKey] = el; }}
                  note={note}
                  isBlack={note.includes('b') || note.includes('#')}
                  isHighlighted={isHighlighted}
                  isCorrect={isCorrect}
                  isIncorrect={incorrectNote === uniqueKey}
                  onClick={(note, e) => onNotePlayed(note, e)}
                  octave={octave}
                  labelMode={labelMode}
                  scale={scale}
                  uniqueKey={uniqueKey}
                  customLabel={noteLabels?.[uniqueKey]}
                  isDisabled={disabledNotes?.includes(uniqueKey)}
                  isActive={isActive}
                  isJustRevealed={isJustRevealed}
                  liveVolume={liveVolume}
                  isMine={isMine}
                  isRevealed={isRevealed}
                  drillMode={drillMode}
                  quizPhase={quizPhase}
                  isSacrificed={isSacrificed}
                />
              );
            })}
          </div>
        </div>
      </div>
       {canScrollRight && (
         <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center bg-gradient-to-l from-stone-900 via-stone-900/70 to-transparent pointer-events-none w-12 transition-opacity duration-300">
          <ChevronRightIcon className="h-8 w-8 text-white opacity-50" />
        </div>
      )}
    </div>
  );
};

export default Piano;
