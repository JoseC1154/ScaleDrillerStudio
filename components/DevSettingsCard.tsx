
import React from 'react';
import { DrillSettings, Note } from '../types';
import PracticeKeySelector from './PracticeKeySelector';

interface DevSettingsCardProps {
  settings: DrillSettings;
  onSettingChange: <K extends keyof DrillSettings>(key: K, value: DrillSettings[K]) => void;
}

const SliderControl: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, step = 1, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-stone-300 mb-1 flex justify-between">
      <span>{label}</span>
      <span className="font-bold text-orange-400">{value}</span>
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(parseInt(e.target.value, 10))}
      className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
    />
  </div>
);

const DevSettingsCard: React.FC<DevSettingsCardProps> = ({ settings, onSettingChange }) => {
  const handlePracticeKeyToggle = (keyToToggle: Note) => {
    const currentKeys = settings.practiceKeys || [];
    const isSelected = currentKeys.includes(keyToToggle);
    let newKeys;
    if (isSelected) {
        newKeys = currentKeys.filter(k => k !== keyToToggle);
    } else {
        newKeys = [...currentKeys, keyToToggle];
    }
    // Empty array means random keys will be used, which is the desired default.
    onSettingChange('practiceKeys', newKeys);
  };
  
  const INFINITE_QUESTIONS_VALUE = 10000;
  const SLIDER_MAX = 101;

  const handleQuestionCountChange = (sliderValue: number) => {
      const newValue = sliderValue >= SLIDER_MAX ? INFINITE_QUESTIONS_VALUE : sliderValue;
      onSettingChange('questionCount', newValue);
  };

  const questionCountDisplay = settings.questionCount >= INFINITE_QUESTIONS_VALUE ? 'Infinite' : settings.questionCount;
  const questionCountSliderValue = settings.questionCount >= INFINITE_QUESTIONS_VALUE ? SLIDER_MAX : settings.questionCount;

  return (
    <div className="p-4 space-y-4">
        <SliderControl
          label="BPM"
          value={settings.bpm}
          min={30}
          max={200}
          onChange={(v) => onSettingChange('bpm', v)}
        />
        <div>
          <label className="block text-sm font-medium text-stone-300 mb-1 flex justify-between">
            <span>Question Count</span>
            <span className="font-bold text-orange-400">{questionCountDisplay}</span>
          </label>
          <input
            type="range"
            min={1}
            max={SLIDER_MAX}
            value={questionCountSliderValue}
            onChange={e => handleQuestionCountChange(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>
        <SliderControl
          label="Starting Beats"
          value={settings.totalBeats}
          min={5}
          max={100}
          onChange={(v) => onSettingChange('totalBeats', v)}
        />
        <SliderControl
          label="Beat Award (on correct)"
          value={settings.beatAward}
          min={0}
          max={20}
          onChange={(v) => onSettingChange('beatAward', v)}
        />
        <SliderControl
          label="Beat Penalty (on incorrect)"
          value={settings.beatPenalty}
          min={0}
          max={20}
          onChange={(v) => onSettingChange('beatPenalty', v)}
        />
        <div className="border-t border-stone-600 my-4" />
        <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
                Practice Keys
            </label>
            <p className="text-xs text-stone-400 font-normal mt-1 mb-2">Select specific keys to practice. Leave empty to use random keys for all modes.</p>
            <PracticeKeySelector
                selectedKeys={settings.practiceKeys}
                onToggleKey={handlePracticeKeyToggle}
                instrument={settings.instrument}
            />
        </div>
        <div className="border-t border-stone-600 my-4" />
        <div>
            <div className="flex justify-between items-center">
                <label htmlFor="piano-shuffle" className="text-stone-200 text-sm font-medium select-none">
                    Piano Shuffle
                </label>
                <button
                    id="piano-shuffle"
                    onClick={() => onSettingChange('pianoShuffle', !settings.pianoShuffle)}
                    className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 ease-in-out flex-shrink-0 ${settings.pianoShuffle ? 'bg-green-500' : 'bg-stone-600'}`}
                    aria-pressed={settings.pianoShuffle}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${settings.pianoShuffle ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
            <p className="text-xs text-stone-400 font-normal mt-1">Randomize piano position before each question (Touch input only).</p>
        </div>
    </div>
  );
};

export default DevSettingsCard;
