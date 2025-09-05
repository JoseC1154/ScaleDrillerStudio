import React, { useState, useMemo, useCallback, useRef } from 'react';
import { UserData, Note, ChordTypeName, InstanceState, VoicingType, Chord } from '../types';
import { ALL_NOTES, CHORD_DEFINITIONS } from '../constants';
import { createChordFromDefinition, getNoteIndex, getNoteFromIndex, getChord, applyInversion, applyVoicing, getChordCentroid, calculateMidiRange, mapMidiToFretboardVoicing, midiToNoteId } from '../services/music';
import { addUserChord } from '../services/userData';
import { Piano } from './Piano';
import Fretboard from './Fretboard';
import ChordInstanceToolbar from './ChordInstanceToolbar';
import { CloseIcon, ChordIcon, SettingsIcon } from './Icons';
import FeedbackBadge from './FeedbackBadge';

const CHORD_GROUPS: Record<string, ChordTypeName[]> = {
    'Dyads': ['Power Chord', 'Perfect Fifth', 'Major Third Dyad', 'Minor Third Dyad'],
    'Triads': ['Major', 'Minor', 'Diminished', 'Augmented', 'Suspended 2', 'Suspended 4', 'Flat Five'],
    'Sevenths': ['Dominant 7th', 'Major 7th', 'Minor 7th', 'Minor Major 7th', 'Diminished 7th', 'Half-Diminished 7th', 'Augmented 7th', 'Augmented Major 7th'],
    'Added Tones': ['Major 6th', 'Minor 6th', 'add2', 'add9', 'add11', 'Major 6th/9th'],
    'Extended': ['Dominant 9th', 'Major 9th', 'Minor 9th', 'Dominant 11th', 'Major 11th', 'Minor 11th', 'Dominant 13th', 'Major 13th', 'Minor 13th'],
    'Altered': ['Dominant 7th b5', 'Dominant 7th #5', 'Dominant 7th b9', 'Dominant 7th #9', 'Altered Dominant'],
    'Special': ['Quartal']
};

// --- Chord Selector Modal ---
interface ChordSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChord: (root: Note, typeName: ChordTypeName) => void;
}

const ChordSelectorModal: React.FC<ChordSelectorModalProps> = ({ isOpen, onClose, onSelectChord }) => {
    const [selectedRoot, setSelectedRoot] = useState<Note>('C');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-stone-900 border border-stone-700/50 rounded-xl w-full max-w-2xl h-[90vh] max-h-[700px] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="px-4 pt-4 pb-2 flex-shrink-0 border-b border-stone-800">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-orange-400">Select a Chord</h2>
                        <button onClick={onClose} className="text-stone-400 hover:text-white" aria-label="Close">
                            <CloseIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-stone-300 mb-2">1. Select a Root Note</label>
                        <div className="grid grid-cols-6 gap-2">
                            {ALL_NOTES.map(note => (
                                <button key={note} onClick={() => setSelectedRoot(note)} className={`py-2 px-1 rounded-md text-sm font-semibold transition-all duration-200 w-full border ${selectedRoot === note ? 'bg-orange-500 text-white border-orange-400 scale-110 shadow-lg' : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'}`}>
                                    {note}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <main className="flex-1 min-h-0 overflow-y-auto p-4">
                    <label className="block text-sm font-medium text-stone-300 mb-2">2. Choose a Chord Type</label>
                     <div className="space-y-3">
                        {Object.entries(CHORD_GROUPS).map(([groupName, chordTypes]) => (
                            <div key={groupName}>
                                <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wider mb-2">{groupName}</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {(chordTypes as ChordTypeName[]).map(typeName => (
                                        <button
                                            key={typeName}
                                            onClick={() => onSelectChord(selectedRoot, typeName)}
                                            className="text-left p-2 rounded-lg transition-all duration-200 bg-stone-800 hover:bg-stone-700 hover:ring-1 hover:ring-orange-500"
                                        >
                                            <span className="font-semibold text-sm text-stone-100">{typeName}</span>
                                            <span className="block text-xs text-stone-400">
                                                e.g., {`${selectedRoot}${CHORD_DEFINITIONS[typeName].symbol}`}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}


// --- Main Dictionary Component ---
interface DictionaryProps {
  userData: UserData;
  onUserDataUpdate: (newUserData: UserData) => void;
}

const Dictionary: React.FC<DictionaryProps> = ({ userData, onUserDataUpdate }) => {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [activeChord, setActiveChord] = useState<{ root: Note, typeName: ChordTypeName } | null>(null);
  const [previewState, setPreviewState] = useState<InstanceState>({
    instrument: 'Piano',
    transpose: 0,
    octaveShift: 0,
    inversion: 0,
    voicing: 'close',
    playbackStyle: 'arpeggio',
    playbackNoteDuration: '4/4',
  });
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelectChord = (root: Note, typeName: ChordTypeName) => {
    setActiveChord({ root, typeName });
    setPreviewState({
        instrument: 'Piano',
        transpose: 0,
        octaveShift: 0,
        inversion: 0,
        voicing: 'close',
        playbackStyle: 'arpeggio',
        playbackNoteDuration: '4/4',
    });
    setIsSelectorOpen(false);
  };

  const handleStateChange = (newState: Partial<InstanceState>) => {
    setPreviewState(prev => ({ ...prev, ...newState }));
  };

  const handleAddChordToLibrary = () => {
    if (!activeChord) return;
    
    const definition = CHORD_DEFINITIONS[activeChord.typeName];
    const name = `${activeChord.root}${definition.symbol}`;
    const newChordData = createChordFromDefinition(activeChord.root, activeChord.typeName, name, 4);

    if (newChordData) {
        const { newUserData } = addUserChord(userData, newChordData);
        onUserDataUpdate(newUserData);
        setFeedbackMessage(`'${name}' added to My Chords!`);
        setTimeout(() => setFeedbackMessage(null), 2000);
    }
  };

  const { fullChord, voicedMidi } = useMemo(() => {
    if (!activeChord) return { fullChord: null, voicedMidi: [] };
    
    const chord = getChord(activeChord.root, activeChord.typeName);
    const definition = CHORD_DEFINITIONS[activeChord.typeName];
    const baseMidiNotes = definition.formula.map(interval => (getNoteIndex(activeChord.root) % 12) + (4 * 12) + interval);
    
    let notes = baseMidiNotes.map(n => n + previewState.transpose + (previewState.octaveShift * 12));
    notes = applyInversion(notes, previewState.inversion);
    notes = applyVoicing(notes, previewState.voicing);

    return { fullChord: chord, voicedMidi: notes };
  }, [activeChord, previewState]);
  
  const centroid = useMemo(() => getChordCentroid(voicedMidi), [voicedMidi]);

  const pianoRange = useMemo(() => calculateMidiRange({ centroidMidi: centroid, octaves: 4 }), [centroid]);
  const fretboardRange = useMemo(() => ({ startFret: 0, fretCount: 24 }), []);
  
  const voicedNotes = useMemo(() => {
    if (previewState.instrument === 'Piano') return voicedMidi.map(midiToNoteId);
    return mapMidiToFretboardVoicing(voicedMidi, previewState.instrument);
  }, [voicedMidi, previewState.instrument]);

  const centerOnChord = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
  }, []);

  const instrumentComponent = useMemo(() => {
    const commonProps = {
      onNotePlayed: () => {}, // Read-only
      highlightedNotes: voicedNotes,
      containerRef,
    };
    switch (previewState.instrument) {
      case 'Piano': return <Piano {...commonProps} range={pianoRange} size="compact" />;
      case 'Guitar':
      case 'Bass': return <Fretboard {...commonProps} instrument={previewState.instrument} handedness="Right" labelMode="notes" scale={null} range={fretboardRange} size="compact" />;
      default: return null;
    }
  }, [voicedNotes, previewState.instrument, pianoRange, fretboardRange]);

  return (
    <div className="w-full h-full flex flex-col text-white p-2">
      {feedbackMessage && <FeedbackBadge text={feedbackMessage} />}
      <header className="flex-shrink-0 flex flex-wrap gap-2 items-center justify-between mb-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-orange-400">Chord Dictionary</h2>
        <button
            onClick={() => setIsSelectorOpen(true)}
            className="flex items-center gap-2 bg-stone-700 hover:bg-stone-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
            <ChordIcon className="h-5 w-5" />
            <span>Select a Chord</span>
        </button>
      </header>
      
      <main className="flex-1 flex flex-col min-h-0 bg-stone-800/50 rounded-lg shadow-lg overflow-hidden">
        {activeChord && fullChord ? (
            <>
                <ChordInstanceToolbar
                    instrument={previewState.instrument}
                    setInstrument={(instrument) => handleStateChange({ instrument })}
                    transpose={(delta) => handleStateChange({ transpose: previewState.transpose + delta })}
                    shiftOctave={(delta) => handleStateChange({ octaveShift: previewState.octaveShift + delta })}
                    cycleInversion={() => handleStateChange({ inversion: (previewState.inversion + 1) % fullChord.notes.length })}
                    voicing={previewState.voicing}
                    setVoicing={(voicing) => handleStateChange({ voicing })}
                    playbackStyle={previewState.playbackStyle}
                    onPlaybackStyleChange={(style) => handleStateChange({ playbackStyle: style })}
                    playbackNoteDuration={previewState.playbackNoteDuration}
                    onPlaybackNoteDurationChange={(duration) => handleStateChange({ playbackNoteDuration: duration })}
                    onCenter={centerOnChord}
                />
                <div className="flex-1 min-h-0 min-w-0">{instrumentComponent}</div>
                <footer className="flex-shrink-0 p-3 bg-black/30 flex flex-wrap gap-4 justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-stone-100">{fullChord.name}</h3>
                        <p className="text-sm text-stone-400">Notes: {fullChord.notes.join(', ')}</p>
                    </div>
                    <button onClick={handleAddChordToLibrary} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition">
                        Add to My Chords
                    </button>
                </footer>
            </>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-stone-400">
                <h3 className="text-2xl font-bold text-stone-200">Welcome to the Chord Dictionary!</h3>
                <p className="mt-2 max-w-md">
                    Click "Select a Chord" to open the library and explore different chord types.
                </p>
            </div>
        )}
      </main>

      <ChordSelectorModal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelectChord={handleSelectChord}
      />
    </div>
  );
};
export default Dictionary;