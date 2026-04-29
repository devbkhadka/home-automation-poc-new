Below is a **formal Architecture Decision Record (ADR)** capturing the connectivity decision and its **ripple effects across the architecture**, written to be future-proof but Phase-1 friendly.

---

# ADR: Device Connectivity Model – Direct-to-Processor with Optional Transparent Gateways

## Status

**Accepted**

## Date

2026-01-11

## Context

The platform aims to simplify Phase-1 architecture while remaining extensible for future edge capabilities.
Previously, **Gateways were mandatory intermediaries** between Devices and the System (Processor), which introduced complexity around:

* Multi-gateway device visibility
* Routing and coordination between gateways
* Split responsibility for security, state, and lifecycle
* Increased design surface early in the project

At the same time, not all devices are capable of direct IP connectivity (e.g., Bluetooth-only, wired, or proprietary protocol devices).

---

## Decision

### **Devices MAY connect directly to the Processor. Gateways are OPTIONAL transparent adapters for incompatible devices.**

* **Direct connectivity is the default and preferred model**
* **Gateways act as transparent, session-scoped transport proxies**
* **Processor is always the authoritative peer for a device**
* **Exactly one active upstream connection per device is enforced by the Processor**

---

## Decision Details

### Connectivity Paths

#### 1. Direct Device → Processor

```
[ Device ] ──(IP / TLS)──> [ Processor ]
```

Used when the device is capable of:

* Secure transport
* Authentication
* Platform protocol support

#### 2. Device → Gateway → Processor (Transparent Adapter)

```
[ Device ] ──(BT / Wire / Proprietary)──> [ Gateway ]
           ──(IP / TLS, session proxy)──> [ Processor ]
```

Used only when the device is incompatible with direct connectivity.

---

### Gateway Role (Redefined)

Gateways:

* Terminate **device-specific physical or constrained transport**
* Proxy messages **verbatim** to the Processor
* Maintain a **single active session per device**

Gateways **do NOT**:

* Own device identity
* Own or evaluate device state
* Execute workflows or effects (Phase-1)
* Participate in routing or device arbitration
* Act as a system-visible entity

Gateways are **invisible to Systems, Workflows, and State Definitions**.

---

### Session & Routing Rules

* A device may see multiple gateways, but:

  * It connects through **exactly one gateway at a time**
* The Processor enforces:

  ```text
  device_id → max one active session
  ```
* If a second gateway attempts to proxy the same device:

  * Processor rejects or preempts based on policy
* No gateway-to-gateway coordination exists

---

## Consequences

### Positive

1. **Significant Phase-1 Simplification**

   * No gateway routing mesh
   * No gateway arbitration logic
   * Single connectivity mental model

2. **Clear Authority Model**

   * Processor is the only authority for:

     * Device identity
     * Device state
     * Command acknowledgement

3. **Alignment with Declarative State Architecture**

   * Device state remains system-defined
   * No edge-side shadow state or conflict resolution

4. **Future Extensibility**

   * Gateways can later gain:

     * Offline buffering
     * Local safety rules
     * Edge effects
   * All as additive capabilities, not breaking changes

---

### Negative / Trade-offs

1. **Increased Responsibility on Processor**

   * Handles more concurrent connections
   * Larger security surface
   * Requires robust rate limiting and backpressure

2. **Session-Based Failover Only**

   * Gateway failure causes device disconnect
   * No seamless mid-session gateway handoff

3. **Reduced Edge Intelligence (Initially)**

   * No local coordination or buffering for direct devices
   * Offline behavior relies on device hardware safety

---

## Impacted Architecture Components

### 1. Device Registry (Updated)

* Must support mixed connectivity:

  * `connection_type = direct | via_gateway`
  * Optional `gateway_id` for active sessions
* Device identity is **independent of gateway**

---

### 2. Security Model (Shifted)

* Authentication and authorization move fully to the Processor
* Gateways are **not trust anchors**
* Device-level credentials become mandatory for direct devices

---

### 3. Processor (Expanded Responsibility)

* Becomes a true **IoT Core**
* Manages:

  * Device sessions
  * Rate limiting
  * Connection lifecycle
* Still remains the single orchestrator for:

  * State evaluation
  * Workflows / effects
  * Command dispatch

---

### 4. Gateway (Simplified)

* Reduced to a **protocol compatibility layer**
* Stateless beyond active sessions
* Optional deployment component

---

### 5. Edge Execution Model (Deferred)

* No mandatory edge workflows in Phase-1
* Edge intelligence becomes an **explicit future extension**, not a default assumption

---

## Non-Goals (Explicit)

* No gateway-based routing or load balancing
* No device multi-homing
* No gateway-owned device state
* No split-brain resolution between edge and cloud

---

## Future Considerations / Open Gaps

1. **Gateway capability escalation**

   * Offline buffering
   * Local safety enforcement
2. **Session handoff protocol**

   * Seamless gateway failover
3. **Observability**

   * Debugging physical-layer issues via gateway metadata
4. **Processor scaling strategy**

   * High fan-in device connectivity
5. **Gateway vs Processor execution boundaries**

   * When edge execution becomes justified

---

## Summary

This decision establishes a **cloud-first, device-centric connectivity model** with **optional, transparent gateways**, delivering:

* Minimal Phase-1 complexity
* Clear authority boundaries
* No routing ambiguity
* A clean evolutionary path toward smarter edge behavior

If you want next, I can:

* Update your **core architecture document** to reflect this ADR
* Define **gateway minimal protocol contracts**
* Produce a **Phase-1 vs Phase-2 capability matrix**
