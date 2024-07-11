import { Router } from 'express';
import * as userController from '../controllers/user-controller.js';
import * as authController from '../controllers/auth-controller.js';

const router = Router();

router.post('/signup', authController.singup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect);

router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);

router.patch('/updateMyPassword', authController.updatePassword);

router.delete('/deleteMe', userController.deleteMe);

router.get('/me', userController.getMe, userController.getUser);

router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getAllUsers).post(userController.addUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
