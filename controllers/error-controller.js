import AppError from '../utils/appError.js';

const sendErrDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // API
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // Rendered Website
  console.error('Error 💥💥', err);

  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message,
  });
};

const sendErrProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational === true) {
      // Operational errors are trusted so we send a message to the client
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // Other errors such as programming errors or unknown errors should not be leaked to the client
    console.error('Error 💥💥', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }

  // Rendered Website
  if (err.isOperational) {
    // Operational errors are trusted so we send a message to the client
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }

  console.error('Error 💥💥', err);
  // Other errors such as programming errors or unknown errors should not be leaked to the client
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'Please try again later',
  });
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldDB = (err) => {
  const message = `The name '${err.keyValue.name}' already exists`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);

  const message = `Invalid input: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJsonWebTokenError = () =>
  new AppError('Invalid token. Please log in and try again.', 401);

const handleTokenExpiredError = () =>
  new AppError('Token expired. Please log in and try again.', 401);

const globalErrHandler = (err, req, res, next) => {
  // console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJsonWebTokenError();
    if (err.name === 'TokenExpiredError') error = handleTokenExpiredError();

    sendErrProd(error, req, res);
  }
};
export default globalErrHandler;
