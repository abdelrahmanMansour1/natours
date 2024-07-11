import multer from 'multer';
import sharp from 'sharp';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/users-model.js';
import AppError from '../utils/appError.js';
import * as factory from './handlerFactory.js';

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError('Not an image! Please upload only images.', 400), false);
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

const filterObj = (obj, ...allowedFields) => {
  const filteredObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) {
      filteredObj[key] = obj[key];
    }
  });
  return filteredObj;
};

export const uploadUserPhoto = upload.single('photo');

export const resizeUserPhoto = asyncHandler(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

export const updateMe = asyncHandler(async (req, res, next) => {
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new AppError(
        'This route is not for password update. Please use /UpdateMyPassword instead',
        400,
      ),
    );
  }

  const filteredBody = filterObj(req.body, 'name', 'email');

  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  });
});

export const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

export const deleteMe = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

export const getAllUsers = factory.getAll(User);
export const getUser = factory.getOne(User);
export const deleteUser = factory.deleteOne(User);
export const updateUser = factory.updateOne(User);

export const addUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'Not Implemented, Please use /signup instead.',
  });
};
