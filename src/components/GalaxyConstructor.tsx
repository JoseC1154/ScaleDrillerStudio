import React, { useMemo } from 'react';
import { Scale } from '../types';
import { INTERVAL_STEP_NAMES } from '../constants';

interface GalaxyConstructorProps {
  scale: Scale;
  builtIntervals: string[];
  intervalChoices: string[];
  onSelectInterval: (interval: string) => void;
}

const GalaxyConstructor: React.FC<GalaxyConstructorProps> = ({ scale, builtIntervals, intervalChoices, onSelectInterval }) => {
  const constructedNotes = useMemo(() => scale.notes.slice(0, builtIntervals.length + 1), [scale, builtIntervals]);
  const formulaSoFar = useMemo(() => {
    return builtIntervals.map(name => INTERVAL_STEP_NAMES[name]?.[0] || '?').join('-');
  }, [builtIntervals]);

  const majorFormula = "W-W-H-W-W-W-H";
  const minorFormula = "W-H-W-W-H-W-W";
  const formulaText = scale.type === 'Major' ? majorFormula : minorFormula;

  const totalSteps = 7;

  return (
    <div className="w-full h-full flex flex-col justify-between items-center bg-black/30 p-4 rounded-lg text-white gap-4">
      {/* Top: Instructions Panel */}
       <div className="w-full bg-stone-900/50 border border-cyan-500/30 rounded-lg p-3 text-center flex-shrink-0">
            <h3 className="text-lg font-bold text-orange-400 mb-2">Mission Briefing</h3>
            <p className="text-xs text-stone-300 mb-2">
                Scales are built with a recipe of <b className="text-cyan-300">Whole Steps (W)</b> and <b className="text-cyan-300">Half Steps (H)</b>.
                Your mission is to use this recipe to build the scale!
            </p>
            <div className="font-mono text-base sm:text-lg text-cyan-300 tracking-widest bg-black/30 p-1 rounded">
                {scale.type} Recipe: {formulaText}
            </div>
       </div>

      {/* Middle: Constellation View */}
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="flex items-center gap-1 sm:gap-2">
          {Array.from({ length: totalSteps + 1 }).map((_, index) => {
            const isConstructed = index < constructedNotes.length;
            const isSun = index === 0;
            const note = isConstructed ? constructedNotes[index] : null;

            return (
              <React.Fragment key={index}>
                {/* Connecting Path */}
                {index > 0 && (
                   <div className="h-0.5 sm:h-1 w-2 sm:w-4 flex-1 transition-colors duration-500" style={{background: index <= constructedNotes.length - 1 ? 'linear-gradient(90deg, #fde047, #fde047, #67e8f9)' : '#57534e'}}></div>
                )}

                {/* Star/Orbit */}
                <div
                  className={`relative rounded-full flex items-center justify-center transition-all duration-500
                    ${isSun ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-8 h-8 sm:w-10 sm:h-10'}
                    ${isConstructed ? '' : 'border-2 border-dashed border-stone-600'}
                  `}
                >
                  {isConstructed && (
                    <div
                      className={`absolute inset-0 rounded-full ${isSun ? 'bg-orange-500 animate-pulse' : 'bg-yellow-300'} transition-all duration-500`}
                      style={{ boxShadow: isSun ? '0 0 20px #f97316' : '0 0 10px #fde047' }}
                    ></div>
                  )}
                  <span className="relative z-10 font-bold text-black text-sm sm:text-base">{note}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Bottom: Interval Transporter */}
      <div className="w-full max-w-md flex-shrink-0">
        <h4 className="text-center text-stone-300 mb-2">Completed: {formulaSoFar} <br/>Choose the next interval:</h4>
        <div className="grid grid-cols-2 gap-4">
          {intervalChoices.map(interval => (
            <button
              key={interval}
              onClick={() => onSelectInterval(interval)}
              className="p-4 bg-stone-800/70 border-2 border-cyan-500/50 rounded-lg text-center transition-all duration-200 hover:bg-cyan-900/70 hover:border-cyan-400 transform hover:scale-105"
            >
              <span className="block text-lg font-bold text-cyan-300">{interval}</span>
              <span className="text-sm text-stone-300">({INTERVAL_STEP_NAMES[interval] || 'Jump'})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GalaxyConstructor;
