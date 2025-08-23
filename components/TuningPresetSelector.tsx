
import React from 'react';
import { TuningPreset } from '../types';

interface TuningPresetSelectorProps {
  presets: TuningPreset[];
  activePreset: TuningPreset;
  onPresetChange: (preset: TuningPreset) => void;
}

const TuningPresetSelector: React.FC<TuningPresetSelectorProps> = ({ presets, activePreset, onPresetChange }) => {
  return (
    <div className="flex justify-center gap-2 mt-4">
      {presets.map(preset => (
        <button
          key={preset.name}
          onClick={() => onPresetChange(preset)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            activePreset.name === preset.name
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
          }`}
        >
          {preset.name}
        </button>
      ))}
    </div>
  );
};

export default TuningPresetSelector;