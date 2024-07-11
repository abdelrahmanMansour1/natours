import Tour from '../models/tours-model.js';
import User from '../models/users-model.js';
import Booking from '../models/bookings-model.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';

export const getOverview = asyncHandler(async (req, res, next) => {
  // 1) Get Tour data
  const tours = await Tour.find();
  // 2) Build template

  // 3) Render the template
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

export const getTour = asyncHandler(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('No tour found with that Name', 404));
  }

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

export const getPaymentForm = (req, res) => {
  res.status(200).render('paymentForm', {
    title: 'Payment',
  });
};

export const getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Login',
  });
};

export const getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your Account',
  });
};

export const UpdateUserData = asyncHandler(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).render('account', {
    title: 'Your Account',
    user: updatedUser,
  });
});

export const getMyTours = asyncHandler(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });

  const tours = await Tour.find({
    _id: { $in: bookings.map((booking) => booking.tour) },
  });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});
