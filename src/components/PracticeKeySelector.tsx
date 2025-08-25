import React from 'react';
import { Note, Instrument } from '../types';
import { ALL_NOTES } from '../constants';

interface PracticeKeySelectorProps {
    selectedKeys: Note[];
    onToggleKey: (key: Note) => void;
    instrument: Instrument; // Kept for future compatibility
}

const PracticeKeySelector: React.FC<PracticeKeySelectorProps> = ({ selectedKeys, onToggleKey }) => {
  
  return (
    <div className="p-3 bg-stone-900/70 backdrop-blur-lg rounded-lg w-full">
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {ALL_NOTES.map(note => {
          const isSelected = selectedKeys.includes(note);
          return (
            <button
              key={note}
              onClick={() => onToggleKey(note)}
              className={`py-2 px-1 rounded-md text-sm font-semibold transition-colors duration-200 w-full border ${
                isSelected
                  ? 'bg-orange-500 text-white border-orange-400 shadow-md'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
              }`}
            >
              {note}
            </button>
          )
        })}
      </div>
    </div>
  );
};

export default PracticeKeySelector;
