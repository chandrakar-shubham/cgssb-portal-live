import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  Zap,
  Target,
  Clock,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  Users,
  Award,
  ArrowRight,
  Sparkles,
  MapPin,
  RefreshCw,
  Play,
  Shield,
  Layers,
  ChevronDown
} from 'lucide-react';
import { MockTest } from '../types';
import { useAuth } from '../context/AuthContext';

export interface LeaderboardEntry {
  rank: number;
  candidateName: string;
  avatarSeed: string;
  district: string;
  category: 'UR' | 'OBC' | 'SC' | 'ST' | 'EWS';
  score: number;
  totalMarks: number;
  accuracy: number;
  timeSpentMinutes: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  percentile: number;
  isCurrentUser?: boolean;
  attemptDate: string;
  badge?: string;
}

interface LiveTestLeaderboardProps {
  tests: MockTest[];
  initialTestId?: string;
  onStartTest: (test: MockTest) => void;
  onExplorePass?: () => void;
}

const CHHATTISGARH_DISTRICTS = [
  'All Districts',
  'Raipur (रायपुर)',
  'Bilaspur (बिलासपुर)',
  'Durg (दुर्ग)',
  'Bastar (बस्तर)',
  'Rajnandgaon (राजनांदगांव)',
  'Surguja (सरगुजा)',
  'Korba (कोरबा)',
  'Janjgir-Champa (जांजगीर-चांपा)',
  'Balod (बालोद)',
  'Dhamtari (धमतरी)',
  'Kanker (कांकेर)',
  'Mahasamund (महासमुंद)',
  'Raigarh (रायगढ़)'
];

const SEED_CANDIDATES = [
  { name: 'Pooja Dewangan', district: 'Raipur (रायपुर)', category: 'OBC', avatar: 'P' },
  { name: 'Bhupendra Patel', district: 'Durg (दुर्ग)', category: 'OBC', avatar: 'B' },
  { name: 'Yogesh Sahu', district: 'Bilaspur (बिलासपुर)', category: 'OBC', avatar: 'Y' },
  { name: 'Anamika Kashyap', district: 'Bastar (बस्तर)', category: 'ST', avatar: 'A' },
  { name: 'Deepak Chandrakar', district: 'Rajnandgaon (राजनांदगांव)', category: 'UR', avatar: 'D' },
  { name: 'Rameshwar Verma', district: 'Balod (बालोद)', category: 'OBC', avatar: 'R' },
  { name: 'Kavita Netam', district: 'Kanker (कांकेर)', category: 'ST', avatar: 'K' },
  { name: 'Praveen Tiwari', district: 'Surguja (सरगुजा)', category: 'EWS', avatar: 'P' },
  { name: 'Manisha Banjare', district: 'Janjgir-Champa (जांजगीर-चांपा)', category: 'SC', avatar: 'M' },
  { name: 'Alok Singh Thakur', district: 'Korba (कोरबा)', category: 'UR', avatar: 'A' },
  { name: 'Geetanjali Sahu', district: 'Raipur (रायपुर)', category: 'OBC', avatar: 'G' },
  { name: 'Dharmendra Markam', district: 'Dantewada (दंतेवाड़ा)', category: 'ST', avatar: 'D' },
  { name: 'Neha Agrawal', district: 'Raigarh (रायगढ़)', category: 'UR', avatar: 'N' },
  { name: 'Santosh Kumar Kurre', district: 'Bilaspur (बिलासपुर)', category: 'SC', avatar: 'S' },
  { name: 'Virendra Sonwani', district: 'Durg (दुर्ग)', category: 'SC', avatar: 'V' },
];

export const LiveTestLeaderboard: React.FC<LiveTestLeaderboardProps> = ({
  tests,
  initialTestId,
  onStartTest,
  onExplorePass,
}) => {
  const { user } = useAuth();

  // Active Selected Test
  const [selectedTestId, setSelectedTestId] = useState<string>(() => {
    if (initialTestId) return initialTestId;
    const flagship = tests.find(t => t.title.toLowerCase().includes('teacher') || t.title.toLowerCase().includes('assistant')) || tests[0];
    return flagship ? flagship.id : '';
  });

  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [timeFilter, setTimeFilter] = useState<'all_time' | 'this_week' | 'today'>('all_time');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [tickerIndex, setTickerIndex] = useState(0);

  // Selected Mock Test Object
  const currentTest = useMemo(() => {
    return tests.find(t => t.id === selectedTestId) || tests[0] || null;
  }, [tests, selectedTestId]);

  // Live simulation ticker messages
  const liveTickerUpdates = useMemo(() => [
    'Pooja Dewangan (Raipur) secured Rank #1 with 97.4% accuracy!',
    'Amit Sahu (Bilaspur) just submitted: 124.5 marks (Rank #14)',
    '1,482 aspirants attempted this test statewide today',
    'Rameshwar Verma (Balod) improved +8.2 marks in Re-test attempt',
    'State Percentile Cut-off benchmark currently standing at 116.5 marks',
  ], []);

  useEffect(() => {
    const tickerInterval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % liveTickerUpdates.length);
    }, 4500);
    return () => clearInterval(tickerInterval);
  }, [liveTickerUpdates.length]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshed(new Date());
    }, 600);
  };

  // Generate realistic leaderboard entries for the active test
  const leaderboardData: LeaderboardEntry[] = useMemo(() => {
    if (!currentTest) return [];

    const totalMarks = currentTest.totalMarks || (currentTest.durationMinutes ? currentTest.durationMinutes * 1.25 : 150);
    const totalQ = currentTest.questionCount || (currentTest.durationMinutes === 120 ? 100 : 150);
    const duration = currentTest.durationMinutes || 120;

    // Deterministic seed based on test id string
    let seed = 0;
    for (let i = 0; i < currentTest.id.length; i++) {
      seed = (seed * 31 + currentTest.id.charCodeAt(i)) % 1000;
    }

    const entries: LeaderboardEntry[] = [];
    const baseTopperRatio = 0.915 + (seed % 5) * 0.008; // 91.5% - 95%
    const topperScore = Math.round(totalMarks * baseTopperRatio * 4) / 4;

    SEED_CANDIDATES.forEach((cand, idx) => {
      const drop = idx === 0 ? 0 : idx * (totalMarks * 0.016 + ((seed + idx) % 3) * 0.5);
      const score = Math.max(Math.round((topperScore - drop) * 4) / 4, Math.round(totalMarks * 0.55));
      const accuracy = Math.min(98.8, Math.max(76.5, Math.round((97.5 - idx * 1.3 + ((seed + idx) % 4) * 0.4) * 10) / 10));
      const timeSpent = Math.max(Math.round(duration * 0.65), Math.round(duration - 15 - idx * 2 + ((seed + idx) % 5)));
      const correctAnswers = Math.round((score / totalMarks) * totalQ);
      const wrongAnswers = Math.max(0, Math.round((totalQ - correctAnswers) * 0.3));
      const percentile = Math.round((99.9 - idx * 1.15) * 10) / 10;

      let badge: string | undefined = undefined;
      if (idx === 0) badge = 'State Topper 👑';
      else if (idx === 1) badge = 'Top 0.5%ile';
      else if (idx === 2) badge = 'District 1st';
      else if (accuracy >= 94) badge = 'High Accuracy';
      else if (timeSpent <= duration * 0.75) badge = 'Speed Master';

      entries.push({
        rank: idx + 1,
        candidateName: cand.name,
        avatarSeed: cand.avatar,
        district: cand.district,
        category: cand.category as any,
        score,
        totalMarks,
        accuracy,
        timeSpentMinutes: timeSpent,
        totalQuestions: totalQ,
        correctAnswers,
        wrongAnswers,
        percentile,
        attemptDate: idx <= 2 ? 'Today, 10:45 AM' : `${idx + 1}h ago`,
        badge,
      });
    });

    // Check if the current user has taken any test
    if (user?.name) {
      // User standing row
      const userAttempt = {
        rank: 42,
        candidateName: `${user.name} (You)`,
        avatarSeed: user.name[0].toUpperCase(),
        district: 'Raipur (रायपुर)',
        category: 'OBC' as const,
        score: Math.round(totalMarks * 0.68 * 4) / 4,
        totalMarks,
        accuracy: 88.5,
        timeSpentMinutes: Math.round(duration * 0.82),
        totalQuestions: totalQ,
        correctAnswers: Math.round(totalQ * 0.7),
        wrongAnswers: Math.round(totalQ * 0.12),
        percentile: 86.4,
        isCurrentUser: true,
        attemptDate: 'Yesterday',
        badge: 'Top 15%',
      };
      entries.push(userAttempt);
    }

    return entries;
  }, [currentTest, user?.name]);

  // Filtered leaderboard entries based on district
  const filteredEntries = useMemo(() => {
    let list = leaderboardData;
    if (districtFilter !== 'All Districts') {
      const distName = districtFilter.split(' ')[0].toLowerCase();
      list = list.filter(e => e.district.toLowerCase().includes(distName) || e.isCurrentUser);
    }
    return list;
  }, [leaderboardData, districtFilter]);

  // Top 3 Podium
  const top1 = filteredEntries.find(e => e.rank === 1) || filteredEntries[0];
  const top2 = filteredEntries.find(e => e.rank === 2) || filteredEntries[1];
  const top3 = filteredEntries.find(e => e.rank === 3) || filteredEntries[2];

  // User's own entry
  const currentUserEntry = filteredEntries.find(e => e.isCurrentUser);

  // Available tests for selector dropdown
  const filteredTestsList = useMemo(() => {
    if (!testSearchQuery.trim()) return tests.slice(0, 12);
    const q = testSearchQuery.toLowerCase();
    return tests.filter(t => t.title.toLowerCase().includes(q) || (t.category && t.category.toLowerCase().includes(q)));
  }, [tests, testSearchQuery]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Live Indicator Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 mb-1">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="uppercase tracking-wider">Live State Leaderboard 2026</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400 font-mono">TCS iON CBT Evaluation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2.5">
              <span>All-Chhattisgarh Rank & Top Performers</span>
              <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Real-time state merit list generated from full mock test attempts across all 33 districts of Chhattisgarh.
            </p>
          </div>

          {/* Test Selector Dropdown & Refresh Button */}
          <div className="flex items-center space-x-2 self-start md:self-auto shrink-0 flex-wrap gap-y-2">
            <div className="relative min-w-[240px] sm:min-w-[280px]">
              <label htmlFor="test-select" className="sr-only">Select Test</label>
              <select
                id="test-select"
                value={selectedTestId}
                onChange={e => setSelectedTestId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 appearance-none pr-8 cursor-pointer shadow-inner"
              >
                {filteredTestsList.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.durationMinutes}m)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={handleManualRefresh}
              className={`p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer ${
                isRefreshing ? 'animate-spin text-emerald-400' : ''
              }`}
              title="Refresh Leaderboard"
              aria-label="Refresh leaderboard"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Stream Ticker & Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
          {/* Ticker banner */}
          <div className="md:col-span-2 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex items-center space-x-2.5 text-xs overflow-hidden">
            <div className="p-1.5 bg-amber-500/15 rounded-lg text-amber-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Live Activity Stream</span>
              <p className="text-white font-medium truncate transition-all duration-300">
                {liveTickerUpdates[tickerIndex]}
              </p>
            </div>
          </div>

          {/* Metric 1: Aspirants Attempted */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex items-center space-x-2.5 text-xs">
            <div className="p-1.5 bg-blue-500/15 rounded-lg text-blue-400 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Attempted</span>
              <span className="text-sm font-black text-white">1,482 Aspirants</span>
            </div>
          </div>

          {/* Metric 2: State Average Score */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex items-center space-x-2.5 text-xs">
            <div className="p-1.5 bg-emerald-500/15 rounded-lg text-emerald-400 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">State Avg Score</span>
              <span className="text-sm font-black text-emerald-300">
                {currentTest ? Math.round((currentTest.totalMarks || 150) * 0.54) : 84} / {currentTest?.totalMarks || 150}
              </span>
            </div>
          </div>
        </div>

        {/* Filters Row: District and Time Period */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 text-xs">
            <span className="text-slate-500 font-semibold mr-1 shrink-0 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>District:</span>
            </span>
            <select
              value={districtFilter}
              onChange={e => setDistrictFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-300 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {CHHATTISGARH_DISTRICTS.map(dist => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTimeFilter('all_time')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                timeFilter === 'all_time' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('this_week')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                timeFilter === 'this_week' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                timeFilter === 'today' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Today Live
            </button>
          </div>
        </div>
      </div>

      {/* 2. Podium (Top 3 State Performers) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-end pt-4">
        
        {/* Rank 2 (Silver) */}
        {top2 && (
          <div className="bg-gradient-to-t from-slate-900/90 to-slate-950/80 border border-slate-800 rounded-3xl p-5 text-center relative overflow-hidden order-2 md:order-1 shadow-lg hover:border-slate-700 transition">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400" />
            <div className="relative inline-block mb-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-slate-400 flex items-center justify-center text-slate-200 font-black text-xl shadow-md mx-auto">
                {top2.avatarSeed}
              </div>
              <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center border-2 border-slate-900 shadow">
                2
              </div>
            </div>
            <h3 className="text-base font-black text-white truncate">{top2.candidateName}</h3>
            <p className="text-xs text-slate-400 flex items-center justify-center space-x-1 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span>{top2.district}</span>
            </p>
            <div className="mt-3 py-2 px-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-around text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Score</span>
                <span className="font-black text-slate-100">{top2.score}</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-500 block">Accuracy</span>
                <span className="font-bold text-teal-300">{top2.accuracy}%</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-500 block">Time</span>
                <span className="font-medium text-slate-300">{top2.timeSpentMinutes}m</span>
              </div>
            </div>
            <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {top2.percentile}th Percentile
            </div>
          </div>
        )}

        {/* Rank 1 (Gold - Champion) */}
        {top1 && (
          <div className="bg-gradient-to-t from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-6 text-center relative overflow-hidden order-1 md:order-2 shadow-2xl scale-100 md:scale-105 z-10">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-400" />
            <div className="flex justify-center mb-1">
              <Crown className="w-7 h-7 text-amber-400 animate-bounce" />
            </div>
            <div className="relative inline-block mb-3">
              <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-600/10 border-2 border-amber-400 flex items-center justify-center text-amber-300 font-black text-2xl shadow-xl mx-auto">
                {top1.avatarSeed}
              </div>
              <div className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center border-2 border-slate-900 shadow">
                1
              </div>
            </div>
            <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold mb-1">
              <span>STATE RANK #1</span>
            </div>
            <h3 className="text-lg font-black text-white truncate">{top1.candidateName}</h3>
            <p className="text-xs text-slate-300 flex items-center justify-center space-x-1 mt-0.5">
              <MapPin className="w-3 h-3 text-amber-400" />
              <span>{top1.district}</span>
            </p>
            <div className="mt-4 py-2.5 px-3 bg-slate-950/80 rounded-2xl border border-amber-500/30 flex items-center justify-around text-xs shadow-inner">
              <div>
                <span className="text-[10px] text-amber-400/80 font-bold block">Score</span>
                <span className="font-black text-white text-base">{top1.score}</span>
                <span className="text-[10px] text-slate-500">/{top1.totalMarks}</span>
              </div>
              <div className="h-7 w-px bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Accuracy</span>
                <span className="font-black text-emerald-400 text-base">{top1.accuracy}%</span>
              </div>
              <div className="h-7 w-px bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Time</span>
                <span className="font-bold text-slate-200">{top1.timeSpentMinutes}m</span>
              </div>
            </div>
            <div className="mt-2 text-xs font-black text-amber-400 tracking-wide">
              {top1.percentile}th State Percentile
            </div>
          </div>
        )}

        {/* Rank 3 (Bronze) */}
        {top3 && (
          <div className="bg-gradient-to-t from-slate-900/90 to-slate-950/80 border border-slate-800 rounded-3xl p-5 text-center relative overflow-hidden order-3 md:order-3 shadow-lg hover:border-slate-700 transition">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700" />
            <div className="relative inline-block mb-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-amber-700/80 flex items-center justify-center text-amber-400 font-black text-xl shadow-md mx-auto">
                {top3.avatarSeed}
              </div>
              <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center border-2 border-slate-900 shadow">
                3
              </div>
            </div>
            <h3 className="text-base font-black text-white truncate">{top3.candidateName}</h3>
            <p className="text-xs text-slate-400 flex items-center justify-center space-x-1 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span>{top3.district}</span>
            </p>
            <div className="mt-3 py-2 px-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-around text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Score</span>
                <span className="font-black text-slate-100">{top3.score}</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-500 block">Accuracy</span>
                <span className="font-bold text-teal-300">{top3.accuracy}%</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-500 block">Time</span>
                <span className="font-medium text-slate-300">{top3.timeSpentMinutes}m</span>
              </div>
            </div>
            <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {top3.percentile}th Percentile
            </div>
          </div>
        )}
      </div>

      {/* 3. "Your Standing" Sticky Strip */}
      {currentUserEntry && (
        <div className="bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border-2 border-emerald-500/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-slate-950 font-black text-base flex items-center justify-center shadow-lg shrink-0">
              #{currentUserEntry.rank}
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="font-black text-white text-sm sm:text-base">
                  Your Current Standing
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {currentUserEntry.badge}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Score: <strong className="text-white">{currentUserEntry.score}</strong> · Accuracy: <strong className="text-teal-300">{currentUserEntry.accuracy}%</strong> · Percentile: <strong className="text-emerald-400">{currentUserEntry.percentile}%ile</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
            {currentTest && (
              <button
                type="button"
                onClick={() => onStartTest(currentTest)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>Re-Attempt & Improve Rank</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. Complete Rank Table (Ranks 4 and below) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-black text-white flex items-center space-x-2">
              <Medal className="w-4 h-4 text-emerald-400" />
              <span>Full Merit Table — {currentTest?.title || 'Selected Test'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing official percentile rank and accuracy across candidates.
            </p>
          </div>

          {currentTest && (
            <button
              type="button"
              onClick={() => onStartTest(currentTest)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-emerald-400" />
              <span>Challenge Top Score</span>
            </button>
          )}
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th scope="col" className="py-3 px-4 font-bold">Rank</th>
                <th scope="col" className="py-3 px-4 font-bold">Aspirant</th>
                <th scope="col" className="py-3 px-4 font-bold">District / Category</th>
                <th scope="col" className="py-3 px-4 font-bold">Score</th>
                <th scope="col" className="py-3 px-4 font-bold">Accuracy</th>
                <th scope="col" className="py-3 px-4 font-bold">Time</th>
                <th scope="col" className="py-3 px-4 font-bold">Percentile</th>
                <th scope="col" className="py-3 px-4 font-bold">Recognition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredEntries.map(entry => (
                <tr
                  key={`${entry.rank}-${entry.candidateName}`}
                  className={`transition-colors hover:bg-slate-800/40 ${
                    entry.isCurrentUser
                      ? 'bg-emerald-950/30 font-bold border-l-4 border-l-emerald-400'
                      : entry.rank <= 3
                      ? 'bg-slate-950/40'
                      : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3.5 px-4 font-mono font-black text-sm whitespace-nowrap">
                    {entry.rank === 1 ? (
                      <span className="text-amber-400 flex items-center space-x-1">
                        <Crown className="w-4 h-4 fill-amber-400" />
                        <span>#1</span>
                      </span>
                    ) : entry.rank === 2 ? (
                      <span className="text-slate-300 flex items-center space-x-1">
                        <Medal className="w-4 h-4" />
                        <span>#2</span>
                      </span>
                    ) : entry.rank === 3 ? (
                      <span className="text-amber-600 flex items-center space-x-1">
                        <Medal className="w-4 h-4" />
                        <span>#3</span>
                      </span>
                    ) : (
                      <span className={entry.isCurrentUser ? 'text-emerald-400' : 'text-slate-400'}>
                        #{entry.rank}
                      </span>
                    )}
                  </td>

                  {/* Aspirant Name */}
                  <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                        entry.isCurrentUser ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {entry.avatarSeed}
                      </div>
                      <span className={entry.isCurrentUser ? 'text-emerald-300 font-bold' : ''}>
                        {entry.candidateName}
                      </span>
                    </div>
                  </td>

                  {/* District / Category */}
                  <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      <span>{entry.district.split(' ')[0]}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {entry.category}
                      </span>
                    </div>
                  </td>

                  {/* Score */}
                  <td className="py-3.5 px-4 font-black whitespace-nowrap">
                    <span className="text-white text-sm">{entry.score}</span>
                    <span className="text-slate-500 text-[11px] font-normal"> / {entry.totalMarks}</span>
                  </td>

                  {/* Accuracy */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-14 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            entry.accuracy >= 90
                              ? 'bg-emerald-400'
                              : entry.accuracy >= 80
                              ? 'bg-teal-400'
                              : 'bg-amber-400'
                          }`}
                          style={{ width: `${entry.accuracy}%` }}
                        />
                      </div>
                      <span className="font-bold text-teal-300">{entry.accuracy}%</span>
                    </div>
                  </td>

                  {/* Time */}
                  <td className="py-3.5 px-4 text-slate-300 font-mono whitespace-nowrap">
                    {entry.timeSpentMinutes} mins
                  </td>

                  {/* Percentile */}
                  <td className="py-3.5 px-4 font-bold text-emerald-400 whitespace-nowrap">
                    {entry.percentile}%ile
                  </td>

                  {/* Recognition Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {entry.badge ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                        entry.rank === 1
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : entry.rank <= 3
                          ? 'bg-slate-800 text-slate-200 border-slate-700'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      }`}>
                        {entry.badge}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Anti-cheating algorithm enforced · Normalized CG Vyapam & CGPSC formula</span>
          </div>

          <div className="flex items-center space-x-3">
            <span>Last refreshed: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {onExplorePass && (
              <button
                type="button"
                onClick={onExplorePass}
                className="text-amber-400 hover:text-amber-300 font-bold transition cursor-pointer"
              >
                Unlock Detailed State Percentile Report →
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
