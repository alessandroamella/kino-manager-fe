# Kino Manager Frontend

## Prerequisiti

1. Node.js
2. pnpm
3. Prettier
4. ESLint

## Installazione

1. Clona la repository
2. Esegui `pnpm install`
3. Crea un file `.env` nella root del progetto come da esempio in `.env.example`

## Variabili d'ambiente

```
PORT=Porta su cui esporre il server
BACKEND_URL=URL del backend (nota: senza prefisso /v1)
VITE_MAPS_API_KEY=API key di Google Maps
VITE_GA4_KEY=Measurement ID di Google Analytics
VITE_CONTACT_EMAIL=Email di contatto inserita nel footer
```

## Utilizzo - Development

1. Esegui `pnpm dev`
2. Apri il browser all'indirizzo `http://localhost:3000`

## Utilizzo - Production

1. Crea una build con `pnpm build`
2. Esegui `pnpm start`
3. Apri il browser all'indirizzo `http://localhost:3000`

## Stampante
[https://github.com/alessandroamella/kino-manager-printer](https://github.com/alessandroamella/kino-manager-printer)

## Backend
[https://github.com/alessandroamella/kino-manager-be](https://github.com/alessandroamella/kino-manager-be)

## Note

- Puoi usare le varianti `primary` di HeroUI e i colori `kino-{n}` di Tailwind (i gialli).
