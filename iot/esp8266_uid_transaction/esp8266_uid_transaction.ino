/*
 * ESP8266 + MFRC522 RFID - UID Transaction System
 * Blockchain Banking IoT (No Card Writing Required!)
 * 
 * This version uses the card's built-in UID (read-only)
 * No need to write anything to the card!
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
const char* WIFI_SSID = "Slayerr";
const char* WIFI_PASSWORD = "okay@090";
const char* API_URL = "http://10.28.222.113:5000/api/iot/transaction";  // Updated to PC's actual WiFi IP
const char* DEVICE_API_KEY = "blockchain-banking-iot-secure-key-2025";
const char* DEVICE_ID = "esp8266-device-01";

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
  Serial.println("  Blockchain Banking IoT (UID Mode)");
  Serial.println("  No Card Writing Required!");
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

  // Connect WiFi
  connectWiFi();
  
  Serial.println("\n✓ System ready");
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
  
  // Read UID (this is the only data we need!)
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
    Serial.print("  IP: ");
    Serial.println(WiFi.localIP());
    indicateSuccess();
  } else {
    Serial.println("\n❌ WiFi failed");
    indicateError();
  }
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
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected");
    indicateError();
    return;
  }

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
    Serial.println("   1. Backend running on port 5000");
    Serial.println("   2. Windows Firewall allows port 5000");
    Serial.print("   3. PC IP is still: ");
    Serial.println("192.168.137.1");
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
