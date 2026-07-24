# **Software Requirements Specification (SRS)**

## **Advanced Vehicle Security Platform**

## **1\. System Overview**

### **1.1 System Control Scope**

The system **shall control**:

* Engine start  
* Fuel line cut-off  
* Door lock/unlock

### **1.2 Override Policy**

* Physical manual override is **not allowed**.  
* Override is allowed **only via the mobile application** using:  
  * Biometric authentication **OR**  
  * Security question confirmation

### **1.3 Fail-Safe Behavior**

* **Fail-closed** policy applies to all security-critical operations:  
  * If network or backend is unavailable → engine start **blocked**  
  * Local (on-device) authentication **does not require network**

## **2\. Functional Requirements — Pass Key Module**

### **2.1 Authentication Trigger**

**FR-PK-01**  
Driver authentication is required on **engine cold start**.

**FR-PK-02**  
Authentication behavior shall be **user-configurable**:

* Cold start only (default)  
* Every ignition ON

### **2.2 Authentication Constraints**

**FR-PK-03**  
Maximum authentication attempts: **5 attempts**

**FR-PK-04**  
Authentication timeout per attempt: **10 seconds**

**FR-PK-05**  
After 5 failed attempts:

* Engine remains locked  
* Owner is notified  
* Mobile override option becomes available

### **2.3 Failure Handling**

**FR-PK-06**  
If camera fails or face is not clearly visible:

* Authentication fails  
* Owner is notified  
* Override option is offered

### **2.4 Face Data Storage**

**FR-PK-07**  
Driver facial data shall be stored **locally on the ESP32 device**, encrypted at rest.

**FR-PK-08**  
The system shall support secure driver enrollment and facial data updates via the mobile application.

**FR-PK-09**  
Facial data shall be synchronized to the vehicle device, allowing:

* Adding a new driver  
* Removing a driver  
* Updating an existing driver

## **3\. Driver Authorization & Scheduling**

### **3.1 Authorization Rules**

**FR-AUTH-01**  
Owners shall be able to:

* Assign drivers per vehicle  
* Restrict drivers individually

**FR-AUTH-02**  
Driving time schedules shall be configurable per driver.

### **3.2 Unauthorized Access**

**FR-AUTH-03**  
If ignition occurs outside allowed time:

* Engine start is blocked  
* Owner is notified immediately

### **3.3 Temporary Drivers**

**FR-AUTH-04**  
Temporary drivers shall be supported with:

* Expiry date  
* Optional time windows

### **3.4 Real-Time Updates**

**FR-AUTH-05**  
Driver authorization changes shall:

* Apply immediately if device is online  
* Apply on next sync if offline

## **4\. Tracking & Telemetry**

### **4.1 Tracking Rules**

**FR-TRK-01**  
Tracking shall be **always ON**, regardless of ignition state.

**FR-TRK-02**  
Location updates shall be sent:

* Every 5 seconds **only when the vehicle is moving**  
* On location change ≥10 meters when stationary  
* Periodic heartbeat every 10 minutes when parked

### **4.2 Performance Constraints**

**FR-TRK-03**  
Maximum acceptable tracking delay: **10 seconds**

**FR-TRK-04**  
Minimum GPS accuracy: **≤10 meters**

## **5\. Offline & Failure Handling**

### **5.1 Buffering**

**FR-OFF-01**  
Devices shall buffer telemetry data **up to the maximum supported storage capacity**, with a minimum target of **7 days**.

**FR-OFF-02**  
Buffering duration shall be configurable based on hardware capabilities.

**FR-OFF-03**  
If buffer overflows:

* FIFO eviction applies  
* Oldest records are discarded first

### **5.2 Recovery & Notifications**

**FR-OFF-04**  
When connectivity is restored:

* All buffered data shall be sent to backend

**FR-OFF-05**  
If backend is unreachable during a critical command:

* Device retries when network is restored  
* Backend notifies owner once data/command is delivered or failed

## **6\. Speed Governor Requirements**

### **6.1 Enforcement Logic**

**FR-SPD-01**  
Speed enforcement mode: **Soft limit**

**FR-SPD-02**  
When speed exceeds the limit:

1. Driver warning issued  
2. After **5 seconds**, fuel cut-off via CAN bus  
3. Owner notified

### **6.2 Failure Handling**

**FR-SPD-03**  
If speed sensor fails:

* Speed governor disabled  
* Owner notified  
* Device flagged in admin dashboard

### **6.3 Emergency Override**

**FR-SPD-04**  
Emergency override duration: **5 minutes**

## **7\. Alerts & Escalation**

### **7.1 Delivery SLA**

**FR-ALT-01**  
Alert delivery SLA:

* In-app: ≤ **5 seconds**  
* SMS: ≤ **15 seconds**  
* Call: ≤ **30 seconds**

### **7.2 Retry & Escalation**

**FR-ALT-02**  
Retry count per channel: **3 attempts**

**FR-ALT-03**  
Escalation sequence:

* App → SMS → Call

**FR-ALT-04**  
Users may configure silence windows per alert type

## **8\. Security Requirements**

### **8.1 Command Security**

**FR-SEC-01**  
All commands shall:

* Have a **unique command ID**  
* Be valid for **up to 5 minutes**  
* Be executable **only once**  
* Reject duplicate executions (prevents replay attacks)

### **8.2 Firmware Security**

**FR-SEC-02**  
Firmware integrity shall be verified on boot.

### **8.3 Data Protection**

**FR-SEC-03**  
Sensitive backend data shall be encrypted at rest:

* Driver facial embeddings  
* Device credentials / keys  
* Authentication secrets  
* Vehicle control permissions  
* Override logs  
* Crash event data

## **9\. Non-Functional Requirements**

| Category | Requirement |
| ----- | ----- |
| Uptime | ≥ **99.5%** |
| Command latency | ≤ **3 seconds** |
| Tracking latency | ≤ **10 seconds** |
| Data retention | Minimum 30 days (configurable based on buffer) |
| Compliance | Local vehicle & telecom regulations |

## **10\. Acceptance Criteria**

### **10.1 Production Readiness**

* All FRs pass automated and field tests  
* Fail-closed behavior verified  
* Offline buffering validated  
* Emergency overrides audited

### **10.2 Test Environments**

* Hardware-in-the-loop testing  
* Staging backend  
* Field vehicle tests