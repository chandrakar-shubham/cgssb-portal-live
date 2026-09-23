import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppLanguage = 'hi' | 'en';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const UI_TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  hi: {
    next: 'अगला प्रश्न',
    prev: 'पिछला प्रश्न',
    previous: 'पिछला',
    submit: 'टेस्ट जमा करें',
    submit_test: 'टेस्ट सबमिट करें',
    review_later: 'समीक्षा के लिए चिह्नित करें',
    clear_response: 'उत्तर हटाएं',
    question: 'प्रश्न',
    section: 'खंड',
    sections: 'विषय खंड',
    time_left: 'शेष समय',
    time_spent: 'इस प्रश्न पर समय',
    topper_time: 'टॉपर / आदर्श समय',
    palette: 'प्रश्न तालिका',
    instruction: 'निर्देश',
    assertion: 'अभिकथन [A]',
    reason: 'कारण [R]',
    list_1: 'सूची - I',
    list_2: 'सूची - II',
    select_one: 'एक विकल्प चुनें:',
    statements: 'कथन विचारणीय:',
    language_switched_notice: 'भाषा बदली गई (सामान्य अध्ययन द्विभाषी है)',
    fixed_language_notice: 'यह भाषा का प्रश्न है, मूल भाषा में ही प्रदर्शित होगा',
    explanation: 'विस्तृत व्याख्या',
    correct_answer: 'सही उत्तर',
    your_answer: 'आपका उत्तर',
  },
  en: {
    next: 'Next Question',
    prev: 'Previous Question',
    previous: 'Previous',
    submit: 'Submit Test',
    submit_test: 'Submit Test',
    review_later: 'Mark for Review',
    clear_response: 'Clear Response',
    question: 'Question',
    section: 'Section',
    sections: 'Sections',
    time_left: 'Time Left',
    time_spent: 'Time on Question',
    topper_time: 'Topper / Ideal Time',
    palette: 'Question Palette',
    instruction: 'Instructions',
    assertion: 'Assertion [A]',
    reason: 'Reason [R]',
    list_1: 'List - I',
    list_2: 'List - II',
    select_one: 'Select one answer:',
    statements: 'Consider the Statements:',
    language_switched_notice: 'Language switched (General Studies is bilingual)',
    fixed_language_notice: 'Language question is fixed in its target language',
    explanation: 'Detailed Explanation',
    correct_answer: 'Correct Answer',
    your_answer: 'Your Answer',
  },
};

const STORAGE_KEY = 'cgssb_language_preference';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'hi') {
        return saved;
      }
    } catch {
      // Ignore storage errors
    }
    return 'hi'; // Default to Hindi as per requirements
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore storage errors
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'hi' ? 'en' : 'hi');
  };

  const t = (key: string, fallback?: string): string => {
    return UI_TRANSLATIONS[language]?.[key] || fallback || UI_TRANSLATIONS['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      language: 'hi',
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key: string, fallback?: string) => UI_TRANSLATIONS['hi']?.[key] || fallback || key,
    };
  }
  return context;
};
