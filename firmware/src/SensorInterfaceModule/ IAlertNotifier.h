//
// Created by mkb2001 on 07/05/2025.
//

#ifndef I_ALERT_NOTIFIER_H
#define I_ALERT_NOTIFIER_H

#include <Arduino.h>

// Interface for alert notification services
class IAlertNotifier {
public:
    virtual ~IAlertNotifier() = default;

    virtual bool begin() = 0;
    virtual bool sendAlert(const String& message) = 0;
};

#endif // I_ALERT_NOTIFIER_H
