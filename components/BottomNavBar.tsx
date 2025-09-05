

import React from 'react';
import { ActiveView } from '../types';
import { DrillIcon, ChordIcon, MenuIcon, DictionaryIcon } from './Icons';

interface BottomNavBarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onMenuClick: () => void;
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

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, onViewChange, onMenuClick, id }) => {
  const isMenuActive = ['tuner', 'report', 'guide'].includes(activeView);

  return (
    <nav id={id} className="bottom-nav-container bg-stone-900/80 backdrop-blur-lg border-t border-stone-700/50 flex justify-around items-center z-40 w-full flex-shrink-0 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <NavButton label="Drill" view="drill" activeView={activeView} onClick={onViewChange}>
        <DrillIcon className="h-6 w-6" />
      </NavButton>
      <NavButton label="Chord Workspace" view="chord" activeView={activeView} onClick={onViewChange}>
        <ChordIcon className="h-6 w-6" />
      </NavButton>
      <NavButton label="Dictionary" view="dictionary" activeView={activeView} onClick={onViewChange}>
        <DictionaryIcon className="h-6 w-6" />
      </NavButton>
      <button
        onClick={onMenuClick}
        className={`flex flex-col items-center justify-center gap-1 w-full rounded-lg transition-colors duration-200 px-2 py-1 ${
            isMenuActive ? 'text-orange-400 bg-orange-500/10' : 'text-stone-400 hover:text-orange-300 hover:bg-stone-700/50'
        }`}
        aria-label="Open Menu"
      >
        <MenuIcon className="h-6 w-6" />
        <span className="text-xs font-medium">Menu</span>
      </button>
    </nav>
  );
};

export default BottomNavBar;