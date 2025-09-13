

import React, { useState, useMemo, useCallback } from 'react';
import { UserData, UserChord, Note, ChordTypeName, InstanceState, DrillSettings, Chord, Language } from '../types';
import { PlusIcon, TrashIcon, CloseIcon } from './Icons';
import { identifyChordFromMidi, noteIdToMidi } from '../services/music';
import { addUserChord } from '../services/userData';
import CustomChordBuilder from './CustomChordBuilder';
import { Piano } from './Piano';
import { ALL_NOTES } from '../constants';
import { createTranslator } from '../services/translations';

interface ChordLibraryPanelProps {
  userData: UserData;
  onUserDataUpdate: (newUserData: UserData) => void;
  selectedChordIds: string[];
  onToggleChord: (id: string) => void;
  onDelete: (id: string) => void;
  instrument: DrillSettings['instrument'];
  setSelectedChordIds: React.Dispatch<React.SetStateAction<string[]>>;
  setInstanceStates: React.Dispatch<React.SetStateAction<Record<string, InstanceState>>>;
  onClose: () => void;
  language: Language;
}

const UserChordSelector: React.FC<ChordLibraryPanelProps> = ({ 
    userData, onUserDataUpdate, selectedChordIds, onToggleChord, onDelete, instrument, setSelectedChordIds, setInstanceStates, onClose, language
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newChordNotes, setNewChordNotes] = useState<string[]>([]);
  const [newChordName, setNewChordName] = useState('');
  const t = createTranslator(language);

  const handleStartCreation = () => {
    setNewChordNotes([]);
    setNewChordName('');
    setIsCreating(true);
  };

  const handleToggleNoteCreation = (noteId: string) => {
    setNewChordNotes(prev => {
        const newNotes = prev.includes(noteId) ? prev.filter(n => n !== noteId) : [...prev, noteId];
        const midiNotes = newNotes.map(noteIdToMidi);
        const detected = identifyChordFromMidi(midiNotes);
        if (detected) {
            setNewChordName(`${detected.root} ${detected.typeName}`);
        } else if (newNotes.length < 2) {
            setNewChordName('');
        }
        return newNotes;
    });
  };

  const handleSaveChord = () => {
    if (newChordNotes.length === 0 || newChordName.trim() === '') return;
    const { newUserData, newChord } = addUserChord(userData, { name: newChordName, notes: newChordNotes });
    onUserDataUpdate(newUserData);
    setIsCreating(false);
    
    if (newChord) {
      setSelectedChordIds(prev => [...prev, newChord.id]);
      setInstanceStates(prev => ({
        ...prev,
        [newChord.id]: {
          instrument: 'Piano',
          transpose: 0,
          octaveShift: 0,
          inversion: 0,
          voicing: 'close',
          playbackStyle: 'arpeggio',
          playbackNoteDuration: '4/4',
        }
      }));
    }
  };

  // Fix: Combined filtering logic into one useMemo hook and added explicit typing to fix inference issues.
  const groupedChords: Record<string, UserChord[]> = useMemo(() => {
    const allUserChords = userData.userChords || [];

    if (searchTerm.trim()) {
      return {
        'Search Results': allUserChords.filter(chord =>
          chord.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      };
    }

    const groups: Record<string, UserChord[]> = {};
    const sortedChords = [...allUserChords].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedChords.forEach(chord => {
        const root = chord.notes[0]?.replace(/-?\d.*$/, '') || 'Unknown'; 
        if (!groups[root]) {
            groups[root] = [];
        }
        groups[root].push(chord);
    });

    const orderedGroups: Record<string, UserChord[]> = {};
    ALL_NOTES.forEach(note => {
        if (groups[note]) {
            orderedGroups[note] = groups[note];
        }
    });

    Object.keys(groups).forEach(root => {
        if (!orderedGroups[root]) {
            orderedGroups[root] = groups[root];
        }
    });

    return orderedGroups;
  }, [userData.userChords, searchTerm]);


  if (isCreating) {
    return (
      <div className="h-full flex flex-col gap-4 p-2 bg-stone-900 border border-stone-700/50 rounded-xl">
        <CustomChordBuilder
          name={newChordName}
          notes={newChordNotes}
          onNameChange={setNewChordName}
          onSave={handleSaveChord}
          onClear={() => setNewChordNotes([])}
          onCancel={() => setIsCreating(false)}
          detectedChord={identifyChordFromMidi(newChordNotes.map(noteIdToMidi))}
          language={language}
        />
        <div className="flex-1 min-h-0 min-w-0 overflow-hidden rounded-lg">
          <Piano
            onNotePlayed={handleToggleNoteCreation}
            highlightedNotes={newChordNotes}
            range={{ startMidi: 36, keyCount: 61 }}
            size="compact"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-900 border border-stone-700/50 rounded-xl w-full h-full flex flex-col">
        <header className="px-4 pt-4 pb-2 flex-shrink-0 border-b border-stone-800">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-orange-400">{t('myChords')}</h2>
                <button onClick={onClose} className="text-stone-400 hover:text-white" aria-label="Close">
                    <CloseIcon className="h-6 w-6" />
                </button>
            </div>
             <div className="flex justify-between items-center mt-2 gap-2">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search my chords..."
                    className="w-full bg-stone-800 border border-stone-600 rounded-md px-3 py-2 text-white placeholder-stone-500 focus:ring-orange-500 focus:border-orange-500"
                />
                <button 
                    onClick={handleStartCreation}
                    disabled={instrument !== 'Piano'}
                    title={instrument === 'Piano' ? "Create a new chord using the piano" : "Custom chords can only be created with the Piano instrument"}
                    className="flex-shrink-0 flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:bg-stone-600 disabled:cursor-not-allowed text-white text-sm font-semibold px-3 py-2 rounded-md transition-colors"
                >
                    <PlusIcon className="h-5 w-5" />
                    New
                </button>
            </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4">
            <section className="space-y-4">
                {Object.keys(groupedChords).length === 0 ? (
                    <div className="text-center text-stone-400 py-4">
                    <p>{searchTerm ? 'No chords match your search.' : 'Your chord library is empty.'}</p>
                    </div>
                ) : (
                    Object.entries(groupedChords).map(([root, chords]) => (
                        <div key={root}>
                            <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wider mb-2">{searchTerm ? root : `${root} Chords`}</h4>
                            <div className="space-y-2">
                                {chords.map(chord => {
                                    const isSelected = selectedChordIds.includes(chord.id);
                                    return (
                                        <div
                                        key={chord.id}
                                        onClick={() => onToggleChord(chord.id)}
                                        className={`p-3 rounded-lg flex justify-between items-center group transition-all duration-200 cursor-pointer ${isSelected ? 'bg-orange-500/30 ring-1 ring-orange-400' : 'bg-stone-800 hover:bg-stone-700'}`}
                                        >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded-md flex-shrink-0 border-2 transition-colors ${isSelected ? 'bg-orange-500 border-orange-300' : 'bg-stone-700 border-stone-600'}`}></div>
                                            <span className="font-semibold text-stone-100">{chord.name}</span>
                                        </div>
                                        <button
                                                onClick={(e) => { e.stopPropagation(); onDelete(chord.id); }}
                                                className="p-1.5 text-stone-500 hover:text-red-500 rounded-full hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label={`Delete ${chord.name}`}
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    );
                                })}
                             </div>
                        </div>
                    ))
                )}
            </section>
        </div>
    </div>
  );
};

export default UserChordSelector;
