# User Web Part A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Part A user web foundation in `Washer-Client` against `Washer-Backend-v2`.

**Architecture:** Keep `Washer-Client` as the implementation base. Introduce shared API helpers and auth/session handling first, then add user and notification slices, followed by PWA and responsive shell cleanup. `Washer-App-v2` is a reference only.

**Tech Stack:** Next.js, React, TypeScript, Axios, React Query where already present, Firebase Cloud Messaging, PWA service worker.

**Spec:** `docs/superpowers/specs/2026-10-06-web-part-a-design.md`

## Global Constraints

- Modify only `Washer-Client`.
- Use `Washer-Backend-v2` `/api/v2` contracts.
- Do not add email/password auth; OAuth is the only auth flow.
- Do not implement reservations, machines, reports, or admin features.
- Preserve responsive mobile and laptop layouts.

## Review Focus

- Concurrent 401 responses must trigger one refresh and retry safely.
- Refresh failure must clear every auth cookie and return to login.
- OAuth callback failures and missing codes must not create a partial session.
- Notification count must not block the navbar when the API is unavailable.
- FCM permission denial and unsupported browsers must remain usable.

### Task 1: Shared API foundation

**Files:** `src/shared/lib/api-request.ts`, `src/shared/lib/api-urls.ts`, `src/shared/lib/api-error.ts`, tests for URL/error behavior.

- [ ] Add failing tests for URL construction and normalized API errors.
- [ ] Implement shared request helpers and error normalization.
- [ ] Run focused tests, then lint/type-check.
- [ ] Commit as `feat: 공통 API 기반 추가`.

### Task 2: OAuth auth and session

**Files:** login/callback routes and pages, auth cookie/session helpers, middleware, auth tests.

- [ ] Add failing tests for callback success/failure and refresh behavior.
- [ ] Implement DataGSM OAuth callback, token cookies, refresh retry, logout, and guard.
- [ ] Verify login, refresh, logout, and failure paths.
- [ ] Commit as `feat: DataGSM OAuth 인증 추가`.

### Task 3: User account surface

**Files:** my-page route/components, user API/types, navbar, route cleanup.

- [ ] Add failing tests for user mapping and withdrawal/logout cleanup.
- [ ] Implement my-page, withdrawal, navbar account actions, and remove register/forgot/admin routes.
- [ ] Verify authenticated and unauthenticated navigation.
- [ ] Commit as `feat: 사용자 계정 기능 추가`.

### Task 4: Notifications, FCM, and PWA

**Files:** notification API/types/hooks/components, FCM service worker/bootstrap, manifest, responsive shell.

- [ ] Add failing tests for notification mapping/count/delete behavior.
- [ ] Implement notification list/delete-all, navbar count, FCM token lifecycle, PWA metadata, and responsive layout.
- [ ] Verify mobile/desktop rendering and permission-denied behavior.
- [ ] Commit as `feat: 웹 알림과 PWA 추가`.

### Final verification and PRs

- [ ] Run formatting, lint, type-check, build, and focused tests.
- [ ] Create stacked PRs from each branch into the next branch, with `develop` as the first base.
- [ ] Attach screenshots and validation results to UI PRs.
