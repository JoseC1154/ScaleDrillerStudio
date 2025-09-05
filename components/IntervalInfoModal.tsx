import React from 'react';
import { CloseIcon } from './Icons';

interface IntervalInfoModalProps {
  onClose: () => void;
}

const IntervalInfoModal: React.FC<IntervalInfoModalProps> = ({ onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-stone-900 border border-stone-700 rounded-lg max-w-sm w-full shadow-2xl animate-key-appear" 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="interval-modal-title"
      >
        <header className="p-4 border-b border-stone-700/50 flex justify-between items-center">
          <h2 id="interval-modal-title" className="text-xl font-bold text-orange-400">Interval Abbreviations</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white" aria-label="Close">
            <CloseIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="p-6">
          <p className="text-stone-300 mb-4">Chord formulas are shown as a series of intervals from the root note. Here's what the abbreviations mean:</p>
          <dl className="space-y-2 text-stone-200">
            <div className="flex"><dt className="w-12 font-bold text-orange-300">R</dt><dd>Root</dd></div>
            <div className="flex"><dt className="w-12 font-bold text-orange-300">M</dt><dd>Major (e.g., M3 is a Major 3rd)</dd></div>
            <div className="flex"><dt className="w-12 font-bold text-orange-300">m</dt><dd>minor (e.g., m7 is a minor 7th)</dd></div>
            <div className="flex"><dt className="w-12 font-bold text-orange-300">P</dt><dd>Perfect (e.g., P5 is a Perfect 5th)</dd></div>
            <div className="flex"><dt className="w-12 font-bold text-orange-300">TT</dt><dd>Tritone</dd></div>
            <div className="flex"><dt className="w-12 font-bold text-orange-300">#</dt><dd>Sharp / Augmented</dd></div>
            <div className="flex"><dt className="w-12 font-bold text-orange-300">b</dt><dd>Flat / Diminished</dd></div>
          </dl>
        </main>
      </div>
    </div>
  );
};

export default IntervalInfoModal;