---
trigger: always_on
---

# Workspace AI Agent Rules

Follow these rules strictly when contributing to this project.

## 1. Stack & Tools
- **Monorepo**: Use Nx for task orchestration and monorepo management.
- **Package Manager**: Use `pnpm`. Never use `npm` or `yarn`.
- **Build Tool**: Use Vite for frontend applications and library bundling.
- **Language**: Use TypeScript exclusively. Maintain strict type safety.

## 2. Architectural Integrity
- **Dependency Boundaries**: Strictly follow Nx library boundaries. Avoid circular dependencies.
- **Telemetry Abstraction**: Implement telemetry via an abstraction layer (e.g., `ITelemetryProvider`). While MQTT is the default, the system must remain protocol-agnostic.
- **State Pattern**: Use the **Desired State Pattern** for all device control logic.

## 3. Documentation & Consistency
- **Location**: All core documentation resides in the `docs/` folder.
- **Sync**: When modifying code (interfaces, schemas, or logic), proactively update the corresponding architectural documents in `docs/architecture/`.

## 4. Coding Standards
- **Component-Level Design**: Break down complex tasks into sub-components.
- **Interfaces First**: Define structural interfaces/contracts before implementing logic.
- **Error Handling**: Implement robust error handling and failure modes for distributed system components.
