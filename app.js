import path from 'path';
import express from 'express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import url from 'url';

import globalErrHandler from './controllers/error-controller.js';
import AppError from './utils/appError.js';
import tourRouter from './routes/tour-routes.js';
import userRouter from './routes/user-routes.js';
import reviewRouter from './routes/review-routes.js';
import viewRouter from './routes/view-routes.js';
import bookingRouter from './routes/booking-routes.js';

// Start Express
const app = express();

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1 Middlewares
// serving static files
app.use(express.static(path.join(__dirname, 'public')));

// CORS

app.use(
  cors({
    credentials: true,
    origin: 'http://127.0.0.1:3000',
  })
);

app.options('*', cors());
// Further HELMET configuration for Security Policy (CSP)
const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://*.cloudflare.com',
  'https://js.stripe.com',
  'https://m.stripe.network',
];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/',
];
const connectSrcUrls = [
  'https://unpkg.com',
  'https://*.paymob.com',
  'https://tile.openstreetmap.org',
  'https://*.stripe.com',
  'https://*.cloudflare.com/',
  'https://*.braintree-api.com/',
  'https://*.braintreegateway.com/',
  'https://bundle.js:*',
  'ws://127.0.0.1:*/',
];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const workerSrcUrls = [
  'https://tile.openstreetmap.org',
  'https://m.stripe.network',
  'https://unpkg.com/',
];

//set security http headers
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
      baseUri: ["'self'"],
      connectSrc: [
        "'self'",
        "'unsafe-inline'",
        'data:',
        'blob:',
        ...connectSrcUrls,
      ],
      scriptSrc: ["'self'", 'https:', 'http:', 'blob:', ...scriptSrcUrls],
      frameSrc: [
        "'self'",
        'https://js.stripe.com',
        'https://assets.braintreegateway.com/',
      ],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:', 'data:', ...workerSrcUrls],
      objectSrc: ["'none'"],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      fontSrc: ["'self'", 'https:', 'data:', ...fontSrcUrls],
      childSrc: ["'self'", 'blob:'],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  })
);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again later',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization aganist NoSQL query injection
app.use(mongoSanitize());

// Data sanitization aganist XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'maxGroupSize',
      'ratingsAverage',
      'ratingsQuantity',
      'difficulty',
      'price',
    ],
  })
);

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.cookies);

  next();
});

// 3 Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Couldn't find ${req.originalUrl}`, 404));
});

app.use(globalErrHandler);
// 4 Start server
export default app;
