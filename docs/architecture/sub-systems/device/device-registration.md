# Device Registration & Onboarding

## Requirements Specification

---

## 1. Purpose

This document defines the functional and non-functional requirements for registering devices into the Modular Home Automation Platform.

The registration flow ensures that:

* Only authorized devices are admitted into the system
* Device identity and credentials are centrally managed by the Processor
* Network access alone is insufficient for system access
* Devices can be individually revoked without affecting others
* Gateways remain transparent transport adapters

---

## 2. Scope

### In Scope

* Directly connected devices
* Gateway-backed incompatible devices (via virtual devices)
* Secure network-based discovery
* Human-in-the-loop authorization with 2FA
* Device-specific credential provisioning

### Out of Scope

* Bluetooth-based provisioning
* Peer-to-peer discovery
* Zero-touch onboarding
* Cross-system device migration

---

## 3. Actors

| Actor       | Description                                         |
| ----------- | --------------------------------------------------- |
| Device      | Physical or virtual unit seeking registration       |
| Processor   | Authoritative orchestration and identity core       |
| User        | Human approving device registration                 |
| Gateway     | Optional transport adapter for incompatible devices |
| IoT Network | Isolated network segment for onboarding             |

---

## 4. Preconditions

* Device firmware supports:

  * Secure storage
  * HTTPS communication
  * DNS resolution
* An isolated IoT network exists with:

  * DHCP
  * Internal DNS
  * Restricted outbound access
* Processor exposes:

  * Discovery endpoint
  * Authorization endpoint
  * Profile provisioning endpoint

---

## 5. Functional Requirements

### FR-1: Network Bootstrap

**Description**
Devices MUST obtain limited network access before registration.

**Requirements**

* Devices MUST connect to an isolated IoT network.
* Network MUST restrict access to registration endpoints only.
* Network MUST provide internal DNS for well-known endpoints.

---

### FR-2: Device Advertisement

**Description**
Devices MUST announce their presence after network bootstrap.

**Requirements**

* Devices MUST send a discovery advertisement to the Processor.
* Advertisement MUST include:

  * Device identity hint
  * Device class
  * Firmware version
  * Capability signature
* Advertisement endpoint MUST be rate-limited and idempotent.
* Advertisement MUST NOT create a Device Registry entry.

---

### FR-3: Pending Discovery State

**Description**
Discovered devices MUST remain unregistered until authorized.

**Requirements**

* Processor MUST maintain a temporary discovery record.
* Discovered devices MUST be visible as “Pending Devices”.
* No telemetry or command exchange is permitted in this state.

---

### FR-4: Human Authorization with 2FA

**Description**
Device registration MUST require explicit authorization.

**Requirements**

* Users MUST explicitly approve device registration.
* Authorization MUST require two-factor authentication.
* Authorization MUST bind:

  * Device
  * User
  * Target system
* Authorization MUST be time-bound.

---

### FR-5: Device Registry Entry Creation

**Description**
Authorized devices MUST be formally registered.

**Requirements**

* Processor MUST create a Device Registry entry only after authorization.
* Registry entry MUST include:

  * Device ID
  * Capabilities
  * Metadata
  * System association
* Devices MUST have a default state of `unknown`.

---

### FR-6: Device-Specific Credential Issuance

**Description**
Each device MUST receive unique credentials.

**Requirements**

* Processor MUST generate a unique credential per device.
* Credentials MUST:

  * Be individually revocable
  * Be scoped to device permissions
* Credential compromise MUST NOT affect other devices.

---

### FR-7: Device Profile Provisioning

**Description**
Devices MUST receive configuration required for operation.

**Requirements**

* Processor MUST provide a Device Profile containing:

  * Transport configuration
  * Endpoints
  * Allowed data flows
  * Retry and backoff policies
* Device MUST securely persist the profile.

---

### FR-8: Authenticated Session Establishment

**Description**
Devices MUST authenticate before becoming operational.

**Requirements**

* Devices MUST authenticate using issued credentials.
* Processor MUST enforce a single active session per device.
* Bootstrap network access MUST no longer be sufficient.

---

### FR-9: Operational Participation

**Description**
Registered devices MUST fully participate in the system.

**Requirements**

* Devices MUST send sensor telemetry asynchronously.
* Devices MUST subscribe to desired state commands.
* Processor MUST evaluate device state declaratively.

---

### FR-10: Gateway Transparency

**Description**
Gateways MUST remain transparent to the system.

**Requirements**

* Processor MUST only interact with gateway virtual devices.
* Gateways MUST handle physical device authentication internally.
* Physical devices MUST NOT appear in the Device Registry.

---

## 6. Non-Functional Requirements

### NFR-1: Security

* Network access alone MUST NOT grant system access.
* All communication MUST be encrypted.
* Credentials MUST support revocation and rotation.

---

### NFR-2: Scalability

* Discovery endpoints MUST support high-volume concurrent requests.
* Authorization flow MUST support parallel approvals.

---

### NFR-3: Reliability

* Discovery MUST be retryable and idempotent.
* Registration MUST be resilient to transient failures.

---

### NFR-4: Observability

* Each registration step MUST emit structured events.
* Failures MUST include diagnostic codes.

---

## 7. Error Handling Requirements

* Devices MUST implement exponential backoff on failures.
* Authorization timeouts MUST return devices to discovery state.
* Invalid credentials MUST immediately terminate sessions.

---

## 8. Compliance & Auditability

* All authorization actions MUST be auditable.
* Device lifecycle transitions MUST be logged.
* Credential issuance and revocation MUST be traceable.

---

## 9. Assumptions & Constraints

* Bluetooth is not available.
* Gateways are optional.
* Processor is the sole authority for identity and state.

---

## 10. Known Gaps & Future Enhancements

1. Automated credential rotation
2. Offline-first registration
3. Bulk device onboarding
4. Device reassignment across systems
5. Enhanced debugging visibility

