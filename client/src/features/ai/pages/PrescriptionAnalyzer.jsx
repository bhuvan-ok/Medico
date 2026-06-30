import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axiosInstance from '../../../lib/axios.js';
import { streamFetch, readSSE } from '../../../lib/streamFetch.js';
import Button from '../../../components/ui/Button.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import toast from 'react-hot-toast';
import { formatDate } from '../../../utils/formatDate.js';
import { drName } from '../../../utils/drName.js';
import {
  FiCpu, FiFileText, FiClipboard, FiAlertTriangle, FiCheckCircle,
  FiInfo, FiChevronDown, FiZap, FiHeart, FiAlertCircle,
} from 'react-icons/fi';

const TABS = ['Prescription', 'Medical Report'];

export default function PrescriptionAnalyzer() {
  const [searchParams] = useSearchParams();
  const autoId = searchParams.get('prescriptionId');

  const [tab, setTab] = useState('Prescription');
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingRx, setLoadingRx] = useState(true);
  const [selectedId, setSelectedId] = useState(autoId ?? '');

  // report tab
  const [reportText, setReportText] = useState('');
  const [reportType, setReportType] = useState('');

  // analysis state
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  const autoAnalyzed = useRef(false);

  useEffect(() => {
    axiosInstance.get('/patients/me/prescriptions')
      .then(({ data }) => {
        setPrescriptions(data.data);
        if (!selectedId && data.data.length > 0) setSelectedId(data.data[0]._id);
      })
      .finally(() => setLoadingRx(false));
  }, []);

  // When a prescription is selected, show cached analysis immediately
  useEffect(() => {
    if (!selectedId || !prescriptions.length) return;
    const rx = prescriptions.find((p) => p._id === selectedId);
    if (rx?.aiAnalysis) {
      setResult({ type: 'prescription', ...rx.aiAnalysis });
    } else {
      setResult(null);
    }
  }, [selectedId, prescriptions]);

  // Auto-trigger analysis if navigated here with prescriptionId param
  useEffect(() => {
    if (!autoId || loadingRx || autoAnalyzed.current) return;
    const rx = prescriptions.find((p) => p._id === autoId);
    if (!rx) return;
    autoAnalyzed.current = true;
    if (rx.aiAnalysis) {
      setResult({ type: 'prescription', ...rx.aiAnalysis });
    } else {
      handleAnalyzePrescription(autoId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoId, loadingRx, prescriptions]);

  const handleAnalyzePrescription = async (id = selectedId) => {
    if (!id) return toast.error('Please select a prescription');
    setLoading(true);
    setResult(null);
    setProgressMsg('Starting analysis...');

    try {
      const response = await streamFetch(`/ai/analyze-prescription/${id}/stream`, { method: 'POST' });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Analysis failed');
      }

      for await (const event of readSSE(response)) {
        if (event.status === 'thinking') {
          setProgressMsg(event.message);
        } else if (event.status === 'done') {
          setResult({ type: 'prescription', ...event.analysis });
          // Update local prescription list with persisted analysis
          setPrescriptions((prev) =>
            prev.map((p) => p._id === id ? { ...p, aiAnalysis: event.analysis, aiSummary: event.analysis.summary } : p)
          );
          setProgressMsg('');
        } else if (event.status === 'error') {
          throw new Error(event.message);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Analysis failed. Please try again.');
      setProgressMsg('');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeReport = async () => {
    if (reportText.trim().length < 20) return toast.error('Please paste more report content');
    setLoading(true);
    setResult(null);
    try {
      const { data } = await axiosInstance.post('/ai/analyze-report', {
        reportText: reportText.trim(),
        reportType: reportType.trim() || undefined,
      });
      setResult({ type: 'report', ...data.data });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const selectedRx = prescriptions.find((p) => p._id === selectedId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
          <FiCpu size={20} className="text-secondary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Health Analyzer</h1>
          <p className="text-sm text-neutral">Clinical-grade prescription and report analysis</p>
        </div>
      </div>

      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <FiInfo size={16} className="mt-0.5 flex-shrink-0" />
        <p>AI analysis is for <strong>patient education only</strong>. Always follow your doctor's instructions.</p>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-white rounded-xl border border-border p-1 gap-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => { setTab(t); setResult(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-primary text-white shadow-sm' : 'text-neutral hover:text-gray-900'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Prescription tab */}
      {tab === 'Prescription' && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          {loadingRx ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : prescriptions.length === 0 ? (
            <p className="text-sm text-neutral py-4 text-center">No prescriptions found yet.</p>
          ) : (
            <>
              <div className="relative">
                <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white pr-8">
                  {prescriptions.map((p) => (
                    <option key={p._id} value={p._id}>
                      {drName(p.doctorId?.name)} — {formatDate(p.createdAt)} — {p.diagnosis?.slice(0, 40)}
                    </option>
                  ))}
                </select>
                <FiChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral pointer-events-none" />
              </div>

              {selectedRx && (
                <div className="bg-surface rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <Avatar src={selectedRx.doctorId?.avatar?.url} name={selectedRx.doctorId?.name} size="sm" />
                    <span className="text-sm font-medium text-gray-900">{drName(selectedRx.doctorId?.name)}</span>
                    <span className="text-xs text-neutral">{formatDate(selectedRx.createdAt)}</span>
                    {selectedRx.aiAnalysis && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-success font-medium">
                        <FiCheckCircle size={11} /> Analyzed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral"><span className="font-medium text-gray-700">Diagnosis:</span> {selectedRx.diagnosis}</p>
                </div>
              )}

              <Button onClick={() => handleAnalyzePrescription()} loading={loading} className="w-full gap-2">
                <FiCpu size={14} />
                {loading ? progressMsg || 'Analyzing...' : selectedRx?.aiAnalysis ? 'Re-analyze' : 'Analyze with AI'}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Medical Report tab */}
      {tab === 'Medical Report' && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Report type (optional)</label>
            <input type="text" value={reportType} onChange={(e) => setReportType(e.target.value)}
              placeholder="e.g. Blood Test, MRI Report, ECG..."
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Report content <span className="text-red-500">*</span></label>
            <textarea value={reportText} onChange={(e) => setReportText(e.target.value)} rows={8}
              placeholder="Paste your report text here..."
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              maxLength={8000} />
            <p className="text-xs text-neutral mt-1">{reportText.length}/8000</p>
          </div>
          <Button onClick={handleAnalyzeReport} loading={loading} className="w-full gap-2">
            <FiCpu size={14} /> {loading ? 'Analyzing...' : 'Analyze Report'}
          </Button>
        </div>
      )}

      {/* Progress / loading */}
      {loading && (
        <div className="bg-white rounded-xl border border-border p-6 flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-neutral font-medium">{progressMsg || 'Analyzing...'}</p>
          <p className="text-xs text-neutral">Clinical AI is reviewing your data</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white rounded-xl border border-border p-5 space-y-2">
            <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide flex items-center gap-1.5">
              <FiFileText size={14} className="text-primary" /> Summary
            </h2>
            <p className="text-sm text-neutral leading-relaxed">{result.summary}</p>
          </div>

          {/* Diagnosis explained (prescription only) */}
          {result.diagnosisExplained && (
            <div className="bg-white rounded-xl border border-border p-5 space-y-2">
              <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide flex items-center gap-1.5">
                <FiHeart size={14} className="text-primary" /> About Your Diagnosis
              </h2>
              <p className="text-sm text-neutral leading-relaxed">{result.diagnosisExplained}</p>
            </div>
          )}

          {/* Key points */}
          {(result.keyPoints ?? result.keyFindings)?.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-5 space-y-2.5">
              <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide flex items-center gap-1.5">
                <FiClipboard size={14} className="text-primary" />
                {result.type === 'prescription' ? 'Key Instructions' : 'Key Findings'}
              </h2>
              <ul className="space-y-1.5">
                {(result.keyPoints ?? result.keyFindings).map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral">
                    <FiCheckCircle size={13} className="text-success mt-0.5 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Medicine guide — detailed clinical cards */}
          {result.medicineGuide?.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-5 space-y-3">
              <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide flex items-center gap-1.5">
                <FiZap size={14} className="text-primary" /> Medicine Guide
              </h2>
              <div className="space-y-3">
                {result.medicineGuide.map((m, i) => (
                  <div key={i} className="border border-border rounded-lg p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{m.name}</p>
                      {m.drugClass && (
                        <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                          {m.drugClass}
                        </span>
                      )}
                    </div>
                    {m.whyPrescribed && (
                      <p className="text-xs text-neutral"><span className="font-medium text-gray-700">Why prescribed:</span> {m.whyPrescribed}</p>
                    )}
                    {m.howToTake && (
                      <p className="text-xs text-neutral"><span className="font-medium text-gray-700">How to take:</span> {m.howToTake}</p>
                    )}
                    {m.sideEffects?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">Side effects to watch:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {m.sideEffects.map((s, j) => (
                            <span key={j} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {m.interactions && (
                      <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1.5">
                        <span className="font-medium">Interactions:</span> {m.interactions}
                      </p>
                    )}
                    {m.missedDose && (
                      <p className="text-xs text-neutral"><span className="font-medium text-gray-700">Missed dose:</span> {m.missedDose}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tests explained */}
          {result.testsExplained && result.testsExplained !== 'No tests ordered' && (
            <div className="bg-white rounded-xl border border-border p-5 space-y-2">
              <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Tests Ordered</h2>
              <p className="text-sm text-neutral leading-relaxed">{result.testsExplained}</p>
            </div>
          )}

          {/* Abnormal values (report) */}
          {result.abnormalValues?.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-5 space-y-2.5">
              <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide flex items-center gap-1.5">
                <FiAlertTriangle size={14} className="text-warning" /> Values to Note
              </h2>
              <ul className="space-y-1.5">
                {result.abnormalValues.map((v, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral">
                    <span className="h-1.5 w-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Important warnings */}
          {result.importantWarnings?.filter(Boolean).length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <h2 className="font-semibold text-amber-800 text-sm flex items-center gap-1.5">
                <FiAlertTriangle size={14} /> Important Warnings
              </h2>
              <ul className="space-y-1">
                {result.importantWarnings.filter(Boolean).map((w, i) => (
                  <li key={i} className="text-sm text-amber-700">{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Red flags */}
          {result.redFlags?.filter(Boolean).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
              <h2 className="font-semibold text-red-700 text-sm flex items-center gap-1.5">
                <FiAlertCircle size={14} /> Seek Immediate Care If...
              </h2>
              <ul className="space-y-1">
                {result.redFlags.filter(Boolean).map((f, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-start gap-1.5">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dietary advice */}
          {result.dietaryAdvice && (
            <div className="bg-white rounded-xl border border-border p-5 space-y-2">
              <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Dietary Advice</h2>
              <p className="text-sm text-neutral leading-relaxed">{result.dietaryAdvice}</p>
            </div>
          )}

          {/* Follow-up + recommendations */}
          {(result.followUpReminder || result.recommendations?.length > 0) && (
            <div className="bg-white rounded-xl border border-border p-5 space-y-2">
              <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Recommendations</h2>
              {result.followUpReminder && (
                <p className="text-sm text-primary font-medium">{result.followUpReminder}</p>
              )}
              {result.recommendations?.map((r, i) => (
                <p key={i} className="text-sm text-neutral flex items-start gap-2">
                  <FiCheckCircle size={13} className="text-success mt-0.5 flex-shrink-0" />{r}
                </p>
              ))}
            </div>
          )}

          <p className="text-xs text-neutral text-center px-2 leading-relaxed">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
