/* eslint-disable */
import axios from 'axios';
import Stripe from 'stripe';
import dotenv from 'dotenv';

import Booking from '../models/bookings-model.js';
import Tour from '../models/tours-model.js';
import * as factory from './handlerFactory.js';
import AppError from '../utils/appError.js';
import asyncHandler from '../utils/asyncHandler.js';

dotenv.config({ path: './config.env' });

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

export const checkout = asyncHandler(async (req, res, next) => {
  // 1) Get the tour from the request params
  const tour = await Tour.findById(req.params.tourId);
  const amount = tour.price;

  const customerName = req.user.name;
  const customerEmail = req.user.email;

  const authResponse = await axios.post(
    'https://accept.paymob.com/api/auth/tokens',
    {
      api_key: process.env.PAYMOB_API_KEY,
    }
  );

  const authToken = authResponse.data.token;

  const orderData = {
    auth_token: authToken,
    delivery_needed: 'false',
    amount_cents: (amount * 100).toString(), // Convert amount to cents
    currency: 'EGP', // Default to EGP if no currency provided
    items: [
      {
        name: tour.name,
        description: tour.description,
        amount_cents: `${amount * 100}`,
        quantity: 1,
      },
    ],
  };

  const orderResponse = await axios.post(
    'https://accept.paymob.com/api/orders',
    orderData
  );
  const orderID = orderResponse.data.id;

  const billingData = {
    apartment: 'NA', // Address fields can be filled as per your need
    email: customerEmail,
    floor: 'NA',
    first_name: customerName.split(' ')[0],
    street: 'NA',
    building: 'NA',
    shipping_method: 'NA',
    postal_code: 'NA',
    city: 'NA',
    country: 'NA',
    last_name: customerName.split(' ')[1],
    state: 'NA',
  };

  const paymentData = {
    auth_token: authToken,
    amount_cents: (amount * 100).toString(), // Convert amount to cents
    expiration: 3600, // Payment token expiration time in seconds
    order_id: orderID,
    billing_data: billingData,
    currency: 'EGP', // Default to EGP if no currency provided
    integration_id: process.env.PAYMOB_INTEGRATION_ID,
  };

  const paymentKeyResponse = await axios.post(
    'https://accept.paymob.com/api/acceptance/payment_keys',
    paymentData
  );
  const paymentKey = paymentKeyResponse.data.token;

  const paymentURL = `https://accept.paymob.com/api/acceptance/iframes/852128?payment_token=${paymentKey}`;

  res.status(200).json({
    status: 'success',
    paymentURL,
  });
});

export const getCheckoutSession = asyncHandler(async (req, res, next) => {
  // 1) Get Currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.used.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
          unit_amount: tour.price * 100,
        },
      },
    ],
  });
  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

export const createBookingCheckout = asyncHandler(async (req, res, next) => {
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

export const createBooking = factory.createOne(Booking);
export const getAllBookings = factory.getAll(Booking);
export const getBooking = factory.getOne(Booking);
export const updateBooking = factory.updateOne(Booking);
export const deleteBooking = factory.deleteOne(Booking);
