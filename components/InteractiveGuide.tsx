
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface InteractiveGuideProps {
  onComplete: () => void;
}

const TUTORIAL_STEPS = [
  { id: 0, elementId: null, title: "Welcome to Scale Driller!", text: "This quick guide will show you around the app.", position: 'center' },
  { id: 1, elementId: 'tutorial-input-selector', title: "Choose Your Input", text: "Select how you'll play notes: on-screen touch, a connected MIDI device, or your microphone.", position: 'bottom' },
  { id: 2, elementId: 'tutorial-instrument-selector', title: "Pick Your Instrument", text: "This changes the on-screen display and sounds. For guitar/bass, you can also pick your handedness.", position: 'bottom' },
  { id: 3, elementId: 'tutorial-level-selector', title: "Select a Level", text: "You'll unlock higher levels by completing 'gatekeeper' drills at the end of each level.", position: 'top' },
  { id: 4, elementId: 'tutorial-drill-selector', title: "Choose a Drill", text: "Each drill focuses on a different skill. Locked drills are unlocked by leveling up.", position: 'top' },
  { id: 5, elementId: 'tutorial-start-button', title: "Start Drilling!", text: "When you're all set up, hit this button to begin the selected drill.", position: 'top' },
  { id: 6, elementId: 'tutorial-bottom-nav', title: "Navigation", text: "Use this bar to switch between the main Drill screen, the instrument Tuner, your performance Report, and the in-depth Guide.", position: 'top' },
  { id: 7, elementId: null, title: "You're All Set!", text: "We recommend starting with the 'Key Explorer' drill in Level 1. Have fun!", position: 'center' },
];

const InteractiveGuide: React.FC<InteractiveGuideProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const [textStyle, setTextStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const textBoxRef = useRef<HTMLDivElement>(null);

  const step = useMemo(() => TUTORIAL_STEPS[currentStep], [currentStep]);

  const updatePositions = useCallback(() => {
    if (!step) return;

    if (!step.elementId) {
      setHighlightStyle({ opacity: 0 });
      setTextStyle({
        opacity: 1,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed'
      });
      return;
    }

    const element = document.getElementById(step.elementId);
    const textBox = textBoxRef.current;

    if (element && textBox) {
      const targetRect = element.getBoundingClientRect();
      const textRect = textBox.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 10; // Viewport margin
      const gap = 16; // Gap between element and tooltip

      // --- HORIZONTAL POSITIONING ---
      let newLeft = targetRect.left + targetRect.width / 2;
      const halfWidth = textRect.width / 2;
      
      if (newLeft - halfWidth < margin) {
        newLeft = halfWidth + margin;
      }
      if (newLeft + halfWidth > viewportWidth - margin) {
        newLeft = viewportWidth - halfWidth - margin;
      }

      // --- VERTICAL POSITIONING ---
      let placeBelow: boolean;
      const spaceBelow = viewportHeight - targetRect.bottom;
      const spaceAbove = targetRect.top;
      const neededSpace = textRect.height + gap;

      const canPlaceBelow = spaceBelow >= neededSpace;
      const canPlaceAbove = spaceAbove >= neededSpace;
      
      if (step.position === 'bottom') {
        if (canPlaceBelow) {
          placeBelow = true;
        } else if (canPlaceAbove) {
          placeBelow = false;
        } else {
          placeBelow = spaceBelow > spaceAbove;
        }
      } else { // position is 'top'
        if (canPlaceAbove) {
          placeBelow = false;
        } else if (canPlaceBelow) {
          placeBelow = true;
        } else {
          placeBelow = spaceBelow > spaceAbove;
        }
      }

      const newTop = placeBelow ? targetRect.bottom + gap : targetRect.top - gap;
      const newTransform = placeBelow ? 'translateX(-50%)' : 'translate(-50%, -100%)';

      // --- FINAL STYLE UPDATE ---
      const padding = 8;
      setHighlightStyle({
        top: `${targetRect.top - padding}px`,
        left: `${targetRect.left - padding}px`,
        width: `${targetRect.width + padding * 2}px`,
        height: `${targetRect.height + padding * 2}px`,
        opacity: 1,
      });

      setTextStyle({
        opacity: 1,
        top: `${newTop}px`,
        left: `${newLeft}px`,
        transform: newTransform,
        position: 'fixed'
      });
    } else {
        // If element not found, move to next step.
        setCurrentStep(s => Math.min(s + 1, TUTORIAL_STEPS.length - 1));
    }
  }, [step]);

  useEffect(() => {
    // A small delay to ensure the text box has rendered and its dimensions can be read
    const timer = setTimeout(updatePositions, 50);
    window.addEventListener('resize', updatePositions);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePositions);
    };
  }, [updatePositions]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop & Highlight */}
      <div
        className="absolute transition-all duration-300 ease-in-out border-2 border-orange-500 rounded-lg pointer-events-none"
        style={{ ...highlightStyle, boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)' }}
      ></div>

      {/* Text Box */}
      <div
        ref={textBoxRef}
        className="transition-all duration-300 ease-in-out bg-stone-800 p-6 rounded-lg shadow-2xl w-80 max-w-[calc(100vw-2rem)] border border-stone-600"
        style={textStyle}
      >
        <h3 className="text-xl font-bold text-orange-400 mb-2">{step.title}</h3>
        <p className="text-stone-300 text-sm mb-4">{step.text}</p>
        <div className="flex justify-between items-center">
            <div className="min-w-[100px]">
              {currentStep < TUTORIAL_STEPS.length - 1 && (
                  <button
                      onClick={onComplete}
                      className="text-xs text-stone-500 hover:text-orange-400 transition-colors px-3 py-2 rounded-md hover:bg-stone-700/50"
                  >
                      Don't show again
                  </button>
              )}
            </div>
          <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-stone-500">{currentStep + 1} / {TUTORIAL_STEPS.length}</span>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="p-2 rounded-full bg-stone-700 hover:bg-stone-600 text-stone-200"
                  aria-label="Previous step"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
              )}
              {currentStep < TUTORIAL_STEPS.length - 1 ? (
                  <button
                      onClick={handleNext}
                      className="p-2 rounded-full bg-orange-600 hover:bg-orange-700 text-white"
                      aria-label="Next step"
                  >
                      <ChevronRightIcon className="h-5 w-5" />
                  </button>
              ) : (
                  <button
                      onClick={onComplete}
                      className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-semibold"
                  >
                      Finish
                  </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveGuide;
