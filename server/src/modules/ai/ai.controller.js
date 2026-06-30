import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as aiService from './ai.service.js';

export const symptomCheck = asyncHandler(async (req, res) => {
  const result = await aiService.checkSymptoms(req.validated.body);
  res.status(200).json(new ApiResponse(200, result, 'Symptom analysis complete'));
});

// SSE streaming endpoint — sends progress events then the full result
export const analyzePrescriptionStream = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();

  const send = (data) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const analysis = await aiService.analyzePrescriptionStream(
      req.params.prescriptionId,
      req.user._id,
      send,
    );
    send({ status: 'done', analysis });
  } catch (err) {
    send({ status: 'error', message: err.message || 'Analysis failed' });
  }

  res.end();
};

export const analyzeReport = asyncHandler(async (req, res) => {
  const result = await aiService.analyzeReport(req.validated.body);
  res.status(200).json(new ApiResponse(200, result, 'Report analyzed'));
});
