import Review from '../models/reviews-model.js';
import * as factory from './handlerFactory.js';

export const setUserTourIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

export const getAllReviews = factory.getAll(Review);
export const createReview = factory.createOne(Review);
export const getReview = factory.getOne(Review);
export const updateReview = factory.updateOne(Review);
export const deleteReview = factory.deleteOne(Review);
