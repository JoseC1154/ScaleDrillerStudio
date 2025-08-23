import React, { useEffect } from 'react';
import {
  TouchIcon, MidiIcon, MicIcon, PianoIcon, GuitarIcon, BassIcon,
  InfoIcon, SettingsIcon, EnterFullscreenIcon, HelpIcon, ToggleDegreesIcon,
  QuitIcon, CloseIcon
} from './Icons';

interface SectionProps { title: string; children: React.ReactNode; }
const Section: React.FC<SectionProps> = ({ title, children }) => (
  <section>
    <h3 className="text-xl font-bold text-orange-400 mb-3 border-b-2 border-orange-500/30 pb-2">{title}</h3>
    <div className="space-y-4 text-stone-300">{children}</div>
  </section>
);

interface IconRowProps { icon: React.ReactNode; title: string; children: React.ReactNode; }
const IconRow: React.FC<IconRowProps> = ({ icon, title, children }) => (
  <div className="flex items-start gap-4">
    <div className="text-green-400 mt-1">{icon}</div>
    <div>
      <h4 className="font-semibold text-stone-100">{title}</h4>
      <p className="text-sm text-stone-400">{children}</p>
    </div>
  </div>
);

interface ModeDescProps { title: string; children: React.ReactNode; }
const ModeDesc: React.FC<ModeDescProps> = ({ title, children }) => (
    <div>
        <h4 className="font-semibold text-stone-100">{title}</h4>
        <p className="text-sm text-stone-400">{children}</p>
    </div>
);

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTutorial: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, onStartTutorial }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-stone-700 rounded-lg max-w-2xl w-full shadow-2xl flex flex-col max-h-[calc(100vh-3rem)]" onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="p-4 border-b border-stone-700/50 flex-shrink-0 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-orange-400">App Guide</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          <Section title="How to Play">
            <p>Welcome to Scale Driller! Your goal is to test and improve your music theory knowledge through a series of fun and challenging drills.</p>
            <ol className="list-decimal list-inside space-y-2 text-stone-400">
                <li><strong className="text-stone-200">Set Up:</strong> Choose your input method (Touch, MIDI, Mic) and instrument from the top-left icons.</li>
                <li><strong className="text-stone-200">Select a Drill:</strong> On the main screen, choose a Level and a Drill. Some drills have extra settings you can configure.</li>
                <li><strong className="text-stone-200">Start Drilling:</strong> Hit the "Start" button to begin the quiz.</li>
                <li><strong className="text-stone-200">Answer Questions:</strong> Read the prompt and use your selected input method to play the correct notes on the on-screen instrument.</li>
                <li><strong className="text-stone-200">Level Up:</strong> Successfully completing the gatekeeper drill for your current level (e.g., "Key Conjurer" for L1) will unlock the next level and more advanced challenges!</li>
            </ol>
          </Section>

          <Section title="Icon Guide">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                    <h4 className="text-lg font-semibold text-stone-200 mb-3">Global Controls</h4>
                    <IconRow icon={<InfoIcon className="h-6 w-6" />} title="App Guide">Opens this help guide.</IconRow>
                    <IconRow icon={<SettingsIcon className="h-6 w-6" />} title="Global Settings">Opens settings to change your instrument, input method, handedness, and test your inputs.</IconRow>
                    <IconRow icon={<EnterFullscreenIcon className="h-6 w-6" />} title="Fullscreen">Toggles fullscreen mode for a more immersive experience.</IconRow>
                </div>
                 <div>
                    <h4 className="text-lg font-semibold text-stone-200 mb-3">In-Quiz Controls</h4>
                    <IconRow icon={<HelpIcon className="h-5 w-5" />} title="Scale Help">Shows all the notes in the current question's scale.</IconRow>
                    <IconRow icon={<ToggleDegreesIcon className="h-5 w-5" />} title="Toggle Labels">Switches the labels on the instrument between note names (C, D, E...) and scale degrees (1, 2, 3...).</IconRow>
                    <IconRow icon={<QuitIcon className="h-5 w-5" />} title="Quit Quiz">Exits the current quiz and returns to the main settings screen.</IconRow>
                </div>
                <div>
                    <h4 className="text-lg font-semibold text-stone-200 mb-3">Input Indicators</h4>
                    <IconRow icon={<TouchIcon className="h-6 w-6" />} title="Touch Input">Indicates that touch or mouse input is active.</IconRow>
                    <IconRow icon={<MidiIcon className="h-6 w-6" />} title="MIDI Input">Indicates that a MIDI controller is the active input method.</IconRow>
                    <IconRow icon={<MicIcon className="h-6 w-6" />} title="Microphone Input">Indicates your microphone or a connected external audio interface is the active input.</IconRow>
                </div>
                <div>
                    <h4 className="text-lg font-semibold text-stone-200 mb-3">Instrument Indicators</h4>
                    <IconRow icon={<PianoIcon className="h-6 w-6" />} title="Piano">Indicates the Piano is the selected instrument.</IconRow>
                    <IconRow icon={<GuitarIcon className="h-6 w-6" />} title="Guitar">Indicates the Guitar is the selected instrument.</IconRow>
                    <IconRow icon={<BassIcon className="h-6 w-6" />} title="Bass">Indicates the Bass is the selected instrument.</IconRow>
                </div>
            </div>
          </Section>

          <Section title="Drills by Level">
            <h4 className="text-lg font-semibold text-stone-200">Level 1: Introduction</h4>
            <ModeDesc title="Key Conjurer (Gatekeeper)">A 5-round drill to master note recognition.
                <ul className="list-disc list-inside text-sm text-stone-400 pl-4 mt-1">
                    <li><b>Concept:</b> Each round cycles through all 12 notes multiple times to build memory through repetition.</li>
                    <li><b>Progression:</b> Difficulty increases each round with more hidden notes, faster tempos, and penalties for incorrect answers.</li>
                </ul>
                * <b>To Level Up:</b> Survive all 5 rounds to unlock Level 2.
            </ModeDesc>
            <ModeDesc title="Galaxy Builder">Learn the secret recipe for building scales! Build scale 'constellations' by choosing the correct intervals (Whole/Half steps).</ModeDesc>
            
            <h4 className="text-lg font-semibold text-stone-200 mt-4">Level 2: Foundational Skills</h4>
            <ModeDesc title="Note Professor">A relaxed, educational drill where a "music professor" provides prompts and facts about each of the 12 notes. Your job is to find the note he asks for.</ModeDesc>
            <ModeDesc title="Simon Memory Game">A musical "Simon Says." Memorize and play back an ever-growing sequence of notes from a random Major scale. Builds your short-term musical memory.</ModeDesc>
            <ModeDesc title="Key Notes">Find all the notes that belong to the requested scale. A fast-paced drill to solidify your knowledge of which notes are in each key.</ModeDesc>
            <ModeDesc title="Practice, Degree Training & Nashville Numbers">Play the specific note that corresponds to the requested scale degree (e.g., the 3rd, 5th, etc.). These drills allow you to customize which keys, scales, and degrees to focus on, targeting your weakest spots.</ModeDesc>
            <ModeDesc title="Time Attack & BPM Challenge">Test your speed and endurance. Answer questions against a timer or a steadily increasing metronome. These drills train you to think and react quickly in a rhythmic context.</ModeDesc>
            <ModeDesc title="Scale Detective (Gatekeeper)">The gateway to the next level! A two-part challenge. First, a scale is played with one note missing—find it. Second, identify the root key of that scale. Complete this to unlock Level 3.</ModeDesc>

            <h4 className="text-lg font-semibold text-stone-200 mt-4">Level 3: Advanced Theory</h4>
            <ModeDesc title="Intervals">Given a root note and an interval name (e.g., "Major 3rd"), play the correct corresponding note. Trains your knowledge of interval distances.</ModeDesc>
            <ModeDesc title="Chord Builder">Given a root note and chord type (Major or Minor), find all three notes that form the chord.</ModeDesc>
            <ModeDesc title="ScaleSweeper (Gatekeeper)">A musical minesweeper! The root note is revealed. Uncover all 7 scale notes to win, but watch out for 'mines' (incorrect notes).
*   **To Level Up:** Complete this drill to unlock Level 4.</ModeDesc>

            <h4 className="text-lg font-semibold text-stone-200 mt-4">Level 4: Advanced Challenges</h4>
            <ModeDesc title="Randomizer Roulette (Gatekeeper)">The ultimate test of versatility. A random mix of questions from all other single-note and multi-note drills to keep you on your toes.
*   **To Level Up:** Complete this drill to unlock Level 5.</ModeDesc>
            
            <h4 className="text-lg font-semibold text-stone-200 mt-4">Level 5: The Ultimate Gauntlet</h4>
            <ModeDesc title="BPM Roulette">The ultimate challenge. Combines the random question style of 'Randomizer Roulette' with the intense, ever-increasing timer mechanics of 'BPM Challenge'.</ModeDesc>
          </Section>
        </div>
        
        {/* Modal Footer */}
        <footer className="p-4 border-t border-stone-700/50 flex-shrink-0">
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
            <button
              onClick={onStartTutorial}
              className="w-full sm:w-auto bg-stone-600 hover:bg-stone-500 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Replay Tutorial
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default InfoModal;