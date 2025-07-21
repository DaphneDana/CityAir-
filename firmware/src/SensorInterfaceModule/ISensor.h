//
// Created by mkb2001 on 07/05/2025.
//

#ifndef I_SENSOR_H
#define I_SENSOR_H

#include "Config.h"

// Interface for all sensors (Interface Segregation Principle)
class ISensor {
public:
    virtual ~ISensor() = default;

    // Core sensor methods
    virtual bool begin() = 0;
    virtual bool read() = 0;
    virtual bool isDataValid() const = 0;
    virtual SensorType getType() const = 0;

    // Optional reset method
    virtual bool reset() { return true; }
};

#endif // I_SENSOR_H
