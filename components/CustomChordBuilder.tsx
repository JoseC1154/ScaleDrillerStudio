
import React from 'react';
import { sortUniqueNotes } from '../services/music';
import { Note, ChordTypeName } from '../types';

interface CustomChordBuilderProps {
  name: string;
  notes: string[];
  onNameChange: (name: string) => void;
  onSave: () => void;
  onClear: () => void;
  onCancel: () => void;
  detectedChord: { root: Note, typeName: ChordTypeName } | null;
}

const CustomChordBuilder: React.FC<CustomChordBuilderProps> = ({ name, notes, onNameChange, onSave, onClear, onCancel, detectedChord }) => {
  const sortedNotes = sortUniqueNotes(notes);
  const noteDisplay = sortedNotes.map(n => n.replace(/-?\d/g, '')).join(', ');
  const canSave = name.trim().length > 0 && notes.length > 0;

  const detectedName = detectedChord 
    ? `${detectedChord.root} ${detectedChord.typeName}` 
    : (notes.length > 1 ? 'Unknown Chord' : '');

  return (
    <div className="bg-black/30 rounded-lg p-3 sm:p-4 animate-key-appear border border-green-500/50">
      <div className="flex justify-between items-baseline mb-2">
        <h3 className="text-lg font-semibold text-green-400">Chord Builder</h3>
        {detectedName && (
            <p className="text-sm text-orange-400 font-medium truncate" title={detectedName}>
                {detectedName}
            </p>
        )}
      </div>
      <div className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter chord name..."
          className="w-full bg-stone-800 border border-stone-600 rounded-md px-3 py-2 text-white placeholder-stone-500 focus:ring-orange-500 focus:border-orange-500"
          aria-label="Chord Name"
        />
        <div className="bg-stone-800/50 rounded-md p-2 min-h-[40px] text-stone-300 text-sm">
          Notes: <span className="font-semibold text-white">{noteDisplay || 'Click notes on the piano to add them'}</span>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-3 py-1.5 bg-stone-600 hover:bg-stone-500 rounded-md text-white text-sm font-semibold">
            Cancel
          </button>
          <button onClick={onClear} disabled={notes.length === 0} className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 rounded-md text-white text-sm font-semibold disabled:bg-stone-600 disabled:cursor-not-allowed">
            Clear
          </button>
          <button onClick={onSave} disabled={!canSave} className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded-md text-white text-sm font-semibold disabled:bg-stone-600 disabled:cursor-not-allowed">
            Save Chord
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomChordBuilder;
