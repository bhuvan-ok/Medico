# MediBook — AI-Powered Doctor Appointment Platform

A production-quality, full-stack doctor appointment booking platform built with the MERN stack. Features real-time slot booking, peer-to-peer video consultations, Gemini AI health tools, online payments, and a complete medical records system — all deployed and live.

**Live Demo:** [medico-ashen.vercel.app](https://medico-ashen.vercel.app)  
**API:** [medico-157o.onrender.com](https://medico-157o.onrender.com)

> First request after inactivity may take ~30s (Render free tier cold start).

---

## Features

### Patient
- Register, verify email, and manage profile with avatar upload
- Search and filter doctors by name, specialization, and availability
- Book appointments (in-person or video) with real-time slot availability
- Razorpay payment integration — slot confirmed only after server-side payment verification
- Real-time slot invalidation via Socket.IO — taken slots strike through live as others book
- Join peer-to-peer video consultations (WebRTC) with mic/camera controls
- View prescriptions with AI plain-language summaries and PDF download
- Upload and manage personal medical reports with AI analysis
- Leave star ratings and reviews after completed appointments
- Persistent notification center with real-time badge updates
- AI Symptom Checker — describes symptoms, gets possible conditions, urgency triage, and specialist recommendation
- AI Health Analyzer — analyze any prescription or pasted medical report in plain language

### Doctor
- Self-registration with admin verification before going live
- Manage weekly schedule templates and generate per-day slots
- Accept, reject, reschedule, or cancel appointments with automated patient emails
- Write structured prescriptions (diagnosis, medicines, tests, follow-up)
- Initiate peer-to-peer video calls for video-type appointments
- Dashboard with earnings stats, upcoming appointments, and patient history

### Admin
- Verify or reject doctor registrations
- Directly add doctors — random credentials auto-emailed to doctor
- User management with soft-disable (no hard deletes)
- Revenue and appointment analytics with Recharts visualizations

### Platform-wide
- Dark mode / light mode toggle — persisted in localStorage, no flash on reload
- Responsive layout with mobile sidebar
- Skeleton screens and error boundaries throughout
- Rate limiting tiers: auth (10/15 min), AI (5/15 min), general (100/15 min)
- 24-hour appointment reminder emails via node-cron

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Redux Toolkit, React Router v6, Tailwind CSS |
| Forms | React Hook Form + Zod |
| HTTP | Axios with JWT refresh-token interceptor |
| Real-time | Socket.IO (slot booking, video signaling, notifications) |
| Video | WebRTC peer-to-peer with Google STUN servers |
| AI | Gemini API (`gemini-3-flash-preview`) via `@google/generative-ai` |
| PDF | pdfkit — server-side generation, cached on Cloudinary |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (access 15 min / refresh 7 days, HTTP-only cookie, hashed in DB) |
| File Storage | Cloudinary + Multer (memory storage, no disk writes) |
| Payments | Razorpay (order created server-side, signature verified before booking) |
| Email | Nodemailer + Brevo SMTP |
| Validation | Zod (all POST/PUT/PATCH bodies validated via middleware) |
| Security | Helmet, CORS, express-rate-limit, express-mongo-sanitize, bcrypt |
| Scheduling | node-cron (24h reminder emails) |
| Deployment | Vercel (frontend) + Render (backend) + MongoDB Atlas + Cloudinary |

---

## Project Structure

```
medibook/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── app/               # Redux store
│   │   ├── components/        # Shared UI components (Button, Modal, Avatar…)
│   │   ├── features/          # Feature modules
│   │   │   ├── auth/          # Login, Register, authSlice
│   │   │   ├── appointment/   # Booking flow, detail, history
│   │   │   ├── doctor/        # Doctor dashboard, schedule, appointments
│   │   │   ├── patient/       # Patient dashboard, prescriptions, reports
│   │   │   ├── admin/         # Admin dashboard, analytics, management
│   │   │   ├── notification/  # NotificationsContext, NotificationsPage
│   │   │   ├── video/         # VideoCallContext, VideoCallModal (WebRTC)
│   │   │   ├── ai/            # SymptomChecker, PrescriptionAnalyzer pages
│   │   │   └── public/        # Landing page, doctor search, public profile
│   │   ├── hooks/             # useAuth, useNotifications, useTheme, useDebounce
│   │   ├── layouts/           # DashboardLayout, PublicLayout, AuthLayout
│   │   ├── lib/               # axios instance, socket.io client, streamFetch SSE
│   │   └── utils/             # formatDate, formatCurrency, drName, cn
│   └── package.json
└── server/                    # Node/Express backend
    ├── src/
    │   ├── config/            # DB, Cloudinary, env, email transporter
    │   ├── middlewares/       # authenticate, validate, upload, rateLimiter
    │   ├── modules/           # Feature modules (each has model/controller/service/routes/validation)
    │   │   ├── user/
    │   │   ├── auth/
    │   │   ├── doctor/
    │   │   ├── appointment/
    │   │   ├── slot/
    │   │   ├── prescription/  # includes PDF generation
    │   │   ├── medical-report/
    │   │   ├── notification/
    │   │   ├── review/
    │   │   ├── payment/
    │   │   ├── admin/
    │   │   └── ai/            # Symptom checker, prescription analyzer, report analyzer
    │   ├── socket/            # Socket.IO event handlers (slots, video signaling, user rooms)
    │   └── utils/             # ApiError, ApiResponse, asyncHandler, sendEmail
    └── package.json
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (free M0 works)
- Cloudinary account (free tier)
- Razorpay test account
- Brevo account (free tier, for email)
- Google AI Studio API key (free, for Gemini AI features)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd "doctor appointment platform"

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
```

### 2. Configure environment variables

**`server/.env`** — copy from the template below and fill in values:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=

ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=MediBook <your@email.com>

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

GEMINI_API_KEY=

CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000

ADMIN_NAME=Admin
ADMIN_EMAIL=admin@medibook.com
ADMIN_PASSWORD=Admin@123456
```

**`client/.env`**:

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_RAZORPAY_KEY_ID=
```

### 3. Run

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

### 4. Create admin account

The admin is seeded automatically on first server start using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`. Log in with those credentials.

---

## Environment Variables — Production (Render)

```env
NODE_ENV=production
MONGODB_URI=
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=465
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=MediBook <your@email.com>
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
GEMINI_API_KEY=
CLIENT_URL=https://medico-ashen.vercel.app
SERVER_URL=https://medico-157o.onrender.com
```

> Use `EMAIL_PORT=465` (SSL) on Render — port 587 is blocked on their free tier.

**`client` environment on Vercel:**

```env
VITE_API_URL=https://medico-157o.onrender.com/api/v1
VITE_RAZORPAY_KEY_ID=
```

---

## API Overview

All routes are prefixed with `/api/v1/`.

| Module | Prefix | Key Endpoints |
|---|---|---|
| Auth | `/auth` | register, login, logout, refresh, verify-email, forgot/reset-password |
| Users | `/users` | profile CRUD, avatar upload |
| Doctors | `/doctors` | search, filter, public profile, schedule management, fee update |
| Slots | `/slots` | generate, list available |
| Appointments | `/appointments` | book, confirm, reject, cancel, reschedule |
| Payments | `/payments` | create Razorpay order, verify signature |
| Prescriptions | `/prescriptions` | create, list, get, PDF generation + download |
| Medical Reports | `/medical-reports` | upload, list, download |
| Reviews | `/reviews` | create, list by doctor |
| Notifications | `/notifications` | list, mark read, mark all read |
| AI | `/ai` | symptom-check, analyze-prescription (SSE stream), analyze-report |
| Admin | `/admin` | doctor verification, user management, analytics, direct-add doctor |

---

## Architecture Notes

- **Service layer mandatory** — controllers are thin (extract params → call service → return response), all business logic in `*.service.js`
- **MongoDB transaction** used exclusively for atomic slot-lock + appointment-create (double-booking prevention)
- **Consultation fee snapshotted** on `Appointment` at booking time — fee changes never retroactively affect existing bookings
- **Slot dates stored as UTC midnight** via `Date.UTC(y,m,d)` — prevents day-flip on UTC+5:30 servers
- **Razorpay signature verified server-side** before slot is marked unavailable and appointment confirmed
- **Refresh token hashed in DB**, rotated on every use, stored in HTTP-only cookie — access token in Redux memory only
- **Socket.IO additive** — REST API is source of truth; sockets push what the DB already reflects
- **All emails fire-and-forget** (`.catch()` only, never `await`) — SMTP failures never 500 user-facing requests
- **AI analysis cached** on `prescription.aiAnalysis` — Gemini API called only once per prescription
- **PDF cached** on `prescription.documentUrl` — pdfkit generation happens only on first request

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Auto-deploys on push to `main` |
| Backend | Render (free tier) | Build filter: `server/**` |
| Database | MongoDB Atlas (M0) | Free cluster |
| Files | Cloudinary (free tier) | Avatars, reports, prescription PDFs |
| Email | Brevo SMTP | 300 emails/day free, no domain verification needed |

CI/CD: Both Vercel and Render are connected to the `main` branch — every push auto-deploys.

---

## License

MIT
