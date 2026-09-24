import React, { useState, useMemo } from 'react';
import { MockTest, Question, PreviousYearPaper, TestAttempt } from '../types';
import {
  Database,
  Download,
  Upload,
  Printer,
  Search,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  FileText,
  X,
  Copy,
  Layers,
  Sparkles,
  ShieldCheck,
  Check,
  RefreshCw,
  Eye
} from 'lucide-react';

interface AdminToolsAndBackupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tests: MockTest[];
  questions: Question[];
  pypPapers: PreviousYearPaper[];
  attempts: TestAttempt[];
  onRestoreSnapshot?: (data: { tests: MockTest[]; questions: Question[]; pypPapers: PreviousYearPaper[] }) => void;
}

export const AdminToolsAndBackupsModal: React.FC<AdminToolsAndBackupsModalProps> = ({
  isOpen,
  onClose,
  tests,
  questions,
  pypPapers,
  attempts,
  onRestoreSnapshot,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'pdf' | 'quality'>('backup');
  const [selectedTestId, setSelectedTestId] = useState<string>(tests[0]?.id || '');
  const [includeOmr, setIncludeOmr] = useState(true);
  const [includeSolutionsKey, setIncludeSolutionsKey] = useState(true);
  const [coachingWatermark, setCoachingWatermark] = useState('CGSSB & CGPSC EXAM PREP PORTAL - CHHATTISGARH');
  const [backupSuccessMessage, setBackupSuccessMessage] = useState<string | null>(null);

  // -------------------------------------------------------------
  // 1. DATABASE BACKUP / EXPORT & RESTORE
  // -------------------------------------------------------------
  const handleDownloadSnapshot = () => {
    const dbSnapshot = {
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      platform: 'CGSSB & CGPSC Portal',
      stats: {
        testsCount: tests.length,
        questionsCount: questions.length,
        pypCount: pypPapers.length,
        attemptsCount: attempts.length,
      },
      data: {
        tests,
        questions,
        pypPapers,
        attempts,
      },
    };

    const blob = new Blob([JSON.stringify(dbSnapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cgssb-portal-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setBackupSuccessMessage('Snapshot downloaded successfully!');
    setTimeout(() => setBackupSuccessMessage(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.data && parsed.data.tests && parsed.data.questions) {
          if (onRestoreSnapshot) {
            onRestoreSnapshot({
              tests: parsed.data.tests,
              questions: parsed.data.questions,
              pypPapers: parsed.data.pypPapers || [],
            });
            setBackupSuccessMessage('Database restored successfully from backup!');
            setTimeout(() => setBackupSuccessMessage(null), 3000);
          }
        } else {
          alert('Invalid backup file schema. Missing test or question tables.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // -------------------------------------------------------------
  // 2. QUALITY & DEDUPLICATION SCANNER
  // -------------------------------------------------------------
  const qualityReport = useMemo(() => {
    const duplicates: { original: Question; duplicate: Question; similarity: string }[] = [];
    const missingHindi: Question[] = [];
    const missingExplanations: Question[] = [];
    const missingOptions: Question[] = [];

    const seenQuestions = new Map<string, Question>();

    questions.forEach(q => {
      // Normalize stem text
      const cleanStem = (q.questionText || q.question || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

      if (cleanStem.length > 15) {
        if (seenQuestions.has(cleanStem)) {
          duplicates.push({
            original: seenQuestions.get(cleanStem)!,
            duplicate: q,
            similarity: 'Exact Match',
          });
        } else {
          seenQuestions.set(cleanStem, q);
        }
      }

      // Quality checks
      if (!q.questionHindi && !q.subject.toLowerCase().includes('english')) {
        missingHindi.push(q);
      }

      if (!q.explanation && !q.explanationHindi) {
        missingExplanations.push(q);
      }

      if (!q.options || q.options.length < 4) {
        missingOptions.push(q);
      }
    });

    return {
      duplicates,
      missingHindi,
      missingExplanations,
      missingOptions,
      healthScore: Math.max(
        0,
        Math.round(
          100 -
            ((duplicates.length * 5 + missingHindi.length * 2 + missingExplanations.length * 1.5) /
              Math.max(1, questions.length)) *
              20
        )
      ),
    };
  }, [questions]);

  // -------------------------------------------------------------
  // 3. PRINTABLE PDF QUESTION PAPER GENERATOR
  // -------------------------------------------------------------
  const selectedTest = useMemo(() => {
    return tests.find(t => t.id === selectedTestId) || tests[0];
  }, [tests, selectedTestId]);

  const testQuestions = useMemo(() => {
    if (!selectedTest) return [];
    const qMap = new Map<string, Question>();
    questions.forEach(q => qMap.set(q.id, q));

    const testQIds = selectedTest.sections?.flatMap(s => s.questionIds) || [];
    return testQIds.map(id => qMap.get(id)).filter((q): q is Question => !!q);
  }, [selectedTest, questions]);

  const handlePrintQuestionPaper = () => {
    if (!selectedTest || testQuestions.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow popups to open the printable question paper.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${selectedTest.title} - Question Paper</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4;
            margin: 15mm 12mm 15mm 12mm;
          }
          body {
            font-family: 'Times New Roman', serif, sans-serif;
            color: #111;
            line-height: 1.35;
            font-size: 11pt;
            background: #fff;
            margin: 0;
            padding: 0;
          }
          .header-box {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .org-title {
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .test-title {
            font-size: 12pt;
            font-weight: bold;
            margin-top: 4px;
          }
          .meta-strip {
            display: flex;
            justify-content: space-between;
            font-size: 9pt;
            margin-top: 6px;
            border-top: 1px solid #ccc;
            padding-top: 4px;
          }
          .watermark {
            position: fixed;
            top: 45%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-35deg);
            font-size: 38pt;
            color: rgba(0, 0, 0, 0.05);
            font-weight: bold;
            text-transform: uppercase;
            z-index: -1;
            pointer-events: none;
            width: 90%;
            text-align: center;
          }
          .two-column-grid {
            column-count: 2;
            column-gap: 20px;
            column-rule: 1px solid #ddd;
          }
          .question-card {
            break-inside: avoid;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px dotted #ccc;
          }
          .q-num {
            font-weight: bold;
            float: left;
            margin-right: 5px;
          }
          .q-text-hi {
            font-weight: 600;
            margin-bottom: 2px;
          }
          .q-text-en {
            font-style: italic;
            color: #333;
            font-size: 9.5pt;
            margin-bottom: 6px;
          }
          .options-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px;
            font-size: 9.5pt;
            margin-top: 4px;
          }
          .omr-sheet-page {
            page-break-before: always;
            padding-top: 20px;
          }
          .omr-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
            margin-top: 10px;
          }
          .omr-table td, .omr-table th {
            border: 1px solid #333;
            padding: 4px;
            text-align: center;
          }
          .bubble {
            display: inline-block;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 1px solid #333;
            margin: 0 2px;
            font-size: 7pt;
            line-height: 14px;
            text-align: center;
          }
          .answers-page {
            page-break-before: always;
            padding-top: 20px;
          }
          .answer-key-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 6px;
            font-size: 9pt;
            font-family: monospace;
          }
          .key-item {
            border: 1px solid #bbb;
            padding: 4px;
            text-align: center;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="watermark">${coachingWatermark}</div>

        <div class="header-box">
          <div class="org-title">${coachingWatermark}</div>
          <div class="test-title">${selectedTest.title}</div>
          <div class="meta-strip">
            <span><strong>Total Questions:</strong> ${testQuestions.length}</span>
            <span><strong>Time Allowed:</strong> ${selectedTest.durationMinutes} Minutes</span>
            <span><strong>Max Marks:</strong> ${testQuestions.length * (selectedTest.marksPerQuestion || 1)}</span>
            <span><strong>Negative:</strong> -${selectedTest.negativeMarksPerQuestion || '0.33'}</span>
          </div>
        </div>

        <div class="two-column-grid">
          ${testQuestions
            .map(
              (q, idx) => `
            <div class="question-card">
              <span class="q-num">Q.${idx + 1}</span>
              <div>
                ${q.questionHindi ? `<div class="q-text-hi">${q.questionHindi}</div>` : ''}
                ${q.questionText ? `<div class="q-text-en">${q.questionText}</div>` : ''}
                <div class="options-grid">
                  ${(q.options || [])
                    .map(
                      (opt, oIdx) => `
                    <div>(${['A', 'B', 'C', 'D'][oIdx]}) ${opt.textHindi || opt.text}</div>
                  `
                    )
                    .join('')}
                </div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>

        ${
          includeOmr
            ? `
          <div class="omr-sheet-page">
            <div class="header-box">
              <div class="org-title">OFFICIAL CANDIDATE OMR ANSWER SHEET</div>
              <div class="test-title">${selectedTest.title}</div>
            </div>
            <div style="font-size: 9pt; margin-bottom: 10px;">
              <strong>Candidate Roll No:</strong> ____________________ | <strong>Signature:</strong> ____________________
            </div>
            <table class="omr-table">
              <thead>
                <tr>
                  <th>Q.No</th><th>Response Bubbles</th>
                  <th>Q.No</th><th>Response Bubbles</th>
                  <th>Q.No</th><th>Response Bubbles</th>
                </tr>
              </thead>
              <tbody>
                ${Array.from({ length: Math.ceil(testQuestions.length / 3) })
                  .map((_, rowIdx) => {
                    const q1 = rowIdx + 1;
                    const q2 = rowIdx + 1 + Math.ceil(testQuestions.length / 3);
                    const q3 = rowIdx + 1 + Math.ceil(testQuestions.length / 3) * 2;
                    return `
                    <tr>
                      <td>${q1 <= testQuestions.length ? q1 : ''}</td>
                      <td>${
                        q1 <= testQuestions.length
                          ? `<span class="bubble">A</span><span class="bubble">B</span><span class="bubble">C</span><span class="bubble">D</span>`
                          : ''
                      }</td>
                      <td>${q2 <= testQuestions.length ? q2 : ''}</td>
                      <td>${
                        q2 <= testQuestions.length
                          ? `<span class="bubble">A</span><span class="bubble">B</span><span class="bubble">C</span><span class="bubble">D</span>`
                          : ''
                      }</td>
                      <td>${q3 <= testQuestions.length ? q3 : ''}</td>
                      <td>${
                        q3 <= testQuestions.length
                          ? `<span class="bubble">A</span><span class="bubble">B</span><span class="bubble">C</span><span class="bubble">D</span>`
                          : ''
                      }</td>
                    </tr>
                  `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        `
            : ''
        }

        ${
          includeSolutionsKey
            ? `
          <div class="answers-page">
            <div class="header-box">
              <div class="org-title">OFFICIAL ANSWER KEY & EXPLANATORY SOLUTIONS</div>
              <div class="test-title">${selectedTest.title}</div>
            </div>
            <div class="answer-key-grid">
              ${testQuestions
                .map(
                  (q, idx) => `
                <div class="key-item">
                  <strong>Q.${idx + 1}:</strong> [${q.correctOption}]
                </div>
              `
                )
                .join('')}
            </div>

            <div style="margin-top: 20px; font-size: 9.5pt;">
              <h4 style="border-bottom: 1px solid #333; padding-bottom: 4px;">Detailed Explanations:</h4>
              ${testQuestions
                .map(
                  (q, idx) => `
                <div style="margin-bottom: 10px; break-inside: avoid;">
                  <strong>Q.${idx + 1} (${q.correctOption}):</strong>
                  <span>${q.explanationHindi || q.explanation || 'No explanation.'}</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
            : ''
        }

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <span>Database Snapshots, Quality Scanner & PDF Generator</span>
              </h2>
              <p className="text-xs text-slate-400">Platform maintenance, deduplication audit, and printable coaching materials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b border-slate-800/80 flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-3 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border-b-2 ${
              activeTab === 'backup'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>DB Backup & Restore</span>
          </button>

          <button
            onClick={() => setActiveTab('pdf')}
            className={`pb-3 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border-b-2 ${
              activeTab === 'pdf'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Printable PDF & OMR Generator</span>
          </button>

          <button
            onClick={() => setActiveTab('quality')}
            className={`pb-3 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border-b-2 ${
              activeTab === 'quality'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Question Bank Quality Scanner ({qualityReport.healthScore}%)</span>
          </button>
        </div>

        {/* Success toast */}
        {backupSuccessMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{backupSuccessMessage}</span>
          </div>
        )}

        <div className="p-6">
          {/* TAB 1: DB BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Full Platform Snapshot (One-Click Backup)</h3>
                    <p className="text-xs text-slate-400">Download a full JSON image of all tests, questions, previous year papers, and student attempt histories.</p>
                  </div>
                  <button
                    onClick={handleDownloadSnapshot}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download DB Snapshot (.json)</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total Mock Tests</span>
                    <strong className="text-white text-sm">{tests.length}</strong>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Question Bank</span>
                    <strong className="text-white text-sm">{questions.length}</strong>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">PYP Papers</span>
                    <strong className="text-white text-sm">{pypPapers.length}</strong>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Attempt Logs</span>
                    <strong className="text-white text-sm">{attempts.length}</strong>
                  </div>
                </div>
              </div>

              {/* Restore & Purge Section */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Restore & Sync Options</h3>
                  <p className="text-xs text-slate-400">Restore database from a previously downloaded JSON snapshot file or purge local browser storage to load the fresh server catalog.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <label className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer transition space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>Select Snapshot File (.json)</span>
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>

                  <button
                    onClick={() => {
                      if (window.confirm('Reset all mock tests and question banks to factory default? Any unexported local drafts will be overwritten.')) {
                        localStorage.removeItem('cgssb_tests');
                        localStorage.removeItem('cgssb_questions');
                        localStorage.removeItem('cgssb_pyp');
                        localStorage.removeItem('kavya_custom_hierarchy_v2');
                        window.location.reload();
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 transition space-x-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Purge Local Storage & Reload Master Catalog</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRINTABLE PDF */}
          {activeTab === 'pdf' && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">2-Column Bilingual PDF Paper & OMR Generator</h3>
                  <p className="text-xs text-slate-400">Generate clean, printable question papers with watermark and official bubble OMR sheets for offline coaching or personal test practice.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Select Mock Test or PYP Paper</label>
                    <select
                      value={selectedTestId}
                      onChange={e => setSelectedTestId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {tests.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.sections?.flatMap(s => s.questionIds).length || 0} Qs)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Watermark / Header Name</label>
                    <input
                      type="text"
                      value={coachingWatermark}
                      onChange={e => setCoachingWatermark(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. Lakshya Academy Raipur"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeOmr}
                      onChange={e => setIncludeOmr(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Include Printable Candidate OMR Sheet</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSolutionsKey}
                      onChange={e => setIncludeSolutionsKey(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Include Official Answer Key & Solutions at End</span>
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={handlePrintQuestionPaper}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Generate & Print Question Paper ({testQuestions.length} Qs)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUALITY SCANNER */}
          {activeTab === 'quality' && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Question Bank Integrity & Deduplication Audit</h3>
                    <p className="text-xs text-slate-400">Scans all questions for duplicates, missing Hindi translations, and incomplete solutions.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Bank Health Score</span>
                    <span className="text-xl font-black text-emerald-400">{qualityReport.healthScore} / 100</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Duplicates Detected</span>
                    <strong className="text-rose-400 text-base">{qualityReport.duplicates.length}</strong>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Missing Hindi Text</span>
                    <strong className="text-amber-400 text-base">{qualityReport.missingHindi.length}</strong>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Missing Explanations</span>
                    <strong className="text-teal-400 text-base">{qualityReport.missingExplanations.length}</strong>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Incomplete Options</span>
                    <strong className="text-indigo-400 text-base">{qualityReport.missingOptions.length}</strong>
                  </div>
                </div>

                {qualityReport.duplicates.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>No duplicate questions detected! All items have unique stems.</span>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-rose-400 block">Flagged Duplicate Items:</span>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {qualityReport.duplicates.map((dup, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-rose-500/30 text-xs">
                          <p className="text-white font-medium">{dup.original.questionText || dup.original.question}</p>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-2">
                            <span>Original ID: {dup.original.id}</span>
                            <span>•</span>
                            <span>Duplicate ID: {dup.duplicate.id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
