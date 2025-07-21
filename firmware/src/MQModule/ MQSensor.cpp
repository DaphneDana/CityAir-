//
// Created by mkb2001 on 07/05/2025.
//
#include "MQSensor.h"

MQSensor::MQSensor(uint8_t pin, SensorType type, const String& name)
    : pin(pin), type(type), lastReading(0), name(name) {
}

bool MQSensor::begin() {
    // MQ sensors need analog input, nothing to initialize
    pinMode(pin, INPUT);
    return true;
}

bool MQSensor::read() {
    lastReading = analogRead(pin);
    return true;
}

bool MQSensor::isDataValid() const {
    return true; // Analog readings are always considered valid
}

SensorType MQSensor::getType() const {
    return type;
}

int MQSensor::getValue() const {
    return lastReading;
}

const String& MQSensor::getName() const {
    return name;
}