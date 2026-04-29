# ADR-004: Device- and Gateway-Level Safety Handling (v1)

## Status

**Accepted (v1)**

## Date

2026-01-10

## Context

The Modular Home Automation Platform is designed around a **single authoritative system state** managed by the Processor, with asynchronous, event-driven device control.

Certain scenarios require **immediate safety action**, including:

* Hardware-critical conditions (e.g. temperature too high)
* Prolonged disconnection from the system (offline for a defined duration)

A previously considered design delegated **conditional safety authority to gateways**, coordinated with system-level operating modes. While robust, this approach introduces significant architectural complexity and observability requirements that are not suitable for the initial phase.

A simpler v1 approach is required that:

* Guarantees hardware safety
* Avoids split-brain control
* Minimizes platform complexity
* Remains compatible with future enhancements

---

## Decision

### Summary

**Safety-critical and prolonged-offline behavior will be handled entirely by devices themselves or by gateway-managed virtual devices.**
The Processor will not participate in safety decision-making in v1.

---

### Key Elements of the Decision

#### 1. Device Safety as a Hardware Capability

* Not all devices are required to support:

  * Critical state handling
  * Offline-safe behavior
* These behaviors are treated as **device capabilities**, not platform requirements.

Each device may declare:

* A predefined **safe state**
* Internal logic to detect **critical conditions**
* Internal logic to detect **offline duration**

---

#### 2. Virtual Devices for Multi-Device Safety

* When safety rules involve **multiple physical devices**, a **virtual device** is defined and managed by a gateway.
* Virtual devices are:

  * **System-visible**
  * First-class devices in the Device Registry
  * Controlled by the Processor like any other device

Underlying physical devices:

* Are hidden or marked as **non-controllable** at the system level
* Are controlled exclusively by the gateway via the virtual device

---

#### 3. Single Controller per Device

* Each device (physical or virtual) has **exactly one controller**:

  * Either the **Processor**
  * Or a **Gateway**
* When devices are grouped into a virtual device:

  * Gateway controls physical devices
  * Processor controls only the virtual device

This enforces a strict authority boundary and eliminates split-brain scenarios.

---

#### 4. Safety and Offline Behavior

* Devices / virtual devices:

  * Transition to their predefined **safe state** when:

    * A critical condition is detected
    * The device is offline for longer than a predefined duration
* While in critical or offline-safe state:

  * Devices reject incoming state commands
  * Devices return acknowledgements with explicit rejection codes

---

#### 5. State Rejection and Convergence

* Devices reject state commands that are based on **stale system state**
* When connectivity is restored:

  * Processor resends desired state using updated state values
* Devices eventually converge once conditions normalize

---

## Consequences

### Positive

* Immediate safety response close to hardware
* Simple Processor logic
* No gateway–processor conflict
* Clear control ownership
* Minimal platform complexity for v1

---

### Negative / Limitations

1. **Safety Logic Is Opaque to the System**

   * Processor does not model critical thresholds or offline timers
   * Only observes command rejections and non-convergence

2. **Policy Is Embedded, Not Declarative**

   * Safety rules live in device firmware or gateway logic
   * Changes require firmware or gateway updates

3. **Limited System-Level Reasoning**

   * Processor cannot predict or simulate safety outcomes
   * Automation correctness is harder to analyze

4. **Implicit State Versioning**

   * Rejecting stale state assumes a monotonic revision mechanism
   * Versioning semantics are not yet formally defined

5. **Migration Cost**

   * Moving safety logic to system-level declarative state in the future will require refactoring

---

## Alternatives Considered

### A. Gateway-Enforced Safety with Conditional Authority

* Gateways enforce safe state during degraded or emergency operating modes
* Processor remains authoritative in normal operation

**Rejected for v1 due to:**

* Higher complexity
* Increased observability requirements
* More difficult initial implementation

---

### B. Fully Centralized Safety in Processor

* Processor computes and enforces all safety logic

**Rejected because:**

* Cannot guarantee low-latency or offline safety
* Unsafe for hardware-critical scenarios

---

## Future Considerations

* Introduce **system-level operating modes** (normal / degraded / emergency)
* Make safety rules **declarative and observable**
* Allow gateways to perform **scoped, temporary safety enforcement**
* Formalize state versioning and reconciliation semantics

This ADR intentionally leaves these as **future enhancements**.

---

## Final Note

This decision prioritizes **safety, clarity of authority, and implementation simplicity** over observability and configurability.
It is a deliberate v1 tradeoff and not an architectural dead-end.

---
