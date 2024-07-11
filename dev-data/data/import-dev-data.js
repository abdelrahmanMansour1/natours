import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import url from 'url';
import Tour from '../../models/tours-model.js';
import User from '../../models/users-model.js';
import Review from '../../models/reviews-model.js';

dotenv.config({ path: './config.env' });

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose.connect(DB).then(() => {
  console.log('Connection successful');
});

// Read JS files
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf8'),
);

// Import data into database
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data imported');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// Delete data from database
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

console.log(process.argv);
