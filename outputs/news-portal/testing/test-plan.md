---
project: "News Portal"
slug: "news-portal"
phase: "testing"
version: "1.0.0"
date: "2026-03-18"
status: "approved"
author: "SDLC Agent"
---

# Test Plan — News Portal

## 1. Introduction

This document defines the master test plan for the News Portal platform. It covers all test types, scope, tools, environments, entry/exit criteria, and risk-based priorities.

## 2. Test Scope and Objectives

### 2.1 In Scope

- All 30 user stories (US-001 through US-030) and their acceptance criteria
- 15 API routes with RBAC enforcement
- 9 frontend pages with SSR/ISR/CSR rendering
- 6 UI components
- 14 Prisma data model entities
- Security controls: authentication, authorization, input validation, headers
- Performance under expected load
- Accessibility compliance (WCAG 2.1 AA)
- Responsive design across breakpoints

### 2.2 Out of Scope

- Third-party OAuth provider internal testing (Google OAuth)
- AWS infrastructure provisioning testing (covered in deployment phase)
- Load testing beyond 500 concurrent users (deferred to production monitoring)
- BRD-006 (Revenue Generation) — deferred to future scope

### 2.3 Objectives

1. Verify all functional requirements are correctly implemented
2. Validate security controls against OWASP Top 10
3. Confirm performance meets NFR thresholds (P95 < 500ms API, < 3s page load)
4. Ensure WCAG 2.1 AA accessibility compliance
5. Achieve ≥ 95% test pass rate before GO recommendation

## 3. Test Types

| Type | Scope | Tool | Target |
|---|---|---|---|
| Unit | Validation schemas, RBAC logic, utilities | Jest | 38+ existing + additional |
| Integration | API routes with database, auth flows | Jest + Supertest | All 15 API routes |
| End-to-End | Full user journeys through browser | Playwright | 6 user journeys |
| Performance | Response times, throughput, scalability | k6 | Key endpoints under load |
| Security | OWASP Top 10, auth, input validation | OWASP ZAP + manual | All attack surfaces |
| Accessibility | WCAG 2.1 AA compliance | axe-core + Playwright | All 9 pages |

## 4. Test Environment

### 4.1 Software Stack

| Component | Version | Purpose |
|---|---|---|
| Node.js | 20.x LTS | Runtime |
| PostgreSQL | 16.x | Primary database |
| Redis | 7.x | Caching layer |
| Next.js | 14.x | Application framework |
| TypeScript | 5.x | Language |
| Prisma | Latest | ORM |

### 4.2 Test Infrastructure

| Environment | Purpose | Config |
|---|---|---|
| Local | Unit + Integration tests | SQLite/PostgreSQL, mock Redis |
| CI (GitHub Actions) | Automated test suite | PostgreSQL 16 service, Redis 7 service |
| Staging | E2E + Performance + Security | Production-equivalent infrastructure |

### 4.3 Test Data

- Seed script with 50 articles, 10 users (all roles), 100 comments, 5 categories, 20 tags
- Dedicated test accounts per role: reader, moderator, editor, reviewer, admin
- Isolated database per test run (transaction rollback strategy)

## 5. Entry and Exit Criteria

### 5.1 Entry Criteria

- [x] Development phase completed and code merged to feature branch
- [x] All 38 unit tests from development phase passing
- [x] Database schema migrations applied successfully
- [x] Test environment provisioned and accessible
- [x] Test data seeded

### 5.2 Exit Criteria

- [x] All test cases executed (0 blocked)
- [x] Pass rate ≥ 95%
- [x] Zero open Critical or High severity defects
- [x] All security tests executed with no critical findings
- [x] Accessibility audit shows no critical violations
- [x] Performance meets NFR thresholds
- [x] GO/NO-GO recommendation issued

## 6. Risk-Based Testing Priorities

| Risk Area | Priority | Rationale |
|---|---|---|
| Authentication & Authorization | P1-Critical | Data breach, unauthorized access |
| Article CRUD operations | P1-Critical | Core business functionality |
| Input validation (XSS, SQLi) | P1-Critical | Security vulnerability |
| Editorial workflow (submit/approve/reject) | P2-High | Business process integrity |
| Search functionality | P2-High | Core user experience |
| Comment moderation | P2-High | Content safety |
| User registration & profile | P2-High | User onboarding |
| Performance under load | P3-Medium | User experience degradation |
| Responsive design | P3-Medium | Mobile user experience |
| Accessibility | P3-Medium | Legal compliance, inclusivity |
| Social sharing / Notifications | P4-Low | Non-critical features |
| Analytics dashboard | P4-Low | Internal tooling |

## 7. Test Schedule

| Phase | Duration | Activities |
|---|---|---|
| Test Preparation | Day 1 | Environment setup, data seeding, tool configuration |
| Unit Testing | Day 1–2 | Execute and verify all unit tests |
| Integration Testing | Day 2–3 | API route testing with database |
| E2E Testing | Day 3–4 | User journey automation |
| Security Testing | Day 4–5 | OWASP ZAP scan, manual pen testing |
| Performance Testing | Day 5 | k6 load tests |
| Accessibility Testing | Day 5 | axe-core automated + manual audit |
| Defect Resolution | Day 5–6 | Fix and retest defects |
| Final Report | Day 6 | GO/NO-GO recommendation |

## 8. Roles and Responsibilities

| Role | Responsibility |
|---|---|
| QA Lead (SDLC Agent) | Test planning, execution, reporting |
| Development Team | Defect fixes, unit test maintenance |
| Security Reviewer | Security test validation |
| Product Owner | Acceptance criteria validation, GO/NO-GO decision |

## 9. Defect Management

### 9.1 Severity Classification

| Severity | Definition | SLA |
|---|---|---|
| Critical | System crash, data loss, security breach | Must fix before release |
| High | Major feature broken, no workaround | Must fix before release |
| Medium | Feature partially broken, workaround exists | Fix in next sprint |
| Low | Cosmetic, minor UX issue | Backlog |

### 9.2 Defect Lifecycle

New → Assigned → In Progress → Fixed → Verified → Closed

## 10. Tools Configuration

```yaml
jest:
  config: jest.config.ts
  coverage_threshold:
    branches: 80
    functions: 80
    lines: 80
    statements: 80

playwright:
  browsers: [chromium, firefox, webkit]
  base_url: http://localhost:3000
  retries: 2
  timeout: 30000

k6:
  vus: 100
  duration: 5m
  thresholds:
    http_req_duration: ["p(95) < 500"]
    http_req_failed: ["rate < 0.01"]

owasp_zap:
  target: http://localhost:3000
  scan_type: full
  policy: default

axe_core:
  standard: wcag21aa
  exclude: []
```
