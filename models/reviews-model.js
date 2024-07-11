import mongoose from 'mongoose';
import Tour from './tours-model.js';

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review is required'],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'user',
  //   select: 'name',
  // }).populate({
  //   path: 'tour',
  //   select: 'name',
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewSchema.statics.CalcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: {
        tour: tourId,
      },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        averageRating: {
          $avg: '$rating',
        },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].averageRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 2.5,
    });
  }
};

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.post('save', function () {
  this.constructor.CalcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  // eslint-disable-next-line no-unused-vars
  this.revData = await this.clone().findOne();
});
reviewSchema.post(/^findOneAnd/, async function () {
  await this.revData.constructor.CalcAverageRatings(this.revData.tour);
});
const Review = mongoose.model('Review', reviewSchema);

export default Review;
