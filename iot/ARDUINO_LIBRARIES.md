# Required Arduino Libraries for ESP8266 IoT System

Install these libraries in Arduino IDE via **Tools → Manage Libraries**

## Core Libraries

### 1. MFRC522 (RFID Reader)
- **Name:** MFRC522
- **Author:** GithubCommunity
- **Version:** 1.4.10 or later
- **Purpose:** Interface with MFRC522 RFID reader module
- **Search:** Type "MFRC522" in Library Manager

### 2. ArduinoJson
- **Name:** ArduinoJson
- **Author:** Benoit Blanchon
- **Version:** 6.x (NOT 7.x - breaking changes)
- **Purpose:** JSON parsing and serialization
- **Search:** Type "ArduinoJson" in Library Manager
- **Note:** Make sure to install version 6, not the latest 7

### 3. ESP8266WiFi
- **Included:** Built-in with ESP8266 board package
- **No manual installation needed**

### 4. ESP8266HTTPClient
- **Included:** Built-in with ESP8266 board package
- **No manual installation needed**

### 5. SPI
- **Included:** Built-in Arduino library
- **No manual installation needed**

---

## ESP8266 Board Package

### Installation Steps:

1. Open Arduino IDE
2. Go to **File → Preferences**
3. In "Additional Boards Manager URLs", add:
   ```
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
4. Click OK
5. Go to **Tools → Board → Boards Manager**
6. Search for "ESP8266"
7. Install **esp8266 by ESP8266 Community** (version 3.x)

---

## Verification

After installation, you should see these in **Sketch → Include Library**:

- ✅ MFRC522
- ✅ ArduinoJson
- ✅ ESP8266WiFi
- ✅ ESP8266HTTPClient
- ✅ SPI

---

## Library Versions (Tested)

```
MFRC522:          1.4.11
ArduinoJson:      6.21.3
ESP8266 Core:     3.1.2
```

---

## Troubleshooting

### "Library not found"
- Restart Arduino IDE after installation
- Check internet connection
- Try manual library installation (download ZIP from GitHub)

### "Compilation error"
- Ensure ArduinoJson is version 6.x, not 7.x
- Update ESP8266 board package to latest
- Check board selection (NodeMCU 1.0 or Wemos D1 Mini)

### "Upload failed"
- Select correct COM port in **Tools → Port**
- Install CH340 or CP2102 drivers (for NodeMCU clones)
- Press RESET button on ESP8266 before upload
