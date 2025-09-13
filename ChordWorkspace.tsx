import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { DrillSettings, UserData, UserChord, InstanceState, SuggestedChord, Instrument, Language } from '../types';
import { noteIdToMidi, applyInversion, applyVoicing, getTransposedChordName, createChordFromDefinition, midiToNoteId } from '../services/music';
import { addUserChords } from '../services/userData';
import ChordInstance from './ChordInstance';
import UserChordSelector from './UserChordSelector';
import { PlusIcon, SparklesIcon, ChevronLeftIcon, ChevronRightIcon, ChordIcon, StopIcon, LoopIcon } from './Icons';
import { suggestChordProgression } from '../services/gemini';
import ProgressionSuggester from './ProgressionSuggester';
import { playNoteSound } from '../services/sound';
import { createTranslator } from '../services/translations';

const CHORD_COLORS = ['#34d399', '#fbbf24', '#60a5fa', '#f87171', '#a78bfa', '#fdba74', '#7dd3fc', '#f472b6'];

interface ChordWorkspaceProps {
  settings: DrillSettings;
  userData: UserData;
  onUserDataUpdate: (newUserData: UserData) => void;
  language: Language;
  selectedChordIds: string[];
  setSelectedChordIds: React.Dispatch<React.SetStateAction<string[]>>;
  instanceStates: Record<string, InstanceState>;
  setInstanceStates: React.Dispatch<React.SetStateAction<Record<string, InstanceState>>>;
}

const ChordWorkspace: React.FC<ChordWorkspaceProps> = ({ 
  settings, 
  userData, 
  onUserDataUpdate, 
  language,
  selectedChordIds,
  setSelectedChordIds,
  instanceStates,
  setInstanceStates
}) => {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isSuggesterOpen, setIsSuggesterOpen] = useState(false);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const [suggestionResult, setSuggestionResult] = useState<SuggestedChord[] | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingChordId, setPlayingChordId] = useState<string | null>(null);
  const [globalBpm, setGlobalBpm] = useState(120);
  
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isPlayingRef = useRef(false);
  const t = createTranslator(language);

  const playbackStateRef = useRef({
      chords: [] as UserChord[],
      states: {} as Record<string, InstanceState>,
      voicedMidis: new Map<string, number[]>(),
      instrument: 'Piano' as Instrument,
      globalBpm: 120,
  });

  const selectedChords = useMemo(() => {
    return selectedChordIds
      .map(id => userData.userChords.find(c => c.id === id))
      .filter((c): c is UserChord => !!c);
  }, [selectedChordIds, userData.userChords]);

  const updateInstanceState = useCallback((chordId: string, newState: Partial<InstanceState>) => {
    setInstanceStates(prev => ({
      ...prev,
      [chordId]: { 
        ...(prev[chordId] || {
            instrument: settings.instrument,
            transpose: 0,
            octaveShift: 0,
            inversion: 0,
            voicing: 'close',
            playbackStyle: 'arpeggio',
            playbackNoteDuration: '4/4',
        }), 
        ...newState 
      },
    }));
  }, [setInstanceStates, settings.instrument]);

  const allVoicedMidis = useMemo(() => {
    const map = new Map<string, number[]>();
    selectedChords.forEach(chord => {
      const state = instanceStates[chord.id];
      if (!state) return;
      
      const baseMidi = chord.notes.map(noteIdToMidi);
      let notes = baseMidi.map(n => n + state.transpose + (state.octaveShift * 12));
      notes = applyInversion(notes, state.inversion);
      notes = applyVoicing(notes, state.voicing);
      
      map.set(chord.id, notes);
    });
    return map;
  }, [selectedChords, instanceStates]);
  
  useEffect(() => {
    playbackStateRef.current = {
        chords: selectedChords,
        states: instanceStates,
        voicedMidis: allVoicedMidis,
        instrument: settings.instrument,
        globalBpm: globalBpm,
    };
  }, [selectedChords, instanceStates, allVoicedMidis, settings.instrument, globalBpm]);

  const stopPlayback = useCallback(() => {
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current = [];
    isPlayingRef.current = false;
    setIsPlaying(false);
    setPlayingChordId(null);
  }, []);

  const handlePlayOrStop = () => {
    if (isPlayingRef.current) {
        stopPlayback();
        return;
    }

    if (playbackStateRef.current.chords.length === 0) return;

    isPlayingRef.current = true;
    setIsPlaying(true);
    
    // Using a ref for the index avoids stale closures in recursive setTimeout
    const playbackIndexRef = { current: 0 };

    const playLoop = () => {
        // isPlayingRef.current is the source of truth for stopping.
        if (!isPlayingRef.current) {
            return;
        }
        
        const { chords, states, voicedMidis, instrument: defaultInstrument, globalBpm: bpm } = playbackStateRef.current;

        // This check is important if chords are removed during playback.
        if (chords.length === 0) {
            stopPlayback();
            return;
        }

        const safeIndex = playbackIndexRef.current % chords.length;
        const chord = chords[safeIndex];
        
        if (!chord) { // Should not happen with the check above, but for safety
            stopPlayback();
            return;
        }

        const state = states[chord.id];
        const midiNotes = voicedMidis.get(chord.id) || [];
        const noteIds = midiNotes.map(midiToNoteId);
        
        const instrument = state?.instrument || defaultInstrument;
        const style = state?.playbackStyle || 'arpeggio';
        const noteDuration = state?.playbackNoteDuration || '4/4';
        
        const beatDurationMs = 60000 / bpm;
        let durationMultiplier = 4; // Default to whole note (4/4)
        if (noteDuration === '1/4') durationMultiplier = 1;
        if (noteDuration === '1/2') durationMultiplier = 2;
        const durationMs = beatDurationMs * durationMultiplier;

        setPlayingChordId(chord.id);

        if (style === 'arpeggio') {
            const strumDelay = 80;
            noteIds.sort((a,b) => noteIdToMidi(a) - noteIdToMidi(b)).forEach((noteId, noteIndex) => {
                const noteTimeout = setTimeout(async () => {
                    if (isPlayingRef.current) await playNoteSound(noteId, instrument);
                }, noteIndex * strumDelay);
                timeoutIdsRef.current.push(noteTimeout);
            });
        } else { // 'box'
            noteIds.forEach(async (noteId) => {
                await playNoteSound(noteId, instrument);
            });
        }
        
        playbackIndexRef.current += 1;

        const loopTimeout = setTimeout(playLoop, durationMs);
        timeoutIdsRef.current.push(loopTimeout);
    };

    playLoop();
  };

  const handlePlayInstance = useCallback(async (chord: UserChord) => {
    const state = instanceStates[chord.id];
    if (!state) return;

    const midiNotes = allVoicedMidis.get(chord.id) || [];
    const noteIds = midiNotes.map(midiToNoteId);
    
    const instrument = state.instrument || settings.instrument;
    const style = state.playbackStyle || 'arpeggio';

    if (style === 'arpeggio') {
        const strumDelay = 80;
        noteIds.sort((a,b) => noteIdToMidi(a) - noteIdToMidi(b)).forEach((noteId, noteIndex) => {
            setTimeout(async () => {
                await playNoteSound(noteId, instrument);
            }, noteIndex * strumDelay);
        });
    } else { // 'box'
        for (const noteId of noteIds) {
            await playNoteSound(noteId, instrument);
        }
    }
  }, [instanceStates, allVoicedMidis, settings.instrument]);


  useEffect(() => {
    return () => stopPlayback();
  }, [stopPlayback]);


  const handleGlobalTranspose = (delta: number) => {
    setInstanceStates(prevStates => {
      const newStates = { ...prevStates };
      selectedChordIds.forEach(id => {
        if (newStates[id]) {
          newStates[id] = {
            ...newStates[id],
            transpose: newStates[id].transpose + delta,
          };
        }
      });
      return newStates;
    });
  };

  const handleToggleChordSelection = (chordId: string) => {
    setSelectedChordIds(prevIds => {
      const newIds = prevIds.includes(chordId)
        ? prevIds.filter(id => id !== chordId)
        : [...prevIds, chordId];

      if (!instanceStates[chordId] && newIds.includes(chordId)) {
        setInstanceStates(prevStates => ({
          ...prevStates,
          [chordId]: {
            instrument: settings.instrument,
            transpose: 0,
            octaveShift: 0,
            inversion: 0,
            voicing: 'close',
            playbackStyle: 'arpeggio',
            playbackNoteDuration: '4/4',
          }
        }));
      }
      return newIds;
    });
  };

  const handleDelete = (idToDelete: string) => {
    const newUserData = { ...userData, userChords: userData.userChords.filter(c => c.id !== idToDelete) };
    onUserDataUpdate(newUserData);
    setSelectedChordIds(prev => prev.filter(id => id !== idToDelete));
  };

  const handleSuggestClick = async () => {
    setIsSuggesterOpen(true);
    setIsSuggestionLoading(true);
    setSuggestionError(null);
    setSuggestionResult(null);

    try {
      const result = await suggestChordProgression(selectedChords);
      setSuggestionResult(result);
    } catch (e) {
      setSuggestionError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setIsSuggestionLoading(false);
    }
  };

  const handleAddSuggestedChords = (chords: SuggestedChord[]) => {
    const newChordsToCreate = chords.map(c => createChordFromDefinition(c.root, c.type, c.name)).filter((c): c is Omit<UserChord, 'id'> => !!c);
    
    if (newChordsToCreate.length > 0) {
        const { newUserData, newChords } = addUserChords(userData, newChordsToCreate);
        onUserDataUpdate(newUserData);
        
        const newChordIds = newChords.map(c => c.id);
        setSelectedChordIds(prev => [...prev, ...newChordIds]);

        setInstanceStates(prev => {
            const newStates = { ...prev };
            newChords.forEach(c => {
                newStates[c.id] = {
                    instrument: settings.instrument,
                    transpose: 0,
                    octaveShift: 0,
                    inversion: 0,
                    voicing: 'close',
                    playbackStyle: 'arpeggio',
                    playbackNoteDuration: '4/4',
                };
            });
            return newStates;
        });
    }

    setIsSuggesterOpen(false);
  };

  const chordColorMap = useMemo(() => {
    const colorMap = new Map<string, string>();
    selectedChords.forEach((chord, index) => {
      const color = CHORD_COLORS[index % CHORD_COLORS.length];
      colorMap.set(chord.id, color);
    });
    return colorMap;
  }, [selectedChords]);

  return (
    <div className="w-full h-full flex flex-col text-white p-2">
      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <header className="flex-shrink-0 flex flex-wrap gap-2 items-center justify-between mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-orange-400">{t('chordWorkspaceTitle')}</h2>
          <div className="flex flex-wrap gap-2 items-center">
              {selectedChords.length > 0 && (
                  <div className="flex items-center gap-1 bg-stone-800 p-1 rounded-lg">
                      <button
                          onClick={() => handleGlobalTranspose(-1)}
                          className="p-2 rounded-md bg-stone-700 hover:bg-stone-600 text-white"
                          aria-label="Global Transpose Down"
                          title="Global Transpose Down"
                      >
                          <ChevronLeftIcon className="h-5 w-5" />
                      </button>
                      <span className="text-xs font-semibold text-stone-300 w-20 text-center">{t('globalTranspose')}</span>
                      <button
                          onClick={() => handleGlobalTranspose(1)}
                          className="p-2 rounded-md bg-stone-700 hover:bg-stone-600 text-white"
                          aria-label="Global Transpose Up"
                          title="Global Transpose Up"
                      >
                          <ChevronRightIcon className="h-5 w-5" />
                      </button>
                  </div>
              )}
               <button
                  onClick={() => setIsSelectorOpen(true)}
                  className="flex items-center gap-2 bg-stone-700 hover:bg-stone-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                  <ChordIcon className="h-5 w-5" />
                  <span>{t('myChords')}</span>
              </button>
              <button
                  onClick={handleSuggestClick}
                  disabled={isSuggestionLoading || selectedChords.length === 0}
                  title={selectedChords.length === 0 ? "Select a chord first to get suggestions" : "Suggest a chord progression"}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-stone-600 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                  <SparklesIcon className="h-5 w-5" />
                  <span>{isSuggestionLoading ? t('thinking') : t('suggest')}</span>
              </button>
          </div>
        </header>

        {selectedChords.length > 0 && (
             <div className="flex-shrink-0 flex flex-wrap gap-4 items-center justify-end mb-4 p-3 bg-black/20 rounded-lg">
                <div className="flex items-center gap-2 p-1 bg-stone-800 rounded-lg">
                    <label htmlFor="global-bpm" className="text-xs font-semibold text-stone-300 pl-2">{t('bpm')}</label>
                    <input
                        id="global-bpm"
                        type="range"
                        min="40"
                        max="240"
                        step="1"
                        value={globalBpm}
                        onChange={e => setGlobalBpm(Number(e.target.value))}
                        className="w-32 h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <span className="text-sm font-mono font-bold text-orange-400 w-10 text-center">{globalBpm}</span>
                </div>
                 <button onClick={handlePlayOrStop} disabled={selectedChords.length < 1} title={isPlaying ? t('stop') : t('playLoop')} className={`flex items-center gap-2 font-semibold px-4 py-2 rounded-lg transition-colors ${isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700 disabled:bg-stone-600'}`}>
                    {isPlaying ? <StopIcon className="h-5 w-5" /> : <LoopIcon className="h-5 w-5" />}
                    <span>{isPlaying ? t('stop') : t('playLoop')}</span>
                </button>
            </div>
        )}

        <main className="flex-1 min-h-0 overflow-y-auto">
          {selectedChords.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pr-2 content-start">
              {selectedChords.map(chord => (
                <ChordInstance
                  key={chord.id}
                  chord={chord}
                  state={instanceStates[chord.id]}
                  onStateChange={(newState) => updateInstanceState(chord.id, newState)}
                  onDelete={() => handleDelete(chord.id)}
                  onPlayInstance={() => handlePlayInstance(chord)}
                  voicedMidi={allVoicedMidis.get(chord.id) || []}
                  color={chordColorMap.get(chord.id) || '#ffffff'}
                  isCurrentlyPlaying={playingChordId === chord.id}
                />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 bg-black/20 rounded-lg">
              <h3 className="text-2xl font-bold text-stone-200">{t('workspaceEmptyStateTitle')}</h3>
              <p className="mt-2 max-w-md">
                {t('workspaceEmptyStateText')}
              </p>
            </div>
          )}
        </main>
      </div>

      {isSelectorOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsSelectorOpen(false)}>
            <div className="w-full max-w-lg h-[90vh] max-h-[700px]" onClick={e => e.stopPropagation()}>
                <UserChordSelector
                    userData={userData}
                    onUserDataUpdate={onUserDataUpdate}
                    selectedChordIds={selectedChordIds}
                    onToggleChord={handleToggleChordSelection}
                    onDelete={handleDelete}
                    instrument={settings.instrument}
                    setSelectedChordIds={setSelectedChordIds}
                    setInstanceStates={setInstanceStates}
                    onClose={() => setIsSelectorOpen(false)}
                    language={language}
                />
            </div>
        </div>
      )}

      {isSuggesterOpen && (
        <ProgressionSuggester
          isOpen={isSuggesterOpen}
          onClose={() => setIsSuggesterOpen(false)}
          isLoading={isSuggestionLoading}
          suggestion={suggestionResult}
          error={suggestionError}
          onAddChords={handleAddSuggestedChords}
          instrument={settings.instrument}
          language={language}
        />
      )}
    </div>
  );
};

export default ChordWorkspace;
