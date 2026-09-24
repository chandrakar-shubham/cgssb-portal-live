import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  RotateCw,
  CheckCircle2,
  HelpCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Volume2,
  Flame,
  Check,
  RotateCcw,
  BookOpen,
  Filter,
  Eye,
  Layers
} from 'lucide-react';

interface FlashcardItem {
  id: string;
  category: 'hana' | 'janula' | 'muhavare' | 'district' | 'culture';
  categoryLabel: string;
  frontTitle: string;
  frontText: string;
  frontSubtext?: string;
  backAnswer: string;
  backExplanation: string;
  examAppearance?: string;
  frequencyBadge?: 'High Yield' | 'Frequently Repeated' | 'Must Know';
}

const CHHATTISGARHI_REVISION_DATA: FlashcardItem[] = [
  // हाना (कहावतें)
  {
    id: 'hana-1',
    category: 'hana',
    categoryLabel: 'हाना (कहावतें)',
    frontTitle: 'हाना / Chhattisgarhi Proverb',
    frontText: 'एक हाथ म घी अऊ दूसरा हाथ म गुड़',
    frontSubtext: 'CGPSC / Vyapam Favorite',
    backAnswer: 'दोनो ओर से लाभ होना (चारों उंगलियां घी में)',
    backExplanation: 'जब किसी व्यक्ति को हर परिस्थिति में केवल लाभ ही लाभ प्राप्त होता है, तब यह हाना प्रयुक्त होता है।',
    examAppearance: 'CGPSC State Service 2021, Hostel Warden 2023',
    frequencyBadge: 'Frequently Repeated',
  },
  {
    id: 'hana-2',
    category: 'hana',
    categoryLabel: 'हाना (कहावतें)',
    frontTitle: 'हाना / Chhattisgarhi Proverb',
    frontText: 'अंधवा के आगू रोवय, अपन दीदा खोवय',
    frontSubtext: 'व्यर्थ परिश्रम व नासमझी',
    backAnswer: 'मूर्ख या असंवेदनशील व्यक्ति के सामने अपनी व्यथा कहना व्यर्थ है।',
    backExplanation: 'दीदा = आंख। अंधे के आगे रोने से केवल अपनी आंखों की रोशनी (दीदा) ही नष्ट होती है, उसे कोई फर्क नहीं पड़ता।',
    examAppearance: 'CG Vyapam Patwari 2022',
    frequencyBadge: 'High Yield',
  },
  {
    id: 'hana-3',
    category: 'hana',
    categoryLabel: 'हाना (कहावतें)',
    frontTitle: 'हाना / Chhattisgarhi Proverb',
    frontText: 'जैसन बोही, वैसन लुही',
    frontSubtext: 'कर्म फल का सिद्धांत',
    backAnswer: 'जैसा कर्म करोगे, वैसा ही फल मिलेगा (जैसी करनी वैसी भरनी)',
    backExplanation: 'बोही = बोना (Sowing), लुही = काटना (Reaping)। फसल के संदर्भ में कर्म सिद्धांत की व्याख्या।',
    examAppearance: 'CG Assistant Teacher 2023',
    frequencyBadge: 'Must Know',
  },
  {
    id: 'hana-4',
    category: 'hana',
    categoryLabel: 'हाना (कहावतें)',
    frontTitle: 'हाना / Chhattisgarhi Proverb',
    frontText: 'घर के भेदी लंका दहय',
    frontSubtext: 'विश्वासघात',
    backAnswer: 'घर का भेदी अथवा अपना आदमी ही सर्वनाश का कारण बनता है।',
    backExplanation: 'विभीषण प्रसंग पर आधारित प्रचलित लोकोक्ति जो छत्तीसगढ़ी में सामान्य बोलचाल में प्रयुक्त होती है।',
    examAppearance: 'CG Forest Guard 2024',
    frequencyBadge: 'Must Know',
  },
  {
    id: 'hana-5',
    category: 'hana',
    categoryLabel: 'हाना (कहावतें)',
    frontTitle: 'हाना / Chhattisgarhi Proverb',
    frontText: 'पानी म मीन पियासी, मोहि सुन-सुन आवै हांसी',
    frontSubtext: 'सुलभ वस्तु की अनभिज्ञता',
    backAnswer: 'सत्य या सुख अपने भीतर होने पर भी बाहर भटकना।',
    backExplanation: 'जल में रहते हुए मछली का प्यासा रहना, आत्मज्ञान की कमी को दर्शाता है।',
    examAppearance: 'CGPSC Mains Paper-1',
    frequencyBadge: 'High Yield',
  },

  // जनउला (पहेलियां)
  {
    id: 'jan-1',
    category: 'janula',
    categoryLabel: 'जनउला (पहेलियां)',
    frontTitle: 'जनउला / Chhattisgarhi Riddle',
    frontText: 'एक थारी म दू अण्डा, एक गरम एक ठण्डा',
    frontSubtext: 'बूझो तो जानें! (आकाश संबंधी)',
    backAnswer: 'सूरज अऊ चंदा (Sun and Moon)',
    backExplanation: 'थारी = आकाश (थाली)। दो अंडे में गरम अंडा = सूरज (Sun) और ठंडा अंडा = चंद्रमा (Moon)।',
    examAppearance: 'CGPSC Prelims 2018, 2022 (Repeated Twice)',
    frequencyBadge: 'Frequently Repeated',
  },
  {
    id: 'jan-2',
    category: 'janula',
    categoryLabel: 'जनउला (पहेलियां)',
    frontTitle: 'जनउला / Chhattisgarhi Riddle',
    frontText: 'करिया बैला बइठे हे, लाल बैला भागत हे',
    frontSubtext: 'रसोई व अग्नि संबंधी जनउला',
    backAnswer: 'आगी अऊ धुआं (Agni & Dhuaan)',
    backExplanation: 'करिया बैला (काला बैल) = धुआं या कड़ाही, लाल बैला = आग की लपटें।',
    examAppearance: 'CG Vyapam RI 2020',
    frequencyBadge: 'High Yield',
  },
  {
    id: 'jan-3',
    category: 'janula',
    categoryLabel: 'जनउला (पहेलियां)',
    frontTitle: 'जनउला / Chhattisgarhi Riddle',
    frontText: 'नानकुन टूरा, बड़का धोती',
    frontSubtext: 'दैनिक खान-पान व वस्तु',
    backAnswer: 'मिरचा (Chilli) अथवा बीड़ी / दियासलाई',
    backExplanation: 'छोटा सा लड़का (मिर्च का डंठल या बीड़ी) जिसके ऊपर बड़ा सा लपेटा हुआ आवरण रहता है।',
    examAppearance: 'CGSSB Hostel Warden 2024',
    frequencyBadge: 'Frequently Repeated',
  },
  {
    id: 'jan-4',
    category: 'janula',
    categoryLabel: 'जनउला (पहेलियां)',
    frontTitle: 'जनउला / Chhattisgarhi Riddle',
    frontText: 'पर्रा भर पुतरी, दिन भर भटके रात भर सूते',
    frontSubtext: 'खगोलीय जनउला',
    backAnswer: 'तारागन / नक्षत्र (Stars)',
    backExplanation: 'पर्रा (बांस की डलिया) भर पुतलियां (तारे), जो रात में चमकती हैं और दिन में छिप जाती हैं।',
    examAppearance: 'CGPSC Prelims 2020',
    frequencyBadge: 'High Yield',
  },

  // मुहावरे (Idioms)
  {
    id: 'muh-1',
    category: 'muhavare',
    categoryLabel: 'मुहावरे (Idioms)',
    frontTitle: 'मुहावरा / Chhattisgarhi Idiom',
    frontText: 'गोड़ धोरना',
    frontSubtext: 'विनती व पश्चाताप',
    backAnswer: 'अत्यंत दीन होकर क्षमा मांगना अथवा अनुनय-विनय करना',
    backExplanation: 'गोड़ = पैर, धोरना = धोना/पकड़ना। किसी के पैर पड़कर अपनी गलती मानना।',
    examAppearance: 'CG Teacher Eligibility Test (CG TET)',
    frequencyBadge: 'Must Know',
  },
  {
    id: 'muh-2',
    category: 'muhavare',
    categoryLabel: 'मुहावरे (Idioms)',
    frontTitle: 'मुहावरा / Chhattisgarhi Idiom',
    frontText: 'छाती म मूंग दलना',
    frontSubtext: 'कष्ट व संताप',
    backAnswer: 'पास रहकर निरंतर कष्ट देना या मानसिक रूप से सताना',
    backExplanation: 'समीप रहकर ऐसा आचरण करना जिससे दूसरे को अत्यधिक मानसिक संताप पहुंचे।',
    examAppearance: 'CG Vyapam Patwari 2023',
    frequencyBadge: 'Frequently Repeated',
  },
  {
    id: 'muh-3',
    category: 'muhavare',
    categoryLabel: 'मुहावरे (Idioms)',
    frontTitle: 'मुहावरा / Chhattisgarhi Idiom',
    frontText: 'आंखी गड़ाना',
    frontSubtext: 'इच्छा व लालसा',
    backAnswer: 'किसी की वस्तु पर बुरी नीयत रखना या लोभ करना',
    backExplanation: 'दूसरे के धन, पद या संपत्ति पर निरंतर दृष्टि बनाए रखना।',
    examAppearance: 'CG Police SI 2023',
    frequencyBadge: 'Must Know',
  },

  // ज़िलावार GK (District-Wise Key Facts)
  {
    id: 'dist-1',
    category: 'district',
    categoryLabel: 'ज़िलावार GK',
    frontTitle: 'बस्तर ज़िला (Bastar District)',
    frontText: 'चित्रकोट जलप्रपात किस नदी पर स्थित है और इसे क्या उपनाम दिया गया है?',
    frontSubtext: 'भूगोल एवं पर्यटन',
    backAnswer: 'इन्द्रावती नदी — "भारत का नियाग्रा (Niagara of India)"',
    backExplanation: 'यह भारत का सबसे चौड़ा जलप्रपात (घोड़े की नाल के आकार का) है। बस्तर में कांगेर घाटी राष्ट्रीय उद्यान व कोटमसर गुफा भी स्थित है।',
    examAppearance: 'CGPSC Prelims 2017, 2019, 2023',
    frequencyBadge: 'High Yield',
  },
  {
    id: 'dist-2',
    category: 'district',
    categoryLabel: 'ज़िलावार GK',
    frontTitle: 'बलौदाबाज़ार-भाटापारा ज़िला',
    frontText: 'गिरौदपुरी धाम किस महान संत की जन्मस्थली व तपोभूमि है?',
    frontSubtext: 'धर्म एवं संस्कृति',
    backAnswer: 'परम पूज्य गुरु घासीदास जी (सतनाम पंथ के प्रवर्तक)',
    backExplanation: 'गिरौदपुरी में 77 मीटर ऊंचा कुतुबमीनार से भी भव्य जैतखाम स्थापित है। छाता पहाड़ भी यहीं स्थित है।',
    examAppearance: 'CG Vyapam Food Inspector 2022',
    frequencyBadge: 'Must Know',
  },
  {
    id: 'dist-3',
    category: 'district',
    categoryLabel: 'ज़िलावार GK',
    frontTitle: 'सरगुजा ज़िला (Surguja District)',
    frontText: 'रामगढ़ की पहाड़ी में स्थित सीताबेंगरा गुफा का ऐतिहासिक महत्व क्या है?',
    frontSubtext: 'पुरातत्व एवं नाट्यकला',
    backAnswer: 'विश्व की प्राचीनतम नाट्यशाला (Oldest Amphitheatre of the World)',
    backExplanation: 'सीताबेंगरा और जोगीमारा गुफा में ब्राह्मी लिपि में देवदत्त और सुतनुका का प्रसिद्ध प्रेम आख्यान उत्कीर्ण है।',
    examAppearance: 'CGPSC State Service 2020, 2024',
    frequencyBadge: 'Frequently Repeated',
  },

  // संस्कृति व पर्व (Culture & Festivals)
  {
    id: 'cult-1',
    category: 'culture',
    categoryLabel: 'संस्कृति व पर्व',
    frontTitle: 'छत्तीसगढ़ का लोकपर्व',
    frontText: 'छेरछेरा पुन्नी (Cherchera Punni) किस माह में मनाया जाता है और इसका मूल भाव क्या है?',
    frontSubtext: 'कृषि एवं दान पर्व',
    backAnswer: 'पौष पूर्णिमा — नई फसल कटाई के उपरांत अन्नदान का महापर्व',
    backExplanation: '"छेरछेरा, माई कोठी के धान ला हेरते हेरा!" कहकर बच्चे व युवा घर-घर जाकर धान मांगते हैं। यह समता और दान का प्रतीक है।',
    examAppearance: 'CGPSC Prelims 2022, CG Teacher 2023',
    frequencyBadge: 'High Yield',
  },
  {
    id: 'cult-2',
    category: 'culture',
    categoryLabel: 'संस्कृति व पर्व',
    frontTitle: 'बस्तर का दशहरा',
    frontText: 'बस्तर का प्रसिद्ध दशहरा कितने दिनों तक चलता है और यह किस देवी को समर्पित है?',
    frontSubtext: 'विश्व प्रसिद्ध आदिवासी लोकोत्सव',
    backAnswer: '75 दिन — मां दंतेश्वरी देवी को समर्पित',
    backExplanation: 'यह राम द्वारा रावण वध का नहीं, बल्कि मां दंतेश्वरी की आराधना व जनजातीय पंचायतों (मुरिया दरबार) का अद्वितीय उत्सव है।',
    examAppearance: 'CGPSC 2018, 2021, 2023',
    frequencyBadge: 'Frequently Repeated',
  },
];

export const ChhattisgarhiRevisionModule: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Mastered tracking in localStorage
  const [masteredIds, setMasteredIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('cgssb_mastered_flashcards');
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set();
  });

  const toggleMastered = (id: string) => {
    setMasteredIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem('cgssb_mastered_flashcards', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const filteredCards = useMemo(() => {
    if (selectedCategory === 'all') return CHHATTISGARHI_REVISION_DATA;
    return CHHATTISGARHI_REVISION_DATA.filter(c => c.category === selectedCategory);
  }, [selectedCategory]);

  const activeCard = filteredCards[currentIndex] || filteredCards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % filteredCards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const masteredCount = useMemo(() => {
    return filteredCards.filter(c => masteredIds.has(c.id)).length;
  }, [filteredCards, masteredIds]);

  const progressPercentage = Math.round((masteredCount / Math.max(1, filteredCards.length)) * 100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-teal-950/40 via-slate-900 to-slate-900 border border-teal-900/40 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center">
                <Sparkles className="w-3 h-3 mr-1 fill-teal-400" />
                RAPID REVISION DECK (त्वरित पुनरीक्षण)
              </span>
              <span className="text-xs text-slate-400">High-Yield Chhattisgarhi GK</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              हाना, जनउला, मुहावरे एवं ज़िलावार तथ्य
            </h1>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Master the highest-scoring, easily confused Chhattisgarhi language questions and cultural facts through active recall flashcards.
            </p>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-teal-500/30 shrink-0 min-w-[200px]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Cards Mastered</span>
              <span className="text-teal-300 font-bold">{masteredCount} / {filteredCards.length}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 block text-right mt-1 font-semibold">
              {progressPercentage}% Completed
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Topics (सभी)' },
          { id: 'hana', label: 'हाना (कहावतें)' },
          { id: 'janula', label: 'जनउला (पहेलियां)' },
          { id: 'muhavare', label: 'मुहावरे (Idioms)' },
          { id: 'district', label: 'ज़िलावार GK' },
          { id: 'culture', label: 'संस्कृति व पर्व' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-teal-500 text-slate-950 font-black shadow-md shadow-teal-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Active Interactive 3D Flashcard */}
      {activeCard && (
        <div className="flex flex-col items-center">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full max-w-2xl min-h-[340px] bg-slate-900 border-2 border-slate-700/80 hover:border-teal-500/60 rounded-3xl p-6 sm:p-8 cursor-pointer transition-all duration-300 flex flex-col justify-between shadow-2xl relative select-none group"
            style={{ perspective: '1000px' }}
          >
            {/* Top Card Badge */}
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {activeCard.categoryLabel}
              </span>

              <div className="flex items-center space-x-2">
                {activeCard.frequencyBadge && (
                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center">
                    <Flame className="w-2.5 h-2.5 mr-1 fill-amber-400 text-amber-400" />
                    {activeCard.frequencyBadge}
                  </span>
                )}
                <span className="text-xs text-slate-500 font-bold">
                  {currentIndex + 1} / {filteredCards.length}
                </span>
              </div>
            </div>

            {/* Front & Back Content Flip */}
            <div className="my-auto py-6 text-center">
              {!isFlipped ? (
                /* FRONT */
                <div className="space-y-4 animate-in fade-in duration-200">
                  <span className="text-[11px] font-bold text-teal-400 uppercase tracking-widest block">
                    {activeCard.frontTitle}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white leading-snug font-sans tracking-tight">
                    "{activeCard.frontText}"
                  </h3>
                  {activeCard.frontSubtext && (
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      💡 संकेत (Hint): {activeCard.frontSubtext}
                    </p>
                  )}
                  <span className="inline-block mt-4 text-[11px] font-bold text-slate-400 group-hover:text-teal-400 transition-colors">
                    Click to flip & see answer ➔
                  </span>
                </div>
              ) : (
                /* BACK */
                <div className="space-y-4 animate-in fade-in duration-200 text-left">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block text-center">
                    उत्तर एवं व्याख्या (Official Answer & Meaning)
                  </span>
                  <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-2xl">
                    <h3 className="text-lg sm:text-xl font-black text-emerald-200 leading-snug">
                      {activeCard.backAnswer}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    <strong className="text-slate-100">विस्तृत व्याख्या: </strong>
                    {activeCard.backExplanation}
                  </p>
                  {activeCard.examAppearance && (
                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-[11px] text-amber-300/90 font-medium">
                      🎯 पूर्व परीक्षा संदर्भ: {activeCard.examAppearance}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
              <span className="text-[10px] text-slate-500">
                {isFlipped ? 'Click card to flip back' : 'Tap to reveal answer'}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMastered(activeCard.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  masteredIds.has(activeCard.id)
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{masteredIds.has(activeCard.id) ? 'Mastered!' : 'Mark as Mastered'}</span>
              </button>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center space-x-4 mt-6">
            <button
              onClick={handlePrev}
              className="p-3 rounded-2xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center space-x-1 text-xs font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 transition text-xs font-bold flex items-center space-x-1.5"
            >
              <RotateCw className="w-4 h-4" />
              <span>Flip Card</span>
            </button>

            <button
              onClick={handleNext}
              className="p-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 transition flex items-center space-x-1 text-xs font-black shadow-lg shadow-teal-500/20"
            >
              <span>Next Card</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
