# Getting Started with Lock-In Responsible

Welcome! This guide will get you up and running with Lock-In Responsible in under 30 minutes.

## What You'll Build

A smart lock system where:
1. You set daily goals (code commits, tasks, etc.)
2. Put your phone in a locked box
3. Complete your goals
4. System verifies completion using AI
5. You get unlock code to retrieve your phone

## Prerequisites

### Required
- Computer (Linux, macOS, or Windows)
- ESP32 development board
- Basic electronics components (see shopping list)
- WiFi network
- OpenAI or Anthropic API key

### Skills Needed
- Basic command line usage
- Basic electronics (if you can plug in USB cables, you're good!)
- No coding required (but you'll need to edit config files)

## Shopping List

**Minimum viable build** (~$35):

| Item | Quantity | Price | Where to Buy |
|------|----------|-------|--------------|
| ESP32 DevKit | 1 | $10 | Amazon, AliExpress |
| 12V Solenoid Lock | 1 | $15 | Amazon |
| 5V Relay Module | 1 | $4 | Amazon |
| 12V Power Supply | 1 | $8 | Amazon |
| Jumper Wires | 1 pack | $5 | Amazon |
| Small box/container | 1 | Free | Use what you have |

**Optional but recommended** (+$15):
- RGB LED + resistors
- Active buzzer
- Push buttons
- 3D printed case

## Step-by-Step Setup

### Step 1: Backend Setup (15 minutes)

**1.1 Install Node.js**

```bash
# Check if already installed
node --version

# If not installed:
# macOS:
brew install node

# Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Windows:
# Download from https://nodejs.org
```

**1.2 Clone Repository**

```bash
git clone <repository-url>
cd lock-in-responsible
```

**1.3 Setup Backend**

```bash
cd backend

# Install dependencies
npm install

# Create configuration
cp .env.example .env

# Edit configuration
nano .env  # or use any text editor
```

**1.4 Configure Environment Variables**

Minimum required changes in `.env`:

```bash
# Generate strong secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Add your LLM API key (choose one)
OPENAI_API_KEY=sk-your-key-here
# OR
ANTHROPIC_API_KEY=sk-ant-your-key-here

# For quick start, use SQLite (change this for production)
DATABASE_URL="file:./dev.db"
```

**1.5 Initialize Database**

```bash
npm run db:push
```

**1.6 Start Backend**

```bash
npm run dev
```

You should see:
```
Server running on http://0.0.0.0:3000
```

✅ **Backend is running!**

---

### Step 2: Hardware Assembly (20 minutes)

**2.1 Gather Components**

Lay out all components on a clean workspace.

**2.2 Connect ESP32 to Computer**

Use USB cable to connect ESP32 to your computer.

**2.3 Wire Components**

Follow this simple wiring guide:

```
ESP32 GPIO 4  →  Relay IN
ESP32 GND     →  Relay GND
ESP32 5V      →  Relay VCC

12V+ (power)  →  Relay COM
Relay NO      →  Solenoid +
Solenoid -    →  12V GND

IMPORTANT: Connect ESP32 GND to 12V GND (common ground!)
```

**2.4 Optional: Add LED**

If you have an RGB LED:

```
ESP32 GPIO 5  →  220Ω Resistor  →  LED Red
ESP32 GPIO 18 →  220Ω Resistor  →  LED Green
ESP32 GPIO 19 →  220Ω Resistor  →  LED Blue
LED Common    →  GND
```

**2.5 Test Connections**

- Double-check all connections
- Ensure no exposed wires touching
- Verify power supply is 12V 2A

---

### Step 3: Firmware Upload (10 minutes)

**3.1 Install PlatformIO**

**VS Code (Recommended):**
1. Install Visual Studio Code
2. Install PlatformIO extension
3. Restart VS Code

**Command Line:**
```bash
pip install platformio
```

**3.2 Configure Firmware**

```bash
cd ../firmware

# Copy config template
cp include/config.h.example include/config.h

# Edit configuration
nano include/config.h
```

**3.3 Set WiFi Credentials**

In `config.h`, change:

```cpp
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

#define API_HOST "192.168.1.100"  // Your computer's IP
#define API_PORT 3000
```

**Find your computer's IP:**
```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'

# Windows
ipconfig
```

**3.4 Build and Upload**

```bash
# Build firmware
pio run

# Upload to ESP32
pio run --target upload

# Open serial monitor
pio device monitor
```

You should see:
```
=================================
Lock-In Responsible ESP32
Firmware Version: 1.0.0
=================================

Connecting to WiFi: YourWiFi
WiFi connected!
IP address: 192.168.1.50
```

✅ **ESP32 is running!**

---

### Step 4: Test the System (10 minutes)

**4.1 Create User Account**

Open a new terminal:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "password": "SecurePass123!",
    "name": "Your Name"
  }'
```

Save the `accessToken` from response.

**4.2 Pair Device**

In the ESP32 serial monitor, you should see periodic heartbeats.

Get the pairing info from backend logs, or manually pair:

```bash
# In ESP32 serial monitor, enter:
pair:sk_live_your_api_key_here
```

To get API key, pair via backend:

```bash
curl -X POST http://localhost:3000/api/devices/pair \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceMac": "AA:BB:CC:DD:EE:FF",
    "deviceName": "My Lock Box"
  }'
```

Use the MAC address shown in ESP32 serial output.

**4.3 Create a Test Goal**

```bash
curl -X POST http://localhost:3000/api/goals \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test goal",
    "description": "Just testing the system",
    "type": "custom",
    "target": 1,
    "deviceId": "YOUR_DEVICE_ID",
    "verificationType": "llm"
  }'
```

**4.4 Verify Goal**

```bash
curl -X POST http://localhost:3000/api/goals/GOAL_ID/verify \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "proofType": "text",
    "proofText": "I completed the test goal successfully!"
  }'
```

**4.5 Get Unlock Code**

```bash
curl -X POST http://localhost:3000/api/devices/DEVICE_ID/unlock \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

You'll get a 6-digit code like: `482751`

**4.6 Unlock the Box**

In ESP32 serial monitor, type the code:

```
482751
```

The lock should activate! 🎉

---

## What's Next?

### Immediate Next Steps

1. **Put it in a box**: Mount everything in a container
2. **Set real goals**: Create daily goals that matter to you
3. **Build the habit**: Use it every day for a week

### Customize Your Setup

1. **Add a keypad**: For entering codes without computer
2. **Build a web app**: Create a nice UI (React template included)
3. **Add more goals**: GitHub commits, Jira tasks, etc.

### Make It Better

1. **3D print a case**: See `/hardware/3d-models/` (future)
2. **Add a display**: Show current goals on OLED screen
3. **Setup mobile app**: React Native template (future)

## Troubleshooting

### "Backend won't start"

```bash
# Check Node.js version
node --version  # Should be 20+

# Check if port 3000 is free
lsof -i :3000

# View detailed errors
npm run dev
```

### "ESP32 won't connect to WiFi"

- Verify SSID and password in `config.h`
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
- Check WiFi signal strength
- Try restarting router

### "Code always invalid"

- Verify device is paired (check serial output)
- Ensure backend is running
- Check goals are completed
- Verify code hasn't expired (5 minutes)

### "Lock doesn't activate"

- Check relay wiring
- Verify 12V power supply is connected
- Test relay manually: `digitalWrite(4, HIGH);`
- Check solenoid is working (apply 12V directly)

## Getting Help

1. **Check documentation**: `/docs` folder has detailed guides
2. **Review examples**: See `/examples` for code samples
3. **Search issues**: GitHub issues may have your answer
4. **Ask for help**: Open a new GitHub issue

## Common Questions

**Q: Do I need to keep my computer running?**
A: For development, yes. For production, deploy to a server (see DEPLOYMENT.md)

**Q: What if I forget my goals and can't unlock?**
A: Press the manual unlock button (emergency access)

**Q: Can I use multiple locks?**
A: Yes! Pair multiple ESP32 devices to one account

**Q: Is my data private?**
A: Yes, you control everything. Self-host for complete privacy.

**Q: How much does it cost to run?**
A: LLM API calls: ~$0.01-0.10 per verification. Very cheap!

**Q: Can I sell these?**
A: Check LICENSE. Generally yes for personal/educational use.

## Next Documentation

- **[Architecture](ARCHITECTURE.md)**: How it all works
- **[API Reference](API.md)**: Complete API documentation
- **[Hardware Guide](HARDWARE.md)**: Detailed assembly instructions
- **[Deployment](DEPLOYMENT.md)**: Production deployment guide

---

**Welcome to Lock-In Responsible!** 🎯🔒

Now go set some goals and achieve them! 💪
