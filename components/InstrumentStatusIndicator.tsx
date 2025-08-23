
import React from 'react';
import { Instrument } from '../types';

// SVG icons as React components
const PianoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5.25h18v13.5H3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 5.25v8.25h2V5.25H6z" fill="currentColor" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 5.25v8.25h2V5.25h-2z" fill="currentColor" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 5.25v8.25h2V5.25h-2z" fill="currentColor"/>
  </svg>
);

const GuitarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16.13 3.87C16.13 3.87 14.2 2 11.5 2C8.8 2 7 3.87 7 3.87" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 3.87v5.63" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16.13 3.87v5.63" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11.56 22a5.5 5.5 0 0 0 5.5-5.5v-7h-11v7A5.5 5.5 0 0 0 11.56 22z" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="11.56" cy="14" r="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const BassIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 4a1 1 0 0 0 1-1 1 1 0 0 0-1-1" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18 4a1 1 0 0 0 1-1 1 1 0 0 0-1-1" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17 2V10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5.4 11.89c-2.3.8-3.4 3.2-3.4 5.61 0 2.2 1.4 3.5 3 3.5h11c1.6 0 3-1.3 3-3.5 0-2.41-1.1-4.81-3.4-5.61" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11 10h2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


interface InstrumentStatusIndicatorProps {
  instrument: Instrument;
}

const neonGlowStyle: React.CSSProperties = {
    filter: 'drop-shadow(0 0 2px #4ade80) drop-shadow(0 0 6px #4ade80)', // green-400
    color: '#bbf7d0', // green-200
    transition: 'all 0.3s ease-in-out',
};

const InstrumentStatusIndicator: React.FC<InstrumentStatusIndicatorProps> = ({ instrument }) => {
  const getIcon = () => {
    switch (instrument) {
      case 'Piano': return <PianoIcon />;
      case 'Guitar': return <GuitarIcon />;
      case 'Bass': return <BassIcon />;
      default: return null;
    }
  };

  const getTitle = () => {
      switch (instrument) {
        case 'Piano': return 'Piano Selected';
        case 'Guitar': return 'Guitar Selected';
        case 'Bass': return 'Bass Selected';
        default: return 'Instrument';
      }
  }

  return (
    <div 
        className="p-2 rounded-full"
        title={getTitle()}
        style={neonGlowStyle}
    >
      {getIcon()}
    </div>
  );
};

export default InstrumentStatusIndicator;