# Sina Dental Clinic Information Management Platform (SDCIMP)

SDCIMP is a modern, real-time dental clinical management and patient information platform built in strict compliance with the Sina Dental SRS specification.

## Core Architectural Highlights

- **Clean Architecture**: Decoupled Presentation, Application, Domain, and Infrastructure layers.
- **Minimalist Neutral Design System**:
  - Crisp, sharp 0px rectangular geometry across all components, modals, inputs, badges, and tables (`borderRadius: 0`).
  - Professional neutral palette: deep slate/black (`#0F172A`), warm cream (`#FAF8F5`), clean white surfaces (`#FFFFFF`), and subtle slate borders (`#E2E8F0`).
  - Strictly zero emojis across frontend source code; 100% standard iconography via `react-icons`.
- **True Start-from-Zero Cold Boot**:
  - Zero hardcoded mock patients, tickets, or procedures.
  - Initial login presents clean, genuine empty states ready for real clinical patient registration and queue check-in.
- **Enterprise Security & Performance**:
  - JWT HS256 authentication with role-based access control (Dentist, Receptionist, Customer).
  - Horizontal patient privacy isolation per BR-05 / BR-31.
  - Sliding-window rate limiting on sensitive routes.
  - High-performance LRU caching with event-driven invalidation.
  - Real-time updates via SignalR and SSE with optimistic UI sync.

## Verification & Testing

Run all automated regression test suites:

```bash
# UI Design, Theme, Zero Radius, and Zero Dummy Data Audits
npm run test:ui

# Cold-Boot Repository Zero-State Suite
npm run test:coldboot

# End-to-End Backend & Frontend Verification
npm test
```
