
# ADR-012: Unregistered Device Discovery and Deduplication Across Multiple Gateways and Transports

## Status

**Accepted**

## Date

2026-01-10

## Context

The platform must support **zero-touch discovery** of **unregistered Devices** when they are powered on, so that the System can list them as candidates for onboarding.

Discovery must work when:

* Devices support **Bluetooth (BLE)**, **Wi-Fi**, or both
* Gateways support **Bluetooth**, **Wi-Fi**, or both
* A Device is within range of **multiple Gateways simultaneously**
* Discovery traffic may be abused (intentional or accidental)

Key constraints:

* Unregistered devices are **untrusted**
* Discovery must **not** result in automatic registration
* Discovery must not create **controllable** or **durable** Device Registry entries
* The platform is **event-driven and asynchronous**
* Gateways may be intermittently connected to the Processor

---

## Decision

### 1. Discovery Is Many-to-Many; Attribution Is Centralized

* Devices **freely advertise** their presence without attempting to coordinate or limit detection
* Gateways **independently detect** unregistered devices using supported transports
* The **Processor** is the **single authority** responsible for deduplicating discovery signals and presenting a single system-level view

No device-to-device or gateway-to-gateway coordination is introduced.

---

### 2. Transport-Agnostic Device Fingerprint

Each unregistered Device must advertise a **stable, transport-independent device fingerprint**.

**Properties:**

* Identical across BLE and Wi-Fi advertisements
* Stable across reboots
* Public and non-secret
* Not sufficient for authentication or control

**Purpose:**

* Enable Processor-level deduplication across:

  * Transports
  * Gateways
  * Detection order

---

### 3. Gateway Discovery Events

Gateways emit **Discovery Events** to the Processor.

Gateways:

* Perform **local rate limiting and deduplication**
* Do **not** attempt global uniqueness
* Do **not** suppress discovery due to multi-gateway visibility

Gateways are treated as **signal sources**, not authorities.

---

### 4. Processor-Level Deduplication and Convergence

The Processor maintains an **ephemeral internal representation** of discovered devices (pre-registry).

Deduplication is performed by:

* Matching incoming discovery events on `device_fingerprint`
* Merging events across:

  * Multiple gateways
  * Multiple transports

This guarantees:

* **At-least-once discovery**
* **Exactly-once system representation**

---

### 5. Ephemeral Lifecycle (TTL-Based)

Discovered devices:

* Are **not** stored in the Device Registry
* Have a **time-to-live (TTL)** refreshed on each discovery event
* Are automatically removed when TTL expires

This limits memory usage and mitigates discovery-layer abuse.

---

### 6. Clear Boundary Between Discovery and Registration

Discovery:

* Is unauthenticated
* Is non-actionable
* Cannot trigger workflows or commands

Only an explicit onboarding flow may promote a discovered device into the **Device Registry**.

---

## Consequences

### Positive

* Supports heterogeneous device and gateway capabilities
* Avoids race conditions and distributed coordination
* Scales with gateway count
* Resilient to network partitions
* Preserves loose coupling and transport agnosticism

### Negative

* Discovery is not strictly “exactly once” at the event level
* Temporary duplicates may exist before Processor convergence
* Requires device manufacturers to implement fingerprinting correctly

---

## Alternatives Considered

### Device-Level Coordination

Rejected.

* Devices lack global system visibility
* Fails under multiple gateways and partitions

### Gateway Ownership Election

Rejected.

* Introduces coupling and coordination complexity
* Breaks under gateway failure or network splits

### Immediate Device Registry Entry

Rejected.

* Violates security and trust boundaries
* Increases blast radius of abuse

---

## Security Considerations

* Device fingerprint is **not an authentication credential**
* All discovery data is treated as untrusted
* Gateway-level throttling limits local abuse
* Processor-level TTL prevents persistent poisoning

---

## Open Gaps / Follow-Ups

1. Fingerprint construction standardization and collision handling
2. Optional vendor-signed discovery payloads
3. Gateway trust and attestation model
4. User-intent signaling (e.g., physical pairing action)
5. UI semantics for multi-gateway detection

---

## Related Decisions

* Device Registry as single authoritative source of device state
* Event-driven state evaluation in the Processor
* Gateway-first noise absorption strategy

