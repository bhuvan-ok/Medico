import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as paymentService from './payment.service.js';

export const createOrder = asyncHandler(async (req, res) => {
  const { slotId, doctorId, type } = req.body;
  const order = await paymentService.createOrder({ slotId, doctorId, type });
  res.status(200).json(new ApiResponse(200, order, 'Order created'));
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const appointment = await paymentService.verifyAndBook(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, appointment, 'Payment verified and appointment booked'));
});
