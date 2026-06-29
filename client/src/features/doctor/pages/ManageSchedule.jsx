import { useState, useEffect } from 'react';
import axiosInstance from '../../../lib/axios.js';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import { DAYS } from '../../../lib/constants.js';

const DEFAULT_SCHEDULE = DAYS.map((_, i) => ({
  dayOfWeek: i,
  startTime: '09:00',
  endTime: '17:00',
  slotDuration: 10,
  isAvailable: i >= 1 && i <= 5,
}));

export default function ManageSchedule() {
  const [schedules, setSchedules] = useState(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [genDate, setGenDate] = useState({ start: '', end: '' });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    axiosInstance.get('/doctors/me/schedule')
      .then(({ data }) => {
        if (data.data.length) {
          const merged = DEFAULT_SCHEDULE.map((d) => {
            const found = data.data.find((s) => s.dayOfWeek === d.dayOfWeek);
            return found ? { ...d, ...found } : d;
          });
          setSchedules(merged);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const update = (day, field, value) =>
    setSchedules((prev) => prev.map((s) => (s.dayOfWeek === day ? { ...s, [field]: value } : s)));

  const save = async () => {
    setSaving(true);
    try {
      await axiosInstance.put('/doctors/me/schedule', { schedules });
      toast.success('Schedule saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const generateSlots = async () => {
    if (!genDate.start || !genDate.end) return toast.error('Select date range');
    setGenerating(true);
    try {
      const { data } = await axiosInstance.post('/doctors/me/slots/generate', {
        startDate: genDate.start,
        endDate: genDate.end,
      });
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Manage Schedule</h1>

      {/* Weekly schedule */}
      <div className="bg-white rounded-xl border border-border">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold text-gray-900">Weekly Availability</h2>
          <p className="text-sm text-neutral mt-0.5">Set your working hours for each day.</p>
        </div>
        <div className="divide-y divide-border">
          {schedules.map((s) => (
            <div key={s.dayOfWeek} className="flex items-center gap-4 p-4 flex-wrap">
              <div className="flex items-center gap-2 w-32">
                <input
                  type="checkbox"
                  checked={s.isAvailable}
                  onChange={(e) => update(s.dayOfWeek, 'isAvailable', e.target.checked)}
                  className="rounded text-primary"
                />
                <span className={`text-sm font-medium ${s.isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>
                  {DAYS[s.dayOfWeek]}
                </span>
              </div>
              {s.isAvailable && (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="time"
                    value={s.startTime}
                    onChange={(e) => update(s.dayOfWeek, 'startTime', e.target.value)}
                    className="rounded-lg border border-border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-neutral text-sm">to</span>
                  <input
                    type="time"
                    value={s.endTime}
                    onChange={(e) => update(s.dayOfWeek, 'endTime', e.target.value)}
                    className="rounded-lg border border-border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <select
                    value={s.slotDuration}
                    onChange={(e) => update(s.dayOfWeek, 'slotDuration', Number(e.target.value))}
                    className="rounded-lg border border-border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {[10, 15, 20, 30, 45, 60].map((d) => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="p-5 border-t border-border">
          <Button loading={saving} onClick={save}>Save Schedule</Button>
        </div>
      </div>

      {/* Generate slots */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Generate Slots</h2>
        <p className="text-sm text-neutral mb-4">Generate appointment slots for a date range based on your schedule.</p>
        <div className="flex gap-3 flex-wrap">
          <div>
            <label className="text-xs text-neutral block mb-1">Start Date</label>
            <input
              type="date"
              className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              min={new Date().toISOString().split('T')[0]}
              value={genDate.start}
              onChange={(e) => setGenDate((d) => ({ ...d, start: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-neutral block mb-1">End Date</label>
            <input
              type="date"
              className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              min={genDate.start || new Date().toISOString().split('T')[0]}
              value={genDate.end}
              onChange={(e) => setGenDate((d) => ({ ...d, end: e.target.value }))}
            />
          </div>
          <div className="flex items-end">
            <Button loading={generating} onClick={generateSlots}>Generate</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
