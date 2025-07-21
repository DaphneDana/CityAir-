//
// Created by mkb2001 on 07/05/2025.
//

#include "DHTSensor.h"

DHTSensor::DHTSensor(uint8_t pin, uint8_t dhtType)
    : dht(pin, dhtType), pin(pin), type(dhtType),
      lastReadTime(0), lastTemperature(25.0), lastHumidity(50.0),
      dataValid(false) {
}

bool DHTSensor::begin() {
    dht.begin();
    // Test if sensor is responding
    delay(1000); // Give DHT time to stabilize

    float t = dht.readTemperature();
    float h = dht.readHumidity();

    if (isnan(t) || isnan(h)) {
        Serial.println(F("WARNING: DHT sensor not responding!"));
        return false;
    }

    lastTemperature = t;
    lastHumidity = h;
    dataValid = true;
    lastReadTime = millis();

    Serial.print(F("DHT sensor working. Initial reading: "));
    Serial.print(t); Serial.print(F("°C, "));
    Serial.print(h); Serial.println(F("%"));

    return true;
}

bool DHTSensor::read() {
    unsigned long currentMillis = millis();

    // Only read sensor if minimum interval has elapsed
    if (currentMillis - lastReadTime >= Timing::DHT_MIN_INTERVAL) {
        lastReadTime = currentMillis;

        float temperature = dht.readTemperature();
        float humidity = dht.readHumidity();

        if (!isnan(temperature) && !isnan(humidity)) {
            lastTemperature = temperature;
            lastHumidity = humidity;
            dataValid = true;

            Serial.print(F("Temp: ")); Serial.print(temperature);
            Serial.print(F("°C | Humidity: ")); Serial.print(humidity);
            Serial.println(F("%"));

            return true;
        } else {
            Serial.println(F("Failed to read from DHT sensor."));
            Serial.print(F("Using last valid readings - Temp: "));
            Serial.print(lastTemperature);
            Serial.print(F("°C, Humidity: "));
            Serial.print(lastHumidity);
            Serial.println(F("%"));

            return false;
        }
    } else {
        Serial.print(F("Skipped DHT reading (need 2s between reads). "));
        Serial.print(F("Using last values - Temp: "));
        Serial.print(lastTemperature);
        Serial.print(F("°C, Humidity: "));
        Serial.print(lastHumidity);
        Serial.println(F("%"));

        return false;
    }
}

bool DHTSensor::isDataValid() const {
    return dataValid;
}

SensorType DHTSensor::getType() const {
    return SensorType::TEMPERATURE; // Simplification - this sensor handles both temp & humidity
}

float DHTSensor::getTemperature() const {
    return lastTemperature;
}

float DHTSensor::getHumidity() const {
    return lastHumidity;
}
