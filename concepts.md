# Product Concept: Modular Home Automation Platform

## Overview
The Modular Home Automation Platform enables intelligent monitoring and control of physical environments by declaratively defining **system state**, deriving **desired device state**, and reliably converging physical devices toward that state.

The platform is **event-driven**, **state-centric**, and **deterministic**, supporting real-time sensing, data transformation, visualization, and controlled interaction with external systems. It is designed to run consistently across **cloud processors and edge gateways**, with configurations compiled into TypeScript for validation and execution.

---

## Core Building Blocks

### 1. Device
A **Device** is a physical or virtual unit that interfaces with the real world. It exposes one or more **Sensors** and/or **Actuators** and is responsible for safely converging toward the **desired device state** provided by the system.

Key characteristics:
- Maintains local communication and configuration
- Receives **declarative desired state**, not imperative commands
- May start in a safe fallback when desired state is `unknown`
- Is assumed to eventually converge to the desired state
- Multiple system can use device but only owner can modify device state.

**Examples:**
- Smart thermostat
- Water meter
- Security camera
- Smart plug

---

### 2. Sensor
A **Sensor** captures environmental data and reports it via its device.

- **Data types:** number, string, boolean, binary, JSON
- **Trigger modes:**
  - Event-driven
  - Device-triggered
  - Time / interval-based

Sensor outputs must always resolve to either:
- a concrete value, or
- `unknown`

**Examples:**
- Temperature sensor
- Motion sensor
- Light sensor

---

### 3. Actuator
An **Actuator** performs actions that change the physical environment.
Actuators do not receive commands directly from workflows or effects; they are driven exclusively by the **desired device state** computed by the system.

**Examples:**
- Light switch
- Heater relay
- Door lock
- Valve controller

---

### 4. Commands
Commands are asynchronous instructions exchanged between the system and devices.

**Command categories:**
- **State commands:** declarative desired device state
- **Configuration commands:** declarative configuration intent
- **Maintenance commands:** reset, reboot, diagnostics

**Acknowledgement model:**
- Success / Success with warning / Failure
- Each acknowledgement includes a **device-specific numeric code**

State and configuration commands are strictly **declarative**.

---

### 5. Gateway
A **Gateway** bridges devices and the cloud processor and may execute critical logic at the edge.

Responsibilities:
- Transmit sensor data upstream
- Relay desired device state downstream
- Support multiple communication protocols
- Execute compiled system logic when processor connectivity is unavailable

**Supported transports:**
- GSM
- LoRaWAN
- Wi-Fi
- Ethernet

---

### 6. System
A **System** is a logical, declarative configuration that defines:
- Which devices participate
- How data is transformed
- How **system state** and **device state** are derived
- Which external **effects** may occur

Key properties:
- Declares all dependencies explicitly
- Defines a **single authoritative device state**
- Device state is complete (no partial updates)
- State evaluation is event-driven and memoized

**Examples:**
- Home lighting system
- Heating system
- Energy monitoring system

---

### 7. State
A **State** is a named, derived value produced by evaluating a pure expression over one or more data sources or transformed data.

**State characteristics:**
- Evaluated on any input change
- Memoized
- Total (defined for all input combinations)
- May be primitive or structured (object)
- May resolve to `unknown`
- Some state can be modified by effects, but we have to explicitly declare it as modifiable by effects.

Two scopes:
- **System State:** describes global conditions
- **Device State:** describes the complete desired actuator state for a device

Device states must structurally match the device’s actuator schema.

---

### 8. Data Transformer
A **Data Transformer** derives higher-level data from one or more inputs.

- Produces either a value or `unknown`
- Has no side effects
- Can be reused across systems
- May execute on gateway or processor

**Examples:**
- Daylight level normalization
- Motion aggregation
- Comfort index calculation

---

### 9. Effect (formerly Workflow)
An **Effect** reacts to system state and interacts with the **external world**.

Key constraints:
- Can read system state
- Can modify **system state**
- Can interact with external services
- **Cannot directly change device state**

Effects are the only mechanism for side effects outside the system boundary.

---

### 10. Device Registry
The **Device Registry** is the authoritative source of truth for devices, including:
- Identity
- Sensor and actuator schemas
- Configuration metadata
- System associations

Registry schemas are used to generate and validate TypeScript types at build time.

---

### 11. Processor
The **Processor** is the orchestration core of the platform.

Responsibilities:
- Load and validate system configurations
- Evaluate state graphs
- Execute data transformers and effects
- Transmit desired device state to devices
- Monitor acknowledgements and emit warnings on delays

The processor enforces **single-writer authority** over device state.

---

## Major Architectural Changes (Summary)

1. Shift from workflow-driven control to **state-centric declarative control**
2. Introduction of **complete, authoritative device state**
3. Replacement of workflows with **effects** that cannot touch devices directly
4. Explicit support for `unknown` as a first-class state value
5. Compilation of configuration into TypeScript for validation and execution

---

## Known Gaps & Deferred Concerns (Tracked)

1. **State observability & explainability** (why a state evaluated to a value)
2. **Gateway vs processor authority** and split-brain resolution
3. **Chronological device state prioritization**
4. **Advanced error handling and recovery semantics**
5. **Simulation and dry-run execution modes**

---

## Value Proposition
- **Deterministic & predictable:** Single authoritative state model
- **Modular & extensible:** Clear separation of concerns
- **Edge-capable:** Safe operation during connectivity loss
- **Build-time safety:** Strong TypeScript validation
- **Scalable foundation:** Suitable for homes today and larger systems tomorrow
