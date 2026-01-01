# Terminology & Concepts

This document defines the core terminology, entities, and architectural patterns used across the IoT platform.

---

## 1. Core Entities

### Device
A physical hardware unit (sensor, actuator, or controller) that interacts with the real world. Every device has an immutable, factory-assigned **GUID**.

### IoTSystem
A logical grouping of multiple devices and their associated logic (data transformations, states, and workflows). It represents a functional unit, such as a "Home Lighting System" or "Smart Factory Floor".

### Tenant
A logical isolation boundary for users and their resources. Every `IoTSystem` and `Device` belongs to exactly one tenant after registration.

### Gateway / Edge Node
A local compute resource that acts as an intermediary between devices and the cloud. It provides low-latency execution and offline capabilities.

---

## 2. Identity & Security

### GUID (Global Unique Identifier)
A unique, immutable identifier assigned to a device at the factory. It is used for initial discovery and tracking throughout the device's lifecycle.

### Factory Certificate
A bootstrap certificate flashed onto the device during manufacturing. It is used to securely identify the device during the initial **Discovery** phase.

### Tenant Certificate
A certificate issued by the system after successful user registration (Onboarding). It scopes the device's permissions and identity to a specific tenant.

### Identity Provisioning
The process of exchanging a factory certificate for a tenant certificate via a **CSR (Certificate Signing Request)** flow.

### mTLS (Mutual TLS)
The primary security protocol used for device-to-gateway and device-to-cloud communication, ensuring both parties are authenticated via certificates.

---

## 3. System Orchestration

### Computed State
A reactive system state derived from raw telemetry or other modifiable states. It is automatically recalculated when its dependencies change, following a **DAG (Directed Acyclic Graph)** pattern.

### Modifiable State
A state that can be directly set by users or workflows. It acts as the "source of truth" for system behavior or manual overrides.

### Initializer Function
A developer-defined function used to calculate the initial or reactive value of a **Computed State**.

### Setter Function
An interface for updating **Modifiable States**, often including validation or side-effect logic.

### Workflow
A set of orchestrated actions triggered by state changes, timers, or events. Workflows bridge the gap between high-level system logic and low-level device commands.

---

## 4. State & Reliability Patterns

### Desired State Pattern
An architectural pattern where the system expresses the *intent* (e.g., "Light should be ON") rather than a direct command. The system then works to reconcile the physical device with this desired state.

### Reconciliation
The asynchronous process of ensuring a device's physical state matches the system's **Desired State**.

### Eventual Consistency
The principle that the system and device states will eventually match, even if there are temporary discrepancies due to network latency or offline periods.

### Sync Status
A metadata field (e.g., `Synced`, `Pending`, `Offline`, `Stale`) that reflects the current alignment between the system's knowledge and the physical world.

---

## 5. Infrastructure & Deployment

### Hybrid Deployment
A topology where compute and logic are distributed between local **Edge** resources and centralized **Cloud** services.

### Edge vs. Cloud Execution
The ability to configure where logic (workflows/states) runs.
- **Edge**: Low latency, works offline, limited resources.
- **Cloud**: High availability, unlimited storage/compute, requires connectivity.
