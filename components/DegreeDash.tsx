import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Scale, Instrument, Handedness, DegreeDashPhase, PerformanceUpdate, Note, DrillMode } from '../types';
import { getDegreeFromNote, getFretboardNotes } from '../services/music';
import { ALL_NOTES, BASS_TUNING, GUITAR_TUNING } from '../constants';
import Piano from './Piano';
import Fretboard from './Fretboard';
import DegreeSelector from './DegreeSelector';

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

interface DegreeDashProps {
  scale: Scale;
  instrumentSettings: { instrument: Instrument; handedness: Handedness; };
  phase: DegreeDashPhase;
  round: number;
  disableHints: boolean;
  onUpdatePerformance: (update: PerformanceUpdate) => void;
  onPlacement: (isCorrect: boolean) => void;
  onRoundComplete: () => void;
}

const DegreeDash: React.FC<DegreeDashProps> = ({ scale, instrumentSettings, phase, round, disableHints, onUpdatePerformance, onPlacement, onRoundComplete }) => {
    const [scaleNotesOnInstrument, setScaleNotesOnInstrument] = useState<string[]>([]);
    const [placedNotes, setPlacedNotes] = useState<Record<string, number>>({});
    const [activeNote, setActiveNote] = useState<string | null>(null);
    const [incorrectNoteFeedback, setIncorrectNoteFeedback] = useState<string | null>(null);
    
    // Effect to determine all valid scale note positions on the current instrument
    useEffect(() => {
        let allInstrumentNotes: string[] = [];
        if (instrumentSettings.instrument === 'Piano') {
            for (let i = 24; i < 24 + 61; i++) {
                const note = ALL_NOTES[i % 12];
                const octave = Math.floor(i / 12) - 1;
                allInstrumentNotes.push(`${note}${octave}`);
            }
        } else {
            const tuning = instrumentSettings.instrument === 'Guitar' ? GUITAR_TUNING : BASS_TUNING;
            allInstrumentNotes = getFretboardNotes(tuning, 12).map(n => `${n.note}-${n.string}-${n.fret}`);
        }

        const notesOnInstrument = allInstrumentNotes.filter(id => {
            const noteName = id.replace(/-?\d.*$/, '');
            return scale.notes.includes(noteName as Note);
        });
        setScaleNotesOnInstrument(notesOnInstrument);
    }, [scale, instrumentSettings.instrument]);
    
    // Effect to set initial hints based on the round number
    useEffect(() => {
        if (disableHints || scaleNotesOnInstrument.length === 0) {
            setPlacedNotes({});
            return;
        }

        const hintPercentages: { [key: number]: number } = { 1: 0.7, 2: 0.6, 3: 0.4, 4: 0.2, 5: 0.1 };
        let hintsToPlace: Record<string, number> = {};

        if (round <= 5) {
            const hintPercent = hintPercentages[round] || 0;
            const numHints = Math.floor(scaleNotesOnInstrument.length * hintPercent);
            
            const shuffledNotes = shuffleArray([...scaleNotesOnInstrument]);
            const hintNotes = shuffledNotes.slice(0, numHints);
            
            for (const noteId of hintNotes) {
                const noteName = noteId.replace(/-?\d.*$/, '') as Note;
                const degree = getDegreeFromNote(noteName, scale);
                if (degree) {
                    hintsToPlace[noteId] = degree;
                }
            }
        } else { // Timed finale (round 6)
            if (scaleNotesOnInstrument.length > 0) {
                const shuffledNotes = shuffleArray([...scaleNotesOnInstrument]);
                const hintNoteId = shuffledNotes[0];
                const noteName = hintNoteId.replace(/-?\d.*$/, '') as Note;
                const degree = getDegreeFromNote(noteName, scale);
                if (degree) {
                    hintsToPlace[hintNoteId] = degree;
                }
            }
        }
        
        setPlacedNotes(hintsToPlace);
    }, [scale, round, scaleNotesOnInstrument, disableHints]);

    const handleNoteClick = useCallback((noteId: string) => {
        if (scaleNotesOnInstrument.includes(noteId) && !placedNotes[noteId]) {
            setActiveNote(noteId);
        }
    }, [scaleNotesOnInstrument, placedNotes]);

    const handleDegreeSelect = useCallback((degree: number) => {
        if (!activeNote) {
            setActiveNote(null);
            return;
        }

        const activeNoteName = activeNote.replace(/-?\d.*$/, '') as Note;
        const correctDegree = getDegreeFromNote(activeNoteName, scale);
        const isCorrect = degree === correctDegree;
        
        onUpdatePerformance({ key: scale.key, scaleType: scale.type, drillMode: disableHints ? 'Degree Dash Pro' : 'Degree Dash', isCorrect });
        onPlacement(isCorrect);
        
        if (isCorrect) {
            const newPlaced = { ...placedNotes, [activeNote]: degree };
            setPlacedNotes(newPlaced);

            if (Object.keys(newPlaced).length === scaleNotesOnInstrument.length) {
                onRoundComplete();
            }
        } else {
            setIncorrectNoteFeedback(activeNote);
            setTimeout(() => setIncorrectNoteFeedback(null), 500);
        }

        setActiveNote(null);
    }, [activeNote, scale, placedNotes, scaleNotesOnInstrument, onUpdatePerformance, onPlacement, onRoundComplete, disableHints]);
    
    const handleCloseSelector = useCallback(() => setActiveNote(null), []);

    const instrumentComponent = useMemo(() => {
        const drillMode: DrillMode = disableHints ? 'Degree Dash Pro' : 'Degree Dash';
        const props = {
            onNotePlayed: handleNoteClick,
            highlightedNotes: scaleNotesOnInstrument,
            noteLabels: placedNotes,
            correctNotes: Object.keys(placedNotes),
            incorrectNote: incorrectNoteFeedback,
            scale: null, // Hide default degree labels
            drillMode: drillMode
        };
        switch(instrumentSettings.instrument) {
            case 'Piano':
                return <Piano {...props} />;
            case 'Guitar':
            case 'Bass':
                return <Fretboard {...props} instrument={instrumentSettings.instrument} handedness={instrumentSettings.handedness} labelMode="degrees" />;
            default:
                return null;
        }
    }, [handleNoteClick, scaleNotesOnInstrument, placedNotes, incorrectNoteFeedback, instrumentSettings, disableHints]);
    
    const prompt = useMemo(() => {
        const title = disableHints ? 'Degree Dash Pro' : 'Degree Dash';
        const phaseText = phase === 'timed_finale' ? 'Final Challenge' : `Round ${round}/5`;
        return `${phaseText}: Fill in the ${scale.key} ${scale.type} scale degrees.`;
    }, [disableHints, phase, round, scale]);
    
    return (
        <div className="drill-layout flex-1 flex flex-col lg:flex-row gap-2 sm:gap-4 min-h-0 mt-2 sm:mt-4">
            {activeNote && (
                <DegreeSelector
                    onClose={handleCloseSelector}
                    onSelect={handleDegreeSelect}
                />
            )}
            <div className="instrument-panel relative flex-1 flex flex-col items-center justify-center min-h-0 min-w-0 lg:order-1 overflow-hidden rounded-lg">
                <div className="relative z-10 w-full flex-1 flex items-center justify-center">
                    {instrumentComponent}
                </div>
            </div>

            <div className="question-panel flex flex-col gap-2 sm:gap-4 lg:w-1/3 lg:max-w-sm lg:order-2">
                <div className="prompt-container text-center p-2 sm:p-4 rounded-lg border border-transparent bg-black/30 flex-1 flex flex-col justify-center">
                    <h3 className="text-base sm:text-lg font-bold text-stone-300 mb-2 sm:mb-4">{disableHints ? 'Degree Dash Pro' : 'Degree Dash'}</h3>
                    <p className="text-xl sm:text-2xl font-semibold text-stone-100 min-h-[40px] flex items-center justify-center">
                        {prompt}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default DegreeDash;