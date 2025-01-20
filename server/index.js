import express from 'express';
import helmet from 'helmet';
import { join } from 'path';
import ViteExpress from 'vite-express';
import { createProxyMiddleware } from 'http-proxy-middleware';
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
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: [
        "'self'",
        'https://www.facebook.com/',
        'https://survey-images.hotjar.com',
        'https://static.zdassets.com',
        'https://bamboosim.zendesk.com',
        'data:',
      ],
      connectSrc: [
        "'self'",
        'https://ipapi.co',
        'https://www.google-analytics.com',
        'https://in.hotjar.com/',
        'https://analytics.tiktok.com',
        'wss://ws.hotjar.com',
        'https://content.hotjar.io',
        'https://metrics.hotjar.io',
        'https://surveystats.hotjar.io',
        'https://ekr.zdassets.com',
        'https://bamboosim.zendesk.com/',
        'wss://pod-15-sunco-ws.zendesk.com',
        'https://vc.hotjar.io/',
      ], // // IPAPI for IP, lang, currency
      scriptSrc: [
        "'self'",
        'https://www.google.com/recaptcha/',
        'https://www.gstatic.com/recaptcha/',
        'https://www.googletagmanager.com/',
        'https://static.hotjar.com/c/',
        "'sha256-frmO7tysqwGzuRwGMuIa2gxi7lhOwJtOnHKaFtE+9E0='",
        "'sha256-xx9Ry1ZVTe90wnZr1Nu/NVM4dUbmplFYJeSCsdQ0q48='",
        "'sha256-uVJOpcqTKKQwAgIi3HgdvGwKPl2XbVeB2qx6Zp7Xag8='",
        "'sha256-3+IYK5UIlTaJfImetiwtQ1673apsISbIfABAVNqc148='",
        "'sha256-/zT9mMAykUbApNF2AxEks7RPtYCm46a2xxGWfneQNTU='",
        "'sha256-JISIBNk5G/Mcl1kiKiPA1Gjyll+jfTJLmHLMPcgmpYA='",
        "'sha256-gxXtb+pwPFIu1juWiHc7FDuBupu581BtCCKz0AYVtxE='",
        "'sha256-iOgiLow3O/r+V91MWR9LQzpSC/V9qVCEIfx6ZFdtNHk='",
        "'sha256-qovsK/u7FZv4/nVaIM66itkTKmGxC8tO1E/YHLF1rlY='",
        "'sha256-XVoGNq71G0wKH2nraWtjcv0WCUSrI+ZsLyXvYo0gCtc='",
        "'sha256-By4gQEwICOAvVVaX+z0oq+8D17A369b4sHfwBAokFoY='",
        'https://script.hotjar.com/',
        'https://analytics.tiktok.com/',
        'https://connect.facebook.net/',
        'https://www.dwin1.com/108850.js',
        'https://static.zdassets.com',
        'https://pod-15-sunco-ws.zendesk.com',
      ], // https://developers.google.com/recaptcha/docs/faq#im-using-content-security-policy-csp-on-my-website.-how-can-i-configure-it-to-work-with-recaptcha
      formAction: ["'self'", 'https://www.facebook.com/tr/'],
      frameSrc: [
        "'self'",
        'https://www.google.com/recaptcha/',
        'https://recaptcha.google.com/recaptcha/',
        'https://www.facebook.com/',
      ], // https://developers.google.com/recaptcha/docs/faq#im-using-content-security-policy-csp-on-my-website.-how-can-i-configure-it-to-work-with-recaptcha
    },
  }),
);

// Forward headers
app.use('/v1', (req, res, next) => {
  req.cloudflareHeaders = {}; // Store headers on the request object
  if (req.headers['cf-connecting-ip']) {
    req.cloudflareHeaders['cf-connecting-ip'] = req.headers['cf-connecting-ip'];
  }
  if (req.headers['cf-ipcountry']) {
    req.cloudflareHeaders['cf-ipcountry'] = req.headers['cf-ipcountry'];
  }
  // ...other Cloudflare headers

  next();
});

// Proxy /v1 requests to the backend
app.use(
  '/v1',
  createProxyMiddleware({
    target: backendUrl,
    changeOrigin: true,
    secure: false,
    on: {
      proxyReq: (proxyReq, req, _res) => {
        // Use onProxyReq to modify outgoing headers
        if (req.cloudflareHeaders) {
          for (const header in req.cloudflareHeaders) {
            proxyReq.setHeader(header, req.cloudflareHeaders[header]);
          }
        }
      },
    },
  }),
);

// Serve public directory
app.use(express.static(join(process.cwd(), '../public')));

ViteExpress.listen(app, port, () => {
  console.log(`Server is running on port ${port}`);
});
