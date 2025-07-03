# Discord Bot Backend

## Setup

1. Copy `.env.example` to `.env` and fill in your credentials.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run Prisma migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
npm start
```
