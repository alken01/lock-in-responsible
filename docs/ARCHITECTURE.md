# System Architecture

## Overview

Lock-In Responsible is a distributed system consisting of three main tiers:

1. **Embedded Device Tier**: ESP32-based hardware controlling physical locks
2. **Backend Service Tier**: Cloud/local server providing API and business logic
3. **Client Tier**: Web/mobile applications for user interaction

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT TIER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐            │
│  │   Web App    │    │  Mobile PWA  │    │   CLI Tool   │            │
│  │   (React)    │    │   (React)    │    │   (Node.js)  │            │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘            │
│         │                   │                    │                     │
│         └───────────────────┴────────────────────┘                     │
│                             │                                          │
│                          HTTPS/WSS                                     │
│                             │                                          │
└─────────────────────────────┼──────────────────────────────────────────┘
                              │
┌─────────────────────────────┼──────────────────────────────────────────┐
│                           BACKEND TIER                                 │
├─────────────────────────────┼──────────────────────────────────────────┤
│                             ▼                                          │
│  ┌──────────────────────────────────────────────────────┐             │
│  │              API Gateway / Load Balancer             │             │
│  │                    (Nginx/Traefik)                   │             │
│  └───────────────────────────┬──────────────────────────┘             │
│                              │                                         │
│         ┌────────────────────┼────────────────────┐                   │
│         ▼                    ▼                    ▼                   │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐          │
│  │   Auth      │      │    Goal     │      │   Device    │          │
│  │  Service    │      │   Service   │      │  Service    │          │
│  └──────┬──────┘      └──────┬──────┘      └──────┬──────┘          │
│         │                    │                    │                   │
│         └────────────────────┼────────────────────┘                   │
│                              │                                         │
│              ┌───────────────┴───────────────┐                        │
│              ▼                               ▼                        │
│  ┌─────────────────────┐         ┌─────────────────────┐             │
│  │   LLM Service       │         │  Verification       │             │
│  │  (GPT-4/Claude)     │         │    Service          │             │
│  └─────────────────────┘         └──────────┬──────────┘             │
│                                              │                         │
│              ┌───────────────────────────────┘                        │
│              ▼                                                         │
│  ┌─────────────────────────────────────────────────────┐             │
│  │              Database Layer                         │             │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │             │
│  │  │PostgreSQL│  │  Redis   │  │  S3/Blob │         │             │
│  │  │ (Primary)│  │ (Cache)  │  │ (Files)  │         │             │
│  │  └──────────┘  └──────────┘  └──────────┘         │             │
│  └─────────────────────────────────────────────────────┘             │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
                              │
                          HTTPS/MQTT
                              │
┌─────────────────────────────┼──────────────────────────────────────────┐
│                        EMBEDDED TIER                                   │
├─────────────────────────────┼──────────────────────────────────────────┤
│                             ▼                                          │
│  ┌─────────────────────────────────────────────────────┐             │
│  │              ESP32 Device Fleet                     │             │
│  │  ┌────────────────┐  ┌────────────────┐            │             │
│  │  │   Device #1    │  │   Device #2    │   ...      │             │
│  │  │  ┌──────────┐  │  │  ┌──────────┐  │            │             │
│  │  │  │  WiFi    │  │  │  │  WiFi    │  │            │             │
│  │  │  │  Stack   │  │  │  │  Stack   │  │            │             │
│  │  │  └────┬─────┘  │  │  └────┬─────┘  │            │             │
│  │  │       │        │  │       │        │            │             │
│  │  │  ┌────▼─────┐  │  │  ┌────▼─────┐  │            │             │
│  │  │  │  Code    │  │  │  │  Code    │  │            │             │
│  │  │  │Generator │  │  │  │Generator │  │            │             │
│  │  │  └────┬─────┘  │  │  └────┬─────┘  │            │             │
│  │  │       │        │  │       │        │            │             │
│  │  │  ┌────▼─────┐  │  │  ┌────▼─────┐  │            │             │
│  │  │  │  Lock    │  │  │  │  Lock    │  │            │             │
│  │  │  │Controller│  │  │  │Controller│  │            │             │
│  │  │  └────┬─────┘  │  │  └────┬─────┘  │            │             │
│  │  │       │        │  │       │        │            │             │
│  │  │    ┌──▼──┐    │  │    ┌──▼──┐    │            │             │
│  │  │    │Relay│    │  │    │Relay│    │            │             │
│  │  │    └──┬──┘    │  │    └──┬──┘    │            │             │
│  │  │       │        │  │       │        │            │             │
│  │  │  ┌────▼─────┐  │  │  ┌────▼─────┐  │            │             │
│  │  │  │Solenoid  │  │  │  │Solenoid  │  │            │             │
│  │  │  │  Lock    │  │  │  │  Lock    │  │            │             │
│  │  │  └──────────┘  │  │  └──────────┘  │            │             │
│  │  └────────────────┘  └────────────────┘            │             │
│  └─────────────────────────────────────────────────────┘             │
└────────────────────────────────────────────────────────────────────────┘
```

## Design Decisions

### 1. ESP32 vs Raspberry Pi

**Decision**: Use ESP32

**Rationale**:
- **Cost**: ESP32 ($5-10) vs RPi ($35-75)
- **Power**: ESP32 uses ~80mA in active mode vs RPi ~500mA minimum
- **Simplicity**: Direct GPIO control, no OS overhead
- **Reliability**: Single-purpose embedded system, fewer failure points
- **Size**: Compact form factor (25x50mm vs 85x56mm)
- **Real-time**: No OS preemption, deterministic lock control
- **WiFi Built-in**: Native WiFi/BLE, no dongles needed

**Trade-offs**:
- Less processing power (good - we don't need it)
- More limited debugging (mitigated with serial logging)
- C++ instead of Python (acceptable, better for embedded)

### 2. Communication Protocol

**Decision**: HTTPS REST + WebSocket for real-time updates

**Rationale**:
- **HTTPS REST**: Standard, well-supported, easy to debug
- **WebSocket**: Real-time device status updates without polling
- **Alternative Considered - MQTT**: Adds broker complexity, overkill for our use case
- **Security**: TLS encryption, certificate pinning on ESP32

### 3. Backend Technology Stack

**Decision**: Node.js + TypeScript + Express

**Rationale**:
- **JavaScript/TypeScript**: Single language across stack (client + backend)
- **NPM Ecosystem**: Excellent LLM libraries (OpenAI SDK, Anthropic SDK)
- **Performance**: Adequate for API workload, non-blocking I/O
- **Developer Experience**: Fast iteration, great tooling
- **Deployment**: Easy containerization, wide hosting support

**Alternatives Considered**:
- **Python/FastAPI**: Slower development, but excellent for ML (not needed here)
- **Go**: Better performance, but slower development, fewer LLM SDKs
- **Rust**: Overkill for API service, longer development time

### 4. Database Choice

**Decision**: PostgreSQL (SQLite for development)

**Rationale**:
- **Relational**: Clear data relationships (users → devices → goals → codes)
- **ACID**: Critical for unlock code generation and validation
- **JSON Support**: Flexible storage for goal configurations and proof data
- **Scalability**: Handles growth from personal to product scale
- **SQLite for Dev**: Zero-config development, easy testing

### 5. LLM Integration Strategy

**Decision**: Multi-provider support (OpenAI, Anthropic, local models)

**Rationale**:
- **Flexibility**: Users choose based on cost/privacy preferences
- **Reliability**: Fallback if one provider has issues
- **Cost**: Allow cheaper models for simple verifications
- **Privacy**: Local LLM option for sensitive goals
- **Future-proof**: Easy to add new providers

### 6. Code Generation & Security

**Decision**: Cryptographically secure random codes with time-based expiry

**Implementation**:
```
- Generate code on ESP32 using hardware RNG
- 4-6 digit numeric code (user configurable)
- 5-minute validity window (configurable)
- Single-use codes (invalidated after use)
- Rate limiting: 3 attempts per 15 minutes
- Audit logging: All attempts recorded
```

**Why on ESP32**:
- No network required for code generation (works offline)
- Hardware RNG is cryptographically secure
- Reduces backend attack surface
- Device can function autonomously

### 7. Authentication & Authorization

**Decision**: JWT-based authentication with refresh tokens

**Flow**:
```
1. User logs in → Backend issues JWT + refresh token
2. Client stores tokens (httpOnly cookies for web, secure storage for mobile)
3. API requests include JWT in Authorization header
4. ESP32 devices have device-specific API keys
5. Device pairing requires authenticated user + physical button press
```

### 8. Goal Verification Architecture

**Decision**: Pluggable verification system with multiple strategies

**Verification Strategies**:

1. **LLM-based** (for screenshots, descriptions)
   - User uploads proof (image/text)
   - LLM analyzes against goal description
   - Returns verification result + confidence score
   - Requires >80% confidence to approve

2. **GitHub Integration** (for code goals)
   - OAuth integration with GitHub
   - Direct API queries for commits, PRs, reviews
   - Deterministic verification (no LLM needed)
   - Real-time webhook updates

3. **Custom Integrations** (extensible)
   - Jira, Trello, Notion, etc.
   - API-based verification
   - Plugin architecture for new integrations

4. **Manual Override** (emergency unlock)
   - Requires admin approval
   - Sends notification to accountability partner
   - Logs as "manual override" (affects streak)

## Data Flow

### Typical Unlock Flow

```
1. User wakes up, wants phone from box
   │
   ├─▶ Opens web/mobile app
   │
   ├─▶ Views today's goals: "Make 3 GitHub commits", "Close 1 PR"
   │
   ├─▶ Works on goals...
   │
   ├─▶ Submits proof:
   │   ├─ GitHub commits: Auto-verified via GitHub API
   │   └─ PR closed: Auto-verified via GitHub API
   │
   ├─▶ Backend verifies proof:
   │   ├─ Queries GitHub API
   │   ├─ Confirms 3+ commits made today
   │   ├─ Confirms 1+ PR closed/merged today
   │   └─ Marks goals as complete
   │
   ├─▶ Backend requests code from ESP32:
   │   └─ POST /api/device/{device_id}/request-code
   │
   ├─▶ ESP32 generates code:
   │   ├─ Uses hardware RNG
   │   ├─ Generates: "4285"
   │   ├─ Sets expiry: now + 5 minutes
   │   └─ Returns encrypted code to backend
   │
   ├─▶ Backend reveals code to user:
   │   └─ "Your unlock code is: 4285 (expires in 5:00)"
   │
   ├─▶ User enters code on ESP32 keypad/app:
   │   └─ Enters: 4-2-8-5
   │
   ├─▶ ESP32 validates code:
   │   ├─ Checks code matches
   │   ├─ Checks expiry time
   │   ├─ Validates not already used
   │   └─ Code valid ✓
   │
   ├─▶ ESP32 unlocks:
   │   ├─ Activates relay for 5 seconds
   │   ├─ Solenoid retracts
   │   ├─ Green LED lights up
   │   └─ Beep confirmation
   │
   └─▶ User retrieves phone, closes box
       └─ ESP32 locks automatically after 10 seconds
```

### Device Pairing Flow

```
1. User purchases ESP32 lock device
   │
   ├─▶ Powers on device (first boot)
   │
   ├─▶ ESP32 creates temporary WiFi AP: "LockIn-XXXX"
   │
   ├─▶ User connects phone to AP
   │
   ├─▶ Captive portal opens
   │
   ├─▶ User enters:
   │   ├─ Home WiFi credentials
   │   └─ Backend server URL (or uses default cloud)
   │
   ├─▶ ESP32 reboots, connects to WiFi
   │
   ├─▶ User opens Lock-In app
   │
   ├─▶ App shows "Add New Device"
   │
   ├─▶ User presses physical pairing button on ESP32
   │   └─ ESP32 enters pairing mode (60 second window)
   │
   ├─▶ App scans for devices on network (mDNS)
   │
   ├─▶ User selects device "LockIn-XXXX"
   │
   ├─▶ App sends pairing request to backend:
   │   └─ POST /api/devices/pair
   │       {
   │         "device_mac": "AA:BB:CC:DD:EE:FF",
   │         "device_name": "Bedroom Phone Lock"
   │       }
   │
   ├─▶ Backend generates device token
   │
   ├─▶ Backend sends token to ESP32
   │
   ├─▶ ESP32 stores token in EEPROM
   │
   └─▶ Device paired ✓
```

## Security Considerations

### Threat Model

**Threats**:
1. **Physical Attack**: Someone tries to break/disable the lock
2. **Code Brute Force**: Trying all possible unlock codes
3. **Network Interception**: MITM attack on WiFi
4. **Backend Compromise**: Attacker gains access to server
5. **Social Engineering**: Fake proof submission

**Mitigations**:

1. **Physical Security**:
   - Tamper detection (accelerometer/vibration sensor optional)
   - Backup battery (maintains lock during power cut)
   - Hardened enclosure design
   - Note: Not bank-vault secure, but sufficient for self-accountability

2. **Brute Force Protection**:
   - Rate limiting: 3 attempts per 15 minutes
   - Exponential backoff: 1min → 5min → 15min → 1hr
   - Code expiry: 5 minutes maximum
   - Lockout after 10 failed attempts (requires reset)

3. **Network Security**:
   - TLS 1.3 for all communication
   - Certificate pinning on ESP32
   - No plaintext credentials in firmware
   - Device tokens rotated every 30 days

4. **Backend Security**:
   - SQL injection prevention (parameterized queries)
   - JWT with short expiry (15 min access, 7 day refresh)
   - Rate limiting on all endpoints
   - Audit logging
   - Secrets in environment variables, never in code

5. **Proof Verification**:
   - LLM asked to actively look for manipulation
   - Screenshot metadata verification (timestamps)
   - Cross-reference with API data when possible
   - Confidence thresholds (require high confidence)

## Scalability Considerations

### Personal Use (1-10 users, 1-5 devices each)
- **Backend**: Single server, SQLite/PostgreSQL
- **Hosting**: Raspberry Pi on home network or $5/month VPS
- **Costs**: ~$5-10/month (VPS + LLM API calls)

### Small Community (100-1000 users)
- **Backend**: Horizontal scaling with load balancer
- **Database**: PostgreSQL with read replicas
- **Caching**: Redis for session/code storage
- **Hosting**: Container orchestration (Docker Swarm/K8s)
- **Costs**: ~$50-200/month

### Product Scale (10,000+ users)
- **Backend**: Microservices architecture
- **Database**: Sharded PostgreSQL, separate read/write
- **CDN**: CloudFront/Cloudflare for static assets
- **File Storage**: S3 for proof uploads
- **Monitoring**: Prometheus + Grafana
- **Hosting**: AWS/GCP with auto-scaling
- **Costs**: $500-2000+/month (dependent on usage)

## Deployment Architectures

### Development
```
Local machine:
  - Backend (npm run dev)
  - PostgreSQL (Docker)
  - Web client (npm start)

ESP32:
  - Connected to local WiFi
  - Points to localhost:3000
```

### Home Server
```
Raspberry Pi 4 / Mini PC:
  - Docker Compose stack:
    - Backend container
    - PostgreSQL container
    - Nginx reverse proxy
    - Let's Encrypt SSL
  - Accessible via DynamicDNS or Tailscale

ESP32 devices:
  - Connect to home WiFi
  - Point to local server
```

### Cloud (Production)
```
AWS/GCP/Azure:
  - ECS/Cloud Run: Backend containers
  - RDS/Cloud SQL: PostgreSQL
  - ElastiCache/Memorystore: Redis
  - S3/Cloud Storage: File uploads
  - CloudFront/CDN: Static assets
  - Route53/Cloud DNS: Domain management
  - Certificate Manager: SSL/TLS

ESP32 devices:
  - Connect via home/office WiFi
  - Point to cloud API endpoint
```

## Technology Stack Summary

### Embedded (ESP32)
- **Language**: C++ (Arduino framework)
- **IDE**: PlatformIO or Arduino IDE
- **Libraries**:
  - WiFi.h (network connectivity)
  - HTTPClient.h (API communication)
  - ArduinoJson.h (JSON parsing)
  - EEPROM.h (persistent storage)
  - ESP32Servo.h (lock control)

### Backend
- **Runtime**: Node.js 20 LTS
- **Language**: TypeScript 5.x
- **Framework**: Express.js
- **ORM**: Prisma (PostgreSQL) or better-sqlite3
- **Authentication**: jsonwebtoken + bcrypt
- **LLM SDKs**:
  - openai (GPT-4)
  - @anthropic-ai/sdk (Claude)
- **Validation**: Zod
- **Testing**: Jest + Supertest
- **API Docs**: OpenAPI/Swagger

### Database
- **Primary**: PostgreSQL 15+ (production)
- **Dev**: SQLite 3 (development)
- **Cache**: Redis 7+ (optional, for scaling)
- **ORM**: Prisma with migrations

### Client
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **State**: Zustand or Redux Toolkit
- **UI**: Tailwind CSS + shadcn/ui
- **API Client**: Axios or TanStack Query
- **Mobile**: PWA (future: React Native)

### DevOps
- **Containers**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana (optional)
- **Logging**: Winston (backend) + Loki (optional)
- **Reverse Proxy**: Nginx or Traefik

## Next Steps

1. ✅ Complete architecture documentation
2. → Implement backend service core
3. → Implement ESP32 firmware
4. → Create database schema
5. → Build web client MVP
6. → Integration testing
7. → Hardware assembly guide
8. → Beta testing

---

**Architecture Version**: 1.0.0
**Last Updated**: 2025-11-14
