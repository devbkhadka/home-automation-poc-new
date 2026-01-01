# IoT System Architecture Documentation

This directory contains the architectural specifications, design decisions, and system patterns for the IoT platform.

## Table of Contents

- [Terminology & Concepts](concepts.md) - Core system terminology and concepts.
- [User Stories & Use Cases](user-stories/device-registration.md) - Device registration use case.
- [IoTSystem Management](user-stories/iot-system-management.md) - Orchestration, state management, and workflows.
- [Device Subsystem](sub-systems/device-subsystem.md) - Physical, virtual, and proxy device architecture.

## System Overview
- **Scale**: Thousands of consumer devices.
- **Deployment**: Hybrid (Edge + Cloud).
- **Security**: Certificate-based device identity (mTLS).
- **Tenancy**: Multi-tenant.
