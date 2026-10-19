# Frontend Agent Instructions

## Before Starting Any Task

Read:

1. `frontend_rules.md`
2. Relevant files in the current frontend implementation
3. `API_REFERENCE.md` if it exists and the task involves backend communication

When implementing a Figma-based page, inspect only the relevant Figma selection provided in the task.

Do not inspect or implement unrelated designs unless required.

---

# Current Milestone: Landing Page and Authentication

The current milestone implements the public landing page, authenticated landing state, authentication pages, authentication flow, and the initial dashboard placeholder.

Do not implement other application features yet.

Do not modify backend code.

---

# Pages

## `/`

The root page has two visual states using the same overall layout:

### Unauthenticated

Use:

`[Design 1]`

This is the landing page shown when the user is not authenticated.

### Authenticated

Use:

`[Design 2]`

This is the authenticated version of the same root page layout.

The two states should share reusable layout/components where appropriate.

Do not duplicate the entire page structure merely because the content differs.

---

## `/auth`

Use:

`[Design 3]`

This is the login page.

---

## `/auth/register`

Use:

`[Design 4]`

This is the registration page.

---

## `/auth/email-verification`

Use:

`[Design 5]`

This page informs the user that an email verification message has been sent.

The email address used for registration or resend verification must be temporarily stored in `sessionStorage`.

The purpose of storing the email in `sessionStorage` is to allow the user to refresh this page and still perform the resend-verification action.

Do not use `sessionStorage` as the authentication state.

---

## `/auth/verify-email`

This route is opened from the verification link contained in the email.

Expected URL:

```text
/auth/verify-email?token=<token>
```

This page is primarily a verification action rather than a normal UI page.

Flow:

1. Read the verification token from the URL.
2. Call the backend `/verify-email` endpoint.
3. Handle success and failure appropriately.
4. On successful verification, redirect the user to `/auth/setup`.
5. Do not implement unnecessary UI for this route unless required to represent loading/error states.

Do not expose or persist the verification token unnecessarily.

---

## `/auth/setup`

Use:

`[Design 6]`

This page is shown after successful email verification when the user still needs to complete account setup.

---

## `/dashboard`

Create a minimal placeholder page for now.

No dashboard functionality needs to be implemented yet.

The page only needs to establish the destination for a successful completed login flow.

---

# Authentication Flow

Implement the following authentication states:

```text
REGISTERED
    ↓
EMAIL VERIFICATION REQUIRED
    ↓
EMAIL VERIFIED
    ↓
SETUP REQUIRED
    ↓
AUTHENTICATED
```

---

## Registration

Flow:

```text
/auth/register
      ↓
Register API
      ↓
Verification email sent
      ↓
Store email in sessionStorage
      ↓
/auth/email-verification
```

The registration page must not assume that email verification has already occurred.

---

## Email Verification

The email verification page must:

* display the appropriate verification state
* retain the email in `sessionStorage`
* allow resend verification
* call the backend resend-verification endpoint when requested
* remain usable after a browser refresh

If the user requests another verification email, keep the relevant email available in `sessionStorage`.

---

## Verification Link

The verification link uses:

```text
/auth/verify-email?token=<token>
```

The page must call the backend `/verify-email` endpoint.

On successful verification:

```text
/auth/verify-email
        ↓
/auth/setup
```

---

# Forced Login Scenarios

When a user attempts to log in, the backend/authentication state may indicate different account states.

Handle these states explicitly.

## Unverified User

If login is attempted but the account has not verified its email:

```text
Login
  ↓
Backend indicates email not verified
  ↓
Call resend-verification
  ↓
Store email in sessionStorage
  ↓
/auth/email-verification
```

Do not treat this state as a successful login.

---

## Setup Not Completed

If the user successfully authenticates but has not completed the required account setup:

```text
Login
  ↓
Authentication successful
  ↓
Setup incomplete
  ↓
/auth/setup
```

---

## Fully Completed Account

If the user successfully authenticates and has completed setup:

```text
Login
  ↓
Authentication successful
  ↓
Setup completed
  ↓
/dashboard
```

---

# Authentication Redirect Rules

Use the backend response/authentication state as the source of truth.

Do not infer account state merely from the existence of client-side storage.

The following states must remain conceptually separate:

```text
Not authenticated
Authenticated but email unverified
Authenticated and email verified but setup incomplete
Authenticated and setup complete
```

If the backend API uses different names or response structures, follow the actual backend contract documented in `API_REFERENCE.md`.

Do not invent API response fields.

---

# Server vs Client Components

Follow `frontend_rules.md`.

Pages should remain Server Components unless they genuinely require client-side functionality.

Authentication forms will generally require client-side interaction.

Keep interactive portions isolated to the smallest appropriate Client Components.

Do not make an entire route a Client Component simply because its form is interactive.

Where possible:

```text
Server Page
    ↓
Client Form
    ↓
API layer
```

instead of:

```text
Client Page
    ↓
Everything
```

---

# API Integration

Use the centralized Axios/API layer defined by `frontend_rules.md`.

Before implementing API calls:

1. Check `API_REFERENCE.md`.
2. Confirm the actual endpoint.
3. Confirm the request body.
4. Confirm the response structure.
5. Confirm authentication requirements.
6. Confirm error responses.

Never invent API contracts.

If the backend contract is ambiguous or missing, inspect the backend implementation before making assumptions.

Do not modify the backend to make frontend implementation easier.

---

# Figma Implementation

For each page:

1. Inspect the provided Figma selection.
2. Identify the shared layout between designs.
3. Identify reusable components.
4. Implement the page according to the Figma design.
5. Preserve the existing design tokens and typography.
6. Verify responsive behavior.
7. Compare the result against Figma.
8. Fix visual discrepancies.

Do not implement all pages in one operation.

Implement one page/flow at a time.

---

# Implementation Order

Follow this order unless a task explicitly requests otherwise:

1. Verify frontend project setup.
2. Configure fonts and semantic color tokens.
3. Configure centralized Axios/API infrastructure.
4. Implement authentication infrastructure.
5. Implement `/auth`.
6. Implement `/auth/register`.
7. Implement `/auth/email-verification`.
8. Implement `/auth/verify-email`.
9. Implement `/auth/setup`.
10. Implement `/` unauthenticated state.
11. Implement `/` authenticated state.
12. Create `/dashboard` placeholder.
13. Verify all authentication transitions.

---

# Scope Discipline

For each task:

* Implement only the requested page or flow.
* Reuse existing infrastructure.
* Do not rebuild existing components without a reason.
* Do not modify unrelated routes.
* Do not implement dashboard functionality beyond the requested placeholder.
* Do not implement future application features.
* Do not modify backend code.
* Do not add dependencies unless necessary.

After completing the task, report:

1. Files created.
2. Files modified.
3. APIs integrated.
4. Authentication flow implemented.
5. Verification performed.
6. Any ambiguity or backend contract that requires clarification.
