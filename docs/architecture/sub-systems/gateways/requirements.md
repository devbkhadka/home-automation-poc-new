# Gateway Requirements Specification

## 1. Overview
The Gateway acts as a local compute bridge between physical devices and the centralized Processor. It provides low-latency execution, protocol translation, and offline autonomy.

## 2. Functional Requirements

### 2.1 Device Discovery
- **Device-Initiated Advertisement**: Discovery process is initiated by the device (e.g., on power-on or physical trigger) by advertising its presence over local transports.
- **Gateway Detection**: The Gateway must listen for these advertisements and detect unregistered devices.
- **Throttling**: Must rate-limit discovery events to prevent Processor overload.
- **Reporting**: Must send transport-agnostic discovery events (including device fingerprint) to the Processor.

### 2.2 Communication & Bridging
- **Message Forwarding**: Must forward telemetry from local devices to the MQTT broker (or Processor).
- **Command Routing**: Must route desired state updates from the system to the target local devices.
- **Protocol Translation**: Must be capable of translating between platform-standard MQTT and local device protocols (e.g., Modbus, Zigbee, custom UART).

### 2.3 Local Safety Handling
- **Delegated Safety Authority**: Safety handling is performed either by the device firmware itself or by a **Virtual Device** managed by the Gateway.
- **Virtual Device Coordination**: When safety rules involve multiple physical devices, the Gateway hosts a Virtual Device that encapsulates the coordination logic.
- **Autonomous Action**: Virtual Devices on the Gateway must be capable of enforcing "Safe States" on underlying local devices during network partitions (Offline Mode).
- **State Rejection**: Devices or Virtual Devices must reject commands that conflict with active safety rules or are based on stale system timestamps.


### 2.4 Virtual Device Management
- **Aggregation**: Must support the creation and management of Virtual Devices that aggregate data from multiple physical devices.
- **Abstraction**: Must present Virtual Devices to the Processor as first-class entities, hiding the complexity of underlying physical interactions.

## 3. Technical Requirements

### 3.1 Identity & Security
- **Unique Identity**: Each Gateway must have its own unique GUID.
- **Authentication**: Must use mTLS for communication with the Processor.
- **Local Trust**: Must handle the secure handover of tenant credentials to discovered devices during onboarding.

### 3.2 Resilience
- **Offline Storage**: Should buffer critical telemetry when the link to the Processor is down.
- **Self-Healing**: Must automatically attempt to reconnect to the Processor and local devices after failures.

### 3.3 Extensibility
- **Driver Model**: Should support a plugin or driver-based architecture to add support for new device types or protocols without core updates.


## Future Considerations

### 4.1 Routing data to devices

- **Routing**: As device can connect to any gateway, we need to ensure that data is routed to device through the correct gateway.
