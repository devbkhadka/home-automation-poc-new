# User Stories & Use Cases: IoTSystem Management

This document defines the requirements for managing `IoTSystem` entities, covering orchestration, state management, workflows, and dashboards.

---

## Overview
An `IoTSystem` is a higher-level abstraction that groups multiple devices and defines their collective behavior through reactive states and workflows.

---

## User Stories

### US-ISM-001: Create and Manage IoTSystem
**As a** user, **I want** to create a new `IoTSystem` **so that** I can group multiple devices and define their collective behavior.
- **Acceptance Criteria**:
    - User can create a new `IoTSystem` with a unique name and description.
    - User can select registered devices to include in the system.
    - User can apply data transformation templates to device data streams.

### US-ISM-002: Computed State Management
**As a** developer, **I want** to define computed states with initializer functions and dependencies **so that** the system can automatically derive complex states from raw device data or other internal states.
- **Acceptance Criteria**:
    - States are recalculated automatically when any of their dependencies change.
    - Computed values are memoized to optimize performance.
    - System detects and prevents circular dependencies (DAG enforcement).
    - System handles "Stale" status when a dependency becomes unavailable.

### US-ISM-003: Modifiable State Management
**As a** user/workflow, **I want** to define modifiable states with setter functions **so that** I can manually control system behavior or store intermediate results.
- **Acceptance Criteria**:
    - States can be updated via setter functions in effect or event handlers.
    - User can specify if a state is volatile (cleared on restart) or persistent (stored in DB).

### US-ISM-004: State Merging & Initialization
**As a** developer, **I want** to merge the output of multiple initializer functions into a single state **so that** complex state logic can be modularized.
- **Acceptance Criteria**:
    - State value can be derived from the combined output of multiple initializers.
    - System uses a deterministic conflict resolution strategy (e.g., Priority-based or Timestamp-based) for overlapping updates.

### US-ISM-005: Workflow Orchestration
**As a** user, **I want** to define workflows that set internal states, call external APIs, and trigger events **so that** I can automate complex routines.
- **Acceptance Criteria**:
    - Workflows can be triggered by state changes, timers (cron), or external webhooks.
    - Constraint: Workflows cannot set device state directly (must use command abstraction).
    - Workflows support basic error handling, timeouts, and configurable retry policies.

### US-ISM-006: Edge vs. Cloud Execution
**As a** system architect, **I want** to configure where a workflow executes (Edge or Cloud) **so that** I can optimize for latency or compute availability.
- **Acceptance Criteria**:
    - Each workflow has an "Execution Environment" setting (Edge/Cloud/Auto).
    - Edge workflows run locally even without internet connectivity.

### US-ISM-007: Device State Reconciliation
**As a** system, **I want** to use a "Desired State" pattern for device interactions **so that** commands are eventually consistent even with intermittent connectivity.
- **Acceptance Criteria**:
    - Workflows emit a "Desired State" event for devices.
    - A reconciliation service attempts to apply the desired state to the device and reports back "Status".
    - **Retry Logic**: If a device does not respond or acknowledge, the Processor retries with exponential backoff.
    - **Unreachable Detection**: After a configured timeout (multiple failed retries or prolonged silence), the device is marked as **Unreachable** and reconciliation stops.
    - **State Refresh on Reconnection**: When a device reconnects after being unreachable:
        - Processor requests fresh telemetry from the device
        - System states dependent on the device are re-evaluated
        - Reconciliation resumes with the current desired state
    - **Status Tracking**: Connection status (`Online`, `Unreachable`) is tracked separately from sync status (`Synced`, `Pending`).

### US-ISM-008: Visualization & Dashboards
**As a** user, **I want** to define dashboards with analytics and visualizations **so that** I can monitor system performance and status at a glance.
- **Acceptance Criteria**:
    - Dashboards support real-time data visualization.
    - Dashboards allow querying historical data for long-term analytics.
    - Access control (RBAC) ensures only authorized users can view or interact with specific dashboards.

---

## Trade-offs & Gaps

| Feature | Trade-off | Gap/Risk |
| :--- | :--- | :--- |
| **Computed States** | Performance (Memoization) vs. Memory overhead. | High-frequency updates could cause "Event Storms" through the dependency graph. |
| **Edge vs Cloud Execution** | Latency/Reliability (Edge) vs. Complexity/Resources (Cloud). | Lack of a unified runtime that can seamlessly migrate functions between Edge and Cloud. |
| **Desired State Pattern** | Decoupling/Resilience vs. Latency/Complexity for simple "Set Brightness" tasks. | Requires robust tracking of "In-progress" vs. "Sync'ed" state. |

---

## Constraints & Guardrails

- **Constraint: Max Dependency Depth**: Limit computed state chains to prevent stack overflows and latency spikes.
- **Constraint: No Direct Device Set**: Enforce the separation of system logic from device drivers through the command abstraction.
- **Guardrail: Tenant Quotas**: Enforce limits on the number of states, workflows, and events per `IoTSystem`.
