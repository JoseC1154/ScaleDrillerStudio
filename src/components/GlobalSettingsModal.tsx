import React from 'react';
import { CloseIcon } from './Icons';
import { DeviceType } from '../types';

interface GlobalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartInputTester: () => void;
  deviceType: DeviceType;
}

const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({ isOpen, onClose, onStartInputTester, deviceType }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-stone-700 rounded-lg p-6 max-w-md w-full shadow-2xl space-y-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-orange-400">Diagnostics</h2>
            <button onClick={onClose} className="text-stone-400 hover:text-white">
                <CloseIcon className="h-6 w-6" />
            </button>
        </div>

        <div className="pt-4 border-t border-stone-700">
            <h3 className="text-lg font-semibold text-stone-200 mb-1">Device Information</h3>
            <p className="text-sm text-stone-400">Detected Device Type: <span className="font-bold text-orange-400 capitalize">{deviceType}</span></p>
        </div>

        <div className="pt-4 border-t border-stone-700">
            <h3 className="text-lg font-semibold text-stone-200 mb-1">Input Tester</h3>
            <p className="text-sm text-stone-400 mb-4">Use the input tester to check if your MIDI controller, microphone, or audio interface is working correctly with the app.</p>
            <button
            onClick={onStartInputTester}
            className="w-full bg-stone-600 hover:bg-stone-500 text-white font-bold py-3 px-4 rounded-lg transition"
            >
            Test Input
            </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettingsModal;
