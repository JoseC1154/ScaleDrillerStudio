import React from 'react';

interface DegreeSelectorProps {
  onSelect: (degree: number) => void;
  isDisabled?: boolean;
}

const DegreeSelector: React.FC<DegreeSelectorProps> = ({ onSelect, isDisabled = false }) => {
  const allDegrees = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-stone-900/80 backdrop-blur-lg p-2 z-30 pb-[calc(0.5rem+env(safe-area-inset-bottom))] border-t border-stone-700/50">
      <div
        className="grid grid-cols-7 gap-2 max-w-lg mx-auto"
        role="toolbar"
        aria-label="Select a scale degree"
      >
        {allDegrees.map(degree => (
          <button
            key={degree}
            onClick={() => onSelect(degree)}
            disabled={isDisabled}
            className="py-3 rounded-lg font-bold text-lg flex items-center justify-center transition-all bg-stone-800 hover:bg-orange-500 text-white transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-stone-700 disabled:text-stone-500 disabled:transform-none disabled:cursor-not-allowed"
            aria-label={`Select degree ${degree}`}
          >
            {degree}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DegreeSelector;
