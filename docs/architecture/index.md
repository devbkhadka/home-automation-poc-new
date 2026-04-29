# IoT System Architecture Documentation

This directory contains the architectural specifications, design decisions, and system patterns for the IoT platform.

## Table of Contents

### Core
- [Terminology & Concepts](concepts.md) - Core system terminology and concepts.

### Sub-systems

#### Device
- [Device Subsystem](sub-systems/device/device-subsystem.md) - Physical, virtual, and proxy device architecture.
- [Device Registration](sub-systems/device/device-registration.md) - Device onboarding and lifecycle management.

#### Gateways
- [Gateway Requirements](sub-systems/gateways/requirements.md) - Edge gateway specifications and interface.

#### IoT System
- [IoT System Management](sub-systems/iot-system/iot-system-management.md) - Orchestration and state management.

### Architectural Decision Records (ADR)
- [Device Discovery](decision-records/2026-01-10-device-discovery.md) - Strategy for local device discovery.
- [Handle Device Critical and Offline State](decision-records/2026-01-10-handle-device-critical-and-offline-state.md) - Safety handling at gateway and device levels.
- [Gateway as Adapter](decision-records/2026-01-11-gateway-as-adapter.md) - Pattern for hardware abstraction.

## System Overview
- **Scale**: Thousands of consumer devices.
- **Deployment**: Hybrid (Edge + Cloud).
- **Security**: Certificate-based device identity (mTLS).
- **Tenancy**: Multi-tenant.
