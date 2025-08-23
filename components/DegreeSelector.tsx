import React from 'react';

interface DegreeSelectorProps {
  onSelect: (degree: number) => void;
  onClose: () => void;
}

const DegreeSelector: React.FC<DegreeSelectorProps> = ({ onSelect, onClose }) => {
  const allDegrees = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div 
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" 
        onClick={onClose} 
        aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select a scale degree"
        className="bg-stone-900 border border-orange-500 rounded-lg p-4 shadow-2xl grid grid-cols-4 gap-2 animate-key-appear"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        {allDegrees.map(degree => (
          <button
            key={degree}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(degree);
            }}
            className="w-12 h-12 rounded-md font-bold text-lg flex items-center justify-center transition-all bg-stone-800 hover:bg-orange-500 text-white transform hover:scale-110"
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