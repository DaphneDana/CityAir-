//
// Created by HP on 07/05/2025.
//

#include "PMSSensor.h"

PMSSensor::PMSSensor(Stream* serial, uint8_t resetPin)
    : serial(serial), resetPin(resetPin), dataValid(false), failCount(0) {
    memset(&data, 0, sizeof(data));
}

bool PMSSensor::begin() {
    // Set up the reset pin
    pinMode(resetPin, OUTPUT);
    digitalWrite(resetPin, HIGH);  // Keep sensor active

    // Reset sensor to start fresh
    reset();

    // Per datasheet, wait 30 seconds for stable data after power up
    Serial.println(F("Waiting 30 seconds for PMS5003 to stabilize..."));
    unsigned long startWait = millis();
    while (millis() - startWait < 30000) {
        // Print a dot every second to show progress
        if ((millis() - startWait) % 1000 == 0) {
            Serial.print(".");
        }
        // Process any data that might arrive during wait
        clearBuffer();
        delay(50);
    }
    Serial.println(F("\nPMS5003 warm-up complete"));

    return true;
}

void PMSSensor::clearBuffer() {
    while (serial->available()) {
        serial->read();
    }
}

bool PMSSensor::read() {
    // Clear buffer first
    clearBuffer();

    // Small delay to allow new data to arrive
    delay(100);

    // Wait for data to become available
    unsigned long timeout = millis() + Timing::PMS_READ_TIMEOUT;
    while (!serial->available() && millis() < timeout) {
        delay(10);
    }

    if (!serial->available()) {
        dataValid = false;
        return false;
    }

    // Look for the start bytes (0x42, 0x4D as defined in datasheet)
    boolean foundStart = false;
    unsigned long startTimeout = millis() + 1000;

    while (!foundStart && millis() < startTimeout) {
        if (serial->peek() != 0x42) {
            serial->read(); // Skip non-start byte
            if (!serial->available()) {
                dataValid = false;
                return false;
            }
        } else {
            // We found first start byte (0x42), check for second (0x4D)
            byte startByte1 = serial->read();

            if (serial->available() && serial->peek() == 0x4D) {
                // We have a valid header!
                byte startByte2 = serial->read();
                foundStart = true;

                // Wait until we have at least 30 more bytes (32 total - 2 we already read)
                startTimeout = millis() + 1000;
                while (serial->available() < 30 && millis() < startTimeout) {
                    delay(10);
                }

                if (serial->available() < 30) {
                    Serial.print(F("Incomplete frame. Only "));
                    Serial.print(serial->available());
                    Serial.println(F(" bytes available"));
                    dataValid = false;
                    return false;
                }

                // Now read the complete data frame
                uint8_t buffer[32];

                // Put the two header bytes we already read
                buffer[0] = startByte1; // 0x42
                buffer[1] = startByte2; // 0x4D

                // Read the remaining 30 bytes
                for (int i = 2; i < 32; i++) {
                    buffer[i] = serial->read();
                }

                // Frame length check (bytes 2-3, should be 0x001C = 28)
                uint16_t frameLen = buffer[2] << 8 | buffer[3];
                if (frameLen != 0x001C) {
                    Serial.print(F("Invalid frame length: 0x"));
                    Serial.println(frameLen, HEX);
                    dataValid = false;
                    return false;
                }

                // Calculate checksum (bytes 0 to 29)
                uint16_t sum = 0;
                for (int i = 0; i < 30; i++) {
                    sum += buffer[i];
                }

                // Extract checksum from data (bytes 30-31)
                uint16_t checksum = buffer[30] << 8 | buffer[31];

                if (sum != checksum) {
                    Serial.println(F("Checksum failure - corrupted data"));
                    dataValid = false;
                    return false;
                }

                // Data is valid, parse values according to datasheet
                data.pm10_standard = buffer[4] << 8 | buffer[5];   // PM1.0 (CF=1)
                data.pm25_standard = buffer[6] << 8 | buffer[7];   // PM2.5 (CF=1)
                data.pm100_standard = buffer[8] << 8 | buffer[9];  // PM10 (CF=1)

                data.pm10_env = buffer[10] << 8 | buffer[11];      // PM1.0 (atmospheric)
                data.pm25_env = buffer[12] << 8 | buffer[13];      // PM2.5 (atmospheric)
                data.pm100_env = buffer[14] << 8 | buffer[15];     // PM10 (atmospheric)

                data.particles_03um = buffer[16] << 8 | buffer[17]; // >0.3um count
                data.particles_05um = buffer[18] << 8 | buffer[19]; // >0.5um count
                data.particles_10um = buffer[20] << 8 | buffer[21]; // >1.0um count
                data.particles_25um = buffer[22] << 8 | buffer[23]; // >2.5um count
                data.particles_50um = buffer[24] << 8 | buffer[25]; // >5.0um count
                data.particles_100um = buffer[26] << 8 | buffer[27]; // >10um count

                // Sanity check for unreasonable values - typically PM2.5 shouldn't exceed 1000
                if (data.pm25_standard > 1000 || data.pm10_standard > 2000) {
                    Serial.println(F("Data values out of expected range"));
                    dataValid = false;
                    return false;
                }

                // Success!
                dataValid = true;
                failCount = 0;
                return true;
            } else {
                // Not a valid second byte, continue searching
                if (serial->available() > 0) {
                    serial->read(); // consume the byte we peeked at
                } else {
                    dataValid = false;
                    return false; // no more data
                }
            }
        }
    }

    // If we got here, we couldn't find the start sequence
    dataValid = false;
    failCount++;

    if (failCount > 1) {
        reset();
        failCount = 0;
    }

    return false;
}

bool PMSSensor::reset() {
    Serial.println(F("Resetting PMS sensor..."));

    // Use RESET pin to hardware reset the sensor
    digitalWrite(resetPin, LOW);   // Reset the sensor
    delay(300);                    // Hold in reset for 300ms
    digitalWrite(resetPin, HIGH);  // Release from reset

    // Clear any data in the buffer
    clearBuffer();

    Serial.println(F("PMS sensor reset. Allow 30 seconds for stabilization."));
    return true;
}

bool PMSSensor::isDataValid() const {
    return dataValid;
}

SensorType PMSSensor::getType() const {
    return SensorType::AIR_QUALITY;
}

uint16_t PMSSensor::getPM25() const {
    return data.pm25_standard;
}

uint16_t PMSSensor::getPM10() const {
    return data.pm100_standard;
}

void PMSSensor::displayData() const {
    if (!dataValid) {
        Serial.println(F("No valid PMS data to display"));
        return;
    }

    // Display PM sensor data
    Serial.println(F("---------------------------------------"));
    Serial.println(F("Concentration Units (standard)"));
    Serial.print(F("PM 1.0: ")); Serial.print(data.pm10_standard);
    Serial.print(F("\t\tPM 2.5: ")); Serial.print(data.pm25_standard);
    Serial.print(F("\t\tPM 10: ")); Serial.println(data.pm100_standard);
    Serial.println(F("Concentration Units (environmental)"));
    Serial.print(F("PM 1.0: ")); Serial.print(data.pm10_env);
    Serial.print(F("\t\tPM 2.5: ")); Serial.print(data.pm25_env);
    Serial.print(F("\t\tPM 10: ")); Serial.println(data.pm100_env);
    Serial.println(F("Particles in 0.1L of air:"));
    Serial.print(F("> 0.3um: ")); Serial.println(data.particles_03um);
    Serial.print(F("> 0.5um: ")); Serial.println(data.particles_05um);
    Serial.print(F("> 1.0um: ")); Serial.println(data.particles_10um);
    Serial.print(F("> 2.5um: ")); Serial.println(data.particles_25um);
    Serial.print(F("> 5.0um: ")); Serial.println(data.particles_50um);
    Serial.print(F("> 10um: ")); Serial.println(data.particles_100um);
    Serial.println(F("---------------------------------------"));
}