# **Business Requirements Document (BRD)**

## **Advanced Vehicle Security Platform**

## **1\. User Roles & Access Control**

### **1.1 User Roles**

The system shall support the following user roles:

* **Owner**  
  * Primary account holder  
  * Full control over vehicle, drivers, and modules  
* **Manager**  
  * Assigned by the owner  
  * Manages vehicles and drivers but does not own them  
* **Driver**  
  * Operates vehicles assigned by the owner  
  * No administrative privileges

**Business Rules:**

* An owner may also act as a driver.  
* A driver **cannot** act as an owner.  
* An owner can register and manage **multiple drivers** per vehicle.  
* One user can manage **multiple vehicles**.  
* One vehicle can have **multiple authorized drivers**.

Driver authorization is based on **facial recognition**, captured during driver registration.

## **2\. Pass Key Module (Driver Authentication)**

### **2.1 Authentication Method**

* Driver authentication shall be performed using **face recognition** via an **ESP32 camera module**.  
* Authentication is mandatory **on every engine start**.

### **2.2 Authentication Outcomes**

* If authentication **fails**:  
  * The engine shall not start.  
  * The owner shall receive a notification.  
* Emergency override mechanism is supported.  
* Authentication events are **not logged** in Phase 1\.

## **3\. Tracking Module**

### **3.1 Tracking Behavior**

* Vehicle location shall be updated **every 5 seconds**.  
* The tracking module shall collect:  
  * GPS location  
  * Ignition status

### **3.2 Trip & History**

* The system shall maintain **trip history**.  
* Tracking data retention period is **1 month**.

### **3.3 Geofencing**

* Users and admins can configure geofences.  
* Entry and exit from geofences shall trigger alerts.

### **3.4 Offline Behavior**

* Offline behavior is **TBD** and will be addressed in the System Architecture phase.

## **4\. Speed Governor Module**

### **4.1 Speed Control**

* Maximum speed shall be **configurable remotely**.  
* Speed shall be monitored continuously.

### **4.2 Speed Violation Handling**

When speed exceeds the configured limit:

1. The driver shall receive a warning.  
2. The system shall cut off the **fuel line**.  
3. The owner shall be notified.

### **4.3 Overrides & Logging**

* Emergency override is supported.  
* Speed violations shall be logged and reported.

## **5\. Alerts & Notifications**

### **5.1 Alert Triggers**

Alerts shall be generated for the following events (non-exhaustive):

* Vehicle movement (\< 10 meters) while ignition is OFF  
* Crash detection (via accelerometer)  
* Touch detection triggering siren  
* Ignition ON during unauthorized time windows  
* Speed violations  
* Unauthorized driving attempts

### **5.2 Alert Recipients**

* Vehicle Owner  
* Assigned Manager

### **5.3 Notification Channels**

Alerts can be delivered via:

* In-app notification  
* SMS  
* Direct phone call

Users can configure:

* Which events trigger alerts  
* Which channels are used per event  
* Escalation rules (App → SMS → Call)

## **6\. Mobile Application (Business View)**

### **6.1 Supported Platforms**

* **Flutter-based mobile app** for:  
  * Android  
  * iOS  
* **Web-based dashboard** for admins

### **6.2 Core Mobile Features**

* Live vehicle map  
* Geofencing  
* Remote lock (engine & doors)  
* Alerts and notifications system  
* Speed configuration and monitoring  
* Vehicle dashboard  
* Driver assignment and monitoring, including:  
  * Seatbelt usage  
  * Phone usage  
  * Alcohol level detection  
  * Drowsiness  
  * Eye closure monitoring

### **6.3 Suggested Offline Behavior (Recommendation)**

* Allow viewing last known vehicle location  
* Queue commands and send when connectivity is restored  
* Show offline indicators clearly

## **7\. Admin Dashboard**

### **7.1 Admin Capabilities**

Admins can manage:

* Users  
* Vehicles  
* Devices  
* Analytics  
* Hospital data (location & contact information)

### **7.2 Advanced Features**

* Crowd-sourced hospital alerts for crash detection  
* Ability to:  
  * Force speed limits  
  * Disable vehicles remotely

### **7.3 Reporting**

Admin dashboard shall support:

* Vehicle usage reports  
* Speed and safety violations  
* Device health monitoring

## **8\. Business Rules & Commercial Model**

### **8.1 Sales Model**

* Current model: **One-time purchase**  
* Future option: Subscription-based services (out of scope for Phase 1\)

### **8.2 Feature Enforcement**

* Features shall be disabled if payment conditions are not met.

### **8.3 Device Ownership**

* Device ownership model is **TBD** and requires a business decision.

## **9\. Open Items / Decisions Pending**

* Offline behavior for tracking devices  
* Device ownership model  
* Regulatory approval requirements  
* Data privacy and consent model  
* Emergency override policy details