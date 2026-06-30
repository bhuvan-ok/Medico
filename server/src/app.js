import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';

import { env } from './config/env.js';
import passport from './config/passport.js';
import { generalLimiter } from './middlewares/rateLimiter.js';
import errorHandler from './middlewares/errorHandler.js';

import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js';
import doctorRoutes from './modules/doctor/doctor.routes.js';
import patientRoutes from './modules/patient/patient.routes.js';
import appointmentRoutes from './modules/appointment/appointment.routes.js';
import prescriptionRoutes from './modules/prescription/prescription.routes.js';
import notificationRoutes from './modules/notification/notification.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import paymentRoutes from './modules/payment/payment.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import { getDoctorReviews } from './modules/review/review.controller.js';

const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(helmet());
app.use(compression());
app.use(mongoSanitize());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(passport.initialize());

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check (no rate limit)
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'MediBook API is running',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.use(generalLimiter);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

// Doctor routes — register the reviews sub-route BEFORE mounting the doctor router
// to avoid /me/* being shadowed by /:id
app.get('/api/v1/doctors/:id/reviews', getDoctorReviews);
app.use('/api/v1/doctors', doctorRoutes);

app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/ai', aiRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

export default app;
