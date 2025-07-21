//
// Created by mkb2001 on 07/05/2025.
//

#ifndef PMS_SENSOR_H
#define PMS_SENSOR_H

#include <Stream.h>
#include "ISensor.h"

class PMSSensor : public ISensor {
private:
    // Structure for PMS5003 data
    struct PMSData {
        uint16_t framelen;
        uint16_t pm10_standard, pm25_standard, pm100_standard;
        uint16_t pm10_env, pm25_env, pm100_env;
        uint16_t particles_03um, particles_05um, particles_10um;
        uint16_t particles_25um, particles_50um, particles_100um;
        uint16_t unused;
        uint16_t checksum;
    };

    Stream* serial;
    uint8_t resetPin;
    PMSData data;
    bool dataValid;
    int failCount;

public:
    PMSSensor(Stream* serial, uint8_t resetPin);

    bool begin() override;
    bool read() override;
    bool isDataValid() const override;
    SensorType getType() const override;
    bool reset() override;

    // Specific getters for this sensor
    uint16_t getPM25() const;
    uint16_t getPM10() const;

    // Display data for debugging
    void displayData() const;

private:
    void clearBuffer();
};

#endif // PMS_SENSOR_H
