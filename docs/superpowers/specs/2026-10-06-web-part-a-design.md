# User Web Part A Design

## Goal

Extend the existing `Washer-Client` into a responsive user-facing web client using `Washer-App-v2` as the product and visual reference, while consuming `Washer-Backend-v2` APIs.

## Scope

- Shared HTTP, URL, and error handling layers.
- DataGSM OAuth login and callback token persistence.
- Access-token refresh, logout, and route protection.
- My-page, user withdrawal, and authenticated navbar.
- Notification list, unread count, and delete-all action.
- Web FCM token registration/removal and PWA service worker/manifest.
- Responsive mobile and desktop layouts.
- Remove password registration, password recovery, and admin routes from the user web.

## Non-goals

Reservation, machine, report, and administrator features are out of scope. `Washer-App-v2` and `Washer-Backend-v2` are references/dependencies only; they are not modified.

## API contract

Use the backend v2 endpoints under `/api/v2`: auth login/refresh/token status, `users/my`, `users/me`, `notifications`, and `notifications/fcm-token`. Backend v2 is OAuth-only, so the web does not implement email/password registration or password recovery.

## Architecture

Keep the existing v1 app as the implementation base. Consolidate requests behind shared HTTP helpers and an Axios interceptor. Keep authentication tokens in web cookies, centralize API URL constants and error normalization, and place user/notification data access behind focused domain modules. Use the app v2 flows and assets as reference without importing admin-only code.

## Acceptance criteria

- A DataGSM OAuth login stores tokens through `/auth/callback` and reaches the authenticated shell.
- Expired access tokens refresh once and retry queued requests; refresh failure clears the session and redirects to login.
- My-page loads the current user and can log out or withdraw.
- Navbar shows the notification count; notifications can be listed and deleted all.
- FCM and PWA setup works on supported browsers with permission denied handled gracefully.
- `/register`, `/forgot-password`, and `/admin` are unavailable or redirected, and no admin UI remains in the user web.
- Mobile and desktop layouts remain usable at the app's narrow viewport and laptop widths.
