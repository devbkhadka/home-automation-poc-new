# Device Subsystem

The Device Subsystem is responsible for the abstraction, communication, and lifecycle management of physical and virtual hardware units within the IoT platform.

## 1. Device Roles

To support the diverse requirements of the system, devices are classified into three primary roles:

### Physical Device
*   **Implementation**: Microcontrollers (Raspberry Pi, ESP32, etc.) or edge computers.
*   **Responsibility**: Direct interaction with hardware sensors and actuators.
*   **Identity**: Identified by a factory-assigned GUID and authenticated via mTLS certificates.

### Simulated Device
*   **Implementation**: Software instances implementing the `IDevice` interface.
*   **Responsibility**: Used for testing, large-scale load simulation, and development without physical hardware.
*   **Location**: Typically runs in the cloud or on local developer machines.

### Virtual (Aggregator) Device
*   **Implementation**: Logical entities within the system.
*   **Responsibility**: Aggregates data from multiple physical or simulated devices to provide a unified high-level state (e.g., a "Zone Average Temperature" device).

### Proxy Device
*   **Implementation**: A class representing a remote device within the system logic.
*   **Responsibility**: Handles the complexity of communication protocols and provides a clean interface for other subsystems (e.g., IoTSystem orchestration) to interact with devices.

---

## 2. Interface Design

The system uses a contract-first approach to ensure interoperability between different device types.

### `IDevice` Interface
Defines the core contract all device implementations must follow.

```typescript
interface IDevice {
  readonly guid: string;
  readonly type: DeviceType;
  readonly namespace: string;

  // Configuration
  configure(config: DeviceConfiguration): Promise<void>;

  // Communication
  sendTelemetry(data: TelemetryPayload): Promise<void>;
  onDesiredStateChange(handler: (state: DesiredState) => void): void;

  // Lifecycle
  reboot(): Promise<void>;
  getStatus(): DeviceStatus;
}
```

### `AbstractDevice` Base Class
Implements shared logic for device management, simplifying specific implementations (e.g., standard MQTT message formatting, retry logic).

```typescript
abstract class AbstractDevice implements IDevice {
  protected constructor(
    public readonly guid: string,
    public readonly type: DeviceType,
    public readonly namespace: string,
    protected sensorConfigs: Record<string, SensorConfig>,
    protected actuatorConfigs: Record<string, ActuatorConfig>
  ) {}

  abstract configure(config: DeviceConfiguration): Promise<void>;
  abstract reboot(): Promise<void>;

  // Common logic for sending data to MQTT
  async sendTelemetry(data: TelemetryPayload): Promise<void> {
    // Protocol-agnostic telemetry handling
  }
}
```

---

## 3. Communication Patterns

### Telemetry (Device → Cloud/Edge)
*   **Protocol**: Default is MQTT over mTLS.
*   **Mechanism**: Devices publish raw sensor data to a specific topic: `telemetry/{tenantId}/{namespace}/{guid}/{sensorName}`.
*   **Extensibility**: The `ProxyDevice` can be extended to support other protocols (e.g., CoAP, HTTP) without breaking high-level logic.

### Control (Cloud/Edge → Device)
*   **Pattern**: Desired State Pattern.
*   **Topic**: `cmd/{tenantId}/{namespace}/{guid}/{actuatorName}/desired`.
*   **Action**: The device subscribes to this topic. Upon receiving a message, it updates its actuators to match the desired state and reports back the `reported` state.

### Reconciliation & Retry Logic
*   **Retry Behavior**: When a device does not respond or acknowledge a desired state command, the Processor retries reconciliation with exponential backoff.
*   **Unreachable Threshold**: After a configured timeout period (e.g., multiple failed retry attempts or prolonged silence), the Processor marks the device as **Unreachable** and stops reconciliation attempts.
*   **State Refresh on Reconnection**: When an unreachable device comes back online, the Processor:
    1. Refreshes all device states by requesting current telemetry
    2. Re-evaluates system states that depend on the device
    3. Resumes reconciliation with the latest desired state
*   **Status Tracking**: Device connection status is tracked separately from sync status (e.g., `Online`, `Unreachable`, `Synced`, `Pending`).

---

## 4. Lifecycle & Configuration

### Configuration Synchronization
*   Devices receive updated sensor/actuator configurations via the control channel.
*   If a configuration change requires a hardware reset, the device completes the sync and initiates a **Reboot**.

### Discovery & Onboarding
*   Initial communication uses a **Factory Certificate**.
*   After successful registration, the device is provisioned with a **Tenant Certificate** for all subsequent operational traffic.
