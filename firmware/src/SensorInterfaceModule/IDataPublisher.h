//
// Created by mkb2001 on 07/05/2025.
//

#ifndef I_DATA_PUBLISHER_H
#define I_DATA_PUBLISHER_H

#include "Config.h"

// Interface for data publishing services
class IDataPublisher {
public:
    virtual ~IDataPublisher() = default;

    virtual bool begin() = 0;
    virtual bool publishData(float temperature, float humidity,
                           int mq135, int mq2, int mq4, int mq9,
                           uint16_t pm25 = 0, uint16_t pm10 = 0,
                           bool pmDataValid = false) = 0;
};

#endif // I_DATA_PUBLISHER_H
