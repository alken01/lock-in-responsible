# Lock-In Responsible - ESP32 Firmware

Firmware for ESP32-based smart lock control.

## Features

- WiFi connectivity
- HTTPS API communication with backend
- Solenoid lock control via relay
- RGB LED status indicators
- Buzzer audio feedback
- Code validation with rate limiting
- Automatic lockout after failed attempts
- Heartbeat monitoring
- Event logging
- EEPROM storage for configuration
- Manual unlock button (emergency)
- Pairing button for device setup

## Hardware Requirements

See [/docs/HARDWARE.md](../docs/HARDWARE.md) for complete hardware guide.

**Minimum:**
- ESP32 DevKit (ESP32-WROOM-32)
- 12V Solenoid Lock
- 5V Relay Module
- 12V Power Supply
- Buck Converter (12V to 5V)
- Jumper wires

**Optional:**
- RGB LED (common cathode)
- Active Buzzer (5V)
- Push Buttons (2x)
- Magnetic Door Sensor
- 3x 220Ω resistors (for LED)

## Software Requirements

### Option 1: PlatformIO (Recommended)

```bash
# Install PlatformIO Core or use VS Code extension
pip install platformio

# Or install VS Code PlatformIO extension
```

### Option 2: Arduino IDE

- Arduino IDE 2.0+
- ESP32 Board Support Package
- ArduinoJson library

## Setup

### 1. Configure Settings

```bash
# Copy config file
cp include/config.h.example include/config.h

# Edit with your settings
nano include/config.h
```

**Important settings to change:**
- `WIFI_SSID` - Your WiFi network name
- `WIFI_PASSWORD` - Your WiFi password
- `API_HOST` - Backend server IP address
- `API_PORT` - Backend server port (default 3000)

### 2. Build and Upload

#### Using PlatformIO

```bash
# Build
pio run

# Upload
pio run --target upload

# Monitor serial output
pio device monitor
```

#### Using Arduino IDE

1. Open `src/main.cpp` in Arduino IDE
2. Select board: Tools → Board → ESP32 Dev Module
3. Select port: Tools → Port → (your ESP32 port)
4. Click Upload
5. Open Serial Monitor (115200 baud)

### 3. Pair Device

After first upload, the device needs to be paired with your account:

#### Method 1: Manual Pairing via Serial

```bash
# In serial monitor, enter:
pair:sk_live_YOUR_API_KEY_FROM_BACKEND

# Get API key by pairing through web interface first
```

#### Method 2: Pairing Button (Future)

1. Press and hold pairing button
2. Device creates WiFi access point
3. Connect to "LockIn-XXXX" network
4. Open http://192.168.4.1
5. Enter backend URL and login
6. Device pairs automatically

### 4. Test

```bash
# In serial monitor, check status:
status

# Enter a valid unlock code (6 digits):
123456
```

## Pin Configuration

Default pin assignments (can be changed in `config.h`):

| Component | Pin | Notes |
|-----------|-----|-------|
| Relay (Lock) | GPIO 4 | Controls solenoid |
| LED Red | GPIO 5 | 220Ω resistor |
| LED Green | GPIO 18 | 220Ω resistor |
| LED Blue | GPIO 19 | 220Ω resistor |
| Buzzer | GPIO 23 | Active buzzer |
| Pairing Button | GPIO 21 | Internal pull-up |
| Manual Button | GPIO 22 | Internal pull-up |
| Door Sensor | GPIO 25 | Optional |
| Status LED | GPIO 2 | Built-in LED |

## LED Status Indicators

| Color | Meaning |
|-------|---------|
| 🔴 Red | Locked |
| 🟢 Green | Unlocked |
| 🔵 Blue | Connecting to WiFi |
| 🟡 Yellow | Warning |
| 🟣 Purple | Pairing mode |
| ⚫ Off | Error/offline |

## Serial Commands

Enter commands in Serial Monitor (115200 baud):

| Command | Description |
|---------|-------------|
| `status` | Show device status |
| `pair:API_KEY` | Manually pair device |
| `XXXXXX` | Enter 6-digit unlock code |

## API Communication

The firmware communicates with the backend via these endpoints:

### POST /api/device/heartbeat
Sent every 60 seconds to report device status.

### POST /api/device/validate-code
Validates unlock codes entered by user.

### POST /api/device/log-event
Logs events (unlock attempts, errors, etc.).

See [/docs/API.md](../docs/API.md) for full API documentation.

## Troubleshooting

### WiFi Won't Connect

```
- Check WIFI_SSID and WIFI_PASSWORD in config.h
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
- Check WiFi signal strength
- Try moving closer to router
```

### Can't Connect to Backend

```
- Verify API_HOST and API_PORT
- Check backend is running: curl http://API_HOST:API_PORT/health
- Verify firewall allows connection
- Check ESP32 and backend on same network
```

### Lock Doesn't Activate

```
- Check relay wiring (GPIO 4 → Relay IN)
- Verify relay has power (VCC, GND)
- Test relay manually with digitalWrite
- Check solenoid power supply (12V)
```

### Code Always Invalid

```
- Ensure device is paired (status command)
- Check backend logs for validation errors
- Verify goals are completed
- Check unlock code hasn't expired (5 min)
```

### Serial Monitor Shows Garbage

```
- Set baud rate to 115200
- Check USB cable and drivers
- Try different USB port
- Reset ESP32 and reconnect
```

## Development

### Adding Features

**Add a new sensor:**
1. Define pin in `config.h`
2. Initialize in `setup()`
3. Read in `loop()`
4. Send data in heartbeat

**Add new event types:**
1. Call `logEvent("event_name", "{\"key\":\"value\"}")`
2. Backend will store in database

### Debugging

Enable verbose output:

```cpp
#define CORE_DEBUG_LEVEL 5  // In platformio.ini
#define DEBUG_SERIAL true   // In config.h
```

View logs:
```bash
pio device monitor --baud 115200
```

### OTA Updates

For production deployments, enable OTA:

```ini
# In platformio.ini
upload_protocol = espota
upload_port = 192.168.1.XXX
```

Then update remotely:
```bash
pio run --target upload --upload-port 192.168.1.XXX
```

## Security Notes

- API key is stored in EEPROM (survives reboots)
- Codes expire after 5 minutes
- Rate limiting prevents brute force (3 attempts)
- 15-minute lockout after failed attempts
- All unlock attempts are logged
- HTTPS recommended for production

## Future Enhancements

- [ ] BLE communication for code entry via app
- [ ] Web server on ESP32 for configuration
- [ ] Captive portal for easy WiFi setup
- [ ] NFC/RFID unlock support
- [ ] Battery level monitoring
- [ ] Deep sleep mode for power saving
- [ ] Encrypted code transmission
- [ ] Local unlock code cache (offline mode)

## License

MIT
