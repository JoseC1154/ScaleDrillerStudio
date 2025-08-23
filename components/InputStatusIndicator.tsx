
import React from 'react';
import { InputMethod } from '../types';

// SVG icons as React components
const TouchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 13v-8.5a1.5 1.5 0 0 1 3 0v7.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 11.5v-2a1.5 1.5 0 0 1 3 0v2.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 10.5a1.5 1.5 0 0 1 3 0v1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 11.5a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1-6 6h-2h.208a6 6 0 0 1-5.012-2.7l-.196-.3c-.312-.479-1.407-2.388-3.286-5.728a1.5 1.5 0 0 1 .536-2.022a1.867 1.867 0 0 1 2.28.28l1.47 1.47" />
  </svg>
);

const MidiIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    {/* Outer circle for the connector body */}
    <circle cx="12" cy="12" r="8.5" />
    {/* The 5 pins, filled */}
    <g fill="currentColor" stroke="none">
        {/* Pin 3 (bottom-left) */}
        <circle cx="9" cy="15.5" r="1.2" />
        {/* Pin 1 (bottom-right) */}
        <circle cx="15" cy="15.5" r="1.2" />
        {/* Pin 5 (middle-left) */}
        <circle cx="7.5" cy="11.5" r="1.2" />
        {/* Pin 4 (middle-right) */}
        <circle cx="16.5" cy="11.5" r="1.2" />
        {/* Pin 2 (top-center) */}
        <circle cx="12" cy="8" r="1.2" />
    </g>
  </svg>
);

const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
  </svg>
);


interface InputStatusIndicatorProps {
  inputMethod: InputMethod;
}

const neonGlowStyle: React.CSSProperties = {
    filter: 'drop-shadow(0 0 2px #4ade80) drop-shadow(0 0 6px #4ade80)',
    color: '#bbf7d0', // green-200
    transition: 'all 0.3s ease-in-out',
};

const InputStatusIndicator: React.FC<InputStatusIndicatorProps> = ({ inputMethod }) => {
  const getIcon = () => {
    switch (inputMethod) {
      case 'Touch': return <TouchIcon />;
      case 'MIDI': return <MidiIcon />;
      case 'Mic': return <MicIcon />;
      default: return null;
    }
  };

  const getTitle = () => {
      switch (inputMethod) {
        case 'Touch': return 'Touch Input Active';
        case 'MIDI': return 'MIDI Input Active';
        case 'Mic': return 'Microphone Input Active';
        default: return 'Input Method';
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

export default InputStatusIndicator;