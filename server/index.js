import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import { readFile } from 'fs/promises';
import helmet from 'helmet';
import { join } from 'path';
import permissionsPolicy from 'permissions-policy';
import ViteExpress from 'vite-express';

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
          "'wasm-unsafe-eval'",
          'https://maps.googleapis.com',
          'https://maps.gstatic.com',
          'https://www.googletagmanager.com',
          'https://unpkg.com',
          "'sha256-f7qoEK4P8VgPdPQa2uOb8DGnuvCBiAT4Xha206/wY/I='",
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
          'https://static.bitrey.it',
        ],
        connectSrc: [
          "'self'",
          'https://maps.googleapis.com',
          'https://*.googleapis.com',
          'https://www.googletagmanager.com',
          'https://*.google-analytics.com',
          'https://unpkg.com',
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
      payment: [],
      syncXhr: [],
      serial: ['self'], // cashier needs Web Serial API for esp32
      camera: ['self'], // admins need camera access for QR scanner
    },
  }),
);

// Serve public directory
const publicDir = join(process.cwd(), 'public');
console.log('Serving static files from:', publicDir);
app.use(express.static(publicDir));

app.use((req, res, next) => {
  // Check if the request is for a static file or API
  if (req.path.startsWith('/api') || req.path.includes('.')) {
    return next();
  }

  // Try to serve the index.html from the build directory
  const indexPath = join(process.cwd(), 'dist', 'index.html');

  fs.access(indexPath, fs.constants.F_OK, async (err) => {
    if (err) {
      // If index.html doesn't exist, serve the fallback HTML
      console.log(`Build not available, serving fallback HTML for ${req.path}`);
      res.setHeader('Content-Type', 'text/html');
      const fallbackHtml = await readFile(
        join(process.cwd(), 'fallback.html'),
        'utf-8',
      );
      return res.status(503).send(fallbackHtml);
    }
    // If the build exists, let ViteExpress handle it
    next();
  });
});

ViteExpress.listen(app, port, () => {
  console.log(`Server is running on port ${port}`);
});
