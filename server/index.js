import express from 'express';
import helmet from 'helmet';
import { join } from 'path';
import ViteExpress from 'vite-express';
import 'dotenv/config';

const app = express();
ViteExpress.config({
  mode: 'production',
});

const port = Number(process.env.PORT);

const backendUrl = process.env.BACKEND_URL;

if (!port) {
  throw new Error('PORT environment variable is required');
} else if (!backendUrl) {
  throw new Error('BACKEND_URL environment variable is required');
}

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', port);
console.log('BACKEND_URL:', backendUrl);

// Secure the app with Helmet and configure Content Security Policy
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"], // Good practice to keep default-src restricted
      scriptSrc: [
        "'self'",
        'https://maps.googleapis.com',
        'https://maps.gstatic.com',
      ], // Allow scripts from your origin and Google Maps
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://maps.googleapis.com',
        'https://maps.gstatic.com',
      ], // Example: Allow inline styles, Google Fonts, and Maps styles
      imgSrc: [
        "'self'",
        'data:',
        'https://maps.gstatic.com',
        'https://*.googleapis.com',
      ], // Example: Allow images from your origin, data URLs, and Google Maps images
      connectSrc: [
        "'self'",
        'https://maps.googleapis.com',
        'https://*.googleapis.com',
      ], // Example: Allow API calls to Google Maps
      fontSrc: ["'self'", 'https://fonts.gstatic.com'], // Example: Allow fonts from Google Fonts
      // ... add other directives as needed for your application
    },
  }),
);

// Serve public directory
const publicDir = join(process.cwd(), 'public');
console.log('Serving static files from:', publicDir);
app.use(express.static(publicDir));

ViteExpress.listen(app, port, () => {
  console.log(`Server is running on port ${port}`);
});
