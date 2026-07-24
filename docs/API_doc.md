# **This is just a Draft not an approved(refined) document**

# **1️ Authentication Endpoints**

| Endpoint | Method / Protocol | Role | Description | Notes |
| ----- | :---- | ----- | ----- | ----- |
| `/admin/owner-invite` | POST / HTTPS | Admin | Invite a new owner via email/phone; generates invitation link | Invitation token is time-limited & single-use |
| `/auth/owner-register` | POST / HTTPS | Owner | Complete owner registration using invitation link | JWT issued upon completion |
| `/owner/invite` | POST / HTTPS | Owner | Invite driver or manager via email/phone; optionally assign vehicle | Invitation can include vehicle assignment |
| `/auth/register` | POST / HTTPS | Driver / Manager | Complete registration using invitation link | Facial embedding optional for offline auth |
| `/owner/register-user` | POST / HTTPS | Owner | Directly register driver or manager without invitation | Facial embeddings synced to vehicle hardware |
| `/auth/login` | POST / HTTPS | Owner / Driver / Manager | Authenticate user and issue JWT & refresh token | Access token short-lived, refresh token renewable |
| `/auth/refresh` | POST / HTTPS | Owner / Driver / Manager | Refresh JWT using refresh token | Optional endpoint for token renewal |
| `/auth/reset-password-request` | POST / HTTPS | Owner / Driver / Manager | Request password reset (OTP sent via email/SMS) | Time-limited OTP |
| `/auth/reset-password` | POST / HTTPS | Owner / Driver / Manager | Reset password using OTP | Password stored hashed |
| `/auth/security-override` | POST / HTTPS | Owner | Authenticate override for vehicle control (biometric or security question) | Used for emergency or locked state |

# **2️ Vehicle Endpoints**

| Endpoint | Method / Protocol | Role | Description | Notes |
| ----- | ----- | ----- | ----- | ----- |
| `/vehicles/register` | POST / HTTPS | Owner | Register vehicle & hardware modules | Returns MQTT credentials for hardware |
| `/vehicles/hardware-activate` | POST / HTTPS / MQTT | Vehicle Module → Backend | Confirm hardware registration & connect | Starts telemetry / event streaming |
| `/vehicles/{vehicle_id}/commands` | POST / MQTT | Backend → Vehicle | Send commands: engine lock/unlock, speed config, overrides | Encrypted, QoS 1 or 2 |
| `/vehicles/{vehicle_id}/status` | GET / HTTPS | Owner / Manager / Driver | Current vehicle status (ignition, speed, location, driver) | Optional cache for offline mode |
| `/vehicles/{vehicle_id}/override` | POST / HTTPS | Owner | Execute override (security question / biometric) | Backend validates owner token |
| `/vehicles/{vehicle_id}/drivers` | GET / HTTPS | Owner / Manager | List assigned drivers | Filters by owner\_id for manager role |
| `/vehicles/{vehicle_id}/drivers` | POST / HTTPS | Owner | Assign/add driver to vehicle | Permission settings included |
| `/vehicles/{vehicle_id}/drivers/{driver_id}` | PUT / HTTPS | Owner | Update driver assignment/permissions | Optional fine-grained access |
| `/vehicles/{vehicle_id}/drivers/{driver_id}` | DELETE / HTTPS | Owner | Remove driver from vehicle | Sync reflected to hardware via MQTT |
| `/vehicles/{vehicle_id}/device-status` | GET / HTTPS | Owner / Manager | Vehicle module connectivity, battery, last telemetry | Real-time alert if offline |
| `/vehicles/{vehicle_id}/device-alerts` | GET / HTTPS | Owner / Manager | Retrieve hardware alerts (tamper, offline, sensor failure) | Optional push via WebSocket |

# **3️ Alert Endpoints**

| Endpoint | Method / Protocol | Role | Description | Notes |
| ----- | ----- | ----- | ----- | ----- |
| `/alerts/{vehicle_id}` | GET / HTTPS | Owner / Manager | Retrieve alert list for vehicle | Can filter by event type/date |
| `/alerts/{vehicle_id}/ack` | POST / HTTPS | Owner / Manager | Acknowledge alerts | Updates backend and optionally notifies device |
| `/alerts/config/{vehicle_id}` | POST / HTTPS | Owner / Manager | Update alert notification preferences (app, SMS, call) | Config changes propagate to MQTT hardware if needed |
| `/alerts/config/{vehicle_id}` | GET / HTTPS | Owner / Manager | Get current alert config | Useful for app UI display |
| `/alerts/{vehicle_id}/live` | WebSocket | Owner / Manager | Real-time push of alerts | Push triggered by MQTT events from hardware |

# **4️ Telemetry / Tracking Endpoints**

| Endpoint | Method / Protocol | Role | Description | Notes |
| ----- | :---- | :---- | ----- | ----- |
| `/telemetry/{vehicle_id}` | POST / MQTT | Vehicle → Backend | Upload telemetry data: location, speed, ignition, crash, tamper, etc. | Critical events use QoS 1 or 2 |
| `/telemetry/{vehicle_id}/live` | WebSocket | Owner / Manager / Driver | Subscribe to real-time telemetry stream | Combines multiple device MQTT messages internally |
| `/telemetry/{vehicle_id}/history` | GET / HTTPS | Owner / Manager | Query historical telemetry data | Filterable by date/time |
| `/telemetry/{vehicle_id}/geofence` | POST / HTTPS | Owner / Manager | Create/update geofence for vehicle alerts | MQTT hardware receives updated config |
| `/telemetry/{vehicle_id}/geofence` | GET / HTTPS | Owner / Manager | List active geofences | App UI uses this for display |
| `/telemetry/{vehicle_id}/geofence/{geofence_id}` | DELETE / HTTPS | Owner / Manager | Remove a geofence | Deletes configuration from backend \+ hardware if needed |

