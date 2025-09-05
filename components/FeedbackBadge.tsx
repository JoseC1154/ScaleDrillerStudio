import React from 'react';

interface FeedbackBadgeProps {
  text: string;
}

const FeedbackBadge: React.FC<FeedbackBadgeProps> = ({ text }) => {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <div className="bg-stone-900/80 backdrop-blur-sm text-orange-400 font-bold px-4 py-2 rounded-lg shadow-lg border border-stone-700 animate-feedback-badge">
        {text}
      </div>
    </div>
  );
};

export default FeedbackBadge;
