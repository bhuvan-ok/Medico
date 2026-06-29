import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../lib/axios.js';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import { formatDate } from '../../../utils/formatDate.js';
import { formatCurrency } from '../../../utils/formatCurrency.js';
import { FiCreditCard, FiLock, FiCalendar, FiClock, FiVideo, FiUser, FiCheckCircle } from 'react-icons/fi';

const STEPS = [
  { label: 'Select Date', icon: FiCalendar },
  { label: 'Select Slot', icon: FiClock },
  { label: 'Review & Pay', icon: FiCreditCard },
];

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

// Group slots into AM / PM buckets for easier scanning
const groupSlots = (slots) => {
  const am = slots.filter((s) => parseInt(s.startTime.split(':')[0], 10) < 12);
  const pm = slots.filter((s) => parseInt(s.startTime.split(':')[0], 10) >= 12);
  return { am, pm };
};

export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [doctor, setDoctor] = useState(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [type, setType] = useState('in-person');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get(`/doctors/${doctorId}`)
      .then(({ data }) => {
        setDoctor(data.data);
        if (data.data.appointmentType?.length) setType(data.data.appointmentType[0]);
      })
      .finally(() => setLoading(false));
    loadRazorpayScript();
  }, [doctorId]);

  const loadSlots = async () => {
    if (!date) return;
    setSlotsLoading(true);
    try {
      const { data } = await axiosInstance.get(`/doctors/${doctorId}/slots?date=${date}`);
      setSlots(data.data);
      setStep(1);
    } catch {
      toast.error('Failed to load slots');
    } finally {
      setSlotsLoading(false);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Check your internet connection.');
        return;
      }

      const { data } = await axiosInstance.post('/payments/create-order', {
        slotId: selectedSlot._id,
        doctorId,
        type,
      });
      const { orderId, amount, currency, key } = data.data;

      const options = {
        key,
        amount,
        currency,
        name: 'MediBook',
        description: `Consultation with Dr. ${doctor.userId?.name}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await axiosInstance.post('/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              slotId: selectedSlot._id,
              doctorId,
              type,
              notes,
            });
            toast.success('Appointment booked successfully!');
            navigate('/dashboard/appointments');
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verified but booking failed. Contact support.');
          }
        },
        prefill: {},
        theme: { color: '#0EA5E9' },
        modal: {
          ondismiss: () => {
            setPaying(false);
            toast('Payment cancelled.');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not initiate payment');
      setPaying(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!doctor) return <div className="text-center py-20 text-neutral">Doctor not found.</div>;

  const { am, pm } = groupSlots(slots);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
        <p className="text-neutral text-sm mt-1">Secure online booking — payment required to confirm your slot.</p>
      </div>

      {/* Doctor card */}
      <div className="bg-white rounded-xl border border-border p-5 flex items-center gap-4">
        <Avatar src={doctor.userId?.avatar?.url} name={doctor.userId?.name} size="lg" />
        <div>
          <p className="font-semibold text-gray-900">Dr. {doctor.userId?.name}</p>
          <p className="text-sm text-primary">{doctor.specialization}</p>
          <p className="text-sm text-neutral font-medium">{formatCurrency(doctor.consultationFee)} consultation fee</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map(({ label, icon: Icon }, i) => (
          <div key={label} className="flex items-center gap-1 flex-1">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
              i < step ? 'bg-success text-white' : i === step ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {i < step ? <FiCheckCircle size={14} /> : <Icon size={14} />}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i <= step ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 0: Date + type */}
      {step === 0 && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1.5">
              <FiCalendar size={14} className="text-primary" /> Select Date
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              min={new Date().toISOString().split('T')[0]}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {doctor.appointmentType?.length > 1 && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Appointment Type</label>
              <div className="flex gap-2">
                {doctor.appointmentType.map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      type === t
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {t === 'video' ? <FiVideo size={14} /> : <FiUser size={14} />}
                    {t === 'video' ? 'Video' : 'In-Person'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button className="w-full gap-2" disabled={!date} loading={slotsLoading} onClick={loadSlots}>
            <FiClock size={14} /> View Available Slots
          </Button>
        </div>
      )}

      {/* Step 1: Slots */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-900 flex items-center gap-2">
              <FiCalendar size={14} className="text-primary" /> {formatDate(date)}
            </p>
            <button onClick={() => { setStep(0); setSelectedSlot(null); }} className="text-sm text-primary hover:underline">
              Change date
            </button>
          </div>

          {slots.length === 0 ? (
            <div className="text-center py-10">
              <FiClock size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-neutral text-sm font-medium">No available slots for this date.</p>
              <p className="text-neutral/70 text-xs mt-1">The doctor may not work on this day or all slots are booked.</p>
              <button onClick={() => setStep(0)} className="text-primary text-sm hover:underline mt-3 block mx-auto">
                Try another date
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {am.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-neutral uppercase tracking-wider mb-2">Morning</p>
                  <div className="grid grid-cols-4 gap-2">
                    {am.map((slot) => (
                      <SlotButton key={slot._id} slot={slot} selected={selectedSlot?._id === slot._id} onSelect={setSelectedSlot} />
                    ))}
                  </div>
                </div>
              )}
              {pm.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-neutral uppercase tracking-wider mb-2">Afternoon / Evening</p>
                  <div className="grid grid-cols-4 gap-2">
                    {pm.map((slot) => (
                      <SlotButton key={slot._id} slot={slot} selected={selectedSlot?._id === slot._id} onSelect={setSelectedSlot} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedSlot && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-neutral mb-2">
                Selected: <span className="font-semibold text-gray-900">{selectedSlot.startTime} – {selectedSlot.endTime}</span>
              </p>
              <Button className="w-full" onClick={() => setStep(2)}>Continue to Review</Button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Review & Pay */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Review & Confirm</h2>

          <div className="bg-surface rounded-lg p-4 space-y-2.5 text-sm">
            <InfoRow label="Date" value={formatDate(date)} icon={FiCalendar} />
            <InfoRow label="Time" value={`${selectedSlot?.startTime} – ${selectedSlot?.endTime}`} icon={FiClock} />
            <InfoRow
              label="Type"
              value={type === 'video' ? 'Video Consultation' : 'In-Person Visit'}
              icon={type === 'video' ? FiVideo : FiUser}
            />
            <div className="border-t border-border pt-2 flex justify-between items-center">
              <span className="text-neutral font-medium">Consultation Fee</span>
              <span className="font-bold text-gray-900 text-base">{formatCurrency(doctor.consultationFee)}</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Pre-consultation notes <span className="text-neutral font-normal">(optional)</span>
            </label>
            <textarea
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
              placeholder="Describe your symptoms or reason for visit..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral bg-success/5 border border-success/20 rounded-lg px-3 py-2">
            <FiLock size={12} className="text-success flex-shrink-0" />
            <span>Payment secured by Razorpay. Your slot is confirmed only after successful payment.</span>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
            <Button className="flex-1 gap-2" loading={paying} onClick={handlePay}>
              <FiCreditCard size={15} />
              Pay {formatCurrency(doctor.consultationFee)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SlotButton({ slot, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(slot)}
      className={`py-2 px-1 rounded-lg text-xs font-medium border transition-all text-center ${
        selected
          ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30'
          : 'bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary'
      }`}
    >
      {slot.startTime}
    </button>
  );
}

function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-neutral flex items-center gap-1.5">
        <Icon size={12} className="text-primary" /> {label}
      </span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
