# Lock-In Responsible

**A goal-based physical lock system that keeps you accountable**

Lock your phone (or anything valuable) in a box. Complete your daily goals. Get AI verification. Unlock and retrieve your items. Stay focused and productive! 🎯🔒

[![Status](https://img.shields.io/badge/status-MVP%20Complete-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

---

## 🚀 **Quick Start** (30 minutes to running app)

### Prerequisites

**Required:**
- Node.js 20+ ([Download](https://nodejs.org))
- Google account (for OAuth login)

**Optional (for full features):**
- OpenAI API key ([Get here](https://platform.openai.com/api-keys)) OR Anthropic API key ([Get here](https://console.anthropic.com))
- ESP32 DevKit + lock hardware (see [Hardware Guide](docs/HARDWARE.md))

---

## 📦 **What You're Building**

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Web Dashboard │◄───────▶│   Backend API    │◄───────▶│   ESP32 Lock    │
│   (React App)   │         │   + Database     │         │   + Hardware    │
│                 │         │   + AI Verify    │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

1. **Frontend Dashboard** - Create goals, track progress, manage devices
2. **Backend API** - Handles auth, goal verification, device management
3. **ESP32 Lock** - Physical lock controlled by your goals (optional)

---

## 🎯 **Step 1: Get API Keys** (10 minutes)

### A. Google OAuth (REQUIRED for login)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized JavaScript origins:
   - `http://localhost:5173` (for local development)
   - `https://your-vercel-app.vercel.app` (for production - add later)
7. **Copy the Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)

### B. LLM API (OPTIONAL - for goal verification)

Choose **ONE** of these:

**Option 1: OpenAI (Recommended)**
- Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Create new secret key
- Copy it (starts with `sk-`)
- Cost: ~$0.01-0.10 per goal verification

**Option 2: Anthropic Claude**
- Go to [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- Create new key
- Copy it (starts with `sk-ant-`)
- Cost: ~$0.01-0.10 per goal verification

**Option 3: Use our service (Coming Soon)**
- No API key needed
- €5/month flat rate
- Not available yet

---

## 🛠️ **Step 2: Setup Backend** (5 minutes)

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

**Edit `backend/.env`** with your API keys:

```env
# Required - Database (SQLite for development)
DATABASE_URL="file:./dev.db"

# Required - JWT Secrets (generate random strings)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this

# Required - Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Optional - LLM (choose one)
OPENAI_API_KEY=sk-your-openai-key-here
# OR
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Optional - Frontend URL for CORS
CORS_ORIGIN=http://localhost:5173
```

**Initialize database and start:**

```bash
# Create database
npm run db:push

# Start backend server
npm run dev
```

✅ Backend running at **http://localhost:3000**

---

## 🎨 **Step 3: Setup Frontend** (5 minutes)

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

**Edit `frontend/.env`**:

```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**Start frontend:**

```bash
npm run dev
```

✅ Frontend running at **http://localhost:5173**

---

## 🎉 **Step 4: Test It Out!**

1. Open **http://localhost:5173** in your browser
2. Click **Sign in with Google**
3. Authorize the app
4. You're in! 🎊

### What to Try:

**Create Your First Goal:**
- Click "New Goal" on the dashboard
- Title: "Test my Lock-In system"
- Type: Custom
- Click "Create Goal"

**Add Your LLM API Key (if you have one):**
- Go to Settings
- Choose OpenAI or Anthropic
- Paste your API key
- Click "Save"

**Try Goal Verification:**
- Create a goal: "Write 100 words"
- Click "Submit Proof"
- Enter proof: "I wrote 100 words about productivity"
- AI will verify it (if you added an API key)

**Pair a Device (if you have ESP32):**
- Go to Devices
- Click "Pair Device"
- See [Hardware Guide](docs/HARDWARE.md) for ESP32 setup

---

## 📱 **Deploy to Vercel** (5 minutes)

### Frontend Deployment

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: lock-in-responsible
# - Directory: ./
# - Build command: npm run build
# - Output directory: dist
```

**Add Environment Variables in Vercel:**

1. Go to your Vercel project → Settings → Environment Variables
2. Add:
   - `VITE_API_URL` = `https://your-backend-url.com/api`
   - `VITE_GOOGLE_CLIENT_ID` = `your-google-client-id`

3. **Update Google OAuth:**
   - Go back to Google Cloud Console
   - Add your Vercel URL to authorized origins:
   - `https://your-app.vercel.app`

4. Deploy:
```bash
vercel --prod
```

✅ Frontend live at **https://your-app.vercel.app**

### Backend Deployment Options

**Option 1: Heroku (Easiest)**
```bash
# See docs/DEPLOYMENT.md for full guide
heroku create your-app
heroku addons:create heroku-postgresql:mini
# Add env vars, deploy
```

**Option 2: Railway**
- Connect GitHub repo
- Add environment variables
- Auto-deploys on push

**Option 3: Your own server**
- See [DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## 📚 **Project Structure**

```
lock-in-responsible/
├── frontend/              # React dashboard (Vite + TypeScript)
│   ├── src/
│   │   ├── pages/        # Goals, Devices, History, Settings
│   │   ├── components/   # UI components (shadcn/ui)
│   │   └── lib/          # API client, utilities
│   └── .env              # Frontend config
│
├── backend/               # Node.js API (Express + TypeScript)
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic (Auth, LLM)
│   │   ├── routes/       # API routes
│   │   └── config/       # Configuration
│   ├── prisma/           # Database schema
│   └── .env              # Backend config (API keys here!)
│
├── firmware/              # ESP32 code (C++)
│   ├── src/main.cpp      # Main firmware
│   └── include/config.h  # WiFi + API settings
│
└── docs/                  # Documentation
    ├── API.md            # API reference
    ├── HARDWARE.md       # Hardware assembly
    └── DEPLOYMENT.md     # Production deployment
```

---

## 🔑 **What Each API Key Does**

| API Key | Required? | Purpose | Cost | Get It |
|---------|-----------|---------|------|--------|
| **Google OAuth Client ID** | ✅ YES | User login (no passwords!) | FREE | [console.cloud.google.com](https://console.cloud.google.com) |
| **OpenAI API Key** | ⚠️ Optional | AI goal verification | ~$0.01-0.10/verification | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Anthropic API Key** | ⚠️ Optional | AI goal verification (alternative) | ~$0.01-0.10/verification | [console.anthropic.com](https://console.anthropic.com) |

**Note:** You can use the app WITHOUT an LLM API key - you just won't have AI-powered goal verification. You can still create goals and manually mark them complete.

---

## 💡 **What Can You Improve?**

Here are some ideas to make this even better:

### Easy Wins (1-2 hours each)
- [ ] **Dark mode toggle** - Add theme switching
- [ ] **Email notifications** - Alert when goals are due
- [ ] **Goal templates** - Pre-made goal templates (coding, fitness, etc.)
- [ ] **Export data** - Download your goal history as CSV
- [ ] **Better proof upload** - Drag & drop images, camera capture
- [ ] **Goal streaks visualization** - Show streak calendar
- [ ] **Device battery alerts** - Notify when ESP32 battery low

### Medium Features (1 day each)
- [ ] **Real-time sync** - WebSocket updates when device status changes
- [ ] **Team goals** - Share goals with accountability partners
- [ ] **GitHub integration** - Auto-verify commits/PRs via OAuth
- [ ] **Jira/Trello integration** - Link tasks to goals
- [ ] **Mobile app** - React Native version
- [ ] **Progressive Web App** - Offline support
- [ ] **Goal recommendations** - AI suggests goals based on history

### Advanced (1 week+ each)
- [ ] **Managed LLM service** - €5/month shared API (no key needed)
- [ ] **Marketplace** - Share/sell goal templates
- [ ] **Analytics dashboard** - Detailed insights and charts
- [ ] **Custom hardware** - PCB design, 3D-printed enclosure
- [ ] **Multi-device orchestration** - Progressive unlocking
- [ ] **Voice integration** - Alexa/Google Home support

---

## 🐛 **Troubleshooting**

### "Google login not working"
- ✅ Check `GOOGLE_CLIENT_ID` in both `.env` files matches
- ✅ Verify authorized origins in Google Console include `http://localhost:5173`
- ✅ Clear browser cache and cookies

### "Backend won't start"
- ✅ Check Node.js version: `node --version` (need 20+)
- ✅ Ensure `.env` file exists in backend folder
- ✅ Run `npm install` again

### "Database error"
- ✅ Run `npm run db:push` to create database
- ✅ Check `DATABASE_URL` in `.env`

### "API calls failing"
- ✅ Check backend is running: `curl http://localhost:3000/health`
- ✅ Verify `VITE_API_URL` in frontend `.env`
- ✅ Check CORS_ORIGIN in backend `.env`

### "LLM verification not working"
- ✅ Add your API key in Settings page
- ✅ Or add to backend `.env` file
- ✅ Check API key is valid

**More help:** Open an issue on GitHub or check [docs/](docs/)

---

## 📖 **Documentation**

- **[Getting Started Guide](docs/GETTING_STARTED.md)** - Detailed walkthrough
- **[API Reference](docs/API.md)** - Complete API docs
- **[Hardware Guide](docs/HARDWARE.md)** - ESP32 assembly ($45 build)
- **[Architecture](docs/ARCHITECTURE.md)** - System design decisions
- **[Deployment](docs/DEPLOYMENT.md)** - Production deployment
- **[Project Summary](PROJECT_SUMMARY.md)** - Technical overview

---

## 🤝 **Contributing**

Want to make this better? See [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📄 **License**

MIT License - See [LICENSE](LICENSE)

---

## ⭐ **What's Next?**

1. ✅ Get the app running locally (30 min - see above!)
2. 📱 Build the hardware if you want physical lock ([Guide](docs/HARDWARE.md))
3. 🚀 Deploy to Vercel for free ([Guide above](#deploy-to-vercel))
4. 🎯 Start using it daily to achieve your goals!
5. 💡 Add features you want (see improvement ideas above)
6. 🤝 Share with friends or contribute back!

---

**Built with accountability in mind** 🎯🔒

Need help? Check the docs or open an issue!
