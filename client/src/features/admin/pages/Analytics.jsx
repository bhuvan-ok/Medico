import { useState, useEffect } from 'react';
import axiosInstance from '../../../lib/axios.js';
import Spinner from '../../../components/ui/Spinner.jsx';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';

const COLORS = ['#0EA5E9', '#10B981', '#EF4444', '#F59E0B', '#6366F1', '#64748B'];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/admin/analytics')
      .then(({ data }) => setData(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

      {/* Appointments over time */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Appointments (last 30 days)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data?.appointmentsByDay?.map((d) => ({ date: d._id, count: d.count }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#0EA5E9" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Status distribution */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Appointment Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data?.statusDistribution?.map((d) => ({ name: d._id, value: d.count }))}
                cx="50%" cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {data?.statusDistribution?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Revenue (last 30 days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.revenueByDay?.map((d) => ({ date: d._id, revenue: d.revenue }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => `₹${v}`} />
              <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top doctors */}
      {data?.topDoctors?.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Top Rated Doctors</h2>
          <div className="space-y-2">
            {data.topDoctors.map((doc, i) => (
              <div key={doc._id} className="flex items-center gap-4 py-2 border-b border-border last:border-0">
                <span className="text-sm font-bold text-neutral w-6">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{doc.userId?.name}</p>
                  <p className="text-xs text-neutral">{doc.specialization}</p>
                </div>
                <span className="text-sm font-semibold text-warning">{doc.rating?.average?.toFixed(1)} ⭐</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
