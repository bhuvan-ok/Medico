import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button.jsx';
import {
  FiSearch, FiCalendar, FiShield, FiVideo,
  FiUserCheck, FiCreditCard, FiBell,
} from 'react-icons/fi';

const FEATURES = [
  { icon: FiSearch, title: 'Find Doctors', desc: 'Search by specialization, hospital, and availability — filter by fee and rating.' },
  { icon: FiCalendar, title: 'Book Instantly', desc: 'Real-time slot availability. Your slot is reserved the moment you pay.' },
  { icon: FiVideo, title: 'Video Consult', desc: 'Face-to-face consultations from anywhere, anytime.' },
  { icon: FiShield, title: 'Verified Doctors', desc: 'Every doctor is reviewed and approved by our admin team before going live.' },
  { icon: FiCreditCard, title: 'Secure Payments', desc: 'Pay online via Razorpay. Your consultation fee is collected at booking.' },
  { icon: FiBell, title: 'Smart Reminders', desc: '24-hour email reminders so you never miss an appointment.' },
];

const STEPS = [
  { step: '01', title: 'Create an Account', desc: 'Sign up as a patient in under a minute. Verify your email to get started.' },
  { step: '02', title: 'Find & Book', desc: 'Search verified doctors by specialization. Pick a slot and pay securely online.' },
  { step: '03', title: 'Get Cared For', desc: 'Attend in-person or video consultation. Receive prescriptions and medical records digitally.' },
];

const STATS = [
  { value: '500+', label: 'Verified Doctors' },
  { value: '10k+', label: 'Appointments Booked' },
  { value: '50+', label: 'Specializations' },
  { value: '4.8★', label: 'Average Rating' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-white to-secondary/5 py-24">
        <div className="max-w-4xl mx-auto text-center px-4">
          <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wide">
            AI-Powered Healthcare Platform
          </span>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-5 leading-tight">
            Healthcare at your<br />
            <span className="text-primary">fingertips</span>
          </h1>
          <p className="text-xl text-neutral mb-8 max-w-2xl mx-auto leading-relaxed">
            Book appointments with verified doctors, manage your health records, and consult from anywhere — all in one platform.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button size="lg" onClick={() => navigate('/doctors')} className="shadow-lg shadow-primary/25">
              Find a Doctor
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/register')}>
              Create Free Account
            </Button>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-y border-border py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-bold text-primary">{value}</p>
                <p className="text-sm text-neutral mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-surface">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How it works</h2>
            <p className="text-neutral mt-2">Get care in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="relative bg-white rounded-2xl p-7 border border-border hover:shadow-md transition-shadow">
                <span className="text-5xl font-black text-primary/10 absolute top-4 right-6 select-none">{step}</span>
                <div className="relative z-10">
                  <span className="inline-block bg-primary text-white text-xs font-bold px-2 py-0.5 rounded mb-4">{step}</span>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                  <p className="text-sm text-neutral leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Everything you need</h2>
            <p className="text-neutral mt-2">A complete healthcare experience, not just a booking tool</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-surface rounded-xl p-6 border border-border hover:shadow-md transition-shadow group">
                <div className="h-11 w-11 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon size={21} className="text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-sm text-neutral leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For doctors section */}
      <section className="py-20 bg-surface">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-10">
                <span className="inline-block bg-secondary/10 text-secondary text-xs font-semibold px-3 py-1 rounded-full mb-4">
                  For Doctors
                </span>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Grow your practice online</h2>
                <p className="text-neutral text-sm leading-relaxed mb-6">
                  Join MediBook to reach more patients. Manage your availability, accept appointments online, issue digital prescriptions, and build your reputation through verified patient reviews.
                </p>
                <div className="space-y-2 text-sm text-neutral mb-6">
                  {[
                    'Set your own schedule and consultation fee',
                    'Accept both in-person and video consultations',
                    'Issue digital prescriptions instantly',
                    'Build credibility with verified reviews',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <FiUserCheck size={14} className="text-success flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" onClick={() => navigate('/register')}>
                  Join as a Doctor
                </Button>
              </div>
              <div className="bg-gradient-to-br from-primary/5 to-secondary/10 p-10 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🩺</div>
                  <p className="text-2xl font-bold text-gray-900">500+</p>
                  <p className="text-neutral text-sm">Doctors already on MediBook</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to take control of your health?</h2>
          <p className="text-sky-100 mb-8 text-lg">
            Join thousands of patients who trust MediBook for their healthcare needs.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-lg transition-colors bg-white text-primary hover:bg-sky-50 shadow-lg"
            >
              Get Started Free
            </button>
            <button
              onClick={() => navigate('/doctors')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-lg transition-colors border border-white/60 text-white hover:bg-white/10"
            >
              Browse Doctors
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
