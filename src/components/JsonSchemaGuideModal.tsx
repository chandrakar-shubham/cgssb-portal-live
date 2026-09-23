import React, { useState } from 'react';
import {
  X,
  Code,
  Copy,
  Check,
  Download,
  BookOpen,
  Layers,
  HelpCircle,
  Sparkles,
  FileJson
} from 'lucide-react';

interface JsonSchemaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadTemplate: (type: 'advanced' | 'legacy') => void;
}

export const ADVANCED_JSON_TEMPLATE = [
  {
    "id": "CGPSC-2024-Q01",
    "examName": "CGPSC Pre",
    "year": 2024,
    "subjectCategory": "gs_reasoning",
    "subject": "Chhattisgarh General Studies",
    "chapter": "History of Chhattisgarh",
    "topic": "Kalchuri Dynasty",
    "subtopic": "Administrative Setup",
    "difficulty": "Medium",
    "questionType": "mcq",
    "questionLanguage": "bilingual",
    "question": "In Kalchuri administration, what was the prime minister / chief administrative head called?",
    "questionHindi": "कलचुरी कालीन शासन व्यवस्था में प्रशासनिक प्रमुख (प्रधान मंत्री) को क्या कहा जाता था?",
    "options": [
      {
        "label": "A",
        "text": "Mahamatya",
        "textHindi": "महामात्य"
      },
      {
        "label": "B",
        "text": "Mahapurohit",
        "textHindi": "महापुरोहित"
      },
      {
        "label": "C",
        "text": "Mahapratihar",
        "textHindi": "महाप्रतिहार"
      },
      {
        "label": "D",
        "text": "Mahasenapati",
        "textHindi": "महासेनापति"
      }
    ],
    "correctOption": "A",
    "idealTimeSeconds": 45,
    "marks": 2,
    "negativeMarks": 0.66,
    "explanation": "In Kalchuri administration, the King's chief administrative minister and advisor was known as Mahamatya.",
    "explanationHindi": "कलचुरी शासन में राजा के मुख्य प्रशासनिक सलाहकार एवं प्रधान अधिकारी को महामात्य कहा जाता था।",
    "pypAppearances": [
      { "exam": "CGPSC Pre", "year": 2024, "paper": "Paper 1 (GS)" }
    ]
  },
  {
    "id": "CGPSC-2024-Q02",
    "examName": "CGPSC Pre",
    "year": 2024,
    "subjectCategory": "gs_reasoning",
    "subject": "Chhattisgarh General Studies",
    "chapter": "Geography of Chhattisgarh",
    "topic": "Rivers and Waterfalls",
    "subtopic": "Bastar Division",
    "difficulty": "Medium",
    "questionType": "matching",
    "questionLanguage": "bilingual",
    "question": "Match List-I (Waterfall) with List-II (River) in Chhattisgarh and select the correct code:",
    "questionHindi": "सूची-I (जलप्रपात) को सूची-II (नदी) से सुमेलित कीजिए तथा नीचे दिए गए कूट से सही उत्तर चुनिए:",
    "columnA": [
      { "id": "1", "text": "Chitrakote", "textHindi": "चित्रकोट" },
      { "id": "2", "text": "Tirathgarh", "textHindi": "तीरथगढ़" },
      { "id": "3", "text": "Amritdhara", "textHindi": "अमृतधारा" },
      { "id": "4", "text": "Kanger Dhara", "textHindi": "कांगेर धारा" }
    ],
    "columnB": [
      { "id": "a", "text": "Munga Bahar", "textHindi": "मुनगा बहार" },
      { "id": "b", "text": "Indravati", "textHindi": "इंद्रावती" },
      { "id": "c", "text": "Kanger", "textHindi": "कांगेर" },
      { "id": "d", "text": "Hasdeo", "textHindi": "हसदेव" }
    ],
    "options": [
      { "label": "A", "text": "1-b, 2-a, 3-d, 4-c", "textHindi": "1-b, 2-a, 3-d, 4-c" },
      { "label": "B", "text": "1-a, 2-b, 3-c, 4-d", "textHindi": "1-a, 2-b, 3-c, 4-d" },
      { "label": "C", "text": "1-c, 2-d, 3-a, 4-b", "textHindi": "1-c, 2-d, 3-a, 4-b" },
      { "label": "D", "text": "1-b, 2-c, 3-d, 4-a", "textHindi": "1-b, 2-c, 3-d, 4-a" }
    ],
    "correctOption": "A",
    "idealTimeSeconds": 60,
    "marks": 2,
    "negativeMarks": 0.66,
    "explanation": "Chitrakote is on Indravati, Tirathgarh is on Munga Bahar, Amritdhara is on Hasdeo, and Kanger Dhara is on Kanger river.",
    "explanationHindi": "चित्रकोट इंद्रावती नदी पर, तीरथगढ़ मुनगा बहार नदी पर, अमृतधारा हसदेव नदी पर और कांगेर धारा कांगेर नदी पर स्थित है।"
  },
  {
    "id": "CGPSC-2024-Q03",
    "examName": "CGPSC Pre",
    "year": 2024,
    "subjectCategory": "gs_reasoning",
    "subject": "General Studies",
    "chapter": "Indian Economy",
    "topic": "Monetary Policy",
    "difficulty": "Hard",
    "questionType": "assertion_reason",
    "questionLanguage": "bilingual",
    "question": "Given below are two statements, one is labelled as Assertion (A) and the other as Reason (R):",
    "questionHindi": "नीचे दो कथन दिए गए हैं, एक को अभिकथन (A) तथा दूसरे को कारण (R) कहा गया है:",
    "assertion": "When RBI increases the repo rate, commercial banks usually increase their lending rates.",
    "assertionHindi": "जब आरबीआई रेपो दर बढ़ाता है, तो वाणिज्यिक बैंक आमतौर पर अपनी ऋण दरों में वृद्धि करते हैं।",
    "reason": "Increase in repo rate raises the cost of borrowing for commercial banks from the central bank.",
    "reasonHindi": "रेपो दर में वृद्धि से वाणिज्यिक बैंकों के लिए केंद्रीय बैंक से उधार लेने की लागत बढ़ जाती है।",
    "options": [
      {
        "label": "A",
        "text": "Both (A) and (R) are true and (R) is the correct explanation of (A)",
        "textHindi": "(A) और (R) दोनों सही हैं और (R), (A) की सही व्याख्या है"
      },
      {
        "label": "B",
        "text": "Both (A) and (R) are true but (R) is NOT the correct explanation of (A)",
        "textHindi": "(A) और (R) दोनों सही हैं परंतु (R), (A) की सही व्याख्या नहीं है"
      },
      {
        "label": "C",
        "text": "(A) is true but (R) is false",
        "textHindi": "(A) सही है लेकिन (R) गलत है"
      },
      {
        "label": "D",
        "text": "(A) is false but (R) is true",
        "textHindi": "(A) गलत है लेकिन (R) सही है"
      }
    ],
    "correctOption": "A",
    "idealTimeSeconds": 75,
    "marks": 2,
    "negativeMarks": 0.66,
    "explanation": "Higher repo rate increases funds cost for banks, forcing them to raise interest on loans to consumers.",
    "explanationHindi": "रेपो दर बढ़ने पर बैंकों की निधि लागत बढ़ जाती है, जिससे वे ग्राहकों के ऋण पर ब्याज दरें बढ़ा देते हैं।"
  },
  {
    "id": "CGPSC-2024-Q04",
    "examName": "CGPSC Pre",
    "year": 2024,
    "subjectCategory": "gs_reasoning",
    "subject": "Chhattisgarh General Studies",
    "chapter": "Geography of Chhattisgarh",
    "topic": "Drainage System",
    "difficulty": "Hard",
    "questionType": "multi_statement",
    "questionLanguage": "bilingual",
    "question": "Consider the following statements regarding the Mahanadi River basin in Chhattisgarh:",
    "questionHindi": "छत्तीसगढ़ में महानदी अपवाह तंत्र के संबंध में निम्नलिखित कथनों पर विचार कीजिए:",
    "statements": [
      {
        "id": "1",
        "text": "It covers approximately 56.15% of the total geographic area of the state.",
        "textHindi": "यह राज्य के कुल भौगोलिक क्षेत्रफल का लगभग 56.15% भाग घेरता है।"
      },
      {
        "id": "2",
        "text": "The main river originates from Sihawa hill in Dhamtari district.",
        "textHindi": "मुख्य नदी का उद्गम धमतरी जिले की सिहावा पहाड़ी से होता है।"
      },
      {
        "id": "3",
        "text": "Its total length inside Chhattisgarh is 286 km.",
        "textHindi": "छत्तीसगढ़ के भीतर इसकी कुल लंबाई 286 किमी है।"
      }
    ],
    "options": [
      {
        "label": "A",
        "id": "A",
        "text": "1 and 2 only",
        "textHindi": "केवल 1 और 2"
      },
      {
        "label": "B",
        "id": "B",
        "text": "2 and 3 only",
        "textHindi": "केवल 2 और 3"
      },
      {
        "label": "C",
        "id": "C",
        "text": "1, 2, and 3",
        "textHindi": "1, 2 और 3 सभी"
      },
      {
        "label": "D",
        "id": "D",
        "text": "1 only",
        "textHindi": "केवल 1"
      }
    ],
    "correctOption": "C",
    "idealTimeSeconds": 70,
    "marks": 2,
    "negativeMarks": 0.66,
    "explanation": "All three statements are factually correct. The Mahanadi basin covers 56.15% of CG, originates at Sihawa, and flows for 286 km within CG out of its total 858 km length.",
    "explanationHindi": "तीनों कथन सत्य हैं। महानदी अपवाह तंत्र 56.15% क्षेत्र को कवर करता है, सिहावा से उद्गमित होता है तथा राज्य में 286 किमी प्रवाहित होता है।"
  }
];

export const LEGACY_PYP_JSON_TEMPLATE = [
  {
    "S.No.": 1,
    "Examname": "CGPSC PRE",
    "Year": 2024,
    "Question(Hindi)": "कलचुरी कालीन शासन व्यवस्था में प्रशासनिक प्रमुख को क्या कहा जाता था ?",
    "Question(english)": "In Kalchuri administration what was the administrative head called ?",
    "option_A": "महामात्य (Mahamatya)",
    "option_B": "महापुरोहित (Mahapurohit)",
    "option_C": "महाप्रतिहार (Mahapratihar)",
    "option_D": "महासेनापति (Mahasenapati)",
    "answer": "A",
    "explaination": "कलचुरी शासन में राजा के मुख्य प्रशासनिक सलाहकार एवं प्रधान अधिकारी को महामात्य कहा जाता था।",
    "chapterName": "History of Chhattisgarh",
    "repeatedInExams": "CGPSC 2018, CGPSC 2021"
  }
];

export const JsonSchemaGuideModal: React.FC<JsonSchemaGuideModalProps> = ({
  isOpen,
  onClose,
  onDownloadTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<'advanced' | 'legacy'>('advanced');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentJson =
    activeTab === 'advanced' ? ADVANCED_JSON_TEMPLATE : LEGACY_PYP_JSON_TEMPLATE;
  const jsonString = JSON.stringify(currentJson, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-5 sm:p-7 space-y-5 shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start space-x-3.5 pr-10 shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <FileJson className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-black text-white">
                Acceptable JSON Question Formats
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                Auto-Detected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              The importer accepts both the <strong>Full Feature Bilingual Schema</strong> (MCQ, 2-column Matching, Assertion-Reason) and the <strong>Standard PYP Format</strong>.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2 shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('advanced')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                activeTab === 'advanced'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Format 1: Advanced Full Schema (Recommended)</span>
            </button>

            <button
              onClick={() => setActiveTab('legacy')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                activeTab === 'legacy'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Format 2: Standard PYP 11-Key</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={() => onDownloadTemplate(activeTab)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .json</span>
            </button>
          </div>
        </div>

        {/* Feature Specs Badges */}
        <div className="shrink-0 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-1.5">
          {activeTab === 'advanced' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex items-start space-x-1.5">
                <span className="text-emerald-400 font-bold">✓ Types:</span>
                <span className="text-slate-300">
                  <code className="text-emerald-300 font-mono">"mcq"</code>, <code className="text-purple-300 font-mono">"matching"</code>, <code className="text-amber-300 font-mono">"assertion_reason"</code>, <code className="text-sky-300 font-mono">"multi_statement"</code>
                </span>
              </div>
              <div className="flex items-start space-x-1.5">
                <span className="text-emerald-400 font-bold">✓ Aliases:</span>
                <span className="text-slate-300">
                  Accepts <code className="text-slate-200 font-mono">questionType</code> or <code className="text-slate-200 font-mono">type</code>; <code className="text-slate-200 font-mono">correctOption</code>, <code className="text-slate-200 font-mono">correctAnswer</code>, or <code className="text-slate-200 font-mono">answer</code>
                </span>
              </div>
              <div className="flex items-start space-x-1.5">
                <span className="text-emerald-400 font-bold">✓ Language:</span>
                <span className="text-slate-300">
                  Bilingual stems (<code className="text-slate-200 font-mono">question</code> & <code className="text-slate-200 font-mono">questionHindi</code>) with options & statements
                </span>
              </div>
            </div>
          ) : (
            <div className="text-slate-300">
              <strong className="text-emerald-400">Keys:</strong> <code>S.No.</code>, <code>Examname</code>, <code>Year</code>, <code>Question(Hindi)</code>, <code>Question(english)</code>, <code>option_A</code>, <code>option_B</code>, <code>option_C</code>, <code>option_D</code>, <code>answer</code>, <code>explaination</code>, <code>chapterName</code>.
            </div>
          )}
        </div>

        {/* Code Editor Preview Box */}
        <div className="flex-1 min-h-0 bg-slate-950 rounded-2xl border border-slate-800 p-4 font-mono text-[11px] sm:text-xs text-emerald-400/90 overflow-y-auto scrollbar-thin">
          <pre>{jsonString}</pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400 shrink-0">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Files can be uploaded directly via the <strong>📥 Import JSON</strong> button.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
