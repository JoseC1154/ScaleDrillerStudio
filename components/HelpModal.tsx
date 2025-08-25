import React from 'react';
import { Scale } from '../types.ts';
import { DEGREE_NAMES } from '../constants.ts';
import { CloseIcon } from './Icons.tsx';

interface HelpModalProps {
  scale: Scale;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ scale, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-stone-900 border border-stone-700 rounded-lg max-w-md w-full shadow-2xl flex flex-col max-h-[calc(100vh-3rem)]" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <header className="p-4 border-b border-stone-700/50 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-orange-400">{scale.key} {scale.type} Scale</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white" aria-label="Close">
            <CloseIcon className="h-6 w-6" />
          </button>
        </header>
        
        {/* Scrollable Content */}
        <main className="overflow-y-auto p-4 sm:p-6">
            <div className="space-y-2">
            {scale.notes.map((note, index) => (
                <div key={note} className="flex justify-between items-center bg-stone-800 p-3 rounded-md">
                <span className="font-semibold text-lg text-stone-100">{note}</span>
                <span className="text-stone-400">{DEGREE_NAMES[index + 1]} Degree</span>
                </div>
            ))}
            </div>
        </main>
        
        {/* Footer */}
        <footer className="p-4 border-t border-stone-700/50 flex-shrink-0">
            <button 
            onClick={onClose}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
            Close
            </button>
        </footer>
      </div>
    </div>
  );
};

export default HelpModal;