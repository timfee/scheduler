# Architecture Documentation

This directory contains Architecture Decision Records (ADRs) and development guidelines for the Scheduler application.

## Quick Start

- **[Architecture Overview](./overview.md)** - High-level architectural approach and patterns
- **[ADR Template](./templates/adr-template.md)** - Template for documenting new architectural decisions
- **[Feature Template](./templates/feature-template.md)** - Template for creating new features

## Architecture Decision Records (ADRs)

ADRs document the important architectural decisions made for this project, including the context, decision, and consequences.

- [ADR-001: Manual State Management Over Libraries](./adr-001-manual-state-management.md)
- [ADR-002: Server Actions Over API Routes](./adr-002-server-actions.md)
- [ADR-003: Feature-based Architecture](./adr-003-feature-based-architecture.md)
- [ADR-004: Minimal Dependencies Approach](./adr-004-minimal-dependencies.md)
- [ADR-005: In-memory Solutions Over External Services](./adr-005-in-memory-solutions.md)
- [ADR-006: File Organization Patterns](./adr-006-file-organization-patterns.md)
- [ADR-007: Client-Server Communication Patterns](./adr-007-client-server-communication.md)
- [ADR-008: Date and Time Handling](./adr-008-date-time-handling.md)
- [ADR-009: Test Environment Setup](./adr-009-test-environment-setup.md)
- [ADR-010: Error Handling and User Feedback Patterns](./adr-010-error-handling-patterns.md)
- [ADR-011: Database Schema Evolution and Migration Patterns](./adr-011-database-schema-evolution.md)
- [ADR-012: Performance Optimization Strategies](./adr-012-performance-optimization.md)

## Development Guidelines

- [Feature Development Guidelines](./feature-development-guidelines.md)
- [Development Guidelines](./development-guidelines.md)

## Templates

- [ADR Template](./templates/adr-template.md) - For documenting architectural decisions
- [Feature Template](./templates/feature-template.md) - For creating new features

## Purpose

This documentation serves to:
- **Prevent over-engineering**: Clear guidelines on when to add complexity
- **Maintain consistency**: Help new developers understand established patterns
- **Preserve working solutions**: Document why current approaches work well
- **Guide decisions**: Provide clear criteria for architectural choices
- **Enforce patterns**: Custom ESLint rules automatically detect violations