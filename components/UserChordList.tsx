import React from 'react';
import { UserChord } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

interface UserChordListProps {
  userChords: UserChord[];
  selectedChords: UserChord[];
  onCreate: () => void;
  onToggle: (chord: UserChord) => void;
  onDelete: (id: string) => void;
  isPiano: boolean;
  chordColorMap: Map<string, string>;
}

const UserChordList: React.FC<UserChordListProps> = ({ userChords, selectedChords, onCreate, onToggle, onDelete, isPiano, chordColorMap }) => {
  return (
    <div className="h-full flex flex-col bg-stone-800/50 rounded-lg p-3">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-stone-300">My Chords</h3>
        <button 
            onClick={onCreate}
            disabled={!isPiano}
            title={isPiano ? "Create a new chord" : "Custom chords only available on Piano"}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:bg-stone-600 disabled:cursor-not-allowed text-white text-sm font-semibold px-3 py-1.5 rounded-md transition-colors"
        >
            <PlusIcon className="h-5 w-5" />
            New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-2">
        {userChords.length === 0 ? (
          <div className="text-center text-stone-400 text-sm py-8">
            <p>Your saved chords will appear here.</p>
            { !isPiano && <p className="mt-2 text-xs">(Switch to the Piano to create custom chords)</p> }
          </div>
        ) : (
          userChords.map(chord => {
            const isSelected = selectedChords.some(c => c.id === chord.id);
            const color = chordColorMap.get(chord.id);
            return (
                <div key={chord.id} className={`p-2 rounded-md flex justify-between items-center group transition-colors duration-200 ${isSelected ? 'bg-orange-500/20' : 'bg-stone-900/70'}`}>
                <button 
                    onClick={() => onToggle(chord)}
                    className="flex-1 flex items-center gap-2 text-left text-stone-200 hover:text-orange-400 transition-colors"
                >
                    {color && isSelected && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />}
                    <div className="truncate">
                        <span className="font-semibold">{chord.name}</span>
                        <span className="text-xs text-stone-500 ml-2">({chord.notes.length} notes)</span>
                    </div>
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(chord.id); }}
                    className="p-1.5 text-stone-500 hover:text-red-500 rounded-full hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Delete ${chord.name}`}
                >
                    <TrashIcon className="h-5 w-5" />
                </button>
                </div>
            )
          })
        )}
      </div>
    </div>
  );
};

export default UserChordList;