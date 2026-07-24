# **System Architecture Document (SAD)**

## **Advanced Vehicle Security Platform**

## **1\. High-Level Architecture Overview**

The platform consists of **three independent in-vehicle hardware modules**, a central backend system, mobile applications (owner & manager), and an admin dashboard. All communication flows through a secure backend layer.

Vehicle Modules → GSM (3G) → Backend (MQTT \+ REST/WebSocket) → Mobile Apps / Admin Dashboard

**Backend Responsibilities:**

* Command dispatch  
* Telemetry ingestion  
* Alert generation  
* Driver enrollment syncing  
* Device status tracking

**Mobile App Responsibilities:**

* Driver enrollment & updates  
* Configuration (alerts, speed limits, geofencing)  
* Override commands (biometric \+ security question)  
* Real-time alerts & tracking

**Admin Dashboard Responsibilities:**

* Fleet management  
* Device monitoring  
* Analytics & incident reporting

## **2\. Hardware Architecture**

### **2.1 In-Vehicle Modules**

| Module | Microcontroller | Responsibilities |
| :---- | :---- | ----- |
| Tracking | Arduino Mega 2560 | GPS, movement detection, crash detection, tamper detection, remote control (engine & door) |
| Pass Key | ESP32 \+ Camera | Driver authentication, alcohol detection, YOLO-based driver monitoring (seatbelt, phone usage, eye closure) |
| Speed Governor | ESP32 | Speed monitoring, soft-limit enforcement, fuel cut-off via CAN bus |

### **2.2 Sensors & Actuators**

**Tracking Module:**

* GPS module  
* Accelerometer (crash detection)  
* Touch sensor (siren trigger)  
* GSM (3G)  
* Data buffering for offline operation

**Pass Key Module:**

* Camera module  
* Alcohol sensor  
* Facial recognition for driver authentication  
* Driver monitoring using YOLO-based models

**Speed Governor Module:**

* Speed sensor  
* Vehicle CAN bus integration  
* Fuel cut-off via CAN commands

### **2.3 Storage & Buffering**

* Minimum buffer: **7 days** (configurable per device)  
* Maximum buffer: up to **device storage capacity (\~50k records)**  
* Buffer policy: **FIFO eviction**  
* Offline storage used for telemetry, critical commands, and event buffering  
* Critical commands executed immediately if possible; retried when network restored

## **3\. Connectivity & Communication**

### **3.1 Network Layer**

* GSM (3G) with **single SIM per device**  
* Devices buffer telemetry and events during network loss

### **3.2 Communication Protocols**

| Path | Protocol | Purpose |
| ----- | ----- | ----- |
| Device → Backend | MQTT | Telemetry, events, command execution |
| Backend → Device | MQTT | Command dispatch |
| Mobile → Backend | REST \+ WebSocket | Configuration, commands, real-time tracking |
| Backend → Mobile | WebSocket | Real-time alerts & telemetry |
| Admin Dashboard → Backend | REST | Fleet management, analytics |

**Fail-Safe Behavior:**

* Critical commands blocked if backend unreachable (**fail-closed**)  
* Commands retried upon reconnection  
* Alerts about failures sent once backend is reachable

## **4\. Backend Architecture**

### **4.1 Backend Design**

* Monolithic backend with modular internal components:  
  * Authentication  
  * Device management  
  * Driver & vehicle management  
  * Telemetry processing  
  * Alert engine  
  * Command dispatcher  
  * Admin operations

### **4.2 Real-Time Features**

* Live tracking via **WebSockets**  
* Remote lock / speed configuration via **REST request/response**

### **4.3 Scalability Target**

* Year-1: \~1,000 vehicles  
* Horizontally scalable if needed

## **5\. Data Storage Architecture**

### **5.1 Database**

* PostgreSQL as primary database

### **5.2 Data Modeling**

**Telemetry (tracking data):**

* Partitioned monthly  
* Indexed by vehicle ID & timestamp

**Events & Alerts:**

* Separate tables for fast querying

**Operational Data:**

* Users, vehicles, devices, drivers, permissions

**Sensitive Data Encryption (Backend):**

* Driver facial embeddings  
* Device credentials / keys  
* Authentication secrets  
* Vehicle control permissions  
* Override logs  
* Crash event data

## **6\. Driver Enrollment & Authorization Flow**

* Owner adds driver via **mobile app**  
* Facial data captured (mobile / vehicle camera) → embeddings generated  
* Encrypted embeddings synced to vehicle ESP32 module  
* Local verification on device (offline capable)  
* Updates / revocations propagate immediately if online, or on next sync if offline

## **7\. Mobile & Admin Integration**

### **7.1 Client Communication**

* REST APIs for commands, configuration, management  
* WebSockets for real-time alerts and live tracking

### **7.2 Admin Dashboard**

* Shares same backend  
* Admin-only endpoints  
* Role-based access control enforced at API level

## **8\. Security Architecture**

### **8.1 Device Security**

* Unique device ID  
* Device authentication: pre-shared keys (Phase 1\) / certificate-based (Phase 2\)

### **8.2 API Security**

* JWT-based authentication  
* Role-based authorization

### **8.3 Command Security**

* Signed commands  
* Valid 5 minutes (configurable)  
* Unique execution, duplicate execution rejected (prevents replay attacks)  
* Fail-closed on network failure

### **8.4 Tamper Detection**

* Physical tamper events sent immediately  
* Alerts escalated via SMS / Call

## **9\. Alerting & Messaging**

### **9.1 Notification Channels**

* In-app push notifications (FCM)  
* SMS (provider TBD)  
* Voice calls (provider TBD)

### **9.2 Alert Logic**

* Retry on failure  
* Escalation: App → SMS → Call  
* Configurable per user & per event

## **10\. Deployment & Operations**

### **10.1 Infrastructure**

* Self-hosted VPS  
* Dockerized backend services

### **10.2 Observability**

* Centralized logging  
* Metrics:  
  * Device connectivity  
  * Command latency  
  * Alert delivery success

### **10.3 Backup & Recovery**

* Automated daily database backups  
* Disaster recovery plan required for production launch

## **11\. Architecture Risks & Recommendations**

**Key Risks:**

* Running YOLO models on ESP32 may exceed hardware limits  
* GSM 3G reliability & potential sunset risk  
* CAN bus integration complexity

**Recommendations:**

* Prototype ML workloads early  
* Keep ML inference optional or offloaded where possible  
* Plan LTE/NB-IoT upgrade path  
* Test fail-closed & offline command flows thoroughly