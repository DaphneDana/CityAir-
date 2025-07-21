#ifndef ALERT_SYSTEM_H
#define ALERT_SYSTEM_H

#include <Arduino.h>
#include "Config.h"
#include "IAlertNotifier.h"

// Alert status tracking structure
struct AlertStatus {
    bool tempHigh;
    bool tempLow;
    bool humidityHigh;
    bool humidityLow;
    bool pm25High;
    bool pm10High;
    bool mq135High;
    bool mq2High;
    bool mq4High;
    bool mq9High;

    unsigned long tempHighTime;
    unsigned long tempLowTime;
    unsigned long humidityHighTime;
    unsigned long humidityLowTime;
    unsigned long pm25HighTime;
    unsigned long pm10HighTime;
    unsigned long mq135HighTime;
    unsigned long mq2HighTime;
    unsigned long mq4HighTime;
    unsigned long mq9HighTime;

    AlertStatus() {
        tempHigh = tempLow = humidityHigh = humidityLow = false;
        pm25High = pm10High = mq135High = mq2High = mq4High = mq9High = false;
        tempHighTime = tempLowTime = humidityHighTime = humidityLowTime = 0;
        pm25HighTime = pm10HighTime = mq135HighTime = mq2HighTime = mq4HighTime = mq9HighTime = 0;
    }
};

class AlertSystem {
private:
    uint8_t greenLedPin;
    uint8_t yellowLedPin;
    uint8_t redLedPin;
    uint8_t buzzerPin;

    AlertStatus alertStatus;
    AlertLevel currentAlertLevel;

    bool buzzerActive;
    unsigned long buzzerStartTime;
    bool ledBlinkState;
    unsigned long lastLedBlinkTime;

    IAlertNotifier* alertNotifier;

public:
    AlertSystem(uint8_t greenLed, uint8_t yellowLed, uint8_t redLed,
              uint8_t buzzer, IAlertNotifier* notifier);

    bool begin();
    void update();
    void checkAlerts(float temperature, float humidity,
                   int mqSensor135, int mqSensor2, int mqSensor4, int mqSensor9,
                   uint16_t pm25 = 0, uint16_t pm10 = 0,
                   bool pmDataValid = false);

    AlertLevel getCurrentAlertLevel() const;

private:
    void updateIndicators();
};

#endif // ALERT_SYSTEM_H