import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import axiosInstance from '../../../lib/axios.js';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import { formatDate } from '../../../utils/formatDate.js';
import {
  FiArrowLeft, FiPlus, FiTrash2, FiUser, FiCalendar,
  FiFileText, FiActivity, FiClipboard, FiCheckCircle,
} from 'react-icons/fi';

const EMPTY_MEDICINE = { name: '', dosage: '', frequency: '', duration: '', instructions: '' };

export default function WritePrescription() {
  const { id: appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      diagnosis: '',
      medicines: [EMPTY_MEDICINE],
      tests: [{ value: '' }],
      advice: '',
      followUpDate: '',
    },
  });

  const { fields: medicineFields, append: appendMedicine, remove: removeMedicine } = useFieldArray({ control, name: 'medicines' });
  const { fields: testFields, append: appendTest, remove: removeTest } = useFieldArray({ control, name: 'tests' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptRes, rxRes] = await Promise.allSettled([
          axiosInstance.get(`/appointments/${appointmentId}`),
          axiosInstance.get(`/prescriptions/${appointmentId}`),
        ]);

        if (apptRes.status === 'fulfilled') setAppointment(apptRes.value.data.data);

        if (rxRes.status === 'fulfilled') {
          const rx = rxRes.value.data.data;
          setIsEditMode(true);
          reset({
            diagnosis: rx.diagnosis || '',
            medicines: rx.medicines?.length ? rx.medicines : [EMPTY_MEDICINE],
            tests: rx.tests?.length ? rx.tests.map((t) => ({ value: t })) : [{ value: '' }],
            advice: rx.advice || '',
            followUpDate: rx.followUpDate ? rx.followUpDate.split('T')[0] : '',
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [appointmentId, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    const payload = {
      diagnosis: data.diagnosis,
      medicines: data.medicines.filter((m) => m.name.trim()),
      tests: data.tests.map((t) => t.value).filter(Boolean),
      advice: data.advice || undefined,
      followUpDate: data.followUpDate || undefined,
    };

    try {
      if (isEditMode) {
        await axiosInstance.put(`/prescriptions/${appointmentId}`, payload);
        toast.success('Prescription updated');
      } else {
        await axiosInstance.post(`/prescriptions/${appointmentId}`, payload);
        toast.success('Prescription issued successfully');
        setIsEditMode(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save prescription');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!appointment) return <div className="text-center py-20 text-neutral">Appointment not found</div>;

  const { patientId, slotId, status } = appointment;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/doctor/appointments')}
          className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-neutral hover:text-gray-900 hover:border-gray-300 transition-colors"
        >
          <FiArrowLeft size={15} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isEditMode ? 'Update Prescription' : 'Write Prescription'}
          </h1>
          <p className="text-xs text-neutral">Appointment #{appointmentId.slice(-8)}</p>
        </div>
      </div>

      {/* Patient summary card */}
      <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
        <Avatar src={patientId?.avatar?.url} name={patientId?.name} size="md" />
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{patientId?.name}</p>
          <p className="text-sm text-neutral">{patientId?.email}</p>
        </div>
        <div className="text-right text-sm text-neutral">
          <p className="flex items-center gap-1 justify-end"><FiCalendar size={12} /> {slotId ? formatDate(slotId.date) : '—'}</p>
          <p>{slotId?.startTime} · {appointment.type}</p>
        </div>
      </div>

      {status !== 'completed' && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl px-4 py-3 text-sm text-warning font-medium">
          Prescriptions can only be issued for completed appointments.
        </div>
      )}

      {isEditMode && (
        <div className="flex items-center gap-2 text-sm text-success bg-success/5 border border-success/20 rounded-xl px-4 py-3">
          <FiCheckCircle size={14} /> Prescription already issued — you can update it below.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Diagnosis */}
        <Section icon={FiFileText} title="Diagnosis / Chief Complaint">
          <textarea
            {...register('diagnosis', { required: 'Diagnosis is required' })}
            rows={3}
            placeholder="Enter diagnosis or chief complaint..."
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.diagnosis && <p className="text-xs text-danger mt-1">{errors.diagnosis.message}</p>}
        </Section>

        {/* Medicines */}
        <Section icon={FiActivity} title="Medicines">
          <div className="space-y-3">
            {medicineFields.map((field, index) => (
              <div key={field.id} className="bg-surface rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-neutral">Medicine {index + 1}</span>
                  {medicineFields.length > 1 && (
                    <button type="button" onClick={() => removeMedicine(index)} className="text-danger hover:text-danger/70 transition-colors">
                      <FiTrash2 size={13} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    {...register(`medicines.${index}.name`)}
                    placeholder="Medicine name *"
                    className="col-span-2 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  />
                  <input
                    {...register(`medicines.${index}.dosage`)}
                    placeholder="Dosage (e.g. 500mg)"
                    className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  />
                  <input
                    {...register(`medicines.${index}.frequency`)}
                    placeholder="Frequency (e.g. Twice daily)"
                    className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  />
                  <input
                    {...register(`medicines.${index}.duration`)}
                    placeholder="Duration (e.g. 5 days)"
                    className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  />
                  <input
                    {...register(`medicines.${index}.instructions`)}
                    placeholder="Instructions (e.g. After meals)"
                    className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => appendMedicine(EMPTY_MEDICINE)}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <FiPlus size={14} /> Add medicine
            </button>
          </div>
        </Section>

        {/* Tests */}
        <Section icon={FiClipboard} title="Tests / Investigations">
          <div className="space-y-2">
            {testFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <input
                  {...register(`tests.${index}.value`)}
                  placeholder={`Test ${index + 1} (e.g. CBC, Blood Glucose)`}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {testFields.length > 1 && (
                  <button type="button" onClick={() => removeTest(index)} className="text-danger hover:text-danger/70 transition-colors flex-shrink-0">
                    <FiTrash2 size={13} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => appendTest({ value: '' })}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <FiPlus size={14} /> Add test
            </button>
          </div>
        </Section>

        {/* Advice & Follow-up */}
        <Section icon={FiUser} title="Advice & Follow-up">
          <div className="space-y-3">
            <textarea
              {...register('advice')}
              rows={3}
              placeholder="General advice, lifestyle recommendations..."
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div>
              <label className="text-xs font-medium text-neutral block mb-1">Follow-up Date (optional)</label>
              <input
                type="date"
                {...register('followUpDate')}
                min={new Date().toISOString().split('T')[0]}
                className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </Section>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/doctor/appointments')}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={submitting} disabled={status !== 'completed'}>
            {isEditMode ? 'Update Prescription' : 'Issue Prescription'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-primary" />
        <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}
