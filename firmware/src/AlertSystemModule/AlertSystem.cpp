#include "AlertSystem.h"

AlertSystem::AlertSystem(uint8_t greenLed, uint8_t yellowLed, uint8_t redLed,
                       uint8_t buzzer, IAlertNotifier* notifier)
    : greenLedPin(greenLed), yellowLedPin(yellowLed), redLedPin(redLed),
      buzzerPin(buzzer), currentAlertLevel(AlertLevel::NORMAL),
      buzzerActive(false), buzzerStartTime(0),
      ledBlinkState(false), lastLedBlinkTime(0),
      alertNotifier(notifier) {
}

bool AlertSystem::begin() {
    // Initialize pins
    pinMode(greenLedPin, OUTPUT);
    pinMode(yellowLedPin, OUTPUT);
    pinMode(redLedPin, OUTPUT);
    pinMode(buzzerPin, OUTPUT);

    // Set initial state
    digitalWrite(greenLedPin, HIGH);
    digitalWrite(yellowLedPin, LOW);
    digitalWrite(redLedPin, LOW);
    digitalWrite(buzzerPin, LOW);

    // Sound buzzer briefly to confirm system start
    digitalWrite(buzzerPin, HIGH);
    delay(300);
    digitalWrite(buzzerPin, LOW);

    return true;
}

void AlertSystem::update() {
    updateIndicators();
}

void AlertSystem::updateIndicators() {
    unsigned long currentMillis = millis();

    // Handle LED blinking and status
    if (currentMillis - lastLedBlinkTime >= Timing::LED_BLINK_INTERVAL) {
        lastLedBlinkTime = currentMillis;
        ledBlinkState = !ledBlinkState;

        // Update LEDs based on current alert level and blink state
        switch (currentAlertLevel) {
            case AlertLevel::NORMAL:
                // Normal: Green LED on, others off, no blinking
                digitalWrite(greenLedPin, HIGH);
                digitalWrite(yellowLedPin, LOW);
                digitalWrite(redLedPin, LOW);
                break;

            case AlertLevel::WARNING:
                // Warning: Yellow LED blinking, green off, red off
                digitalWrite(greenLedPin, LOW);
                digitalWrite(yellowLedPin, ledBlinkState);
                digitalWrite(redLedPin, LOW);
                break;

            case AlertLevel::CRITICAL:
                // Critical: Red LED blinking, others off
                digitalWrite(greenLedPin, LOW);
                digitalWrite(yellowLedPin, LOW);
                digitalWrite(redLedPin, ledBlinkState);
                break;
        }
    }

    // Handle buzzer
    if (buzzerActive) {
        // Turn off buzzer after BUZZER_DURATION milliseconds
        if (currentMillis - buzzerStartTime >= Timing::BUZZER_DURATION) {
            digitalWrite(buzzerPin, LOW);
            buzzerActive = false;
        } else {
            digitalWrite(buzzerPin, HIGH);
        }
    }
}

void AlertSystem::checkAlerts(float temperature, float humidity,
                           int mqSensor135, int mqSensor2, int mqSensor4, int mqSensor9,
                           uint16_t pm25, uint16_t pm10,
                           bool pmDataValid) {
    unsigned long currentMillis = millis();
    bool anyAlert = false;
    String alertMessage = "ALERT: ";
    AlertLevel newAlertLevel = AlertLevel::NORMAL;

    // Check temperature high (Critical alert)
    if (temperature > Thresholds::TEMP_HIGH_THRESHOLD &&
        (!alertStatus.tempHigh || currentMillis - alertStatus.tempHighTime > Timing::ALERT_COOLDOWN)) {
        alertStatus.tempHigh = true;
        alertStatus.tempHighTime = currentMillis;
        alertMessage += "High temperature: " + String(temperature, 1) + "C. ";
        anyAlert = true;
        newAlertLevel = max(static_cast<int>(newAlertLevel), static_cast<int>(AlertLevel::CRITICAL));
    }
    else if (temperature <= Thresholds::TEMP_HIGH_THRESHOLD && alertStatus.tempHigh) {
        alertStatus.tempHigh = false;  // Reset alert state when condition clears
    }

    // Check temperature low (Critical alert)
    if (temperature < Thresholds::TEMP_LOW_THRESHOLD &&
        (!alertStatus.tempLow || currentMillis - alertStatus.tempLowTime > Timing::ALERT_COOLDOWN)) {
        alertStatus.tempLow = true;
        alertStatus.tempLowTime = currentMillis;
        alertMessage += "Low temperature: " + String(temperature, 1) + "C. ";
        anyAlert = true;
        newAlertLevel = max(static_cast<int>(newAlertLevel), static_cast<int>(AlertLevel::CRITICAL));
    }
    else if (temperature >= Thresholds::TEMP_LOW_THRESHOLD && alertStatus.tempLow) {
        alertStatus.tempLow = false;
    }

    // Check humidity high (Warning alert)
    if (humidity > Thresholds::HUMIDITY_HIGH_THRESHOLD &&
        (!alertStatus.humidityHigh || currentMillis - alertStatus.humidityHighTime > Timing::ALERT_COOLDOWN)) {
        alertStatus.humidityHigh = true;
        alertStatus.humidityHighTime = currentMillis;
        alertMessage += "High humidity: " + String(humidity, 1) + "%. ";
        anyAlert = true;
        newAlertLevel = max(static_cast<int>(newAlertLevel), static_cast<int>(AlertLevel::WARNING));
    }
    else if (humidity <= Thresholds::HUMIDITY_HIGH_THRESHOLD && alertStatus.humidityHigh) {
        alertStatus.humidityHigh = false;
    }

    // Check humidity low (Warning alert)
    if (humidity < Thresholds::HUMIDITY_LOW_THRESHOLD &&
        (!alertStatus.humidityLow || currentMillis - alertStatus.humidityLowTime > Timing::ALERT_COOLDOWN)) {
        alertStatus.humidityLow = true;
        alertStatus.humidityLowTime = currentMillis;
        alertMessage += "Low humidity: " + String(humidity, 1) + "%. ";
        anyAlert = true;
        newAlertLevel = max(static_cast<int>(newAlertLevel), static_cast<int>(AlertLevel::WARNING));
    }
    else if (humidity >= Thresholds::HUMIDITY_LOW_THRESHOLD && alertStatus.humidityLow) {
        alertStatus.humidityLow = false;
    }

    // Check air quality (MQ135) (Warning alert)
    if (mqSensor135 > Thresholds::MQ135_THRESHOLD &&
        (!alertStatus.mq135High || currentMillis - alertStatus.mq135HighTime > Timing::ALERT_COOLDOWN)) {
        alertStatus.mq135High = true;
        alertStatus.mq135HighTime = currentMillis;
        alertMessage += "Poor air quality: " + String(mqSensor135) + ". ";
        anyAlert = true;
        newAlertLevel = max(static_cast<int>(newAlertLevel), static_cast<int>(AlertLevel::WARNING));
    }
    else if (mqSensor135 <= Thresholds::MQ135_THRESHOLD && alertStatus.mq135High) {
        alertStatus.mq135High = false;
    }

    // More checks for other sensors...
    // Check combustible gas (MQ2) (Critical alert)
    if (mqSensor2 > Thresholds::MQ2_THRESHOLD &&
        (!alertStatus.mq2High || currentMillis - alertStatus.mq2HighTime > Timing::ALERT_COOLDOWN)) {
        alertStatus.mq2High = true;
        alertStatus.mq2HighTime = currentMillis;
        alertMessage += "Combustible gas detected: " + String(mqSensor2) + ". ";
        anyAlert = true;
        newAlertLevel = max(static_cast<int>(newAlertLevel), static_cast<int>(AlertLevel::CRITICAL));
    }
    else if (mqSensor2 <= Thresholds::MQ2_THRESHOLD && alertStatus.mq2High) {
        alertStatus.mq2High = false;
    }

    // Check methane (MQ4) (Critical alert)
    if (mqSensor4 > Thresholds::MQ4_THRESHOLD &&
        (!alertStatus.mq4High || currentMillis - alertStatus.mq4HighTime > Timing::ALERT_COOLDOWN)) {
        alertStatus.mq4High = true;
        alertStatus.mq4HighTime = currentMillis;
        alertMessage += "Methane detected: " + String(mqSensor4) + ". ";
        anyAlert = true;
        newAlertLevel = max(static_cast<int>(newAlertLevel), static_cast<int>(AlertLevel::CRITICAL));
    }
    else if (mqSensor4 <= Thresholds::MQ4_THRESHOLD && alertStatus.mq4High) {
        alertStatus.mq4High = false;
    }

    // Check CO/combustible gas (MQ9) (Critical alert)
    if (mqSensor9 > Thresholds::MQ9_THRESHOLD &&
        (!alertStatus.mq9High || currentMillis - alertStatus.mq9HighTime > Timing::ALERT_COOLDOWN)) {
        alertStatus.mq9High = true;
        alertStatus.mq9HighTime = currentMillis;
        alertMessage += "CO/combustible gas detected: " + String(mqSensor9) + ". ";
        anyAlert = true;
        newAlertLevel = max(static_cast<int>(newAlertLevel), static_cast<int>(AlertLevel::CRITICAL));
    }
    else if (mqSensor9 <= Thresholds::MQ9_THRESHOLD && alertStatus.mq9High) {
        alertStatus.mq9High = false;
    }

    // Check PM2.5 if data is valid (Warning alert)
    if (pmDataValid) {
        if (pm25 > Thresholds::PM25_THRESHOLD &&
            (!alertStatus.pm25High || currentMillis - alertStatus.pm25HighTime > Timing::ALERT_COOLDOWN)) {
            alertStatus.pm25High = true;
            alertStatus.pm25HighTime = currentMillis;
            alertMessage += "High PM2.5: " + String(pm25) + "ug/m3. ";
            anyAlert = true;
            newAlertLevel = max(static_cast<int>(newAlertLevel), static_cast<int>(AlertLevel::WARNING));
        }
        else if (pm25 <= Thresholds::PM25_THRESHOLD && alertStatus.pm25High) {
            alertStatus.pm25High = false;
        }

        // Check PM10 if data is valid (Warning alert)
        if (pm10 > Thresholds::PM10_THRESHOLD &&
            (!alertStatus.pm10High || currentMillis - alertStatus.pm10HighTime > Timing::ALERT_COOLDOWN)) {
            alertStatus.pm10High = true;
            alertStatus.pm10HighTime = currentMillis;
            alertMessage += "High PM10: " + String(pm10) + "ug/m3. ";
            anyAlert = true;
            newAlertLevel = max(static_cast<int>(newAlertLevel), static_cast<int>(AlertLevel::WARNING));
        }
        else if (pm10 <= Thresholds::PM10_THRESHOLD && alertStatus.pm10High) {
            alertStatus.pm10High = false;
        }
    }

    // Update the current alert level
    if (anyAlert) {
        Serial.println(F("Alert triggered!"));
        Serial.println(alertMessage);

        // Update the alert level
        currentAlertLevel = newAlertLevel;

        // Start the buzzer for critical alerts - immediate response
        if (newAlertLevel == AlertLevel::CRITICAL && !buzzerActive) {
            buzzerActive = true;
            buzzerStartTime = currentMillis;
            // Immediately turn on buzzer
            digitalWrite(buzzerPin, HIGH);
        }

        // Send alert notification
        if (alertNotifier) {
            alertNotifier->sendAlert(alertMessage);
        }
    } else if (!anyAlertActive()) {
        // If all alerts are cleared, set status back to normal
        currentAlertLevel = AlertLevel::NORMAL;
    }
}

bool AlertSystem::anyAlertActive() const {
    return alertStatus.tempHigh || alertStatus.tempLow ||
           alertStatus.humidityHigh || alertStatus.humidityLow ||
           alertStatus.mq135High || alertStatus.mq2High ||
           alertStatus.mq4High || alertStatus.mq9High ||
           alertStatus.pm25High || alertStatus.pm10High;
}

AlertLevel AlertSystem::getCurrentAlertLevel() const {
    return currentAlertLevel;
}