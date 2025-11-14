/**
 * Lock-In Responsible - ESP32 Firmware
 *
 * This firmware controls a solenoid lock based on goal completion
 * verified through the backend API.
 *
 * Hardware:
 * - ESP32 DevKit
 * - 12V Solenoid Lock
 * - 5V Relay Module
 * - RGB LED (optional)
 * - Buzzer (optional)
 * - Buttons (pairing, manual)
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include "config.h"

// ========================================
// Global Variables
// ========================================

struct DeviceState {
  bool isLocked = true;
  bool isOnline = false;
  bool isPairing = false;
  unsigned long lastHeartbeat = 0;
  unsigned long unlockTime = 0;
  unsigned long lockoutTime = 0;
  int failedAttempts = 0;
  String currentCode = "";
  String apiKey = "";
};

DeviceState device;

// ========================================
// EEPROM Storage
// ========================================

#define EEPROM_SIZE 512
#define EEPROM_API_KEY_ADDR 0
#define EEPROM_API_KEY_SIZE 256

void saveApiKey(const String& key) {
  for (size_t i = 0; i < EEPROM_API_KEY_SIZE; i++) {
    if (i < key.length()) {
      EEPROM.write(EEPROM_API_KEY_ADDR + i, key[i]);
    } else {
      EEPROM.write(EEPROM_API_KEY_ADDR + i, 0);
    }
  }
  EEPROM.commit();

  #if DEBUG_SERIAL
  Serial.println("API key saved to EEPROM");
  #endif
}

String loadApiKey() {
  char key[EEPROM_API_KEY_SIZE];
  for (size_t i = 0; i < EEPROM_API_KEY_SIZE; i++) {
    key[i] = EEPROM.read(EEPROM_API_KEY_ADDR + i);
    if (key[i] == 0) break;
  }
  key[EEPROM_API_KEY_SIZE - 1] = '\0';

  #if DEBUG_SERIAL
  Serial.print("Loaded API key: ");
  Serial.println(key[0] != 0 ? "Yes" : "No");
  #endif

  return String(key);
}

// ========================================
// LED Control
// ========================================

void setLED(int red, int green, int blue) {
  analogWrite(PIN_LED_RED, red);
  analogWrite(PIN_LED_GREEN, green);
  analogWrite(PIN_LED_BLUE, blue);
}

void ledOff() {
  setLED(0, 0, 0);
}

void ledRed() {
  setLED(255, 0, 0);
}

void ledGreen() {
  setLED(0, 255, 0);
}

void ledBlue() {
  setLED(0, 0, 255);
}

void ledYellow() {
  setLED(255, 255, 0);
}

void ledPurple() {
  setLED(128, 0, 128);
}

// ========================================
// Buzzer Control
// ========================================

void beep(int frequency, int duration) {
  tone(PIN_BUZZER, frequency);
  delay(duration);
  noTone(PIN_BUZZER);
}

void beepSuccess() {
  beep(TONE_SUCCESS, BEEP_DURATION_MS);
  delay(50);
  beep(TONE_SUCCESS, BEEP_DURATION_MS);
}

void beepError() {
  beep(TONE_ERROR, BEEP_DURATION_MS * 2);
}

void beepWarning() {
  beep(TONE_WARNING, BEEP_DURATION_MS);
}

// ========================================
// Lock Control
// ========================================

void lockDoor() {
  digitalWrite(PIN_RELAY, LOW);
  device.isLocked = true;
  ledRed();

  #if DEBUG_SERIAL
  Serial.println("Door LOCKED");
  #endif
}

void unlockDoor() {
  digitalWrite(PIN_RELAY, HIGH);
  device.isLocked = false;
  device.unlockTime = millis();
  ledGreen();
  beepSuccess();

  #if DEBUG_SERIAL
  Serial.println("Door UNLOCKED");
  #endif

  // Auto-lock after duration
  delay(UNLOCK_DURATION_MS);
  lockDoor();
}

// ========================================
// WiFi Functions
// ========================================

void connectWiFi() {
  #if DEBUG_SERIAL
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  #endif

  ledBlue();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - startTime > WIFI_CONNECT_TIMEOUT_MS) {
      #if DEBUG_SERIAL
      Serial.println("WiFi connection timeout!");
      #endif
      ledRed();
      beepError();
      device.isOnline = false;
      return;
    }

    delay(500);
    #if DEBUG_SERIAL
    Serial.print(".");
    #endif
  }

  device.isOnline = true;
  ledGreen();
  beepSuccess();

  #if DEBUG_SERIAL
  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  Serial.print("MAC address: ");
  Serial.println(WiFi.macAddress());
  #endif
}

// ========================================
// API Functions
// ========================================

String getApiUrl(const String& endpoint) {
  String protocol = API_USE_HTTPS ? "https" : "http";
  return protocol + "://" + API_HOST + ":" + String(API_PORT) + "/api/device" + endpoint;
}

bool sendHeartbeat() {
  if (!device.isOnline || device.apiKey.length() == 0) {
    return false;
  }

  HTTPClient http;
  String url = getApiUrl("/heartbeat");

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", device.apiKey);

  // Build JSON payload
  JsonDocument doc;
  doc["macAddress"] = WiFi.macAddress();
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["lockState"] = device.isLocked ? "locked" : "unlocked";
  doc["wifiRssi"] = WiFi.RSSI();
  doc["uptime"] = millis() / 1000;

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);

  #if DEBUG_SERIAL
  Serial.print("Heartbeat response: ");
  Serial.println(httpCode);
  #endif

  bool success = httpCode == 200;
  http.end();

  return success;
}

bool validateCode(const String& code) {
  if (!device.isOnline || device.apiKey.length() == 0) {
    #if DEBUG_SERIAL
    Serial.println("Cannot validate: offline or not paired");
    #endif
    return false;
  }

  HTTPClient http;
  String url = getApiUrl("/validate-code");

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", device.apiKey);

  // Build JSON payload
  JsonDocument doc;
  doc["code"] = code;

  String payload;
  serializeJson(doc, payload);

  #if DEBUG_SERIAL
  Serial.print("Validating code: ");
  Serial.println(code);
  #endif

  int httpCode = http.POST(payload);

  if (httpCode == 200) {
    String response = http.getString();

    #if DEBUG_SERIAL
    Serial.print("Validation response: ");
    Serial.println(response);
    #endif

    JsonDocument responseDoc;
    deserializeJson(responseDoc, response);

    bool valid = responseDoc["data"]["valid"];
    http.end();

    return valid;
  }

  http.end();
  return false;
}

void logEvent(const String& eventType, const String& metadata = "{}") {
  if (!device.isOnline || device.apiKey.length() == 0) {
    return;
  }

  HTTPClient http;
  String url = getApiUrl("/log-event");

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", device.apiKey);

  JsonDocument doc;
  doc["eventType"] = eventType;

  JsonDocument metaDoc;
  deserializeJson(metaDoc, metadata);
  doc["metadata"] = metaDoc;

  String payload;
  serializeJson(doc, payload);

  http.POST(payload);
  http.end();
}

// ========================================
// Code Input (Simulated)
// ========================================

// In a real implementation, this would handle:
// - Physical keypad input
// - BLE communication from phone app
// - Web interface on ESP32's own web server
// For now, we'll use Serial for demonstration

void checkSerialInput() {
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();

    if (input.length() == CODE_LENGTH) {
      #if DEBUG_SERIAL
      Serial.print("Code entered: ");
      Serial.println(input);
      #endif

      // Check if in lockout
      if (device.lockoutTime > 0 && millis() < device.lockoutTime) {
        unsigned long remaining = (device.lockoutTime - millis()) / 1000;
        #if DEBUG_SERIAL
        Serial.print("LOCKED OUT! ");
        Serial.print(remaining);
        Serial.println(" seconds remaining");
        #endif
        ledRed();
        beepError();
        return;
      }

      // Validate code with backend
      if (validateCode(input)) {
        // Code valid - unlock!
        device.failedAttempts = 0;
        unlockDoor();
        logEvent("unlock_success", "{\"code\":\"" + input + "\"}");
      } else {
        // Code invalid
        device.failedAttempts++;
        ledRed();
        beepError();

        #if DEBUG_SERIAL
        Serial.print("Invalid code! Attempts: ");
        Serial.print(device.failedAttempts);
        Serial.print("/");
        Serial.println(MAX_CODE_ATTEMPTS);
        #endif

        if (device.failedAttempts >= MAX_CODE_ATTEMPTS) {
          device.lockoutTime = millis() + LOCKOUT_DURATION_MS;
          #if DEBUG_SERIAL
          Serial.println("TOO MANY ATTEMPTS! LOCKED OUT FOR 15 MINUTES");
          #endif
          ledRed();
          for (int i = 0; i < 5; i++) {
            beepError();
            delay(200);
          }
        }

        logEvent("unlock_fail", "{\"code\":\"" + input + "\",\"attempts\":" + String(device.failedAttempts) + "}");
      }
    } else if (input.startsWith("pair:")) {
      // Manual pairing command: pair:sk_live_xxxxx
      String key = input.substring(5);
      device.apiKey = key;
      saveApiKey(key);

      #if DEBUG_SERIAL
      Serial.println("Device paired manually!");
      #endif

      ledGreen();
      beepSuccess();
    } else if (input == "status") {
      #if DEBUG_SERIAL
      Serial.println("\n=== Device Status ===");
      Serial.print("Locked: ");
      Serial.println(device.isLocked ? "Yes" : "No");
      Serial.print("Online: ");
      Serial.println(device.isOnline ? "Yes" : "No");
      Serial.print("Paired: ");
      Serial.println(device.apiKey.length() > 0 ? "Yes" : "No");
      Serial.print("MAC: ");
      Serial.println(WiFi.macAddress());
      Serial.print("IP: ");
      Serial.println(WiFi.localIP());
      Serial.print("RSSI: ");
      Serial.println(WiFi.RSSI());
      Serial.println("==================\n");
      #endif
    }
  }
}

// ========================================
// Button Handlers
// ========================================

void handlePairingButton() {
  // TODO: Implement pairing mode
  // This would:
  // 1. Create temporary WiFi AP
  // 2. Serve configuration web page
  // 3. Receive API key from user
  // 4. Save and restart

  #if DEBUG_SERIAL
  Serial.println("Pairing button pressed (not implemented)");
  #endif

  ledPurple();
  beepWarning();
}

void handleManualButton() {
  // Emergency manual unlock (should be logged)
  #if DEBUG_SERIAL
  Serial.println("MANUAL UNLOCK REQUESTED");
  #endif

  unlockDoor();
  logEvent("manual_unlock", "{}");
}

// ========================================
// Setup & Loop
// ========================================

void setup() {
  // Initialize Serial
  #if DEBUG_SERIAL
  Serial.begin(DEBUG_BAUD_RATE);
  Serial.println("\n\n=================================");
  Serial.println("Lock-In Responsible ESP32");
  Serial.println("Firmware Version: " FIRMWARE_VERSION);
  Serial.println("=================================\n");
  #endif

  // Initialize EEPROM
  EEPROM.begin(EEPROM_SIZE);

  // Load saved API key
  device.apiKey = loadApiKey();

  // Initialize pins
  pinMode(PIN_RELAY, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_BLUE, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_BUTTON_PAIR, INPUT_PULLUP);
  pinMode(PIN_BUTTON_MANUAL, INPUT_PULLUP);
  pinMode(PIN_STATUS_LED, OUTPUT);

  // Initial state - locked
  lockDoor();

  // Connect to WiFi
  connectWiFi();

  // Send initial heartbeat
  if (device.isOnline) {
    sendHeartbeat();
  }

  #if DEBUG_SERIAL
  Serial.println("\nSetup complete!");
  Serial.println("Enter " + String(CODE_LENGTH) + "-digit code to unlock");
  Serial.println("Commands: 'status', 'pair:API_KEY'\n");
  #endif
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    device.isOnline = false;
    ledRed();
    connectWiFi();
  }

  // Send heartbeat periodically
  if (millis() - device.lastHeartbeat > HEARTBEAT_INTERVAL_MS) {
    sendHeartbeat();
    device.lastHeartbeat = millis();
  }

  // Check for serial input (code entry)
  checkSerialInput();

  // Check pairing button
  if (digitalRead(PIN_BUTTON_PAIR) == LOW) {
    delay(50); // Debounce
    if (digitalRead(PIN_BUTTON_PAIR) == LOW) {
      handlePairingButton();
      while (digitalRead(PIN_BUTTON_PAIR) == LOW) {
        delay(10);
      }
    }
  }

  // Check manual unlock button
  if (digitalRead(PIN_BUTTON_MANUAL) == LOW) {
    delay(50); // Debounce
    if (digitalRead(PIN_BUTTON_MANUAL) == LOW) {
      handleManualButton();
      while (digitalRead(PIN_BUTTON_MANUAL) == LOW) {
        delay(10);
      }
    }
  }

  // Blink status LED if online
  if (device.isOnline) {
    digitalWrite(PIN_STATUS_LED, (millis() / 1000) % 2);
  }

  delay(10);
}
