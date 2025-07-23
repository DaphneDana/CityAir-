/**
 * Environmental Monitoring System with SOLID Principles
 *
 * This system uses multiple sensors to monitor environmental conditions
 * and provides alerts for dangerous conditions.
 */

#include "Config.h"
#include "DHTSensor.h"
#include "PMSSensor.h"
#include "MQSensor.h"
#include "GSMModule.h"
#include "AlertSystem.h"

// Create sensor instances
DHTSensor dhtSensor(Pins::DHT_PIN, DHT11);  // Change to DHT22 if using that sensor
PMSSensor pmsSensor(&SerialPorts::PMS_SERIAL, Pins::PMS_RESET_PIN);

// MQ gas sensors
MQSensor mq135Sensor(Pins::MQ135_PIN, SensorType::AIR_QUALITY, "MQ135");
MQSensor mq2Sensor(Pins::MQ2_PIN, SensorType::COMBUSTIBLE_GAS, "MQ2");
MQSensor mq4Sensor(Pins::MQ4_PIN, SensorType::METHANE, "MQ4");
MQSensor mq9Sensor(Pins::MQ9_PIN, SensorType::CO, "MQ9");

// GSM module for communications
GSMModule gsmModule(&SerialPorts::GSM_SERIAL, "internet",
                  ThingSpeakConfig::API_KEY,
                  AlertConfig::ALERT_PHONE_NUMBER);

// Alert system
AlertSystem alertSystem(Pins::GREEN_LED_PIN, Pins::YELLOW_LED_PIN,
                      Pins::RED_LED_PIN, Pins::BUZZER_PIN, &gsmModule);

// Timing variables
unsigned long lastSendTime = 0;

void setup() {
  // Initialize serial communications
  Serial.begin(115200);

  // Wait for serial port to connect (needed for native USB port only)
  while (!Serial && millis() < 3000);  // Wait up to 3 seconds for serial connection

  Serial.println(F("Starting Environmental Monitoring System with SOLID principles..."));

  // Initialize sensors
  bool dhtInitialized = dhtSensor.begin();
  if (!dhtInitialized) {
    Serial.println(F("WARNING: Failed to initialize DHT sensor"));
  }

  // Initialize PMS serial port
  SerialPorts::PMS_SERIAL.begin(9600);
  bool pmsInitialized = pmsSensor.begin();
  if (!pmsInitialized) {
    Serial.println(F("WARNING: Failed to initialize PMS sensor"));
  }

  // Initialize MQ sensors
  mq135Sensor.begin();
  mq2Sensor.begin();
  mq4Sensor.begin();
  mq9Sensor.begin();
  Serial.println(F("MQ sensors initialized"));

  // Initialize GSM serial port
  SerialPorts::GSM_SERIAL.begin(4800);
  delay(100);

  // Flash yellow LED during GSM initialization to show it's happening
  digitalWrite(Pins::GREEN_LED_PIN, LOW);
  digitalWrite(Pins::YELLOW_LED_PIN, HIGH);

  bool gsmInitialized = gsmModule.begin();
  if (!gsmInitialized) {
    Serial.println(F("WARNING: Failed to initialize GSM module"));
  }

  // Initialize alert system
  alertSystem.begin();

  Serial.println(F("System initialization complete"));
}

void loop() {
  unsigned long currentMillis = millis();

  // Update alert system indicators (highest priority)
  alertSystem.update();

  // Read all sensor data
  dhtSensor.read();
  bool pmsDataValid = pmsSensor.read();

  if (pmsDataValid) {
    pmsSensor.displayData();
  }

  mq135Sensor.read();
  mq2Sensor.read();
  mq4Sensor.read();
  mq9Sensor.read();

  // Display MQ sensor readings
  Serial.print(F("MQ135: ")); Serial.print(mq135Sensor.getValue());
  Serial.print(F(" | MQ2: ")); Serial.print(mq2Sensor.getValue());
  Serial.print(F(" | MQ4: ")); Serial.print(mq4Sensor.getValue());
  Serial.print(F(" | MQ9: ")); Serial.print(mq9Sensor.getValue());
  Serial.println();

  // Check for alerts based on the latest readings
  alertSystem.checkAlerts(
    dhtSensor.getTemperature(),
    dhtSensor.getHumidity(),
    mq135Sensor.getValue(),
    mq2Sensor.getValue(),
    mq4Sensor.getValue(),
    mq9Sensor.getValue(),
    pmsSensor.getPM25(),
    pmsSensor.getPM10(),
    pmsDataValid
  );

  // Send data at the specified interval (lowest priority)
  if (currentMillis - lastSendTime >= Timing::DATA_SEND_INTERVAL) {
    lastSendTime = currentMillis;

    // Flash yellow LED to indicate data transmission
    digitalWrite(Pins::GREEN_LED_PIN, LOW);
    digitalWrite(Pins::YELLOW_LED_PIN, HIGH);

    gsmModule.publishData(
      dhtSensor.getTemperature(),
      dhtSensor.getHumidity(),
      mq135Sensor.getValue(),
      mq2Sensor.getValue(),
      mq4Sensor.getValue(),
      mq9Sensor.getValue(),
      pmsSensor.getPM25(),
      pmsSensor.getPM10(),
      pmsDataValid
    );

    // Restore LEDs based on current alert level
    alertSystem.update();
  }

  // Short delay for responsiveness
  delay(50);
}