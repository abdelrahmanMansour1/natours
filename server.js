import mongoose from 'mongoose';
import dotenv from 'dotenv';

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception system Shutting down!');
  console.log(err);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

// eslint-disable-next-line import/first
import app from './app.js';

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose.connect(DB).then(() => {
  console.log('Connection successful');
});

// console.log(process.env);
const port = 3000;
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log('Uncaught Rejection system Shutting down!');
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
