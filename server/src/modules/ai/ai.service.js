import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.js';
import Prescription from '../prescription/prescription.model.js';
import ApiError from '../../utils/ApiError.js';

const getModel = () => {
  if (!env.GEMINI_API_KEY) throw new ApiError(503, 'AI service is not configured on this server');
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
};

const parseJsonResponse = (text) => {
  const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new ApiError(500, 'Failed to parse AI response');
  return JSON.parse(match[0]);
};

// ── Symptom Checker ────────────────────────────────────────────────────────────
export const checkSymptoms = async ({ symptoms, age, gender }) => {
  const prompt = `You are a careful medical AI assistant for MediBook. A patient describes symptoms — provide responsible, accurate guidance.

Patient: Age ${age ?? 'unknown'}, Gender ${gender ?? 'unknown'}
Symptoms: ${symptoms}

Respond ONLY with valid JSON (no markdown):
{
  "possibleConditions": ["2-4 plausible conditions, not definitive diagnoses"],
  "recommendedSpecialty": "single most relevant specialty",
  "urgencyLevel": "low|medium|high",
  "urgencyMessage": "one sentence on urgency",
  "generalAdvice": "2-3 sentences of safe, practical advice",
  "disclaimer": "This is for informational purposes only and not a substitute for professional medical advice."
}`;

  const result = await getModel().generateContent(prompt);
  return parseJsonResponse(result.response.text());
};

// ── Prescription Analysis (streaming-capable) ──────────────────────────────────
export const analyzePrescriptionStream = async (prescriptionId, userId, onProgress) => {
  const prescription = await Prescription.findById(prescriptionId)
    .populate('doctorId', 'name')
    .populate('patientId', 'name');

  if (!prescription) throw new ApiError(404, 'Prescription not found');

  const isOwner =
    prescription.patientId._id.toString() === userId.toString() ||
    prescription.doctorId._id.toString() === userId.toString();
  if (!isOwner) throw new ApiError(403, 'Access denied');

  // Return cached result immediately if it exists
  if (prescription.aiAnalysis) {
    return prescription.aiAnalysis;
  }

  onProgress?.({ status: 'thinking', message: 'Reading prescription details...' });

  const medicineList = prescription.medicines.length > 0
    ? prescription.medicines.map((m) => {
        const parts = [m.name];
        if (m.dosage) parts.push(`dosage: ${m.dosage}`);
        if (m.frequency) parts.push(`frequency: ${m.frequency}`);
        if (m.duration) parts.push(`duration: ${m.duration}`);
        if (m.instructions) parts.push(`instructions: ${m.instructions}`);
        return `• ${parts.join(' | ')}`;
      }).join('\n')
    : '• None';

  onProgress?.({ status: 'thinking', message: 'Analyzing medicines and interactions...' });

  const prompt = `You are a clinical pharmacist AI for MediBook. Analyze this prescription in detail — like a pharmacist counseling a patient at the pharmacy counter.

PRESCRIPTION:
Diagnosis: ${prescription.diagnosis}
Medicines:
${medicineList}
Tests ordered: ${prescription.tests?.join(', ') || 'None'}
Doctor's advice: ${prescription.advice || 'None'}
Follow-up: ${prescription.followUpDate ? new Date(prescription.followUpDate).toDateString() : 'Not scheduled'}

Provide a clinically accurate, patient-friendly analysis. For each medicine, use real pharmacological knowledge.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "summary": "2-3 sentence clinical summary: what the diagnosis is, how the medicines treat it, and the overall treatment goal",
  "diagnosisExplained": "plain-English explanation of the diagnosis — what it is, why it happens, what the patient experiences",
  "keyPoints": [
    "3-5 most critical instructions the patient must follow"
  ],
  "medicineGuide": [
    {
      "name": "exact medicine name",
      "drugClass": "e.g. Antibiotic (Penicillin group), NSAID, Proton pump inhibitor",
      "whyPrescribed": "specific reason for this diagnosis",
      "howToTake": "specific timing — with food/empty stomach, morning/evening, with water",
      "sideEffects": ["2-3 most common side effects to watch for"],
      "interactions": "key food or drug interactions (e.g. avoid alcohol, avoid dairy, do not take with antacids)",
      "missedDose": "what to do if a dose is missed"
    }
  ],
  "testsExplained": "why the ordered tests are relevant to the diagnosis (or 'No tests ordered')",
  "importantWarnings": [
    "critical warnings such as dangerous combinations, stop-medication criteria, or emergency symptoms to watch for"
  ],
  "dietaryAdvice": "specific food and drink advice relevant to this diagnosis and medicines",
  "followUpReminder": "specific follow-up instruction, or empty string if none",
  "redFlags": [
    "symptoms that should prompt immediate medical attention"
  ],
  "disclaimer": "This AI analysis is for patient education only. Always follow your doctor's and pharmacist's instructions exactly."
}

Be specific — use actual drug class names, real interactions (e.g. 'Avoid grapefruit with statins', 'Metronidazole + alcohol causes severe nausea'), and real side effect profiles.`;

  onProgress?.({ status: 'thinking', message: 'Generating clinical analysis...' });

  const result = await getModel().generateContent(prompt);
  const analysis = parseJsonResponse(result.response.text());

  // Persist full analysis so it never needs to be re-generated
  await Prescription.findByIdAndUpdate(prescriptionId, {
    aiSummary: analysis.summary,
    aiAnalysis: analysis,
  });

  return analysis;
};

// ── Medical Report Analyzer ────────────────────────────────────────────────────
export const analyzeReport = async ({ reportText, reportType }) => {
  const prompt = `You are a clinical AI assistant for MediBook. A patient has shared their medical report. Explain findings clearly.

Report type: ${reportType || 'Medical Report'}
Content:
${reportText}

Respond ONLY with valid JSON (no markdown):
{
  "summary": "2-3 sentence plain-English overview",
  "keyFindings": ["3-5 key findings"],
  "normalValues": ["parameters within normal range"],
  "abnormalValues": ["parameters outside normal range with clinical significance"],
  "recommendations": ["2-4 specific recommendations"],
  "urgency": "routine|follow-up-needed|see-doctor-soon",
  "disclaimer": "This analysis is for patient education only and does not replace professional medical advice."
}`;

  const result = await getModel().generateContent(prompt);
  return parseJsonResponse(result.response.text());
};
