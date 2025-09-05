
import React, { useMemo, useRef } from 'react';
import { Note, Scale, DrillMode, QuizPhase } from '../types';
import { ALL_NOTES } from '../constants';
import PianoKey from './PianoKey';

interface PianoProps {
  onNotePlayed: (note: string, event?: React.MouseEvent) => void;
  highlightedNotes?: string[];
  correctNotes?: string[];
  incorrectNote?: string | null;
  labelMode?: 'notes' | 'degrees';
  scale?: Scale | null;
  noteLabels?: { [uniqueId: string]: string | number };
  disabledNotes?: string[];
  disabled?: boolean;
  activeNotes?: string[];
  justRevealedNotes?: string[];
  liveVolume?: number;
  mineNotes?: string[];
  revealedNoteNames?: Set<Note>;
  drillMode?: DrillMode;
  quizPhase?: QuizPhase;
  animatingSacrifice?: Set<Note>;
  size?: 'default' | 'small' | 'compact';
  range: { startMidi: number; keyCount: number };
  dimUnfocusedNotes?: boolean;
  multiColorNotes?: Map<string, string[]>;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export const Piano: React.FC<PianoProps> = ({ onNotePlayed, highlightedNotes = [], correctNotes = [], incorrectNote = null, labelMode = 'notes', scale = null, noteLabels, disabledNotes, disabled, activeNotes, justRevealedNotes, liveVolume, mineNotes = [], revealedNoteNames, drillMode, quizPhase, animatingSacrifice, size = 'default', range, dimUnfocusedNotes = false, multiColorNotes, containerRef }) => {
  const keyRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const pianoKeys = useMemo(() => {
    const keys: { note: Note; octave: number; uniqueKey: string }[] = [];
    const { keyCount, startMidi } = range;

    for (let i = 0; i < keyCount; i++) {
        const midiNumber = startMidi + i;
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
  }, [range]);

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
    <div ref={containerRef} className="w-full overflow-x-auto overflow-y-hidden rounded-lg">
      <div className="flex flex-nowrap min-w-max relative bg-black gap-px items-start p-1">
        {pianoKeys.map(({ note, octave, uniqueKey }) => {
          const isCorrect = correctUniqueIds.has(uniqueKey) || correctNoteNames.has(note);
          const isHighlighted = highlightedUniqueIds.has(uniqueKey) || highlightedNoteNames.has(note);
          const isActive = activeNotes ? activeNotes.includes(uniqueKey) : true;
          const isJustRevealed = justRevealedNotes?.includes(uniqueKey);
          const isMine = mineNotes.includes(uniqueKey);
          const isRevealed = revealedNoteNames?.has(note) ?? false;
          const isSacrificed = animatingSacrifice?.has(note) ?? false;
          const colors = multiColorNotes?.get(uniqueKey);
          
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
              isDisabled={disabled || disabledNotes?.includes(uniqueKey)}
              isActive={isActive}
              isJustRevealed={isJustRevealed}
              liveVolume={liveVolume}
              isMine={isMine}
              isRevealed={isRevealed}
              drillMode={drillMode}
              quizPhase={quizPhase}
              isSacrificed={isSacrificed}
              size={size}
              dimUnfocusedNotes={dimUnfocusedNotes}
              colors={colors}
            />
          );
        })}
      </div>
    </div>
  );
};
