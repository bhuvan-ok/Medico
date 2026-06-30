import PDFDocument from 'pdfkit';
import Prescription from './prescription.model.js';
import Appointment from '../appointment/appointment.model.js';
import ApiError from '../../utils/ApiError.js';
import { uploadToCloudinary } from '../../utils/uploadToCloudinary.js';
import { createNotification } from '../notification/notification.service.js';

export const createPrescription = async (doctorId, appointmentId, body) => {
  const appointment = await Appointment.findOne({ _id: appointmentId, doctorId })
    .populate('patientId', 'name');

  if (!appointment) throw new ApiError(404, 'Appointment not found');
  if (appointment.status !== 'completed') {
    throw new ApiError(400, 'Prescription can only be written for completed appointments');
  }

  const existing = await Prescription.findOne({ appointmentId });
  if (existing) throw new ApiError(409, 'Prescription already exists for this appointment');

  const prescription = await Prescription.create({
    appointmentId,
    doctorId,
    patientId: appointment.patientId._id,
    ...body,
  });

  await createNotification({
    userId: appointment.patientId._id,
    type: 'prescription_ready',
    title: 'Prescription Available',
    message: 'Your doctor has written a prescription for your recent appointment.',
    meta: { appointmentId, prescriptionId: prescription._id },
  });

  return prescription;
};

export const getPrescription = async (userId, appointmentId) => {
  const prescription = await Prescription.findOne({ appointmentId })
    .populate('doctorId', 'name avatar')
    .populate('patientId', 'name avatar');

  if (!prescription) throw new ApiError(404, 'Prescription not found');

  const isOwner =
    prescription.patientId._id.toString() === userId.toString() ||
    prescription.doctorId._id.toString() === userId.toString();

  if (!isOwner) throw new ApiError(403, 'Access denied');
  return prescription;
};

export const updatePrescription = async (doctorId, appointmentId, body) => {
  const prescription = await Prescription.findOneAndUpdate(
    { appointmentId, doctorId },
    { $set: body },
    { new: true, runValidators: true }
  );
  if (!prescription) throw new ApiError(404, 'Prescription not found');
  return prescription;
};

export const uploadPrescriptionDocument = async (doctorId, appointmentId, fileBuffer) => {
  const prescription = await Prescription.findOne({ appointmentId, doctorId });
  if (!prescription) throw new ApiError(404, 'Prescription not found');

  const result = await uploadToCloudinary(fileBuffer, 'medibook/prescriptions', 'raw');
  prescription.documentUrl = result;
  await prescription.save();
  return prescription;
};

export const getPatientPrescriptions = async (patientId) => {
  return Prescription.find({ patientId })
    .populate('doctorId', 'name avatar')
    .populate('appointmentId', 'createdAt type')
    .sort({ createdAt: -1 });
};

export const generatePrescriptionPdf = async (userId, appointmentId) => {
  const prescription = await Prescription.findOne({ appointmentId })
    .populate('doctorId', 'name email')
    .populate('patientId', 'name email')
    .populate({
      path: 'appointmentId',
      populate: { path: 'slotId', select: 'date startTime' },
    });

  if (!prescription) throw new ApiError(404, 'Prescription not found');

  const isOwner =
    prescription.patientId._id.toString() === userId.toString() ||
    prescription.doctorId._id.toString() === userId.toString();
  if (!isOwner) throw new ApiError(403, 'Access denied');

  // Return cached URL if already generated
  if (prescription.documentUrl?.url) {
    return { url: prescription.documentUrl.url };
  }

  const buffer = await buildPdfBuffer(prescription);

  const result = await uploadToCloudinary(buffer, 'medibook/prescription-pdfs', 'raw');
  prescription.documentUrl = { url: result.url, publicId: result.publicId };
  await prescription.save();

  return { url: result.url };
};

function buildPdfBuffer(prescription) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const BLUE = '#0284c7';
    const DARK = '#1e293b';
    const MUTED = '#64748b';
    const LIGHT = '#f8fafc';
    const BORDER = '#e2e8f0';
    const W = 495; // usable width (595 - 2*50)

    // ── Header ──────────────────────────────────────────────
    doc.fontSize(22).fillColor(BLUE).font('Helvetica-Bold').text('MediBook', 50, 50);
    doc.fontSize(9).fillColor(MUTED).font('Helvetica').text('Digital Health Platform', 50, 76);
    doc.moveTo(50, 93).lineTo(545, 93).strokeColor(BORDER).lineWidth(1).stroke();

    // Doctor + date
    doc.fontSize(13).fillColor(DARK).font('Helvetica-Bold')
       .text(`Dr. ${prescription.doctorId.name}`, 50, 108);
    doc.fontSize(9).fillColor(MUTED).font('Helvetica')
       .text(prescription.doctorId.email, 50, 124);

    const apptDate = prescription.appointmentId?.slotId?.date
      ? new Date(prescription.appointmentId.slotId.date).toDateString()
      : new Date(prescription.createdAt).toDateString();
    doc.fontSize(9).fillColor(MUTED)
       .text(`Date: ${apptDate}`, 350, 108, { align: 'right', width: 195 });

    // Patient strip
    doc.rect(50, 142, W, 38).fillColor(LIGHT).fill();
    doc.fontSize(8).fillColor(MUTED).font('Helvetica').text('PATIENT', 60, 150);
    doc.fontSize(11).fillColor(DARK).font('Helvetica-Bold')
       .text(prescription.patientId.name, 60, 162);
    doc.fontSize(9).fillColor(MUTED).font('Helvetica')
       .text(prescription.patientId.email, 270, 165);

    let y = 202;

    const sectionHeader = (label) => {
      if (y > 700) { doc.addPage(); y = 50; }
      doc.rect(50, y, W, 20).fillColor(BLUE).fill();
      doc.fontSize(8).fillColor('#ffffff').font('Helvetica-Bold').text(label, 60, y + 6);
      y += 28;
    };

    const lineBreak = () => {
      if (y > 710) { doc.addPage(); y = 50; }
      doc.moveTo(50, y).lineTo(545, y).strokeColor(BORDER).lineWidth(0.5).stroke();
      y += 6;
    };

    // Diagnosis
    sectionHeader('DIAGNOSIS');
    doc.fontSize(11).fillColor(DARK).font('Helvetica')
       .text(prescription.diagnosis, 60, y, { width: W - 20 });
    y += doc.heightOfString(prescription.diagnosis, { width: W - 20 }) + 14;

    // Medicines
    if (prescription.medicines?.length > 0) {
      sectionHeader('MEDICINES');
      prescription.medicines.forEach((m, i) => {
        if (y > 700) { doc.addPage(); y = 50; }
        doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold').text(`${i + 1}. ${m.name}`, 60, y);
        const detail = [m.dosage, m.frequency, m.duration].filter(Boolean).join(' · ');
        if (detail) {
          y += 14;
          doc.fontSize(9).fillColor(MUTED).font('Helvetica').text(detail, 70, y);
        }
        if (m.instructions) {
          y += 13;
          doc.fontSize(8).fillColor(MUTED).text(`Note: ${m.instructions}`, 70, y);
        }
        y += 14;
        lineBreak();
      });
      y += 4;
    }

    // Tests
    if (prescription.tests?.length > 0) {
      sectionHeader('TESTS ADVISED');
      doc.fontSize(10).fillColor(DARK).font('Helvetica')
         .text(prescription.tests.join(', '), 60, y, { width: W - 20 });
      y += doc.heightOfString(prescription.tests.join(', '), { width: W - 20 }) + 14;
    }

    // Advice
    if (prescription.advice) {
      sectionHeader('ADVICE');
      doc.fontSize(10).fillColor(DARK).font('Helvetica')
         .text(prescription.advice, 60, y, { width: W - 20 });
      y += doc.heightOfString(prescription.advice, { width: W - 20 }) + 14;
    }

    // Follow-up
    if (prescription.followUpDate) {
      if (y > 710) { doc.addPage(); y = 50; }
      doc.fontSize(10).fillColor(BLUE).font('Helvetica-Bold')
         .text(`Follow-up: ${new Date(prescription.followUpDate).toDateString()}`, 60, y);
      y += 20;
    }

    // Footer
    doc.moveTo(50, 780).lineTo(545, 780).strokeColor(BORDER).lineWidth(0.5).stroke();
    doc.fontSize(7.5).fillColor(MUTED).font('Helvetica')
       .text(
         'This prescription was generated digitally via MediBook. Always consult your doctor before making any medical decisions.',
         50, 787, { align: 'center', width: W },
       );

    doc.end();
  });
}
