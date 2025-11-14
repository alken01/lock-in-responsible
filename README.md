# Lock-In Responsible

**A goal-based physical lock system that keeps you accountable**

Lock-In Responsible is a smart lock system that combines embedded hardware, backend services, and AI-powered goal verification to help you stay accountable to your commitments. Put your phone (or any valuable item) in the box, and you can only unlock it after proving you've completed your daily goals.

## 🎯 TLDR for Claude

**Project Goal**: Build a production-ready smart lock system where:
- ESP32 controls a physical solenoid lock on a box
- User sets daily goals (code commits, PRs, tasks, etc.)
- ESP32 generates random unlock codes valid for limited time
- User must prove goal completion to LLM-powered backend to reveal the code
- Backend verifies proof (screenshots, git commits, code analysis) using LLM
- Only after verification can user get the unlock code

**Tech Stack**:
- **Hardware**: ESP32 + Solenoid Lock + Power Supply
- **Firmware**: ESP-IDF/Arduino C++ with WiFi + HTTPS
- **Backend**: Node.js + TypeScript + Express
- **Database**: PostgreSQL (SQLite for development)
- **LLM**: OpenAI GPT-4 / Anthropic Claude API
- **Client**: Web app (React) + Mobile PWA

**Current Status**: ✅ MVP Complete - Full stack implemented and documented

**For Complete Project Overview**: See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for comprehensive technical details.

## 🚀 Quick Start

**New to the project?** See [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) for a detailed step-by-step guide.

```bash
# 1. Clone the repository
git clone <repository-url>
cd lock-in-responsible

# 2. Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev

# 3. Setup ESP32 firmware
cd ../firmware
# Copy config.h.example to config.h and edit WiFi credentials
# Flash using Arduino IDE or PlatformIO

# 4. Setup web client
cd ../client
npm install
npm start
```

## 📋 Use Cases

1. **Phone Lock-In**: Put your phone in the box. Only unlock after completing coding goals.
2. **Gaming Control**: Lock your gaming console. Unlock only after work tasks are done.
3. **Snack Box**: Lock snacks/treats. Unlock after exercise or study goals.
4. **Accountability Partner**: Share goal verification with friends/team.
5. **Habit Building**: Create daily streaks and unlock patterns.

## 🏗️ Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  ESP32 Device   │◄────────┤  Backend API     │◄────────┤  Web/Mobile     │
│  + Lock         │  HTTPS  │  + Database      │  HTTPS  │  Client         │
│                 │         │  + LLM Service   │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
       │                            │                            │
       │                            │                            │
    Generates                   Verifies                    Sets Goals
    Unlock Code                 Proof via LLM              Submits Proof
```

### Key Components

1. **ESP32 Firmware** (`/firmware`)
   - Generates secure random unlock codes
   - Controls solenoid lock via relay
   - Communicates with backend over WiFi
   - Handles unlock requests and verification
   - Status LED indicators

2. **Backend Service** (`/backend`)
   - RESTful API for all operations
   - User authentication and session management
   - Goal creation and tracking
   - LLM integration for proof verification
   - Code generation and validation
   - Device management and pairing

3. **Database** (`/backend/db`)
   - User accounts and authentication
   - Device registration and pairing
   - Goals and verification history
   - Unlock codes and audit logs

4. **LLM Integration** (`/backend/services/llm`)
   - Analyzes proof submissions (screenshots, text, code)
   - Verifies GitHub commits and PRs
   - Evaluates task completion
   - Provides detailed feedback

5. **Web Client** (`/client`)
   - Goal management interface
   - Proof submission portal
   - Device pairing and status
   - Analytics and streak tracking

## 🔧 Hardware Requirements

### Essential Components
- **ESP32 DevKit** (recommended: ESP32-WROOM-32)
- **12V Solenoid Lock** (electric door strike or bolt lock)
- **5V Relay Module** (to control solenoid)
- **12V Power Supply** (2A minimum)
- **Step-down converter** (12V to 5V for ESP32)
- **Enclosure/Box** (for 3D printing or purchase)

### Optional Components
- Status LEDs (RGB or separate colors)
- Buzzer for audio feedback
- Backup battery (for maintaining time during power loss)
- Magnetic door sensor (to detect box state)

### Estimated Cost: $40-60 USD

See [docs/HARDWARE.md](docs/HARDWARE.md) for detailed specifications and assembly instructions.

## 🎯 Goal Types Supported

1. **GitHub Goals**
   - Commit X times
   - Create/merge PR
   - Close issues
   - Code review participation

2. **Code Goals**
   - Write X lines of code
   - Pass all tests
   - Improve code coverage
   - Fix specific bugs

3. **Task Goals**
   - Complete TODO items
   - Time-based work sessions (Pomodoro)
   - Documentation writing
   - Learning milestones

4. **Custom Goals**
   - Upload proof (screenshots, photos)
   - LLM-evaluated free-form proof
   - Third-party integrations (Jira, Trello, etc.)

## 🔒 Security Features

- **Code Expiry**: Unlock codes expire after 5 minutes
- **Rate Limiting**: Prevents brute-force attempts
- **Audit Logging**: All unlock attempts are logged
- **Encrypted Communication**: TLS/HTTPS for all API calls
- **Device Pairing**: Secure device registration with tokens
- **Goal Verification**: LLM validates proof authenticity

## 📚 Documentation

- [Architecture Guide](docs/ARCHITECTURE.md) - Detailed system design
- [Component Breakdown](docs/COMPONENTS.md) - Individual component specs
- [Hardware Guide](docs/HARDWARE.md) - Assembly and wiring
- [API Reference](docs/API.md) - Backend API documentation
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment
- [Development Guide](docs/DEVELOPMENT.md) - Contributing and development

## 🛣️ Roadmap to Production

### Phase 1: MVP (Current)
- [x] Architecture design
- [ ] ESP32 firmware with basic lock control
- [ ] Backend API with goal management
- [ ] Simple web client
- [ ] LLM integration for proof verification

### Phase 2: Enhanced Features
- [ ] Mobile app (React Native/Flutter)
- [ ] Multiple lock support per user
- [ ] Shared accountability (family/team goals)
- [ ] Advanced analytics and insights
- [ ] Goal templates and presets

### Phase 3: Production Ready
- [ ] Cloud deployment (AWS/GCP)
- [ ] Custom PCB design
- [ ] 3D-printed enclosure designs
- [ ] Manufacturing partnerships
- [ ] Beta testing program

### Phase 4: Product Launch
- [ ] Kickstarter/crowdfunding campaign
- [ ] Pre-orders and manufacturing
- [ ] Mobile app store releases
- [ ] Community marketplace for goal templates
- [ ] Enterprise features (teams, organizations)

## 🤝 Contributing

This project is designed to be production-ready. Contributions are welcome!

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

## 🙋 Support

For questions, issues, or feature requests, please open an issue on GitHub.

---

**Built with accountability in mind** 🎯
