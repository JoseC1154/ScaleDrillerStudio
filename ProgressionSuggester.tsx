import React from 'react';
import { SuggestedChord, Instrument, Language } from '../types';
import { CloseIcon, SparklesIcon, PlayIcon } from './Icons';
import { createChordFromDefinition } from '../services/music';
import { playNoteSound } from '../services/sound';
import { createTranslator } from '../services/translations';

interface ProgressionSuggesterProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  suggestion: SuggestedChord[] | null;
  error: string | null;
  onAddChords: (chords: SuggestedChord[]) => void;
  instrument: Instrument;
  language: Language;
}

const ProgressionSuggester: React.FC<ProgressionSuggesterProps> = ({ isOpen, onClose, isLoading, suggestion, error, onAddChords, instrument, language }) => {
  const t = createTranslator(language);
  if (!isOpen) return null;

  const handlePlayProgression = () => {
    if (!suggestion) return;

    let delay = 0;
    const chordDuration = 600; // ms per chord
    const noteStrum = 50; // ms between notes in a chord

    suggestion.forEach(chordData => {
      // Use a reasonable default octave for playback
      const chord = createChordFromDefinition(chordData.root, chordData.type, chordData.name, 4);
      if (chord) {
        chord.notes.forEach((noteId, noteIndex) => {
          setTimeout(async () => {
            await playNoteSound(noteId, instrument);
          }, delay + noteIndex * noteStrum);
        });
        delay += chordDuration;
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-stone-700 rounded-lg max-w-md w-full shadow-2xl flex flex-col animate-key-appear" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-stone-700/50 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-6 w-6 text-orange-400" />
            <h2 className="text-xl font-bold text-orange-400">Progression Suggester</h2>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white" aria-label="Close">
            <CloseIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="p-6 min-h-[150px] flex items-center justify-center">
          {isLoading && (
            <div className="text-center space-y-2 text-stone-300">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto"></div>
                <p>{t('thinking')}</p>
            </div>
          )}
          {error && (
            <div className="text-center text-red-400">
              <p className="font-semibold">An error occurred:</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}
          {suggestion && (
            <div className="flex flex-wrap justify-center gap-3">
              {suggestion.map((chord, index) => (
                <div key={index} className="bg-stone-800 border border-stone-700 rounded-lg px-4 py-2 text-center shadow-md">
                  <p className="text-2xl font-bold text-stone-100">{chord.name}</p>
                  <p className="text-xs text-stone-400">{chord.type}</p>
                </div>
              ))}
            </div>
          )}
        </main>

        <footer className="p-4 border-t border-stone-700/50 flex-shrink-0 flex">
          {suggestion && !error ? (
            <div className="flex justify-between items-center w-full">
              <button
                onClick={handlePlayProgression}
                className="flex items-center gap-2 bg-stone-600 hover:bg-stone-500 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                <PlayIcon className="h-5 w-5" />
                Play
              </button>
              <button
                onClick={() => onAddChords(suggestion)}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Add to Workspace
              </button>
            </div>
          ) : (
            <div className="flex justify-end w-full">
                <button
                    onClick={onClose}
                    className="bg-stone-600 hover:bg-stone-500 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                    {isLoading ? 'Cancel' : t('guideClose')}
                </button>
            </div>
           )}
        </footer>
      </div>
    </div>
  );
};

export default ProgressionSuggester;
