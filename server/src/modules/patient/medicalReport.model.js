import mongoose from 'mongoose';

const medicalReportSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    reportType: {
      type: String,
      enum: ['blood-test', 'xray', 'mri', 'scan', 'other'],
      default: 'other',
    },
    fileUrl: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
    uploadedAt: { type: Date, default: Date.now },
    aiAnalysis: { type: String },
    analysedAt: Date,
  },
  { timestamps: true }
);

medicalReportSchema.index({ patientId: 1, createdAt: -1 });

const MedicalReport = mongoose.model('MedicalReport', medicalReportSchema);
export default MedicalReport;
