import ApiError from '../utils/ApiError.js';

export const authorize = (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }
    next();
  };
