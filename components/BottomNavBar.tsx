

import React from 'react';
import { ActiveView, Language } from '../types';
import { DrillIcon, ChordIcon, MenuIcon, DictionaryIcon } from './Icons';
import { createTranslator } from '../services/translations';
import { playUIClick } from '../services/sound';

interface BottomNavBarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  id?: string;
  language: Language;
}

const NavButton: React.FC<{
  label: string;
  view: ActiveView;
  activeView: ActiveView;
  onClick: (view: ActiveView) => void;
  children: React.ReactNode;
  id?: string;
}> = ({ label, view, activeView, onClick, children, id }) => {
  const isActive = activeView === view;
  return (
    <button
      id={id}
      onClick={() => { onClick(view); playUIClick(); }}
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

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, onViewChange, id, language }) => {
  const t = createTranslator(language);

  return (
    <nav id={id} className="bottom-nav-container bg-stone-900/80 backdrop-blur-lg border-t border-stone-700/50 flex justify-around items-center z-40 w-full flex-shrink-0 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <NavButton id="tutorial-nav-drill" label={t('drill')} view="drill" activeView={activeView} onClick={onViewChange}>
        <DrillIcon className="h-6 w-6" />
      </NavButton>
      <NavButton id="tutorial-nav-chord" label={t('chordWorkspace')} view="chord" activeView={activeView} onClick={onViewChange}>
        <ChordIcon className="h-6 w-6" />
      </NavButton>
      <NavButton id="tutorial-nav-dictionary" label={t('dictionary')} view="dictionary" activeView={activeView} onClick={onViewChange}>
        <DictionaryIcon className="h-6 w-6" />
      </NavButton>
      <NavButton id="tutorial-nav-menu" label={t('menu')} view="menu" activeView={activeView} onClick={onViewChange}>
        <MenuIcon className="h-6 w-6" />
      </NavButton>
    </nav>
  );
};

export default BottomNavBar;
