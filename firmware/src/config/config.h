#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino_BuiltIn.h>

// Pin definitions
namespace Pins {
    // Sensors
    constexpr uint8_t DHT_PIN = 4;
    constexpr uint8_t PMS_RESET_PIN = 5;

    // Indicators
    constexpr uint8_t GREEN_LED_PIN = 47;
    constexpr uint8_t YELLOW_LED_PIN = 53;
    constexpr uint8_t RED_LED_PIN = 49;
    constexpr uint8_t BUZZER_PIN = 6;

    // MQ Sensors
    constexpr uint8_t MQ135_PIN = A3;  // Air quality
    constexpr uint8_t MQ2_PIN = A1;    // Combustible gas
    constexpr uint8_t MQ4_PIN = A0;    // Methane
    constexpr uint8_t MQ9_PIN = A2;    // CO/combustible gas
}

// Serial port definitions
namespace SerialPorts {
    #define PMS_SERIAL Serial3    // PMS5003 on Serial3 (pins 14,15)
    #define GSM_SERIAL Serial1    // GSM Module on Serial1 (pins 18,19)
}

// Timing constants
namespace Timing {
    constexpr unsigned long DATA_SEND_INTERVAL = 30000;  // Send data every 30 seconds
    constexpr unsigned long PMS_READ_TIMEOUT = 3000;     // Timeout for PMS sensor readings
    constexpr unsigned long DHT_MIN_INTERVAL = 2100;     // Minimum time between DHT readings
    constexpr unsigned long PMS_STABLE_INTERVAL = 2500;  // PMS stable mode interval
    constexpr unsigned long BUZZER_DURATION = 3000;      // Buzzer duration
    constexpr unsigned long LED_BLINK_INTERVAL = 250;    // LED blink interval
    constexpr unsigned long ALERT_COOLDOWN = 3600000;    // Alert cooldown (1 hour)
}

// Thresholds
namespace Thresholds {
    // Environmental thresholds
    constexpr float TEMP_HIGH_THRESHOLD = 30.0;
    constexpr float TEMP_LOW_THRESHOLD = 5.0;
    constexpr float HUMIDITY_HIGH_THRESHOLD = 80.0;
    constexpr float HUMIDITY_LOW_THRESHOLD = 20.0;

    // Air quality thresholds
    constexpr uint16_t PM25_THRESHOLD = 25;
    constexpr uint16_t PM10_THRESHOLD = 50;

    // Gas sensor thresholds
    constexpr int MQ135_THRESHOLD = 700;
    constexpr int MQ2_THRESHOLD = 600;
    constexpr int MQ4_THRESHOLD = 600;
    constexpr int MQ9_THRESHOLD = 600;
}

// Alert configuration
namespace AlertConfig {
    constexpr char ALERT_PHONE_NUMBER[] = "+1234567890";
}

// ThingSpeak configuration
namespace ThingSpeakConfig {
    constexpr char API_KEY[] = "XR1OCESZGWSNRVVN";
}

// Sensor types
enum class SensorType {
    TEMPERATURE,
    HUMIDITY,
    AIR_QUALITY,
    COMBUSTIBLE_GAS,
    METHANE,
    CO
};

// Alert levels
enum class AlertLevel {
    NORMAL,
    WARNING,
    CRITICAL
};

#endif // CONFIG_H