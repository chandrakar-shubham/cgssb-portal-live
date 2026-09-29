import React, { useState } from 'react';
import { ShieldCheck, Scale, FileText, RefreshCw, AlertTriangle, Mail, X, CheckCircle2 } from 'lucide-react';

export type LegalTab = 'privacy' | 'terms' | 'refund' | 'disclaimer' | 'contact';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, initialTab = 'privacy' }) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Trust, Safety & Safeguard Policies</h2>
              <p className="text-xs text-slate-400">Official candidate protection and compliance guidelines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 overflow-x-auto text-xs font-semibold scrollbar-none">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 whitespace-nowrap transition ${
              activeTab === 'privacy'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy Policy</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 whitespace-nowrap transition ${
              activeTab === 'terms'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Terms of Service</span>
          </button>
          <button
            onClick={() => setActiveTab('disclaimer')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 whitespace-nowrap transition ${
              activeTab === 'disclaimer'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Government Disclaimer</span>
          </button>
          <button
            onClick={() => setActiveTab('refund')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 whitespace-nowrap transition ${
              activeTab === 'refund'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refund & Cancellation</span>
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-2 whitespace-nowrap transition ${
              activeTab === 'contact'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Contact & Grievance</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm leading-relaxed text-slate-300">
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 text-xs flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                <span>
                  <strong>Candidate Data Commitment:</strong> We never sell, rent, or monetize your personal data, test performance records, or contact details to third-party telemarketers or advertisers.
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">1. Information We Collect</h3>
                <p>
                  When you register on CGSSB Test, we collect your name, email address, optional contact number, and your chosen examination preferences (e.g. CG Teacher Bharti, CGPSC Prelims, CG Vyapam Hostel Warden). Test attempt answers, timings, and percentile scores are securely recorded to compile your personal performance analytics.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">2. Security & Storage Safeguards</h3>
                <p>
                  All database transactions are transmitted over TLS 1.3 / SSL encryption. Access to student profiles and administrative dashboards is enforced through strict role-based access control (RBAC) and Firebase Authentication safeguards to prevent unauthorized data tampering.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">3. Cookie & Offline Cache Policy</h3>
                <p>
                  We utilize standard browser local storage and IndexedDB caches solely to save your in-progress test responses, so that rural candidates experiencing intermittent mobile internet connection do not lose their answers during an ongoing exam session.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">1. Candidate Code of Conduct & Fair Use</h3>
                <p>
                  CGSSB Test provides diagnostic mock tests and previous year question archives for bona fide personal educational preparation. Automated web scraping, bulk extraction of proprietary questions, denial-of-service attempts, or sharing unauthorized account passes across multiple concurrent devices is strictly prohibited.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">2. Exam Simulation Environment</h3>
                <p>
                  Our mock exam software emulates the TCS iON style computer-based test interface (with timer, palette navigation, marking schemes, and bilingual display) to train candidates for the physical examination hall. Simulated ranks and percentiles represent candidate performance within the CGSSB Test sample pool and do not guarantee official selection.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">3. Intellectual Property Rights</h3>
                <p>
                  Curated test explanations, sectional syllabus breakdowns, and original simulated question sets created by our subject matter educators remain the intellectual property of CGSSB Test.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'disclaimer' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs flex items-start space-x-2.5">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <strong className="block text-amber-300 font-semibold mb-0.5">Non-Government Independent Educational Platform</strong>
                  cgtest.in is an independent private educational technology and exam practice platform. It is <strong>NOT</strong> affiliated with, associated with, endorsed by, or in any way connected to the Chhattisgarh Professional Examination Board (CG Vyapam), the Chhattisgarh Public Service Commission (CGPSC), the Government of Chhattisgarh, or any Central Government agency.
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">Official Notifications & Circulars</h3>
                <p>
                  All official recruitment notifications, exam dates, eligibility criteria, and final answer keys are issued directly by the respective government authorities. Candidates should always verify official circulars on official portals such as <code>vyapam.cgstate.gov.in</code> and <code>psc.cg.gov.in</code>.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">Trademarks & Names</h3>
                <p>
                  All trademarks, exam names (e.g. CGPSC, CGSSB, CG Vyapam, Atmanand Shikshak), and logos referenced on this website belong to their respective statutory bodies. Their mention on this platform is purely for candidate guidance, search identification, and descriptive educational practice purposes.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'refund' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">1. Digital Pass & Test Series Purchases</h3>
                <p>
                  Access to full-length premium test series and annual exam passes is unlocked immediately upon transaction confirmation. If a candidate experiences technical delivery failure (e.g. payment deducted but pass not activated), the transaction is automatically reconciled within 24 hours.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">2. Refund Request Window</h3>
                <p>
                  Candidates who have purchased an exam pass and have attempted fewer than 2 premium tests may request a refund within <strong>48 hours</strong> of purchase by emailing their transaction ID and registered email to <code>support@cgtest.in</code>.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">3. Processing Timeline</h3>
                <p>
                  Approved refunds are credited directly back to the original payment source (UPI / NetBanking / Card) within 5–7 business days as per standard banking settlement cycles.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">Student Support & Grievance Redressal</h3>
                <p>
                  Have a question regarding test series access, question accuracy corrections, or billing? Our candidate support team is available Monday through Saturday.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Candidate Help Desk</span>
                  <div className="text-sm font-bold text-emerald-400">support@cgtest.in</div>
                  <div className="text-xs text-slate-400">Typical response time: Within 4 hours</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Exam Controller & Staff</span>
                  <div className="text-sm font-bold text-indigo-400">coolboy171717@gmail.com</div>
                  <div className="text-xs text-slate-400">Official Exam Ingestion & Administration</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Last Updated: September 2026 • Compliant with Indian IT Act 2000 & Digital Safeguards</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold text-white transition shadow-sm"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
