//
// Created by mkb2001 on 07/05/2025.
//

#ifndef DHT_SENSOR_H
#define DHT_SENSOR_H

#include <DHT.h>
#include "ISensor.h"

// DHT temperature and humidity sensor implementation
class DHTSensor : public ISensor {
private:
    DHT dht;
    uint8_t pin;
    uint8_t type;
    unsigned long lastReadTime;
    float lastTemperature;
    float lastHumidity;
    bool dataValid;

public:
    DHTSensor(uint8_t pin, uint8_t dhtType);

    bool begin() override;
    bool read() override;
    bool isDataValid() const override;
    SensorType getType() const override;

    // Specific getters for this sensor
    float getTemperature() const;
    float getHumidity() const;
};

#endif // DHT_SENSOR_H
