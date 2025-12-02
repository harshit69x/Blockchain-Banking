/*
 * RFID Card Writer Utility
 * Write card tokens to MFRC522 RFID cards
 * 
 * This sketch allows you to write a card token (e.g., "CRD103492")
 * to an RFID card's block 4, which will then be read by the main
 * transaction system.
 * 
 * Usage:
 * 1. Upload this sketch to ESP8266
 * 2. Open Serial Monitor (115200 baud)
 * 3. Place card on reader
 * 4. Enter card token when prompted
 * 5. Card will be written and verified
 */

#include <SPI.h>
#include <MFRC522.h>

// RFID Pins
#define SS_PIN D8
#define RST_PIN D3

MFRC522 mfrc522(SS_PIN, RST_PIN);
MFRC522::MIFARE_Key key;

#define CARD_TOKEN_BLOCK 4

void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\n========================================");
  Serial.println("  RFID Card Writer Utility");
  Serial.println("========================================\n");

  SPI.begin();
  mfrc522.PCD_Init();
  
  // Set default key
  for (byte i = 0; i < 6; i++) {
    key.keyByte[i] = 0xFF;
  }
  
  Serial.println("✓ RFID Reader initialized");
  Serial.println("\nPlace card on reader and enter token...\n");
}

void loop() {
  // Check if data available in Serial
  if (Serial.available() > 0) {
    String cardToken = Serial.readStringUntil('\n');
    cardToken.trim();
    
    if (cardToken.length() > 0 && cardToken.length() <= 16) {
      Serial.print("Token to write: ");
      Serial.println(cardToken);
      Serial.println("Place card on reader now...");
      
      // Wait for card
      while (!mfrc522.PICC_IsNewCardPresent()) {
        delay(100);
      }
      
      if (mfrc522.PICC_ReadCardSerial()) {
        writeCardToken(cardToken);
        mfrc522.PICC_HaltA();
        mfrc522.PCD_StopCrypto1();
      }
    } else {
      Serial.println("❌ Invalid token length (max 16 characters)");
    }
  }
  
  delay(100);
}

void writeCardToken(String token) {
  Serial.println("\n--- Writing Card Token ---");
  
  // Get card UID
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  Serial.print("Card UID: ");
  Serial.println(uid);

  // Authenticate
  MFRC522::StatusCode status = mfrc522.PCD_Authenticate(
    MFRC522::PICC_CMD_MF_AUTH_KEY_A,
    CARD_TOKEN_BLOCK,
    &key,
    &(mfrc522.uid)
  );

  if (status != MFRC522::STATUS_OK) {
    Serial.print("❌ Authentication failed: ");
    Serial.println(mfrc522.GetStatusCodeName(status));
    return;
  }

  // Prepare data (16 bytes, pad with zeros)
  byte dataBlock[16];
  for (byte i = 0; i < 16; i++) {
    if (i < token.length()) {
      dataBlock[i] = token[i];
    } else {
      dataBlock[i] = 0;
    }
  }

  // Write block
  status = mfrc522.MIFARE_Write(CARD_TOKEN_BLOCK, dataBlock, 16);

  if (status != MFRC522::STATUS_OK) {
    Serial.print("❌ Write failed: ");
    Serial.println(mfrc522.GetStatusCodeName(status));
    return;
  }

  Serial.println("✓ Token written successfully");

  // Verify by reading back
  byte buffer[18];
  byte size = sizeof(buffer);
  
  status = mfrc522.MIFARE_Read(CARD_TOKEN_BLOCK, buffer, &size);
  
  if (status == MFRC522::STATUS_OK) {
    String readToken = "";
    for (byte i = 0; i < 16; i++) {
      if (buffer[i] == 0) break;
      readToken += (char)buffer[i];
    }
    
    Serial.print("✓ Verification: ");
    Serial.println(readToken);
    
    if (readToken == token) {
      Serial.println("✅ Write verified successfully!");
    } else {
      Serial.println("⚠️ Verification mismatch");
    }
  } else {
    Serial.println("⚠️ Could not verify write");
  }
  
  Serial.println("--- Write Complete ---\n");
  Serial.println("Enter another token or remove card...\n");
}
