# SDCIMP Software Architecture & SRS Alignment Specification

## 1. Executive Summary
This document formalizes the architectural review of the Sina Dental Customer Information Management Platform (SDCIMP) against SRS Version 2.0.

## 2. Layered Architecture Verification
SDCIMP follows a strict three-tier architecture adhering to Domain-Driven Design (DDD) principles:
1. **Presentation Layer**: Express controllers, routes, and middleware (`src/Presentation`).
2. **Application Layer**: Isolated, single-responsibility use cases (`src/application`).
3. **Domain Layer**: Pure entities, domain services, value objects, and enums (`src/domain`).
4. **Infrastructure Layer**: Prisma ORM, MariaDB connection pools, JWT token service, password hashing, and real-time WebSocket/SignalR gateways (`src/Infrastructure`).
5. **Dependency Injection**: Centralized inversion-of-control container (`src/container/container.js`).

## 3. High-Priority Backend Tenets
- **Authentication**: Bcrypt hashing, email/phone normalization, rate-limited login.
- **Authorization & RBAC**: Strict separation of Dentist, Receptionist, and Customer. Customer scoped to own patient record.
- **JWT Verification**: Validates issuer (`sdcmis-sina-api`), audience (`sdcmis-sina_client`), expiration, algorithm (`HS256`).
- **Rate Limiting**: Tiered token bucket / window counters for auth (5 req/min) and API (100 req/min).
- **Caching**: In-memory cache for dashboard aggregates with event-driven invalidation.
- **Load Balancing**: Express trust proxy enabled, stateless tokens, cluster-ready server.

## 4. High-Priority Frontend UI/UX Tenets
- **Color Palette**: Creamish/white base (`#FDFBF7`, `#FFFFFF`, `#EAE6DF`).
- **Clickables**: Light green buttons (`#4CAF50`, `#43A047`).
- **Typography**: Clean, standard sans-serif (`Inter`, `system-ui`).
- **Zero Emojis**: Replaced with React Icons (`react-icons/fi`).
- **Zero Fluff**: Only necessary controls and data displays.
