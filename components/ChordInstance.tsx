import React, { useMemo, useRef, useEffect } from 'react';
import { UserChord, InstanceState, Language } from '../types';
import { Piano } from './Piano';
import Fretboard from './Fretboard';
import ChordInstanceToolbar from './ChordInstanceToolbar';
import { calculateMidiRange, getChordCentroid, mapMidiToFretboardVoicing, midiToNoteId, getTransposedChordName } from '../services/music';

interface ChordInstanceProps {
  chord: UserChord;
  state: InstanceState;
  onStateChange: (newState: Partial<InstanceState>) => void;
  onDelete: () => void;
  onPlayInstance: () => void;
  voicedMidi: number[];
  color: string;
  isCurrentlyPlaying: boolean;
  language: Language;
}

const ChordInstance: React.FC<ChordInstanceProps> = ({ chord, state, onStateChange, onDelete, onPlayInstance, voicedMidi, color, isCurrentlyPlaying, language }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const centroid = useMemo(() => getChordCentroid(voicedMidi), [voicedMidi]);

  const displayName = useMemo(() => {
    if (!state || state.transpose === 0) {
      return chord.name;
    }
    return getTransposedChordName(chord.name, state.transpose);
  }, [chord.name, state?.transpose]);

  const pianoRange = useMemo(() => {
    return calculateMidiRange({ centroidMidi: centroid, octaves: 4 });
  }, [centroid]);
  
  const fretboardRange = useMemo(() => {
    return { startFret: 0, fretCount: 24 };
  }, []);

  const voicedNotes = useMemo(() => {
    if (state.instrument === 'Piano') {
      return voicedMidi.map(midiToNoteId);
    } else {
      return mapMidiToFretboardVoicing(voicedMidi, state.instrument);
    }
  }, [voicedMidi, state.instrument]);
  
  const singleColorNoteMap = useMemo(() => {
    const noteMap = new Map<string, string[]>();
    voicedNotes.forEach(noteId => {
      noteMap.set(noteId, [color]);
    });
    return noteMap;
  }, [voicedNotes, color]);

  const centerOnChord = () => {
      const container = containerRef.current;
      if (!container) return;

      if(state.instrument === 'Piano') {
          const totalKeysInFullPiano = 88;
          const totalWidth = container.scrollWidth;
          const avgKeyWidth = totalWidth / totalKeysInFullPiano * (12/7); // Estimate based on white keys
          
          const centerOfVisibleRange = container.clientWidth / 2;
          const centroidPosition = (centroid - pianoRange.startMidi) * avgKeyWidth;
          
          container.scrollLeft = centroidPosition - centerOfVisibleRange;
      } else {
          container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
      }
  };

  useEffect(() => {
    // A timeout allows the DOM to update and give the container a scrollWidth before we try to scroll
    setTimeout(centerOnChord, 50);
  }, [voicedMidi, state.instrument]); // Recenter when chord or instrument changes

  const instrumentComponent = useMemo(() => {
    const commonProps = {
      onNotePlayed: () => {}, // Read-only view
      highlightedNotes: voicedNotes,
      multiColorNotes: singleColorNoteMap,
      containerRef: containerRef,
    };
    
    switch (state.instrument) {
      case 'Piano': return <Piano {...commonProps} range={pianoRange} size="compact"/>;
      case 'Guitar':
      case 'Bass': 
        return <Fretboard {...commonProps} instrument={state.instrument} handedness="Right" labelMode="notes" scale={null} range={fretboardRange} size="compact" />;
      default: return null;
    }
  }, [voicedNotes, singleColorNoteMap, state.instrument, pianoRange, fretboardRange]);

  return (
    <div 
        className={`bg-stone-800/50 rounded-lg flex flex-col shadow-lg overflow-hidden transition-all duration-300 ${isCurrentlyPlaying ? 'ring-2 ring-offset-2 ring-offset-stone-900 animate-pulse' : ''}`}
        style={{'--tw-ring-color': isCurrentlyPlaying ? color : 'transparent'} as React.CSSProperties}
    >
       <header className="flex-shrink-0 p-2 flex justify-between items-center border-b border-stone-700/50">
           <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></div>
                <h3 className="font-bold text-stone-100 truncate">{displayName}</h3>
           </div>
       </header>
       
       <div className="flex-shrink-0 min-h-0 min-w-0 relative overflow-hidden">
          {instrumentComponent}
       </div>
       
       <footer className="flex-shrink-0">
           <ChordInstanceToolbar
             instrument={state.instrument}
             setInstrument={(instrument) => onStateChange({ instrument })}
             transpose={(delta) => onStateChange({ transpose: state.transpose + delta })}
             shiftOctave={(delta) => onStateChange({ octaveShift: state.octaveShift + delta })}
             cycleInversion={() => {
                const numNotes = chord.notes.length;
                if(numNotes > 0) onStateChange({ inversion: (state.inversion + 1) % numNotes })
             }}
             voicing={state.voicing}
             setVoicing={(voicing) => onStateChange({ voicing })}
             playbackStyle={state.playbackStyle}
             onPlaybackStyleChange={(style) => onStateChange({ playbackStyle: style })}
             playbackNoteDuration={state.playbackNoteDuration}
             onPlaybackNoteDurationChange={(duration) => onStateChange({ playbackNoteDuration: duration })}
             onCenter={centerOnChord}
             onPlay={onPlayInstance}
             onDelete={onDelete}
             language={language}
           />
       </footer>
    </div>
  );
};

export default ChordInstance;