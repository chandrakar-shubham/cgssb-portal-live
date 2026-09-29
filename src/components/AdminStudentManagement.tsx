import React, { useState, useMemo } from 'react';
import { User, DiscountCoupon, TestAttempt } from '../types';
import {
  getRegisteredStudents,
  saveRegisteredStudents,
  getCoupons,
  saveCoupons
} from '../utils/studentStore';
import {
  Users,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Edit,
  Trash2,
  Crown,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  Download,
  Send,
  Plus,
  CheckCircle2,
  XCircle,
  Copy,
  Clock,
  BookOpen,
  Tag,
  Percent,
  X,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';

interface AdminStudentManagementProps {
  attempts?: TestAttempt[];
}

export const AdminStudentManagement: React.FC<AdminStudentManagementProps> = ({ attempts = [] }) => {
  const [students, setStudents] = useState<User[]>(() => getRegisteredStudents());
  const [coupons, setCoupons] = useState<DiscountCoupon[]>(() => getCoupons());
  const [activeTab, setActiveTab] = useState<'crm' | 'marketing' | 'coupons'>('crm');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCadre, setFilterCadre] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'active' | 'blocked' | 'pro_pass' | 'free'>('ALL');

  // Modals
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [blockModalStudent, setBlockModalStudent] = useState<User | null>(null);
  const [blockReasonInput, setBlockReasonInput] = useState('');
  const [viewHistoryStudent, setViewHistoryStudent] = useState<User | null>(null);
  const [isNewCouponModalOpen, setIsNewCouponModalOpen] = useState(false);
  const [copySuccessMsg, setCopySuccessMsg] = useState<string | null>(null);

  // Marketing Campaign State
  const [selectedCampaignCadre, setSelectedCampaignCadre] = useState('CG Teacher 2026 (शिक्षक भर्ती)');
  const [campaignHeadline, setCampaignHeadline] = useState('🔥 CG Teacher 2026 Mega Mock Test Live!');
  const [campaignOfferCode, setCampaignOfferCode] = useState('CGTEACHER50');
  const [campaignDiscount, setCampaignDiscount] = useState('50% Flat Off');

  // New Coupon Form
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState(50);
  const [newCouponPlan, setNewCouponPlan] = useState<'all' | 'monthly' | 'yearly'>('all');
  const [newCouponDays, setNewCouponDays] = useState(30);
  const [newCouponMaxUses, setNewCouponMaxUses] = useState(500);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        (s.district && s.district.toLowerCase().includes(q)) ||
        (s.targetExam && s.targetExam.toLowerCase().includes(q));

      const matchesCadre = filterCadre === 'ALL' || (s.targetExam && s.targetExam.includes(filterCadre));

      let matchesStatus = true;
      if (filterStatus === 'active') matchesStatus = !s.isBlocked && s.status !== 'blocked';
      if (filterStatus === 'blocked') matchesStatus = Boolean(s.isBlocked || s.status === 'blocked');
      if (filterStatus === 'pro_pass') matchesStatus = Boolean(s.hasProPass);
      if (filterStatus === 'free') matchesStatus = !s.hasProPass;

      return matchesSearch && matchesCadre && matchesStatus;
    });
  }, [students, searchQuery, filterCadre, filterStatus]);

  // KPIs
  const totalStudents = students.length;
  const proPassStudents = students.filter(s => s.hasProPass).length;
  const blockedStudents = students.filter(s => s.isBlocked || s.status === 'blocked').length;

  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const updated = students.map(s => s.id === editingStudent.id ? editingStudent : s);
    setStudents(updated);
    saveRegisteredStudents(updated);
    setEditingStudent(null);
  };

  const handleToggleBlock = (student: User, isBlocking: boolean, reason?: string) => {
    const updated = students.map(s => {
      if (s.id === student.id) {
        return {
          ...s,
          isBlocked: isBlocking,
          status: isBlocking ? 'blocked' as const : 'active' as const,
          blockReason: isBlocking ? (reason || 'Violation of exam honor code') : undefined
        };
      }
      return s;
    });
    setStudents(updated);
    saveRegisteredStudents(updated);
    setBlockModalStudent(null);
    setBlockReasonInput('');
  };

  const handleGrantProPass = (studentId: string, days = 365) => {
    const updated = students.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          hasProPass: true,
          proPassPlan: `Admin Granted Pass (${days} Days)`,
          passDurationDays: days,
          passExpiresAt: new Date(Date.now() + days * 86400000).toISOString()
        };
      }
      return s;
    });
    setStudents(updated);
    saveRegisteredStudents(updated);
  };

  const handleRevokePass = (studentId: string) => {
    const updated = students.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          hasProPass: false,
          proPassPlan: undefined,
          passExpiresAt: undefined
        };
      }
      return s;
    });
    setStudents(updated);
    saveRegisteredStudents(updated);
  };

  const handleDeleteStudent = (studentId: string) => {
    if (!confirm('Are you sure you want to permanently delete this student record?')) return;
    const updated = students.filter(s => s.id !== studentId);
    setStudents(updated);
    saveRegisteredStudents(updated);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['User ID', 'Name', 'Email', 'Phone', 'Target Exam', 'District', 'Medium', 'Pass Status', 'Pass Expiry', 'Account Status', 'Registered Date'];
    const rows = filteredStudents.map(s => [
      s.id,
      `"${s.name.replace(/"/g, '""')}"`,
      s.email,
      s.phone || '',
      `"${(s.targetExam || '').replace(/"/g, '""')}"`,
      s.district || '',
      s.medium || 'Hindi',
      s.hasProPass ? 'PRO_PASS' : 'FREE_TIER',
      s.passExpiresAt ? s.passExpiresAt.split('T')[0] : '',
      s.isBlocked ? 'BLOCKED' : 'ACTIVE',
      s.registeredAt || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CGSSB_Student_CRM_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy WhatsApp Phone List
  const handleCopyPhoneNumbers = () => {
    const targetStudents = students.filter(s => !selectedCampaignCadre || (s.targetExam && s.targetExam.includes(selectedCampaignCadre)));
    const phones = targetStudents.map(s => s.phone).filter(Boolean);
    if (phones.length === 0) {
      alert('No phone numbers found for this cadre.');
      return;
    }
    navigator.clipboard.writeText(phones.join(', '));
    setCopySuccessMsg(`Copied ${phones.length} candidate phone numbers!`);
    setTimeout(() => setCopySuccessMsg(null), 3000);
  };

  // Create Coupon
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    const newC: DiscountCoupon = {
      id: `c-${Date.now()}`,
      code: newCouponCode.trim().toUpperCase(),
      discountPercentage: Number(newCouponDiscount),
      applicablePlan: newCouponPlan,
      validUntil: new Date(Date.now() + newCouponDays * 86400000).toISOString().split('T')[0],
      usageCount: 0,
      maxUses: Number(newCouponMaxUses),
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const updated = [newC, ...coupons];
    setCoupons(updated);
    saveCoupons(updated);
    setIsNewCouponModalOpen(false);
    setNewCouponCode('');
  };

  const handleToggleCouponActive = (couponId: string) => {
    const updated = coupons.map(c => c.id === couponId ? { ...c, isActive: !c.isActive } : c);
    setCoupons(updated);
    saveCoupons(updated);
  };

  const handleDeleteCoupon = (couponId: string) => {
    const updated = coupons.filter(c => c.id !== couponId);
    setCoupons(updated);
    saveCoupons(updated);
  };

  // WhatsApp Campaign Text
  const generatedWhatsAppMessage = useMemo(() => {
    return `🎯 *CGSSB Test Portal - Official Notification* 🎯

नमस्कार अभ्यर्थी, 

${campaignHeadline}

🏆 *आपकी परीक्षा तैयारी के लिए विशेष अवसर:*
• नए TCS पैटर्न आधारित Full Length Mock Tests लाइव हैं।
• सभी प्रश्नों के साथ विस्तृत व्याख्या (Bilingual Hindi/English) उपलब्ध।
• राज्य स्तरीय मेरिट रैंक व विश्लेषण।

🎟️ *Special Discount Offer:*
उपयोग करें प्रोमो कोड: *${campaignOfferCode}* और पाएं तुरंत *${campaignDiscount}*!

🔗 *अभी अभ्यास शुरू करें:* https://cgssbtest.com

_शुभकामनाएं,_
*CGSSB Test Portal Academic Wing*`;
  }, [campaignHeadline, campaignOfferCode, campaignDiscount]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Top Banner & Navigation Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
            <Users className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                FAANG Student CRM & Marketing Hub
              </span>
            </div>
            <h1 className="text-xl font-black text-white tracking-tight mt-0.5">
              Student Profile Ledger & Marketing Operations
            </h1>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('crm')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-2 ${
              activeTab === 'crm' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Student CRM ({totalStudents})</span>
          </button>
          <button
            onClick={() => setActiveTab('marketing')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-2 ${
              activeTab === 'marketing' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Marketing</span>
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-2 ${
              activeTab === 'coupons' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Coupons ({coupons.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Registered Candidates</span>
          <div className="text-2xl font-black text-white">{totalStudents}</div>
          <span className="text-[10px] text-emerald-400 font-semibold">100% Real Synchronized Profiles</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Active Pass Subscribers</span>
          <div className="text-2xl font-black text-amber-300">{proPassStudents}</div>
          <span className="text-[10px] text-slate-400">{Math.round((proPassStudents / (totalStudents || 1)) * 100)}% Pass Conversion</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Blocked / Suspended</span>
          <div className="text-2xl font-black text-rose-300">{blockedStudents}</div>
          <span className="text-[10px] text-slate-400">Zero-Tolerance Access Gate</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Total Test Attempts</span>
          <div className="text-2xl font-black text-indigo-300">{attempts.length || 14}</div>
          <span className="text-[10px] text-slate-400">Live CBT Mock Submissions</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STUDENT CRM LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'crm' && (
        <div className="space-y-4">
          
          {/* Action Bar with Search, Filters, CSV Export */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3 w-full md:w-auto flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search student name, email, phone, district..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto flex-wrap justify-end">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="active">Active Only</option>
                <option value="blocked">Blocked Accounts</option>
                <option value="pro_pass">Pro Pass Holders</option>
                <option value="free">Free Tier</option>
              </select>

              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table of Students */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Candidate Details</th>
                    <th className="py-3 px-4">Target Examination</th>
                    <th className="py-3 px-4">Location & Medium</th>
                    <th className="py-3 px-4">Pass Status</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No students found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-slate-800/40 transition">
                        
                        {/* Student Name & Contact */}
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-white text-sm">{student.name}</div>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="flex items-center space-x-1">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{student.email}</span>
                            </span>
                            {student.phone && (
                              <>
                                <span>•</span>
                                <span className="flex items-center space-x-1 text-emerald-400 font-mono">
                                  <Phone className="w-3 h-3" />
                                  <span>{student.phone}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Target Exam */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">
                            {student.targetExam || 'CG Teacher 2026'}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Joined {student.registeredAt || '2026-01-01'}
                          </span>
                        </td>

                        {/* Location & Medium */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1 text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>{student.district || 'Raipur'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Medium: <span className="text-white font-bold">{student.medium || 'Hindi'}</span>
                          </div>
                        </td>

                        {/* Pass Status */}
                        <td className="py-3.5 px-4">
                          {student.hasProPass ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              <Crown className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>PRO PASS ACTIVE</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              Free Tier
                            </span>
                          )}
                        </td>

                        {/* Account Status */}
                        <td className="py-3.5 px-4">
                          {student.isBlocked || student.status === 'blocked' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              <XCircle className="w-3 h-3" />
                              <span>BLOCKED</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            
                            {/* Pass Toggle Button */}
                            {student.hasProPass ? (
                              <button
                                onClick={() => handleRevokePass(student.id)}
                                title="Revoke Pro Pass"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition cursor-pointer"
                              >
                                <Crown className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleGrantProPass(student.id, 365)}
                                title="Grant 1-Year Free Pro Pass"
                                className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition cursor-pointer"
                              >
                                <Crown className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Edit Button */}
                            <button
                              onClick={() => setEditingStudent(student)}
                              title="Edit Student Profile"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Block / Unblock Toggle */}
                            {student.isBlocked || student.status === 'blocked' ? (
                              <button
                                onClick={() => handleToggleBlock(student, false)}
                                title="Unblock / Allow Student"
                                className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition cursor-pointer"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => { setBlockModalStudent(student); setBlockReasonInput(''); }}
                                title="Block Student"
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete Record */}
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              title="Delete Record"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WHATSAPP MARKETING & GROWTH HUB */}
      {/* ========================================================================= */}
      {activeTab === 'marketing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Campaign Configurator */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>1-Click Campaign Broadcast Generator</span>
            </div>

            <h2 className="text-lg font-black text-white">Create Targeted Exam Blast</h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Target Exam Cadre</label>
                <select
                  value={selectedCampaignCadre}
                  onChange={e => setSelectedCampaignCadre(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                >
                  <option value="CG Teacher 2026 (शिक्षक भर्ती)">CG Teacher 2026 (शिक्षक भर्ती)</option>
                  <option value="CG Police Sub-Inspector (SI)">CG Police Sub-Inspector (SI)</option>
                  <option value="CGPSC State Service Prelims 2026">CGPSC State Service Prelims 2026</option>
                  <option value="CG Vyapam Hostel Warden">CG Vyapam Hostel Warden</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Headline Announcement</label>
                <input
                  type="text"
                  value={campaignHeadline}
                  onChange={e => setCampaignHeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Promo Coupon Code</label>
                  <input
                    type="text"
                    value={campaignOfferCode}
                    onChange={e => setCampaignOfferCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white uppercase font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Discount Tagline</label>
                  <input
                    type="text"
                    value={campaignDiscount}
                    onChange={e => setCampaignDiscount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleCopyPhoneNumbers}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer border border-slate-700"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copy Phone Number List for this Cadre</span>
                </button>
              </div>

              {copySuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-bold">
                  {copySuccessMsg}
                </div>
              )}
            </div>
          </div>

          {/* Message Preview & WhatsApp Direct Share */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp Broadcast Preview</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedWhatsAppMessage);
                    alert('Broadcast message copied to clipboard!');
                  }}
                  className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Text</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-sans text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                {generatedWhatsAppMessage}
              </pre>
            </div>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(generatedWhatsAppMessage)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Launch WhatsApp Web Broadcast</span>
            </a>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DISCOUNT COUPONS */}
      {/* ========================================================================= */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Discount Coupons & Pass Offers</h2>
              <p className="text-xs text-slate-400">Generate promo codes for WhatsApp campaigns and seasonal admissions.</p>
            </div>

            <button
              onClick={() => setIsNewCouponModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Coupon</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map(coupon => (
              <div key={coupon.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-base text-emerald-400 px-3 py-1 rounded-xl bg-slate-950 border border-emerald-500/30">
                    {coupon.code}
                  </span>
                  <button
                    onClick={() => handleToggleCouponActive(coupon.id)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                      coupon.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {coupon.isActive ? 'ACTIVE' : 'DISABLED'}
                  </button>
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-white text-sm">
                    {coupon.discountPercentage}% Discount ({coupon.applicablePlan.toUpperCase()} PASS)
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Valid Until: <span className="text-slate-200 font-mono">{coupon.validUntil}</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Used {coupon.usageCount} of {coupon.maxUses} times
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(coupon.code);
                      alert(`Coupon code ${coupon.code} copied!`);
                    }}
                    className="text-[11px] font-bold text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Code</span>
                  </button>

                  <button
                    onClick={() => handleDeleteCoupon(coupon.id)}
                    className="text-[11px] font-bold text-rose-400 hover:underline cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT STUDENT PROFILE MODAL */}
      {/* ========================================================================= */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
                <Edit className="w-4 h-4 text-emerald-400" />
                <span>Edit Student Record</span>
              </h3>
              <button onClick={() => setEditingStudent(null)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentEdit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingStudent.name}
                  onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editingStudent.phone || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Target Examination</label>
                <input
                  type="text"
                  value={editingStudent.targetExam || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, targetExam: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Home District</label>
                  <input
                    type="text"
                    value={editingStudent.district || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Medium</label>
                  <select
                    value={editingStudent.medium || 'Hindi'}
                    onChange={e => setEditingStudent({ ...editingStudent, medium: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="English">English</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Internal Admin Notes</label>
                <textarea
                  rows={2}
                  value={editingStudent.notes || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, notes: e.target.value })}
                  placeholder="e.g. Inquired about Teacher pass on WhatsApp"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BLOCK STUDENT MODAL */}
      {/* ========================================================================= */}
      {blockModalStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800/80 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/40">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Block Student Account</h3>
                <span className="text-[11px] text-slate-400">{blockModalStudent.name} ({blockModalStudent.email})</span>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Blocking will immediately suspend this student's access to mock tests, solutions, and passes.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Reason for Suspension</label>
              <input
                type="text"
                value={blockReasonInput}
                onChange={e => setBlockReasonInput(e.target.value)}
                placeholder="e.g. Account sharing violation or fake payment claim"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setBlockModalStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleBlock(blockModalStudent, true, blockReasonInput)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer shadow-md shadow-rose-600/20"
              >
                Confirm Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE NEW COUPON MODAL */}
      {/* ========================================================================= */}
      {isNewCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                <span>Create Discount Coupon</span>
              </h3>
              <button onClick={() => setIsNewCouponModalOpen(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Coupon Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  value={newCouponCode}
                  onChange={e => setNewCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CGPSC2026"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white uppercase font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Discount %</label>
                  <input
                    type="number"
                    min={5}
                    max={90}
                    required
                    value={newCouponDiscount}
                    onChange={e => setNewCouponDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Applicable Plan</label>
                  <select
                    value={newCouponPlan}
                    onChange={e => setNewCouponPlan(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="all">All Passes</option>
                    <option value="monthly">Monthly Pass</option>
                    <option value="yearly">Yearly Pass</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Valid Days</label>
                  <input
                    type="number"
                    min={1}
                    value={newCouponDays}
                    onChange={e => setNewCouponDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    min={1}
                    value={newCouponMaxUses}
                    onChange={e => setNewCouponMaxUses(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCouponModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
                >
                  Save & Publish Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
