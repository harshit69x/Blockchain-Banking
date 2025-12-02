/*
 * ESP8266 AccessPoint Mode + RFID - UID Transaction System
 * Blockchain Banking IoT - AP Mode (NodeMCU creates WiFi network)
 * 
 * NETWORK SETUP:
 * 1. ESP8266 creates WiFi network "NodeMCU-Banking"
 * 2. Your PC connects to this network (password: banking123)
 * 3. ESP8266 gets IP: 192.168.4.1 (gateway)
 * 4. Your PC gets IP: 192.168.4.2 (or similar)
 * 5. Backend runs on PC, accessible at http://192.168.4.2:5000
 * 6. ESP8266 sends requests to PC's IP on this network
 * 
 * This bypasses mobile hotspot AP isolation completely!
 * 
 * Hardware:
 * - ESP8266 (NodeMCU)
 * - MFRC522 RFID Reader
 * - 2x LEDs (Green + Red) + 220Ω resistors
 * 
 * Pin Connections:
 * MFRC522:
 *   SDA  → D8, SCK  → D5, MOSI → D7
 *   MISO → D6, RST  → D3, 3.3V → 3.3V, GND → GND
 * LEDs:
 *   Green LED → D1 (GPIO5) → 220Ω → GND
 *   Red LED   → D2 (GPIO4) → 220Ω → GND
 */

#include <SPI.h>
#include <MFRC522.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClient.h>

// ==================== CONFIGURATION ====================
// AccessPoint Configuration
const char* AP_SSID = "NodeMCU-Banking";
const char* AP_PASSWORD = "banking123";

// IMPORTANT: After connecting PC to "NodeMCU-Banking" WiFi,
// check PC's IP using: ipconfig (look for "NodeMCU-Banking" adapter)
// Then update this IP to match your PC's IP on this network
const char* PC_IP = "192.168.4.100";  // Updated to actual PC IP!

const char* API_URL = "http://192.168.4.100:5000/api/iot/transaction";
const char* DEVICE_API_KEY = "blockchain-banking-iot-secure-key-2025";
const char* DEVICE_ID = "esp8266-ap-mode-01";

#define SS_PIN D8
#define RST_PIN D3
#define LED_GREEN D1
#define LED_RED D2

// Transaction settings
#define DEFAULT_TRANSACTION_TYPE "VERIFY"  // DEPOSIT, WITHDRAW, TRANSFER, VERIFY
#define DEFAULT_AMOUNT 1  // For DEPOSIT/WITHDRAW (in ETH)

// ==================== GLOBALS ====================
MFRC522 mfrc522(SS_PIN, RST_PIN);

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\n========================================");
  Serial.println("  Blockchain Banking IoT (AP Mode)");
  Serial.println("  NodeMCU Creates WiFi Network!");
  Serial.println("========================================\n");

  // Initialize RFID
  SPI.begin();
  mfrc522.PCD_Init();
  Serial.println("✓ RFID Reader initialized");

  // Initialize LEDs
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);
  blinkBoth();
  Serial.println("✓ LEDs initialized\n");

  // Start AccessPoint Mode
  startAccessPoint();
  
  Serial.println("\n========================================");
  Serial.println("SETUP INSTRUCTIONS:");
  Serial.println("1. On your PC, connect to WiFi:");
  Serial.print("   Network: ");
  Serial.println(AP_SSID);
  Serial.print("   Password: ");
  Serial.println(AP_PASSWORD);
  Serial.println("\n2. After connecting, run in PowerShell:");
  Serial.println("   ipconfig | Select-String 'NodeMCU'");
  Serial.println("   Look for 'IPv4 Address' under this adapter");
  Serial.println("\n3. If PC IP is NOT 192.168.4.2:");
  Serial.println("   Update PC_IP in Arduino code and re-upload");
  Serial.println("\n4. Make sure backend is running:");
  Serial.println("   cd backend ; node server.js");
  Serial.println("========================================\n");
  
  Serial.println("✓ System ready");
  Serial.println("📇 Tap any RFID card to read UID\n");
}

// ==================== MAIN LOOP ====================
void loop() {
  if (!mfrc522.PICC_IsNewCardPresent()) {
    delay(100);
    return;
  }

  if (!mfrc522.PICC_ReadCardSerial()) {
    delay(100);
    return;
  }

  Serial.println("==================================");
  Serial.println("📇 RFID Card Detected");
  
  // Read UID
  String cardUID = getCardUID();
  Serial.print("   UID: ");
  Serial.println(cardUID);

  // Process transaction using UID
  processTransaction(cardUID);

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  
  Serial.println("==================================\n");
  delay(2000);
}

// ==================== FUNCTIONS ====================
void startAccessPoint() {
  Serial.println("Starting AccessPoint Mode...");
  Serial.print("   Network: ");
  Serial.println(AP_SSID);
  Serial.print("   Password: ");
  Serial.println(AP_PASSWORD);
  
  // Configure AP with specific IP
  IPAddress local_IP(192, 168, 4, 1);
  IPAddress gateway(192, 168, 4, 1);
  IPAddress subnet(255, 255, 255, 0);
  
  WiFi.softAPConfig(local_IP, gateway, subnet);
  
  bool result = WiFi.softAP(AP_SSID, AP_PASSWORD);
  
  if (result) {
    Serial.println("✓ AccessPoint started");
    IPAddress IP = WiFi.softAPIP();
    Serial.print("   ESP8266 IP: ");
    Serial.println(IP);
    Serial.println("   Your PC will get IP: 192.168.4.2 (typically)");
    indicateSuccess();
  } else {
    Serial.println("❌ AccessPoint failed to start");
    indicateError();
  }
  
  delay(1000);
}

String getCardUID() {
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

void processTransaction(String cardUID) {
  // Check if any client is connected to our AP
  int clientCount = WiFi.softAPgetStationNum();
  if (clientCount == 0) {
    Serial.println("❌ No PC connected to NodeMCU WiFi");
    Serial.println("   Please connect your PC to: ");
    Serial.println("   Network: " + String(AP_SSID));
    indicateError();
    return;
  }
  
  Serial.print("✓ ");
  Serial.print(clientCount);
  Serial.println(" client(s) connected to AP");

  Serial.println("📤 Sending to backend...");
  Serial.print("   Backend URL: ");
  Serial.println(API_URL);

  WiFiClient client;
  HTTPClient http;

  // Set timeout
  http.setTimeout(10000); // 10 seconds

  if (!http.begin(client, API_URL)) {
    Serial.println("❌ HTTP begin failed - check URL");
    indicateError();
    return;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-api-key", DEVICE_API_KEY);

  StaticJsonDocument<512> requestDoc;
  requestDoc["cardUID"] = cardUID;
  requestDoc["deviceId"] = DEVICE_ID;
  requestDoc["transactionType"] = DEFAULT_TRANSACTION_TYPE;
  
  if (String(DEFAULT_TRANSACTION_TYPE) == "DEPOSIT" || 
      String(DEFAULT_TRANSACTION_TYPE) == "WITHDRAW") {
    requestDoc["amount"] = DEFAULT_AMOUNT;
  }

  String jsonBody;
  serializeJson(requestDoc, jsonBody);

  Serial.print("   Request: ");
  Serial.println(jsonBody);

  int httpCode = http.POST(jsonBody);
  Serial.print("   HTTP Code: ");
  Serial.println(httpCode);

  if (httpCode == -1) {
    Serial.println("❌ Connection failed - Check:");
    Serial.println("   1. Backend running: node server.js");
    Serial.println("   2. PC connected to NodeMCU-Banking WiFi");
    Serial.print("   3. PC IP is: ");
    Serial.println(PC_IP);
    Serial.println("   4. Test with curl from PC:");
    Serial.println("      curl http://localhost:5000/api/health");
    indicateError();
    http.end();
    return;
  }

  if (httpCode > 0) {
    String response = http.getString();
    Serial.print("   Response: ");
    Serial.println(response);

    StaticJsonDocument<1024> responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);

    if (!error) {
      const char* status = responseDoc["status"];
      
      if (String(status) == "success") {
        Serial.println("✅ Transaction successful!");
        
        if (responseDoc.containsKey("txHash")) {
          Serial.print("   Tx Hash: ");
          Serial.println(responseDoc["txHash"].as<String>());
        }
        
        if (responseDoc.containsKey("balance")) {
          Serial.print("   Balance: ");
          Serial.print(responseDoc["balance"].as<String>());
          Serial.println(" ETH");
        }
        
        indicateSuccess();
      } else {
        Serial.println("❌ Transaction failed");
        if (responseDoc.containsKey("message")) {
          Serial.print("   Reason: ");
          Serial.println(responseDoc["message"].as<String>());
        }
        indicateError();
      }
    } else {
      Serial.println("❌ JSON parse error");
      indicateError();
    }
  } else {
    Serial.print("❌ HTTP error: ");
    Serial.println(http.errorToString(httpCode));
    indicateError();
  }

  http.end();
}

void indicateSuccess() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_GREEN, HIGH);
    delay(200);
    digitalWrite(LED_GREEN, LOW);
    delay(200);
  }
}

void indicateError() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_RED, HIGH);
    delay(200);
    digitalWrite(LED_RED, LOW);
    delay(200);
  }
}

void blinkBoth() {
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_RED, HIGH);
  delay(300);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);
}
