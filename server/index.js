import express from 'express';
import helmet from 'helmet';
import { join } from 'path';
import ViteExpress from 'vite-express';
// import { createProxyMiddleware } from 'http-proxy-middleware';
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

// Secure the app with Helmet
app.use(helmet());

// theoretically not needed
// Proxy /v1 requests to the backend
// app.use(
//   '/v1',
//   createProxyMiddleware({
//     target: backendUrl,
//     changeOrigin: true,
//     secure: false,
//   }),
// );

// Serve public directory
const publicDir = join(process.cwd(), 'public');
console.log('Serving static files from:', publicDir);
app.use(express.static(publicDir));

ViteExpress.listen(app, port, () => {
  console.log(`Server is running on port ${port}`);
});
