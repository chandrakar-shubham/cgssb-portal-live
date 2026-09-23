import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Languages } from 'lucide-react';

interface LanguageToggleProps {
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`inline-flex items-center p-1 bg-slate-800/90 border border-slate-700/80 rounded-xl shadow-inner ${className}`}>
      <button
        type="button"
        onClick={() => setLanguage('hi')}
        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
          language === 'hi'
            ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Switch to Hindi medium"
      >
        <span>हिन्दी</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
          language === 'en'
            ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Switch to English medium"
      >
        <span>English</span>
      </button>
    </div>
  );
};
