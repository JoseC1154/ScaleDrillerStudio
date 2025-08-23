
import React from 'react';

interface TunerNeedleProps {
  centsOff: number;
}

const TunerNeedle: React.FC<TunerNeedleProps> = ({ centsOff }) => {
  // Clamp cents from -50 to 50
  const clampedCents = Math.max(-50, Math.min(50, centsOff));
  
  // Map cents to a rotation angle. -50 cents = -45 deg, 50 cents = 45 deg.
  const rotation = (clampedCents / 50) * 45;

  const inTuneThreshold = 5;
  const isInTune = Math.abs(centsOff) <= inTuneThreshold;

  return (
    <div className="w-full max-w-xs h-24 relative flex flex-col items-center">
      {/* Meter Background */}
      <div className="w-full h-12 bg-gradient-to-b from-stone-800 to-stone-900 border border-stone-700 rounded-full overflow-hidden absolute bottom-4">
         <div className="absolute inset-0 flex justify-center items-center">
             <div className="w-1 h-full bg-green-500/50" />
         </div>
      </div>

      {/* Needle */}
      <div
        className="absolute bottom-4 h-12 w-0.5 origin-bottom transition-transform duration-200 ease-out"
        style={{
          transform: `rotate(${rotation}deg)`,
          background: isInTune ? '#4ade80' : '#fde047', // green-400 or yellow-300
          boxShadow: `0 0 5px ${isInTune ? '#4ade80' : '#fde047'}`,
        }}
      />

      {/* Center Circle */}
      <div className="w-4 h-4 bg-stone-700 border-2 border-stone-500 rounded-full absolute bottom-2 z-10" />

      {/* Markings */}
       <div className="absolute w-full h-full text-xs text-stone-400 font-mono">
           <span className="absolute bottom-[60px]" style={{left: '10%'}}>-50</span>
           <span className="absolute bottom-[60px] text-center" style={{left: '50%', transform: 'translateX(-50%)'}}>0</span>
           <span className="absolute bottom-[60px]" style={{right: '10%'}}>+50</span>
       </div>
    </div>
  );
};

export default TunerNeedle;