import express from 'express';
import helmet from 'helmet';
import { join } from 'path';
import ViteExpress from 'vite-express';
import permissionsPolicy from 'permissions-policy';
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
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://maps.googleapis.com',
          'https://maps.gstatic.com',
          'https://www.googletagmanager.com',
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://maps.googleapis.com',
          'https://maps.gstatic.com',
        ],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://maps.gstatic.com',
          'https://*.googleapis.com',
          'https://www.googletagmanager.com',
          'https://gravatar.com',
          'https://kinocafe-static.bitrey.it',
        ],
        connectSrc: [
          "'self'",
          'https://maps.googleapis.com',
          'https://*.googleapis.com',
          'https://www.googletagmanager.com',
          'https://*.google-analytics.com',
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      },
    },
  }),
);

app.use(
  permissionsPolicy({
    features: {
      fullscreen: ['self'],
      vibrate: ['none'],
      payment: [],
      syncXhr: [],
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
