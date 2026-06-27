# Discord Bot Backend

## Setup

1. Copy `.env.example` to `.env` and fill in your credentials.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run Prisma migrations:
   ```bash
   pnpm exec prisma migrate dev --name init
   ```

## Development

```bash
pnpm run dev
```

## Build

```bash
pnpm run build
pnpm start
```
