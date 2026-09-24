import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import {
  User as UserIcon,
  X,
  Check,
  Award,
  Crown,
  MapPin,
  Calendar,
  BookOpen,
  Phone,
  Mail,
  Target,
  Sparkles,
  Zap,
  Bookmark,
  AlertCircle
} from 'lucide-react';
import { getBookmarks } from '../utils/bookmarkStorage';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  attemptsCount?: number;
  mistakesCount?: number;
}

const CG_DISTRICTS = [
  'Raipur',
  'Bilaspur',
  'Durg',
  'Rajnandgaon',
  'Bastar (Jagdalpur)',
  'Surguja (Ambikapur)',
  'Korba',
  'Janjgir-Champa',
  'Raigarh',
  'Balod',
  'Bemetara',
  'Kabirdham (Kawardha)',
  'Baloda Bazar-Bhatapara',
  'Mahasamund',
  'Dhamtari',
  'Gariaband',
  'Kanker (North Bastar)',
  'Kondagaon',
  'Narayanpur',
  'Dantewada (South Bastar)',
  'Sukma',
  'Bijapur',
  'Korea (Baikunthpur)',
  'Manendragarh-Chirmiri-Bharatpur',
  'Surajpur',
  'Balrampur-Ramanujganj',
  'Jashpur',
  'Mungeli',
  'Gaurela-Pendra-Marwahi',
  'Khairagarh-Chhuikhadan-Gandai',
  'Mohla-Manpur-Ambagarh Chowki',
  'Sarangarh-Bilaigarh',
  'Sakti',
];

const TARGET_EXAMS = [
  'CGPSC State Service Prelims & Mains (Civil Services)',
  'CG Vyapam Hostel Warden (छात्रवास अधीक्षक)',
  'CG Vyapam Patwari / Revenue Inspector (RI)',
  'CG Teacher Recruitment 2026 (शिक्षक / सहायक शिक्षक)',
  'CG Assistant Professor / Lecturer 2026',
  'CG Police Sub-Inspector (SI) / Constable',
  'CG Forest Service (ACF / Forest Ranger)',
  'Swami Atmanand English Medium Schools (SAGES)',
  'CG Apex Bank / Sahkari Bank Recruitment',
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80',
];

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  attemptsCount = 0,
  mistakesCount = 0,
}) => {
  const { user, updateUserProfile } = useAuth();
  const bookmarkCount = getBookmarks().length;

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    targetExam: user?.targetExam || TARGET_EXAMS[0],
    targetYear: user?.targetYear || 2026,
    district: user?.district || 'Raipur',
    categoryReservation: (user?.categoryReservation || 'OBC') as 'UR' | 'OBC' | 'SC' | 'ST' | 'EWS',
    gender: (user?.gender || 'Male') as 'Male' | 'Female' | 'Other',
    medium: (user?.medium || 'Hindi') as 'Hindi' | 'English',
    education: user?.education || 'Graduate',
    bio: user?.bio || '',
    dailyGoalQuestions: user?.dailyGoalQuestions || 50,
    avatar: user?.avatar || PRESET_AVATARS[0],
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen || !user) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      targetExam: formData.targetExam,
      targetYear: Number(formData.targetYear),
      district: formData.district,
      categoryReservation: formData.categoryReservation,
      gender: formData.gender,
      medium: formData.medium,
      education: formData.education.trim(),
      bio: formData.bio.trim(),
      dailyGoalQuestions: Number(formData.dailyGoalQuestions),
      avatar: formData.avatar,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <span>Candidate Profile & Target Goals</span>
                {user.hasProPass && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center">
                    <Crown className="w-3 h-3 mr-1 fill-amber-400" />
                    PASS PRO
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">Manage your exam targets, domicile reservation, and preparation preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Highlights / Learning Dashboard Strip */}
        <div className="bg-slate-950/60 border-b border-slate-800/80 px-6 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Tests Practiced</span>
            <span className="text-base font-black text-white mt-0.5 block">{attemptsCount}</span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Mistakes Logged</span>
            <span className="text-base font-black text-rose-400 mt-0.5 block">{mistakesCount}</span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Bookmarked Questions</span>
            <span className="text-base font-black text-amber-400 mt-0.5 block">{bookmarkCount}</span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Credit Balance</span>
            <span className="text-base font-black text-emerald-400 mt-0.5 block flex items-center">
              <Zap className="w-3.5 h-3.5 mr-1 fill-emerald-400" />
              {user.credits} Pts
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Avatar Selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">Profile Avatar</label>
            <div className="flex flex-wrap items-center gap-3">
              {PRESET_AVATARS.map((av, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar: av })}
                  className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all p-0.5 ${
                    formData.avatar === av
                      ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-500/30'
                      : 'border-slate-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={av} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                </button>
              ))}
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Full Name (उम्मीदवार का नाम) *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                placeholder="e.g. Rameshwar Dewangan"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                placeholder="candidate@example.com"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Mobile / WhatsApp Number</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">+91</span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-11 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  placeholder="98270XXXXX"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Gender (लिंग)</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Male">Male (पुरुष)</option>
                <option value="Female">Female (महिला)</option>
                <option value="Other">Other (अन्य)</option>
              </select>
            </div>
          </div>

          {/* Domicile & Category Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-800 pt-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Home District (गृह ज़िला - CG)
              </label>
              <select
                value={formData.district}
                onChange={e => setFormData({ ...formData, district: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {CG_DISTRICTS.map(dist => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Reservation Category (आरक्षण वर्ग)
              </label>
              <select
                value={formData.categoryReservation}
                onChange={e => setFormData({ ...formData, categoryReservation: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="UR">UR (General / अनारक्षित)</option>
                <option value="OBC">OBC (अन्य पिछड़ा वर्ग - Non Creamy)</option>
                <option value="SC">SC (अनुसूचित जाति)</option>
                <option value="ST">ST (अनुसूचित जनजाति)</option>
                <option value="EWS">EWS (आर्थिक रूप से कमजोर)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Exam Language (माध्यम)
              </label>
              <select
                value={formData.medium}
                onChange={e => setFormData({ ...formData, medium: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Hindi">Hindi (हिंदी माध्यम)</option>
                <option value="English">English (अंग्रेजी माध्यम)</option>
              </select>
            </div>
          </div>

          {/* Academic & Target Exam Preferences */}
          <div className="border-t border-slate-800 pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Primary Target Exam (मुख्य लक्ष्य परीक्षा)
                </label>
                <select
                  value={formData.targetExam}
                  onChange={e => setFormData({ ...formData, targetExam: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {TARGET_EXAMS.map(ex => (
                    <option key={ex} value={ex}>
                      {ex}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Target Year</label>
                  <select
                    value={formData.targetYear}
                    onChange={e => setFormData({ ...formData, targetYear: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Daily Target</label>
                  <select
                    value={formData.dailyGoalQuestions}
                    onChange={e => setFormData({ ...formData, dailyGoalQuestions: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value={25}>25 Qs / day</option>
                    <option value={50}>50 Qs / day</option>
                    <option value={75}>75 Qs / day</option>
                    <option value={100}>100 Qs / day</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Highest Qualification / Degree
              </label>
              <input
                type="text"
                value={formData.education}
                onChange={e => setFormData({ ...formData, education: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                placeholder="e.g. B.Sc. (Maths) + B.Ed. (CG TET Qualified)"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Study Motto / Target Post (लक्ष्य पद व संकल्प)
              </label>
              <textarea
                rows={2}
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                placeholder="e.g. Target CGPSC Deputy Collector or CG Vyapam Hostel Warden with 120+ score in first attempt!"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 font-sans"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                  <span>Profile Updated!</span>
                </>
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
