## 🛠️ Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Discord Application & Bot Token

### Installation

1. **Clone and install dependencies:**
```bash
git clone <your-repo>
cd discord-bot-boilerplate
npm install
cd backend && npm install
cd ../frontend && npm install
```

2. **Environment Setup:**
```bash
cp .env.example .env
# Edit .env with your values
```

3. **Database Setup:**
```bash
cd backend
npx prisma generate
npx prisma db push
```

4. **Development:**
```bash
# Root directory - runs both backend and frontend
npm run dev

# Or separately:
npm run dev:backend
npm run dev:frontend
```

## 📋 Environment Variables

Create `.env` in the root directory:

```env
# Discord Bot
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_REDIRECT_URI=http://localhost:3001/auth/discord/callback

# Bot Settings
PREFIX=!
NODE_ENV=development

# Database
DATABASE_URL="file:./dev.db"

# API
API_PORT=3001
JWT_SECRET=your_super_secret_jwt_key_here
FRONTEND_URL=http://localhost:3000

# Frontend
REACT_APP_API_URL=http://localhost:3001
REACT_APP_DISCORD_CLIENT_ID=your_client_id_here
REACT_APP_DISCORD_REDIRECT_URI=http://localhost:3000/auth/callback
```