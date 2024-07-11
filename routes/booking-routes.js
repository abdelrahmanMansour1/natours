import { Router } from 'express';
import * as bookingController from '../controllers/booking-controller.js';
import * as authController from '../controllers/auth-controller.js';

const router = Router();

router.use(authController.protect);

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

router.post('/checkout/:tourId', bookingController.checkout);

router.use(authController.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

export default router;
