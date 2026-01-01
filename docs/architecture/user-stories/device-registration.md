# User Stories & Use Cases: Device Registration

This document defines the process for onboarding new devices into the system, focusing on security and user experience.

---

## User Stories

### US-DR-001: Easy Onboarding (Default Config)
**As a** user, **I want** to receive a device with a default configuration and certificate **so that** the initial setup is seamless and secure out-of-the-box.
- **Acceptance Criteria**:
    - Device arrives with a factory-flashed default certificate.
    - Device has a unique, immutable GUID assigned at the factory.

### US-DR-002: Auto-Discovery
**As a** user, **I want** my new device to be automatically listed as "New Device Discovered" in the system as soon as it powers on and connects to the internet or gateway using local network.
- **Acceptance Criteria**:
    - Device uses its default certificate to identify itself to a discovery service.
    - User sees the device in their "New Devices" section.

### US-DR-003: Secure Registration (2FA)
**As a** user, **I want** to be prompted for two-factor authentication (2FA) when attempting to add a discovered device to my account **so that** unauthorized users cannot take control of my hardware.
- **Acceptance Criteria**:
    - Adding a device triggers a 2FA challenge (e.g., SMS, App, or physical button press on device).
    - Device registration fails if 2FA is not completed.

### US-DR-004: Identity Provisioning
**As a** system, **I want** to replace the factory certificate with a tenant-specific certificate after successful authentication **so that** the device is securely tied to the user's tenant.
- **Acceptance Criteria**:
    - Device generates a new CSR (Certificate Signing Request).
    - System issues and installs a tenant-scoped certificate.

### US-DR-005: Post-Registration Configuration
**As a** user, **I want** to give my device a custom name and assign it to a room/group after it is added **so that** I can easily identify it in my system.

### US-DR-006: Un-registering and Remote Reset
**As a** user, **I want** to be able to remove a device from my account and trigger a factory reset **so that** I can safely sell or dispose of the hardware without leaving my data or credentials on it.
- **Acceptance Criteria**:
    - User can initiate "Remove Device" from the app.
    - System invalidates the tenant-specific certificate.
    - Device receives a command to wipe local configuration and return to factory state (Discovery mode).

### US-DR-007: Managing Long-Term Offline Devices
**As a** user, **I want** to see a list of my devices that have been disconnected for a long period (e.g., > 30 days) **so that** I can troubleshoot them, replace batteries, or remove them if they are no longer in use.
- **Acceptance Criteria**:
    - Dashboard provides a "Long-term Offline" filter.
    - System sends a notification when a device has been offline for a configurable threshold.

### US-DR-008: Identifying Orphaned/Idle Devices
**As a** system administrator, **I want** to identify devices that are registered and online but haven't sent telemetry or received commands for an extended period **so that** I can investigate potential firmware bugs or service misconfigurations.
- **Acceptance Criteria**:
    - Report shows devices with "Last Activity" older than a specific threshold.
    - Admin can "Ping" or "Reboot" these devices to test responsiveness.

### US-DR-009: Firmware Integrity Check (Onboarding)
**As a** system, **I want** to verify the device's firmware version and signature during onboarding **so that** I can ensure only genuine, non-compromised hardware with the minimum required security version is granted a tenant certificate.
- **Acceptance Criteria**:
    - System checks firmware version before identity provisioning.
    - If version is below the "Minimum Secure Version", system forces an update before completion.

### US-DR-010: Automatic Firmware Updates
**As a** user, **I want** my devices to stay updated with the latest security patches and features automatically **so that** I don't have to manually manage maintenance for every device.
- **Acceptance Criteria**:
    - Devices check for updates during low-activity periods (e.g., 3 AM).
    - Updates are automatic by default, with a toggle for manual approval in advanced settings.

### US-DR-011: Outdated Firmware Reporting
**As a** system administrator, **I want** to see a list of all devices across all tenants that are running outdated or vulnerable firmware **so that** I can track update progress or investigate failing updates.
- **Acceptance Criteria**:
    - Admin dashboard includes an "Outdated Firmware" report.
    - Devices that consistently fail updates are flagged for manual intervention.

### US-DR-012: Automatic Certificate Rotation
**As a** system, **I want** to automatically rotate and renew tenant certificates well before they expire **so that** devices remain securely connected without requiring user re-registration.
- **Acceptance Criteria**:
    - System initiates renewal (CSR flow) when 20% of the certificate's validity remains.
    - Rotation happens seamlessly in the background without service interruption.

---

## Constraints & Future-proofing
- **Constraint: Factory Certificate Revocation**: A mechanism must exist to blacklist leaked factory certificates at the global discovery level. To prevent ghost copy devices, DDoS attacks, etc.
