
import React from 'react';
import { ActiveView } from '../types';
import { ReportIcon, InfoIcon, TunerIcon, SettingsIcon } from './Icons';

interface BottomNavBarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  id?: string;
}

const NavButton: React.FC<{
  label: string;
  view: ActiveView;
  activeView: ActiveView;
  onClick: (view: ActiveView) => void;
  children: React.ReactNode;
}> = ({ label, view, activeView, onClick, children }) => {
  const isActive = activeView === view;
  return (
    <button
      onClick={() => onClick(view)}
      className={`flex flex-col items-center justify-center gap-1 w-full rounded-lg transition-colors duration-200 px-2 py-1 ${
        isActive ? 'text-orange-400 bg-orange-500/10' : 'text-stone-400 hover:text-orange-300 hover:bg-stone-700/50'
      }`}
      aria-label={`Go to ${label}`}
    >
      {children}
      <span className={`text-xs font-medium`}>{label}</span>
    </button>
  );
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, onViewChange, id }) => {
  return (
    <nav id={id} className="bottom-nav-container bg-stone-900/80 backdrop-blur-lg border-t border-stone-700/50 flex justify-around items-center z-40 w-full flex-shrink-0 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <NavButton label="Drill" view="drill" activeView={activeView} onClick={onViewChange}>
        <SettingsIcon className="h-6 w-6" />
      </NavButton>
      <NavButton label="Tuner" view="tuner" activeView={activeView} onClick={onViewChange}>
        <TunerIcon className="h-6 w-6" />
      </NavButton>
      <NavButton label="Report" view="report" activeView={activeView} onClick={onViewChange}>
        <ReportIcon className="h-6 w-6" />
      </NavButton>
      <NavButton label="Guide" view="guide" activeView={activeView} onClick={onViewChange}>
        <InfoIcon className="h-6 w-6" />
      </NavButton>
    </nav>
  );
};

export default BottomNavBar;