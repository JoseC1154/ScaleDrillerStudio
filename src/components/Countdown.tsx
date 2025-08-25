import React, { useState, useEffect } from 'react';

interface CountdownProps {
  onComplete: () => void;
  message?: string;
}

const Countdown: React.FC<CountdownProps> = ({ onComplete, message }) => {
  // If there is a message, use it as a single stage. Otherwise, no stages.
  // This removes the "Ready, Set, Go!" sequence.
  const stages = message ? [message] : [];
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    // If there are no stages to display, complete immediately.
    if (stages.length === 0) {
      onComplete();
      return;
    }

    if (stageIndex >= stages.length) {
      const completionTimer = setTimeout(onComplete, 500); // Wait half a second after message fades
      return () => clearTimeout(completionTimer);
    }

    const timer = setTimeout(() => {
      setStageIndex(i => i + 1);
    }, 1000); // Each stage lasts 1 second

    return () => clearTimeout(timer);
  }, [stageIndex, onComplete, stages]); // Depend on the array itself

  // Don't render anything if there are no stages to show.
  if (stages.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 pointer-events-none">
      <div key={stageIndex} className="relative w-full h-full flex items-center justify-center">
        {stageIndex < stages.length && (
          <h1 className="text-7xl md:text-9xl font-bold text-white uppercase tracking-widest countdown-text" style={{ textShadow: '0 0 20px rgba(249, 115, 22, 0.8)' }}>
            {stages[stageIndex]}
          </h1>
        )}
      </div>
    </div>
  );
};

export default Countdown;
