import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

export const SettingsIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const ReportIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

export const InfoIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const TunerIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v10a4 4 0 008 0V3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 13v8" />
    </svg>
);

export const TouchIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 13v-8.5a1.5 1.5 0 0 1 3 0v7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 11.5v-2a1.5 1.5 0 0 1 3 0v2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 10.5a1.5 1.5 0 0 1 3 0v1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 11.5a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1-6 6h-2h.208a6 6 0 0 1-5.012-2.7l-.196-.3c-.312-.479-1.407-2.388-3.286-5.728a1.5 1.5 0 0 1 .536-2.022a1.867 1.867 0 0 1 2.28.28l1.47 1.47" />
    </svg>
);
  
export const MidiIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <g fill="currentColor" stroke="none">
          <circle cx="9" cy="15.5" r="1.2" />
          <circle cx="15" cy="15.5" r="1.2" />
          <circle cx="7.5" cy="11.5" r="1.2" />
          <circle cx="16.5" cy="11.5" r="1.2" />
          <circle cx="12" cy="8" r="1.2" />
      </g>
    </svg>
);
  
export const MicIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
    </svg>
);

export const PianoIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5.25h18v13.5H3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 5.25v8.25h2V5.25H6z" fill="currentColor" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 5.25v8.25h2V5.25h-2z" fill="currentColor" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 5.25v8.25h2V5.25h-2z" fill="currentColor"/>
    </svg>
);
  
export const GuitarIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
       <path strokeLinecap="round" strokeLinejoin="round" d="M9.75,2.25l-2,3.46-1,1.74-2.25,1c-1.25,.5-1.5,1.5-1.5,2.25s.5,1.75,1.5,2.25l2.25,1,1,1.74,2,3.46h4.5l2-3.46,1-1.74,2.25-1c1-.5,1.5-1.25,1.5-2.25s-.5-1.75-1.5-2.25l-2.25-1-1-1.74-2-3.46h-4.5Z" />
       <path strokeLinecap="round" strokeLinejoin="round" d="M12,14.5a2.5,2.5,0,1,0,0-5,2.5,2.5,0,1,0,0,5Z" />
       <path strokeLinecap="round" strokeLinejoin="round" d="M8,8V2h8v6" />
    </svg>
);

export const BassIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.2,2.2l-1.5,3.3-1.2,1-3,1.5c-1,.5-1.5,1.5-1.5,2.2v0c0,.8,.5,1.8,1.5,2.2l3,1.5,1.2,1,1.5,3.3h5.5l1.5-3.3,1.2-1,3-1.5c1-.5,1.5-1.5,1.5-2.2v0c0-.8-.5-1.8-1.5-2.2l-3-1.5-1.2-1-1.5-3.3H14.2Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M11,8V2h2v6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.5,4.5h-2V2.5h2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5,4.5H5.5V2.5H7.5" />
    </svg>
);

export const EnterFullscreenIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4" />
    </svg>
);

export const ExitFullscreenIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 4H4v4m12 0V4h-4M8 20H4v-4m12 0v4h-4" />
    </svg>
);

export const HelpIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
);

export const ToggleDegreesIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h12M6 15h12" />
    </svg>
);

export const QuitIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
);

export const CloseIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const LockIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
);

export const XMarkIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

export const HeartIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
    </svg>
);
