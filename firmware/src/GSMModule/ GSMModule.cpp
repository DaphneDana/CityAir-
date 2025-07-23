#include "GSMModule.h"

GSMModule::GSMModule(Stream* serial, const String& apn,
                   const String& thingSpeakApiKey,
                   const String& alertPhoneNumber)
    : serial(serial), apn(apn), thingSpeakApiKey(thingSpeakApiKey),
      alertPhoneNumber(alertPhoneNumber) {
}

bool GSMModule::begin() {
    Serial.println(F("Initializing GSM module..."));

    // Give the GSM module time to boot up
    delay(3000);

    // Basic AT command to check connection
    sendCommand("AT");

    // Reset to factory defaults
    sendCommand("ATZ", 1000);

    // Echo off
    sendCommand("ATE0");

    // Set SMS text mode
    sendCommand("AT+CMGF=1");

    // Close any open GPRS connections
    sendCommand("AT+SAPBR=0,1", 2000);

    // Initialize GPRS
    return initGPRS();
}

void GSMModule::sendCommand(const String& command, int delayMs) {
    Serial.print(F("Sending command: "));
    Serial.println(command);

    serial->println(command);
    delay(delayMs); // Wait for response

    // Wait for a response with timeout
    unsigned long startTime = millis();
    while (!serial->available() && millis() - startTime < 2000) {
        delay(10);
    }

    // Wait a bit more for the full response
    delay(500);

    // Print GSM response
    if (serial->available()) {
        Serial.println(F("GSM Response:"));
        String response = "";
        while (serial->available()) {
            char c = serial->read();
            response += c;
            Serial.write(c);
        }
        Serial.println(); // Add line break after response

        // Check for ERROR response and retry once if needed
        if (response.indexOf("ERROR") >= 0 && !command.startsWith("AT+HTTPTERM")) {
            Serial.println(F("Error detected, retrying command after delay..."));
            delay(1000);
            serial->println(command);
            delay(1000);

            // Print retry response
            Serial.println(F("Retry Response:"));
            while (serial->available()) {
                Serial.write(serial->read());
            }
            Serial.println();
        }
    } else {
        Serial.println(F("No response from GSM module!"));
    }
}

bool GSMModule::initGPRS() {
    // Setup GPRS connection
    sendCommand("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", 1000);

    String apnCommand = "AT+SAPBR=3,1,\"APN\",\"" + apn + "\"";
    sendCommand(apnCommand, 1000);

    // Try to enable GPRS multiple times
    boolean gprsSuccess = false;
    for (int i = 0; i < 3; i++) {
        sendCommand("AT+SAPBR=1,1", 3000);  // Enable GPRS

        // Check if bearer is open
        serial->println("AT+SAPBR=2,1");
        delay(1000);

        // Check response
        String response = "";
        while (serial->available()) {
            response += (char)serial->read();
        }

        if (response.indexOf("+SAPBR: 1,1") >= 0) {
            Serial.println(F("GPRS connection successful!"));
            gprsSuccess = true;
            break;
        }

        Serial.println(F("GPRS connection failed, retrying..."));
        delay(2000);
    }

    if (gprsSuccess) {
        // Initialize HTTP service
        sendCommand("AT+HTTPINIT", 1000);

        // Set HTTP parameters
        sendCommand("AT+HTTPPARA=\"CID\",1", 1000);
        return true;
    } else {
        Serial.println(F("Failed to establish GPRS connection after multiple attempts"));
        return false;
    }
}

bool GSMModule::publishData(float temperature, float humidity,
                          int mq135, int mq2, int mq4, int mq9,
                          uint16_t pm25, uint16_t pm10,
                          bool pmDataValid) {
    Serial.println(F("Preparing to send data to ThingSpeak..."));

    // First check if GPRS is connected
    serial->println("AT+SAPBR=2,1");
    delay(1000);

    // Check response
    String response = "";
    while (serial->available()) {
        response += (char)serial->read();
    }

    if (response.indexOf("+SAPBR: 1,1") < 0) {
        Serial.println(F("GPRS not connected. Reconnecting..."));
        if (!initGPRS()) {
            return false;
        }
    }

    // Create URL with data
    String url = "http://api.thingspeak.com/update?api_key=" + thingSpeakApiKey;

    // Add sensor data to URL
    url += "&field1=" + String(temperature, 2); // 2 decimal places
    url += "&field2=" + String(humidity, 2);    // 2 decimal places
    url += "&field3=" + String(mq135);
    url += "&field4=" + String(mq2);
    url += "&field5=" + String(mq4);
    url += "&field6=" + String(mq9);

    // Only add PM sensor data if it's valid
    if (pmDataValid) {
        url += "&field7=" + String(pm25);  // PM 2.5
        url += "&field8=" + String(pm10);  // PM 10
        Serial.println(F("Including PMS data in upload"));
    } else {
        Serial.println(F("Skipping corrupt PMS data"));
    }

    Serial.print(F("ThingSpeak URL: "));
    Serial.println(url);

    // Reinitialize HTTP if needed
    sendCommand("AT+HTTPTERM", 1000);
    sendCommand("AT+HTTPINIT", 1000);
    sendCommand("AT+HTTPPARA=\"CID\",1", 1000);

    // Set the URL with proper timeout
    Serial.println(F("Setting URL parameter (this may take a moment)..."));
    serial->print("AT+HTTPPARA=\"URL\",\"");
    serial->print(url);
    serial->println("\"");
    delay(2000);

    // Read response
    while (serial->available()) {
        Serial.write(serial->read());
    }
    Serial.println();

    // Execute the HTTP action (GET request)
    sendCommand("AT+HTTPACTION=0");

    // Wait for the HTTP status with timeout
    unsigned long httpTimeout = millis() + 15000; // 15 second timeout
    bool httpStatusReceived = false;

    Serial.println(F("Waiting for HTTP response..."));

    while (millis() < httpTimeout && !httpStatusReceived) {
        if (serial->available()) {
            String httpResponse = "";
            while (serial->available()) {
                httpResponse += (char)serial->read();
            }

            Serial.println(httpResponse);

            // Check if we have a status code
            if (httpResponse.indexOf("+HTTPACTION:") >= 0) {
                httpStatusReceived = true;
                // Check if it's 200 OK
                if (httpResponse.indexOf("+HTTPACTION: 0,200") >= 0) {
                    Serial.println(F("HTTP request successful!"));
                } else {
                    Serial.println(F("HTTP request failed with error!"));
                }
            }
        }
        delay(100);
    }

    if (!httpStatusReceived) {
        Serial.println(F("HTTP response timeout!"));
    }

    // Read the HTTP response content
    sendCommand("AT+HTTPREAD");

    // Terminate HTTP session
    sendCommand("AT+HTTPTERM");

    Serial.println(F("Data sending to ThingSpeak completed"));

    return httpStatusReceived;
}

bool GSMModule::sendAlert(const String& message) {
    Serial.println(F("Sending SMS alert..."));

    // Set SMS text mode
    sendCommand("AT+CMGF=1", 500);

    // Set SMS recipient
    String recipient = "AT+CMGS=\"" + alertPhoneNumber + "\"";
    serial->println(recipient);
    delay(1000);

    // Check for ">" prompt
    bool promptFound = false;
    unsigned long startTime = millis();
    while (millis() - startTime < 5000 && !promptFound) {
        if (serial->available()) {
            char c = serial->read();
            Serial.write(c);
            if (c == '>') {
                promptFound = true;
            }
        }
        delay(10);
    }

    if (!promptFound) {
        Serial.println(F("SMS prompt not found, aborting SMS"));
        return false;
    }

    // Send the message content
    serial->print(message);
    delay(500);

    // End SMS with Ctrl+Z
    serial->write(26);
    Serial.println(F("SMS sent!"));

    // Wait for confirmation
    delay(5000);

    // Print any response
    while (serial->available()) {
        Serial.write(serial->read());
    }
    Serial.println();

    return true;
}