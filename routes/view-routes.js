import { Router } from 'express';
import * as viewController from '../controllers/view-controller.js';
import * as authController from '../controllers/auth-controller.js';
import * as bookingController from '../controllers/booking-controller.js';

const router = Router();

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview
);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
router.get('/me', authController.protect, viewController.getAccount);
router.get('/my-tours', authController.protect, viewController.getMyTours);

/*  router.post(
  '/submit-user-data',
  authController.protect,
  viewController.UpdateUserData,
); */

export default router;
