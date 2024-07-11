import util from 'util';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/users-model.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';
import Email from '../utils/email.js';

export const signToken = (id) =>
  jwt.sign({ id }, `${process.env.JWT_SECRET}`, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

export const singup = asyncHandler(async (req, res, next) => {
  const newUser = await User.create(req.body);
  const url = `${req.protocol}://${req.get('host')}/me`;
  new Email(newUser, url).sendWelcome();

  sendToken(newUser, 201, res);
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email or password missing', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  sendToken(user, 200, res);
});

export const logout = (req, res) => {
  res.cookie('jwt', 'logged out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

export const protect = asyncHandler(async (req, res, next) => {
  // 1) Getting token and checking if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('Please log in to get access!', 401));
  }

  // 2) Verification the token
  const decoded = await util.promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  // 3) Check if user stil exits
  const userExist = await User.findById(decoded.id);

  if (!userExist) {
    return next(new AppError('The user of this token no longer exists', 401));
  }

  // 4) Check if user changed password after the token was issued
  if (userExist.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'Password was changed after the token was issued, Please log in and try again!',
        401
      )
    );
  }

  req.user = userExist;
  res.locals.user = userExist;
  next();
});

// Only for rendered pages, no errors!
export const isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      const decoded = await util.promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // 3) Check if user stil exits
      const userExist = await User.findById(decoded.id);

      if (!userExist) {
        return next(
          new AppError('The user of this token no longer exists', 401)
        );
      }

      // 4) Check if user changed password after the token was issued
      if (userExist.changedPasswordAfter(decoded.iat)) {
        return next(
          new AppError(
            'Password was changed after the token was issued, Please log in and try again!',
            401
          )
        );
      }
      res.locals.user = userExist;
    }

    next();
  } catch (err) {
    next();
  }
};

export const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'User does not have permission to complete this action',
          403
        )
      );
    }
    next();
  };

export const forgotPassword = asyncHandler(async (req, res, next) => {
  if (!req.body.email) {
    return next(new AppError('Email is required', 400));
  }

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('No user found with that email', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Password Reset (available for 10 minutes)',
    //   message,
    // });

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    //console.log(err);

    return next(
      new AppError('There was a problem sending the email try again later', 500)
    );
  }
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user from token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new AppError('Password reset token is invalid or has expired', 400)
    );
  }

  // 2) If token is still valid set the new password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  // 3) Update passwordChangedAt property
  // 4) Log user in , send JWT
  sendToken(user, 200, res);
});

export const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  // 1) Get user from database
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if password matches
  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError('Incorrect current password', 401));
  }
  // 3) Update password
  user.password = newPassword;
  user.confirmPassword = confirmNewPassword;

  await user.save();
  // 4) Log user in, send JWT
  sendToken(user, 200, res);
});
