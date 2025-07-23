//
// Created by mkb2001 on 07/05/2025.
//

#ifndef MQ_SENSOR_H
#define MQ_SENSOR_H

#include "ISensor.h"

class MQSensor : public ISensor {
private:
    uint8_t pin;
    SensorType type;
    int lastReading;
    String name;

public:
    MQSensor(uint8_t pin, SensorType type, const String& name);

    bool begin() override;
    bool read() override;
    bool isDataValid() const override;
    SensorType getType() const override;

    // Specific getter for this sensor
    int getValue() const;
    const String& getName() const;
};

#endif // MQ_SENSOR_H
