/*
 * RFID UID Reader Utility
 * Read MFRC522 card UIDs for registration
 * 
 * This sketch simply reads and displays the UID
 * of any RFID card placed on the reader.
 * 
 * Use this to get the UID for registration in
 * the bank dashboard.
 */

#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN D8
#define RST_PIN D3

MFRC522 mfrc522(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\n========================================");
  Serial.println("  RFID UID Reader");
  Serial.println("========================================\n");

  SPI.begin();
  mfrc522.PCD_Init();
  
  Serial.println("✓ RFID Reader initialized");
  Serial.println("\n📇 Place card on reader to get UID...\n");
}

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
  Serial.println("📇 RFID Card Detected!");
  
  // Get UID
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  
  Serial.print("\n✅ Card UID: ");
  Serial.println(uid);
  Serial.println("\n📋 Copy this UID and paste it in the");
  Serial.println("   Bank Dashboard → RFID Cards tab");
  Serial.println("\n==================================\n");

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  
  delay(2000);
}
