# Hardware Guide

## Bill of Materials (BOM)

### Core Components

| Component | Specification | Quantity | Est. Cost | Notes |
|-----------|--------------|----------|-----------|-------|
| ESP32 Development Board | ESP32-WROOM-32 or ESP32-DevKitC | 1 | $8-12 | Recommended: 30-pin version |
| Solenoid Lock | 12V DC Electric Door Lock | 1 | $12-18 | Bolt or strike style |
| Relay Module | 5V Single Channel Relay | 1 | $3-5 | Must handle 12V/2A |
| Power Supply | 12V 2A DC Adapter | 1 | $8-10 | Wall adapter with barrel jack |
| DC-DC Converter | LM2596 Buck Converter | 1 | $3-5 | 12V to 5V step-down |
| **Subtotal** | | | **$34-50** | |

### Optional Components

| Component | Specification | Quantity | Est. Cost | Purpose |
|-----------|--------------|----------|-----------|---------|
| RGB LED | Common Cathode 5mm | 1 | $0.50 | Status indication |
| Resistors | 220Ω 1/4W | 3 | $0.30 | LED current limiting |
| Buzzer | 5V Active Buzzer | 1 | $1-2 | Audio feedback |
| Push Button | Tactile Switch 6x6mm | 2 | $1 | Pairing + manual unlock |
| Magnetic Door Sensor | Reed Switch NO/NC | 1 | $2-3 | Detect box open/close |
| Backup Battery | 18650 Li-ion + holder | 1 | $8-12 | Power during outage |
| **Optional Subtotal** | | | **$13-20** | |

### Enclosure Materials

**Option 1: 3D Printed Enclosure**
- PLA or PETG filament: ~100g ($3-5)
- Print time: 6-12 hours
- Files: Available in `/hardware/3d-models/`

**Option 2: Pre-made Project Box**
- Hammond 1591XXLBK or similar
- Dimensions: 150x100x60mm minimum
- Cost: $10-15

**Option 3: Custom Wood/Acrylic Box**
- Materials: $15-30
- Requires: Saw, drill, glue

### Tools Required

- Soldering iron and solder
- Wire strippers
- Screwdriver set
- Multimeter (for testing)
- Hot glue gun (optional, for strain relief)
- Drill (if mounting in enclosure)

## Component Details

### ESP32-WROOM-32 DevKit

**Specifications**:
- CPU: Dual-core Xtensa LX6, 240MHz
- RAM: 520KB SRAM
- Flash: 4MB (minimum)
- WiFi: 802.11 b/g/n (2.4GHz)
- Bluetooth: BLE 4.2
- GPIO: 34 programmable pins
- ADC: 18 channels, 12-bit
- Power: 3.3V logic, 5V USB power

**Pin Usage**:
```
GPIO 2  - Built-in LED (status)
GPIO 4  - Relay control (lock)
GPIO 5  - RGB LED - Red
GPIO 18 - RGB LED - Green
GPIO 19 - RGB LED - Blue
GPIO 21 - Pairing button (input, pull-up)
GPIO 22 - Manual unlock button (input, pull-up)
GPIO 23 - Buzzer (PWM output)
GPIO 25 - Magnetic door sensor (input, pull-up)
```

### Solenoid Lock Selection

**Recommended Models**:

1. **Electric Door Strike** (Recommended)
   - Model: 12V DC Fail-Secure Strike
   - Current: 500mA-1A
   - Holding force: 1000-1500 lbs
   - Pros: Professional look, easy installation
   - Cons: Requires door frame

2. **Electric Bolt Lock**
   - Model: 12V DC Solenoid Bolt Lock
   - Current: 1-2A
   - Bolt throw: 12-20mm
   - Pros: Versatile mounting, strong
   - Cons: Higher current draw

3. **Cabinet Lock**
   - Model: 12V DC Electromagnetic Cabinet Lock
   - Current: 500mA
   - Holding force: 60-100 lbs
   - Pros: Small, low power, cheap
   - Cons: Less secure, needs precise alignment

**Selection Criteria**:
- **For Phone Lock Box**: Cabinet lock sufficient
- **For Gaming Console**: Bolt lock recommended
- **For Door**: Strike lock required

### Relay Module

**Why Needed**:
- ESP32 GPIO outputs 3.3V at 40mA max
- Solenoid requires 12V at 0.5-2A
- Relay acts as electrical switch

**Specifications**:
- Coil Voltage: 5V DC
- Control Signal: 3.3V compatible (important!)
- Contact Rating: 10A @ 250VAC / 10A @ 30VDC
- Type: SPDT (Single Pole Double Throw)
- Trigger: Active LOW or Active HIGH (configurable)

**Wiring**:
```
ESP32 GPIO 4 → Relay IN
ESP32 GND → Relay GND
5V Supply → Relay VCC
12V+ → Relay COM
Solenoid+ → Relay NO (Normally Open)
Solenoid- → GND
```

### Power Supply Design

**Power Requirements**:
```
ESP32: 5V @ 500mA (typical 200mA, peak 500mA)
Relay: 5V @ 70mA
Solenoid: 12V @ 1-2A (when activated)
Optional components: 5V @ 50-100mA

Total:
  12V rail: 2A (solenoid)
  5V rail: 650mA (ESP32 + relay + peripherals)
```

**Power Architecture**:
```
Wall Adapter (12V 2A)
     │
     ├───→ Solenoid (via relay)
     │
     └───→ Buck Converter (LM2596)
               │
               └───→ 5V @ 1A
                     ├───→ ESP32
                     ├───→ Relay module
                     └───→ LEDs, Buzzer, etc.
```

**Alternative: USB Power for ESP32**:
```
Wall Adapter (12V 2A) → Solenoid only
USB Charger (5V 1A) → ESP32 + peripherals
```
- Pros: Simpler, no buck converter needed
- Cons: Two wall outlets required

## Wiring Diagram

```
                          ┌─────────────────────────────┐
                          │     12V Power Supply        │
                          │      (Wall Adapter)         │
                          └──────┬────────────┬─────────┘
                                 │            │
                          12V+ ──┘            └── GND
                                 │                │
                    ┌────────────┤                │
                    │            │                │
                    ▼            ▼                ▼
            ┌───────────┐  ┌──────────────────────────┐
            │  Relay    │  │    Buck Converter        │
            │  Module   │  │    (LM2596)              │
            │           │  │  IN: 12V   OUT: 5V       │
            │ VCC  GND  │  └──┬────────────────┬──────┘
            │  │    │   │     │                │
            │  │    │   │     │ 5V             │ GND
            │  └────┼───┼─────┘                │
            │       │   │                      │
            │  IN   │   │                      │
            │   │   │   │                      │
            └───┼───┴───┴──────────────────────┼───────┐
                │                              │       │
    ┌───────────┴──────────────────────────────┴─────┐ │
    │                ESP32 DevKit                    │ │
    │                                                │ │
    │  5V ──── (from buck converter)                │ │
    │  GND ─┬─ (common ground)                      │ │
    │       │                                        │ │
    │  GPIO 4 ─────────────────────────────(to relay IN)
    │  GPIO 21 ────┬──────────────────(pairing btn)    │
    │              │                                    │
    │  GPIO 5 ─────┼──┬── 220Ω ──── Red LED ─── GND    │
    │  GPIO 18 ────┼──┼── 220Ω ──── Green LED ── GND   │
    │  GPIO 19 ────┼──┼── 220Ω ──── Blue LED ─── GND   │
    │              │  │                                 │
    │  GPIO 23 ────┼──┼────────────── Buzzer+ ─── GND  │
    │              │  │                                 │
    │  GPIO 22 ────┼──┼──────────────(manual btn)      │
    │              │  │                                 │
    │  GPIO 25 ────┼──┼──────────────(door sensor)     │
    │              │  │                                 │
    │  3.3V ───────┼──┴─── (pull-up for buttons)       │
    │              │                                    │
    └──────────────┴────────────────────────────────────┘
                   │
            [Push Buttons]
            (with 10kΩ pull-up to 3.3V)

    ┌──────────────────┐
    │   Relay Module   │
    │                  │
    │  COM ──── 12V+   │
    │  NO  ────┐       │
    │  NC      │       │
    └──────────┼───────┘
               │
        ┌──────▼──────┐
        │  Solenoid   │
        │   Lock      │
        │             │
        │  +  ────────┘
        │  -  ──── GND (12V)
        └─────────────┘
```

## Assembly Instructions

### Step 1: Prepare Components

1. **Test ESP32**:
   ```
   - Connect to USB
   - Upload blink sketch
   - Verify built-in LED blinks
   ```

2. **Test Power Supply**:
   ```
   - Use multimeter
   - Verify 12V output
   - Check polarity (center positive usually)
   ```

3. **Test Solenoid**:
   ```
   - Briefly connect to 12V (1-2 seconds)
   - Verify bolt extends/retracts
   - Measure current draw with multimeter
   ```

### Step 2: Assemble Power Circuit

1. **Buck Converter Setup**:
   ```
   - Connect 12V input to IN+ and IN-
   - Adjust potentiometer for 5V output
   - Verify with multimeter before connecting ESP32
   ```

2. **Common Ground**:
   ```
   - Critical: All grounds must be connected
   - 12V GND = 5V GND = ESP32 GND
   - Use wire nuts or terminal blocks
   ```

### Step 3: Connect Relay Module

1. **Relay Control**:
   ```
   - Relay VCC → 5V from buck converter
   - Relay GND → Common GND
   - Relay IN → ESP32 GPIO 4
   ```

2. **Relay Switch**:
   ```
   - COM → 12V+
   - NO → Solenoid+
   - Solenoid- → 12V GND
   ```

3. **Test**:
   ```
   - Upload test sketch (toggles GPIO 4)
   - Should hear relay click
   - Solenoid should activate
   ```

### Step 4: Add Status Indicators

1. **RGB LED** (Common Cathode):
   ```
   - Red Anode → 220Ω → GPIO 5
   - Green Anode → 220Ω → GPIO 18
   - Blue Anode → 220Ω → GPIO 19
   - Common Cathode → GND
   ```

2. **Buzzer**:
   ```
   - Buzzer + → GPIO 23
   - Buzzer - → GND
   ```

3. **Test**:
   ```
   - Upload LED test sketch
   - All colors should display
   - Buzzer should beep
   ```

### Step 5: Add User Input

1. **Pairing Button**:
   ```
   - One terminal → GPIO 21
   - Other terminal → GND
   - Enable internal pull-up in code
   ```

2. **Manual Unlock Button**:
   ```
   - One terminal → GPIO 22
   - Other terminal → GND
   - Enable internal pull-up in code
   ```

3. **Optional Door Sensor**:
   ```
   - Magnetic switch → GPIO 25 and GND
   - Enable internal pull-up
   ```

### Step 6: Enclosure Assembly

1. **Mount ESP32**:
   - Use M2.5 screws or hot glue
   - Ensure USB port is accessible

2. **Mount Solenoid**:
   - Position for proper latch alignment
   - Test lock/unlock motion
   - Secure with screws or strong adhesive

3. **Mount Relay and Converter**:
   - Keep away from WiFi antenna area (ESP32 chip side)
   - Use standoffs or double-sided tape

4. **Wire Management**:
   - Use cable ties
   - Hot glue for strain relief at connection points
   - Label wires for future debugging

5. **Cut Holes**:
   - USB access for programming
   - Power jack opening
   - Button holes
   - LED light pipes (or mount flush)

### Step 7: Final Testing

1. **Power On Test**:
   - Connect power
   - ESP32 should boot (LED activity)
   - No smoke, burning smell, or excessive heat

2. **Lock Cycle Test**:
   - Manually trigger lock/unlock 10 times
   - Verify consistent operation
   - Check for mechanical binding

3. **WiFi Test**:
   - Upload WiFi connection sketch
   - Verify connection to home network
   - Check signal strength (RSSI > -70 dBm)

4. **Integration Test**:
   - Upload full firmware
   - Test pairing process
   - Test goal completion → unlock flow

## Safety Considerations

### Electrical Safety

1. **Proper Insulation**:
   - No exposed 12V connections
   - Heat-shrink tubing on all solder joints
   - Non-conductive enclosure or proper grounding

2. **Overcurrent Protection**:
   - Use fused power supply
   - Consider adding inline fuse (2A) for solenoid circuit

3. **Voltage Verification**:
   - Always test voltages before connecting components
   - Reverse polarity can destroy ESP32 instantly

### Mechanical Safety

1. **Lock Failure Mode**:
   - **Fail-Secure**: Locks when power lost (default for solenoids)
   - **Emergency Access**: Manual override button should work even if ESP32 crashes
   - **Backup Plan**: Physical key or bypass (recommended)

2. **Pinch Points**:
   - Ensure bolt doesn't create pinch hazard
   - Smooth edges on all moving parts

3. **Heat Management**:
   - Solenoid gets warm during extended activation
   - Firmware limits activation to 5 seconds max
   - Adequate ventilation in enclosure

### Fire Safety

1. **Component Ratings**:
   - All components within rated voltage/current
   - Use proper gauge wire (18-22 AWG for this project)

2. **Thermal Fuses**:
   - Consider thermal fuse on power supply (optional)

3. **Placement**:
   - Don't place near flammable materials
   - Ensure adequate airflow

## Troubleshooting

### ESP32 Won't Boot
- **Check**: 5V supply voltage (should be 4.75-5.25V)
- **Check**: USB cable (try known-good cable)
- **Fix**: Hold BOOT button while powering on

### Relay Clicks But Solenoid Doesn't Work
- **Check**: 12V at solenoid terminals when relay on
- **Check**: Solenoid resistance (should be 10-50Ω)
- **Fix**: Verify relay NO/NC connections

### WiFi Won't Connect
- **Check**: SSID and password in code
- **Check**: 2.4GHz network (ESP32 doesn't support 5GHz)
- **Check**: Signal strength (move closer to router)
- **Fix**: Use WiFi analyzer app to check interference

### Random Reboots
- **Likely**: Power supply insufficient
- **Check**: Voltage sag when solenoid activates
- **Fix**: Add capacitor (1000µF, 16V) across 5V rail

### Lock Mechanism Sticks
- **Mechanical**: Misalignment or binding
- **Fix**: Adjust mounting position, lubricate

## Customization Ideas

### Enhanced Security
- Add keypad for code entry (instead of app)
- Fingerprint sensor integration
- Camera for face recognition

### Better UX
- E-ink display showing next goal
- NFC reader for tap-to-unlock
- Servo for motorized opening (not just unlock)

### Multi-Box System
- Multiple locks, single ESP32
- Relay board controlling multiple solenoids
- Progressive unlock (easy → medium → hard goals)

### Power Optimization
- Deep sleep between checks (30-60 min battery life)
- Solar panel + battery for outdoor use
- PoE (Power over Ethernet) version

## Recommended Vendors

### USA
- **Adafruit**: ESP32 boards, quality components
- **SparkFun**: Development boards, sensors
- **Amazon**: Solenoids, power supplies, relays

### International
- **AliExpress**: Budget components (longer shipping)
- **Digi-Key / Mouser**: Professional components
- **Seeed Studio**: Asian market, good quality

## Cost Optimization

### Budget Build (~$30)
- Generic ESP32 from AliExpress
- Cheap solenoid lock
- USB charger instead of dedicated PSU
- Cardboard/plastic container

### Premium Build (~$70)
- Name-brand ESP32 (Adafruit/SparkFun)
- High-quality solenoid lock
- Custom 3D-printed enclosure
- All optional features (RGB, buzzer, sensors)

---

**Hardware Version**: 1.0
**Last Updated**: 2025-11-14
