# MediBook — AI-Powered Doctor Appointment Platform

A full-stack, production-quality doctor appointment booking platform built with the MERN stack. Patients can discover doctors, book appointments (with online payment), and manage their medical records — all in one place.

---

## Features

### Patient
- Register, verify email, and manage profile with avatar upload
- Search and filter doctors by name, specialization, and availability
- Book appointments (in-person or video) with real-time slot availability
- Razorpay payment integration — slot confirmed only after payment verification
- View/download prescriptions and upload medical reports
- Leave star ratings and reviews after completed appointments
- Notification center for booking updates and reminders

### Doctor
- Self-registration with admin verification before going live
- Manage weekly schedule templates and per-day slot overrides
- Accept, reject, reschedule, or cancel appointments
- Create prescriptions per appointment
- Dashboard with earnings, upcoming appointments, and patient history

### Admin
- Verify/reject doctor registrations
- Directly add doctors (credentials auto-emailed)
- User management with soft-disable
- Revenue and appointment analytics with charts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Redux Toolkit, React Router v6, Tailwind CSS |
| Forms | React Hook Form + Zod |
| HTTP | Axios with JWT refresh-token interceptor |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (access 15 min / refresh 7 days, HTTP-only cookie) |
| File Storage | Cloudinary + Multer |
| Payments | Razorpay |
| Email | Nodemailer (Gmail SMTP) |
| Validation | Zod |
| Security | Helmet, CORS, express-rate-limit, bcrypt |
| Scheduling | node-cron (24 h appointment reminders) |

**Planned (Phase 2):** Socket.IO real-time notifications, WebRTC video consultations  
**Planned (Phase 3):** Gemini AI symptom checker / appointment recommendations

---

## Project Structure

```
medibook/
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── app/             # Redux store
│   │   ├── components/      # Shared UI components
│   │   ├── features/        # Feature slices (auth, doctor, appointment…)
│   │   └── pages/           # Top-level route pages
│   └── package.json
└── server/          # Node/Express backend
    ├── src/
    │   ├── config/          # DB, Cloudinary, env
    │   ├── middlewares/     # auth, validate, upload, rateLimiter
    │   ├── modules/         # Feature modules (user, doctor, appointment…)
    │   └── utils/           # ApiError, ApiResponse, asyncHandler, mailer
    └── package.json
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas cluster (free tier works)
- Cloudinary account
- Razorpay test account
- Gmail account with App Password enabled

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd medibook
```

### 2. Backend setup

```bash
cd server
npm install
cp .env.example .env
# Fill in all values in .env
npm run dev
```

### 3. Frontend setup

```bash
cd client
npm install
cp .env.example .env
# Fill VITE_API_BASE_URL=http://localhost:5000/api/v1
npm run dev
```

### 4. Seed admin

Hit `POST /api/v1/auth/register` with:

```json
{
  "name": "Admin",
  "email": "admin@medibook.com",
  "password": "Admin@123",
  "role": "admin"
}
```

Then verify email and use these credentials to log in as admin.

---

## Environment Variables

### `server/.env`

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_USER=
EMAIL_PASS=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
CLIENT_URL=http://localhost:5173
```

### `client/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_RAZORPAY_KEY_ID=
```

---

## API Overview

All routes are prefixed with `/api/v1/`.

| Module | Prefix | Key Endpoints |
|---|---|---|
| Auth | `/auth` | register, login, logout, refresh, verify-email, forgot/reset-password |
| Users | `/users` | profile CRUD, avatar upload |
| Doctors | `/doctors` | search, filter, public profile, schedule management |
| Slots | `/slots` | generate, list available, lock/unlock |
| Appointments | `/appointments` | book, confirm, reject, cancel, reschedule |
| Payments | `/payments` | create Razorpay order, verify signature |
| Prescriptions | `/prescriptions` | create, list, download |
| Medical Reports | `/medical-reports` | upload, list, download |
| Reviews | `/reviews` | create, list by doctor |
| Notifications | `/notifications` | list, mark read |
| Admin | `/admin` | doctor verification, user management, analytics |

---

## Key Design Decisions

- **Single User collection** for all roles — role-specific data in separate profile collections (`DoctorProfile`, `PatientProfile`)
- **DoctorSchedule → Slot** two-model approach — templates define recurring weekly availability; slots are generated per-day
- **MongoDB transaction** used exclusively for the atomic slot-lock + appointment-create on booking (double-booking prevention)
- **Consultation fee snapshotted** on `Appointment` at booking time — fee changes don't break existing bookings
- **Slot dates stored as UTC midnight** via `Date.UTC(y,m,d)` — prevents timezone-induced day-flip on UTC+5:30 servers
- **Razorpay signature verified server-side** before appointment is confirmed and slot marked unavailable
- **Refresh token is hashed in DB**, rotated on every use, stored in HTTP-only cookie — access token lives only in Redux memory

---

## License

MIT
