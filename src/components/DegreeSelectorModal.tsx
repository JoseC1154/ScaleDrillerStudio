import React from 'react';
import { CloseIcon } from './Icons';

interface DegreeSelectorModalProps {
  onSelect: (degree: number) => void;
  onClose: () => void;
}

const DegreeSelectorModal: React.FC<DegreeSelectorModalProps> = ({ onSelect, onClose }) => {
  const allDegrees = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-stone-900 border border-stone-700 p-6 rounded-xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-orange-400">Select Degree</h3>
            <button onClick={onClose} className="text-stone-400 hover:text-white">
                <CloseIcon className="h-6 w-6" />
            </button>
        </div>
        <div
          className="grid grid-cols-4 sm:grid-cols-7 gap-3"
          role="toolbar"
          aria-label="Select a scale degree"
        >
          {allDegrees.map(degree => (
            <button
              key={degree}
              onClick={() => onSelect(degree)}
              className="py-4 rounded-lg font-bold text-xl flex items-center justify-center transition-all bg-stone-800 hover:bg-orange-500 text-white transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label={`Select degree ${degree}`}
            >
              {degree}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DegreeSelectorModal;
