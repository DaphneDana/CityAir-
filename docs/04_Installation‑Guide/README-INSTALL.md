# FactoryAirWatch – Robust Installation Guide

This guide provides a comprehensive walkthrough for setting up both the IoT Edge Node (hardware) and the FactoryAirWatch Cloud Stack (dashboard + backend) in a robust, production-ready configuration.

---

## 1. IoT Edge Node Installation

### Required Files

Download the following files from the [official GitHub repository](https://github.com/Aurits/factory-air-watch):

* `factoryairwatch-node-v1.4.hex` – Precompiled firmware
* `sensor-offsets.json` – Sensor calibration offsets
* `edge-env.template` – GSM & API configuration file

### Prerequisites

* **Arduino IDE 2.3.2+** with AVR board support
* **Arduino Mega 2560**
* **SIM800 GSM module** with active SIM (APN = `webmtn` or `internet`)
* **DHT11**, **MQ-series sensors**, **PMS5003**
* **5V/2A power adapter** and ≥1200 mAh Li-ion battery

### Installation Steps

1. **Inspect and Prepare Hardware**

   * Confirm correct sensor placement and cable integrity.
   * Ensure battery voltage ≥3.9V and SIM card is inserted.
   * Check all sensor headers and GSM antenna.

2. **Upload Firmware via Arduino IDE**

   * Open Arduino IDE and load the `factoryairwatch-node-v1.4.ino` sketch.
   * Select the correct board (Arduino Mega 2560) and COM port.
   * Click **Upload** and observe the serial monitor at 9600 baud for logs.

3. **EEPROM and Environment Configuration**

   * Populate `edge-env.template` with your ThingSpeak API key and thresholds.
   * Use the serial interface or EEPROM utilities to set these values on device.

4. **ThingSpeak Setup**

   * Create a ThingSpeak channel with 8 fields.
   * Insert the write API key into the firmware.

5. **Power and Initial Test**

   * Plug in power. Node should connect to GSM and transmit within 60 seconds.
   * Verify live updates on ThingSpeak.

---

## 2. Cloud Dashboard & Backend Deployment

### Prerequisites

* GitHub account (for forking repo)
* Vercel account (for frontend/backend hosting)
* MySQL 8+ database instance (Railway, PlanetScale, Supabase, etc.)

### Deployment Steps

1. **Fork the Repository**

   ```bash
   git clone https://github.com/Aurits/factory-air-watch.git
   cd factory-air-watch
   ```

2. **Configure Environment Variables**
   In `.env.local` (or via Vercel dashboard):

   ```env
   DATABASE_URL="mysql://user:pass@host:port/db"
   JWT_SECRET="super-secure-secret"
   SMTP_HOST="smtp.example.com"
   SMTP_USER="your@email.com"
   SMTP_PASS="yourpassword"
   SMTP_PORT=587
   SMTP_SECURE=false
   ```

3. **Deploy with Vercel**

   * Push the forked repo to your GitHub.
   * Connect Vercel to the GitHub repo.
   * Set up build environment.
   * Vercel will auto-deploy frontend and backend.

4. **Run Database Migration**

   ```bash
   cd app/api
   npx prisma migrate deploy
   ```

5. **First Login**

   * Visit the Vercel deployment URL.
   * Default credentials:

     * Email: `admin@example.com`
     * Password: `password123` (change immediately after login)

---

## 3. Post-Deployment Verification Checklist

| Component | Checklist                                      |
| --------- | ---------------------------------------------- |
| Edge node | TX confirmed on ThingSpeak, LEDs functioning   |
| Dashboard | Live chart updates, PDF reports, thresholds OK |
| Alerts    | Simulate smoke to trigger LED + buzzer alerts  |
| Security  | HTTPS lock visible, no exposed endpoints       |

---

## 4. Troubleshooting Guide

| Symptom           | Cause                             | Fix                                 |
| ----------------- | --------------------------------- | ----------------------------------- |
| No dashboard data | No GSM, bad SIM, APN misconfig    | Verify SIM card, APN, antenna, logs |
| Login fails       | Credentials wrong or reset needed | Change from DB or Vercel console    |
| Sensor = 0 or NaN | Sensor error, poor soldering      | Reconnect, inspect PCB              |
| No PDF export     | Client popup blocked              | Enable popups or switch browser     |

---

## 5. Resources

* 📖 Project Blog: [iot-monitor-livid.vercel.app](https://iot-monitor-livid.vercel.app)
* 🧭 Live Dashboard: [factory-air-watch-m9bx.vercel.app](https://factory-air-watch-m9bx.vercel.app)
* 📦 Source Code: [github.com/Aurits/factory-air-watch](https://github.com/Aurits/factory-air-watch)

---

© 2025 FactoryAirWatch Consortium · All rights reserved
