/*
 * ESP8266 + MFRC522 RFID Card Reader
 * Blockchain Banking IoT Transaction System
 * 
 * Hardware Requirements:
 * - ESP8266 (NodeMCU, Wemos D1 Mini, etc.)
 * - MFRC522 RFID Reader
 * - 2x LEDs (Green + Red)
 * - 2x 220Ω Resistors
 * 
 * Pin Connections:
 * MFRC522:
 *   - SDA  → D8 (GPIO15)
 *   - SCK  → D5 (GPIO14)
 *   - MOSI → D7 (GPIO13)
 *   - MISO → D6 (GPIO12)
 *   - IRQ  → (not connected)
 *   - GND  → GND
 *   - RST  → D3 (GPIO0)
 *   - 3.3V → 3.3V
 * 
 * LEDs:
 *   - Green LED (+) → D1 (GPIO5) → 220Ω → GND
 *   - Red LED (+)   → D2 (GPIO4) → 220Ω → GND
 */

#include <SPI.h>
#include <MFRC522.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClient.h>

// ==================== CONFIGURATION ====================
// WiFi Credentials
const char* WIFI_SSID = "Slayerr";
const char* WIFI_PASSWORD = "okay@090";

// Backend API Configuration
const char* API_URL = "http://192.168.137.1:5000/api/iot/transaction";
const char* DEVICE_API_KEY = "blockchain-banking-iot-secure-key-2025";
const char* DEVICE_ID = "esp8266-device-01";

// RFID Reader Pins
#define SS_PIN D8    // SDA
#define RST_PIN D3   // RST

// LED Pins
#define LED_GREEN D1
#define LED_RED D2

// Transaction Settings
#define DEFAULT_TRANSACTION_TYPE "VERIFY"  // DEPOSIT, WITHDRAW, TRANSFER, VERIFY
#define DEFAULT_AMOUNT 100  // For DEPOSIT/WITHDRAW transactions

// RFID Block to read card token from
#define CARD_TOKEN_BLOCK 4

// ==================== GLOBALS ====================
MFRC522 mfrc522(SS_PIN, RST_PIN);
MFRC522::MIFARE_Key key;

// Transaction types
enum TransactionType {
  DEPOSIT,
  WITHDRAW,
  VERIFY,
  TRANSFER
};

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\n");
  Serial.println("========================================");
  Serial.println("  Blockchain Banking IoT System");
  Serial.println("  ESP8266 + RFID Transaction Module");
  Serial.println("========================================\n");

  // Initialize RFID
  SPI.begin();
  mfrc522.PCD_Init();
  
  // Set default RFID key (factory default)
  for (byte i = 0; i < 6; i++) {
    key.keyByte[i] = 0xFF;
  }
  
  Serial.println("✓ RFID Reader initialized");
  Serial.print("  Reader version: ");
  mfrc522.PCD_DumpVersionToSerial();

  // Initialize LEDs
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);
  
  // Test LEDs
  blinkBoth();
  Serial.println("✓ LEDs initialized\n");

  // Connect to WiFi
  connectWiFi();

  Serial.println("\n✓ System ready");
  Serial.println("Waiting for RFID card...\n");
}

// ==================== MAIN LOOP ====================
void loop() {
  // Check for new RFID card
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
  
  // Read card UID
  String cardUID = getCardUID();
  Serial.print("   UID: ");
  Serial.println(cardUID);

  // Read card token from block
  String cardToken = readCardToken();
  
  if (cardToken.length() == 0) {
    Serial.println("❌ Failed to read card token");
    indicateError();
    haltCard();
    return;
  }

  Serial.print("   Token: ");
  Serial.println(cardToken);

  // Process transaction
  processTransaction(cardToken);

  // Halt card and prepare for next read
  haltCard();
  
  Serial.println("==================================\n");
  delay(2000);  // Prevent rapid re-reads
}

// ==================== WIFI FUNCTIONS ====================
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected");
    Serial.print("  IP address: ");
    Serial.println(WiFi.localIP());
    indicateSuccess();
  } else {
    Serial.println("\n❌ WiFi connection failed");
    indicateError();
  }
}

// ==================== RFID FUNCTIONS ====================
String getCardUID() {
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

String readCardToken() {
  byte buffer[18];
  byte size = sizeof(buffer);

  // Authenticate with key A
  MFRC522::StatusCode status = mfrc522.PCD_Authenticate(
    MFRC522::PICC_CMD_MF_AUTH_KEY_A,
    CARD_TOKEN_BLOCK,
    &key,
    &(mfrc522.uid)
  );

  if (status != MFRC522::STATUS_OK) {
    Serial.print("❌ Authentication failed: ");
    Serial.println(mfrc522.GetStatusCodeName(status));
    return "";
  }

  // Read the block
  status = mfrc522.MIFARE_Read(CARD_TOKEN_BLOCK, buffer, &size);

  if (status != MFRC522::STATUS_OK) {
    Serial.print("❌ Read failed: ");
    Serial.println(mfrc522.GetStatusCodeName(status));
    return "";
  }

  // Convert buffer to string (max 16 bytes)
  String token = "";
  for (byte i = 0; i < 16; i++) {
    if (buffer[i] == 0) break;  // Stop at null terminator
    if (buffer[i] >= 32 && buffer[i] <= 126) {  // Printable ASCII only
      token += (char)buffer[i];
    }
  }

  return token;
}

void haltCard() {
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}

// ==================== BLOCKCHAIN TRANSACTION ====================
void processTransaction(String cardToken) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected");
    indicateError();
    return;
  }

  Serial.println("📤 Sending transaction to backend...");

  WiFiClient client;
  HTTPClient http;

  http.begin(client, API_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-api-key", DEVICE_API_KEY);

  // Build JSON request
  StaticJsonDocument<512> requestDoc;
  requestDoc["cardToken"] = cardToken;
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

  // Send POST request
  int httpCode = http.POST(jsonBody);

  Serial.print("   HTTP Code: ");
  Serial.println(httpCode);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.print("   Response: ");
    Serial.println(response);

    // Parse JSON response
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
    Serial.print("❌ HTTP request failed: ");
    Serial.println(http.errorToString(httpCode));
    indicateError();
  }

  http.end();
}

// ==================== LED FEEDBACK ====================
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

// ==================== HELPER FUNCTIONS ====================
void printSeparator() {
  Serial.println("========================================");
}
