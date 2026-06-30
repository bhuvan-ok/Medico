import { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../../lib/axios.js';
import Button from '../../../components/ui/Button.jsx';
import toast from 'react-hot-toast';
import {
  FiActivity, FiAlertCircle, FiCheckCircle, FiAlertTriangle,
  FiSearch, FiInfo,
} from 'react-icons/fi';

const URGENCY_CONFIG = {
  low: { color: 'text-green-700 bg-green-50 border-green-200', icon: FiCheckCircle, label: 'Routine — no immediate concern' },
  medium: { color: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: FiAlertTriangle, label: 'See a doctor soon' },
  high: { color: 'text-red-700 bg-red-50 border-red-200', icon: FiAlertCircle, label: 'Seek care promptly' },
};

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (symptoms.trim().length < 10) {
      toast.error('Please describe your symptoms in more detail');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const body = { symptoms: symptoms.trim() };
      if (age) body.age = Number(age);
      if (gender) body.gender = gender;
      const { data } = await axiosInstance.post('/ai/symptom-check', body);
      setResult(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const urgency = result ? URGENCY_CONFIG[result.urgencyLevel] ?? URGENCY_CONFIG.low : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FiActivity size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Symptom Checker</h1>
          <p className="text-sm text-neutral">Describe your symptoms and get AI-powered guidance</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <FiInfo size={16} className="mt-0.5 flex-shrink-0" />
        <p>This tool provides general health information only and is <strong>not a substitute for professional medical advice</strong>. In an emergency, call emergency services immediately.</p>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Describe your symptoms <span className="text-red-500">*</span></label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows={4}
            placeholder="e.g. I have had a persistent headache for 2 days, some nausea, and sensitivity to light..."
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary text-gray-900"
            maxLength={1000}
          />
          <p className="text-xs text-neutral mt-1">{symptoms.length}/1000 characters</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Age (optional)</label>
            <input
              type="number"
              min={1}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 32"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender (optional)</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full gap-2">
          <FiSearch size={15} />
          {loading ? 'Analyzing...' : 'Analyze Symptoms'}
        </Button>
      </form>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Urgency banner */}
          <div className={`flex items-center gap-3 rounded-xl border p-4 ${urgency.color}`}>
            <urgency.icon size={18} className="flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">{urgency.label}</p>
              <p className="text-xs mt-0.5">{result.urgencyMessage}</p>
            </div>
          </div>

          {/* Possible conditions */}
          <div className="bg-white rounded-xl border border-border p-5 space-y-3">
            <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Possible Conditions</h2>
            <div className="flex flex-wrap gap-2">
              {result.possibleConditions?.map((c, i) => (
                <span key={i} className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">{c}</span>
              ))}
            </div>
          </div>

          {/* Recommended specialty + CTA */}
          <div className="bg-white rounded-xl border border-border p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-neutral font-medium uppercase tracking-wide mb-1">Recommended Specialist</p>
              <p className="text-lg font-bold text-gray-900">{result.recommendedSpecialty}</p>
            </div>
            <Link to="/doctors">
              <Button size="sm" className="flex-shrink-0">Find Doctors</Button>
            </Link>
          </div>

          {/* General advice */}
          <div className="bg-white rounded-xl border border-border p-5 space-y-2">
            <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">General Advice</h2>
            <p className="text-sm text-neutral leading-relaxed">{result.generalAdvice}</p>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-neutral text-center px-2 leading-relaxed">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
