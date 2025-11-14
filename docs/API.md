# API Documentation

## Base URL

**Development**: `http://localhost:3000/api`
**Production**: `https://api.lockin.example.com/api`

## Authentication

All API endpoints (except auth and health) require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Device endpoints use device-specific API keys:

```
X-Device-Key: <device_api_key>
```

## Response Format

All responses follow this format:

```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Success message",
  "timestamp": "2025-11-14T10:30:00Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { /* additional context */ }
  },
  "timestamp": "2025-11-14T10:30:00Z"
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `CONFLICT` | 409 | Resource conflict (e.g., already exists) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `GOAL_NOT_COMPLETE` | 400 | Goals not yet completed |
| `CODE_EXPIRED` | 400 | Unlock code has expired |
| `CODE_INVALID` | 400 | Unlock code is incorrect |
| `DEVICE_OFFLINE` | 503 | Device not reachable |

## Endpoints

### Authentication

#### POST /auth/register

Register a new user account.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2025-11-14T10:30:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 900
    }
  }
}
```

#### POST /auth/login

Login with email and password.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 900
    }
  }
}
```

#### POST /auth/refresh

Refresh access token using refresh token.

**Request**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

#### POST /auth/logout

Invalidate refresh token.

**Request**: Empty body

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### User Management

#### GET /users/me

Get current user profile.

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-11-14T10:30:00Z",
    "stats": {
      "totalGoalsCompleted": 42,
      "currentStreak": 7,
      "longestStreak": 15,
      "devicesOwned": 2
    }
  }
}
```

#### PATCH /users/me

Update user profile.

**Request**:
```json
{
  "name": "John Smith",
  "preferences": {
    "codeLength": 6,
    "codeExpiry": 300,
    "notifications": {
      "email": true,
      "push": false
    }
  }
}
```

**Response**: `200 OK`

---

### Device Management

#### GET /devices

List all devices owned by user.

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": "dev_xyz789",
        "name": "Bedroom Phone Lock",
        "macAddress": "AA:BB:CC:DD:EE:FF",
        "status": "online",
        "lastSeen": "2025-11-14T10:29:00Z",
        "firmwareVersion": "1.0.0",
        "batteryLevel": 85,
        "lockState": "locked"
      }
    ]
  }
}
```

#### POST /devices/pair

Pair a new device.

**Request**:
```json
{
  "deviceMac": "AA:BB:CC:DD:EE:FF",
  "deviceName": "Living Room Lock",
  "pairingCode": "123456"
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "device": {
      "id": "dev_xyz789",
      "name": "Living Room Lock",
      "macAddress": "AA:BB:CC:DD:EE:FF",
      "apiKey": "sk_live_abc123...",
      "createdAt": "2025-11-14T10:30:00Z"
    }
  }
}
```

#### GET /devices/:deviceId

Get device details.

**Response**: `200 OK`

#### PATCH /devices/:deviceId

Update device settings.

**Request**:
```json
{
  "name": "Bedroom Lock",
  "settings": {
    "autoLockDelay": 10,
    "unlockDuration": 5,
    "buzzerEnabled": true
  }
}
```

**Response**: `200 OK`

#### DELETE /devices/:deviceId

Unpair and remove device.

**Response**: `200 OK`

#### POST /devices/:deviceId/unlock

Request unlock code (after goals completed).

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "unlockCode": "482751",
    "expiresAt": "2025-11-14T10:35:00Z",
    "expiresIn": 300
  }
}
```

---

### Goals

#### GET /goals

List all goals for current user.

**Query Parameters**:
- `status`: Filter by status (`pending`, `completed`, `failed`)
- `date`: Filter by date (`2025-11-14`)
- `deviceId`: Filter by device

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "goals": [
      {
        "id": "goal_123",
        "title": "Make 3 GitHub commits",
        "description": "Commit at least 3 times to any repository",
        "type": "github_commits",
        "target": 3,
        "progress": 2,
        "status": "pending",
        "dueDate": "2025-11-14T23:59:59Z",
        "deviceId": "dev_xyz789",
        "createdAt": "2025-11-14T00:00:00Z"
      }
    ]
  }
}
```

#### POST /goals

Create a new goal.

**Request**:
```json
{
  "title": "Complete 5 Pomodoro sessions",
  "description": "Work for 25 minutes, 5 times today",
  "type": "custom",
  "target": 5,
  "deviceId": "dev_xyz789",
  "dueDate": "2025-11-14T23:59:59Z",
  "verificationType": "llm",
  "verificationConfig": {
    "requireProof": true,
    "proofType": "screenshot"
  }
}
```

**Goal Types**:
- `github_commits`: GitHub commit count
- `github_pr`: Create/merge pull request
- `github_issues`: Close issues
- `code_lines`: Write X lines of code
- `time_based`: Time tracking (Pomodoro, etc.)
- `custom`: User-defined with LLM verification

**Response**: `201 Created`

#### GET /goals/:goalId

Get goal details.

**Response**: `200 OK`

#### PATCH /goals/:goalId

Update goal (only if not completed).

**Request**:
```json
{
  "title": "Complete 6 Pomodoro sessions",
  "target": 6
}
```

**Response**: `200 OK`

#### DELETE /goals/:goalId

Delete goal.

**Response**: `200 OK`

#### POST /goals/:goalId/verify

Submit proof for goal verification.

**Request** (multipart/form-data):
```
proof_type: "screenshot"
proof_file: <file upload>
proof_text: "I completed 5 Pomodoro sessions using the Focus app"
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "verification": {
      "id": "ver_456",
      "status": "verified",
      "confidence": 0.95,
      "feedback": "Confirmed: Screenshot shows 5 completed Pomodoro sessions in Focus app.",
      "verifiedAt": "2025-11-14T10:30:00Z"
    },
    "goal": {
      "id": "goal_123",
      "status": "completed",
      "completedAt": "2025-11-14T10:30:00Z"
    }
  }
}
```

---

### Verification

#### GET /verifications

List all verification attempts.

**Query Parameters**:
- `goalId`: Filter by goal
- `status`: Filter by status (`pending`, `verified`, `rejected`)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "verifications": [
      {
        "id": "ver_456",
        "goalId": "goal_123",
        "status": "verified",
        "proofType": "screenshot",
        "proofUrl": "https://storage.example.com/proof_456.png",
        "confidence": 0.95,
        "feedback": "Confirmed completion",
        "submittedAt": "2025-11-14T10:30:00Z",
        "verifiedAt": "2025-11-14T10:30:15Z"
      }
    ]
  }
}
```

#### GET /verifications/:verificationId

Get verification details.

**Response**: `200 OK`

---

### Integrations

#### POST /integrations/github/connect

Connect GitHub account.

**Request**:
```json
{
  "code": "github_oauth_code"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "integration": {
      "id": "int_github_123",
      "provider": "github",
      "username": "johndoe",
      "connectedAt": "2025-11-14T10:30:00Z"
    }
  }
}
```

#### DELETE /integrations/:integrationId

Disconnect integration.

**Response**: `200 OK`

#### GET /integrations/github/commits

Get recent GitHub commits for verification.

**Query Parameters**:
- `since`: ISO date string
- `until`: ISO date string

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "commits": [
      {
        "sha": "abc123",
        "message": "Fix bug in auth",
        "repository": "user/repo",
        "timestamp": "2025-11-14T09:15:00Z",
        "url": "https://github.com/user/repo/commit/abc123"
      }
    ],
    "count": 3
  }
}
```

---

### Analytics

#### GET /analytics/stats

Get user statistics.

**Query Parameters**:
- `period`: `day`, `week`, `month`, `year`, `all`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "period": "week",
    "stats": {
      "goalsCreated": 21,
      "goalsCompleted": 18,
      "completionRate": 0.857,
      "currentStreak": 7,
      "totalUnlocks": 18,
      "averageUnlockTime": "18:30:00",
      "topGoalTypes": [
        { "type": "github_commits", "count": 7 },
        { "type": "time_based", "count": 6 }
      ]
    }
  }
}
```

#### GET /analytics/streaks

Get streak information.

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "currentStreak": 7,
    "longestStreak": 15,
    "streakHistory": [
      { "date": "2025-11-14", "completed": true },
      { "date": "2025-11-13", "completed": true },
      { "date": "2025-11-12", "completed": false }
    ]
  }
}
```

---

### Device API (for ESP32)

#### POST /device/heartbeat

Device check-in and status update.

**Headers**: `X-Device-Key: sk_live_abc123...`

**Request**:
```json
{
  "macAddress": "AA:BB:CC:DD:EE:FF",
  "firmwareVersion": "1.0.0",
  "lockState": "locked",
  "batteryLevel": 85,
  "wifiRssi": -65,
  "uptime": 86400
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "deviceId": "dev_xyz789",
    "serverTime": "2025-11-14T10:30:00Z",
    "pendingCommands": []
  }
}
```

#### POST /device/generate-code

Request new unlock code generation.

**Headers**: `X-Device-Key: sk_live_abc123...`

**Request**:
```json
{
  "codeLength": 6,
  "expirySeconds": 300
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "codeId": "code_789",
    "expiresAt": "2025-11-14T10:35:00Z"
  }
}
```

#### POST /device/validate-code

Validate unlock code entered by user.

**Headers**: `X-Device-Key: sk_live_abc123...`

**Request**:
```json
{
  "code": "482751",
  "codeId": "code_789"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "valid": true,
    "action": "unlock",
    "duration": 5
  }
}
```

If goals not completed:
```json
{
  "success": false,
  "error": {
    "code": "GOAL_NOT_COMPLETE",
    "message": "Complete your daily goals first",
    "details": {
      "pendingGoals": [
        {
          "id": "goal_123",
          "title": "Make 3 GitHub commits",
          "progress": 2,
          "target": 3
        }
      ]
    }
  }
}
```

#### POST /device/log-event

Log device event (unlock, lock, error, etc.).

**Headers**: `X-Device-Key: sk_live_abc123...`

**Request**:
```json
{
  "eventType": "unlock_success",
  "timestamp": "2025-11-14T10:30:00Z",
  "metadata": {
    "code": "482751",
    "attempts": 1
  }
}
```

**Response**: `200 OK`

---

### Admin (Future)

#### GET /admin/users

List all users (admin only).

#### GET /admin/devices

List all devices (admin only).

#### GET /admin/stats

System-wide statistics.

---

## Rate Limits

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| Goal Verification | 10 requests | 1 hour |
| Device API | 120 requests | 1 minute |
| General API | 100 requests | 15 minutes |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699961400
```

## Webhooks (Future)

Users can configure webhooks to receive events:

**Events**:
- `goal.completed`
- `goal.failed`
- `device.unlocked`
- `device.offline`
- `streak.milestone`

**Payload**:
```json
{
  "event": "goal.completed",
  "timestamp": "2025-11-14T10:30:00Z",
  "data": {
    "goalId": "goal_123",
    "userId": "usr_abc123",
    "deviceId": "dev_xyz789"
  }
}
```

## WebSocket API (Real-time Updates)

Connect to: `wss://api.lockin.example.com/ws`

**Authentication**:
```json
{
  "type": "auth",
  "token": "eyJhbGc..."
}
```

**Subscribe to device updates**:
```json
{
  "type": "subscribe",
  "channel": "device:dev_xyz789"
}
```

**Receive updates**:
```json
{
  "type": "device.status",
  "deviceId": "dev_xyz789",
  "data": {
    "lockState": "unlocked",
    "timestamp": "2025-11-14T10:30:00Z"
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { LockInClient } from '@lockin/sdk';

const client = new LockInClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.lockin.example.com'
});

// Login
const { user, tokens } = await client.auth.login({
  email: 'user@example.com',
  password: 'password'
});

// Create goal
const goal = await client.goals.create({
  title: 'Make 3 commits',
  type: 'github_commits',
  target: 3,
  deviceId: 'dev_xyz789'
});

// Verify goal
const verification = await client.goals.verify(goal.id, {
  proofType: 'github',
  autoVerify: true
});

// Request unlock
if (verification.status === 'verified') {
  const unlock = await client.devices.unlock('dev_xyz789');
  console.log(`Unlock code: ${unlock.unlockCode}`);
}
```

### Python

```python
from lockin import LockInClient

client = LockInClient(
    api_key='your_api_key',
    base_url='https://api.lockin.example.com'
)

# Login
user, tokens = client.auth.login(
    email='user@example.com',
    password='password'
)

# Create goal
goal = client.goals.create(
    title='Make 3 commits',
    type='github_commits',
    target=3,
    device_id='dev_xyz789'
)

# Verify and unlock
verification = client.goals.verify(goal.id, proof_type='github')
if verification.status == 'verified':
    unlock = client.devices.unlock('dev_xyz789')
    print(f"Unlock code: {unlock.unlock_code}")
```

---

**API Version**: 1.0.0
**Last Updated**: 2025-11-14
