# Frontend Engineering Rules

## Stack

* Framework: Next.js
* Language: TypeScript
* HTTP client: Axios
* Backend location: `../backend`
* Styling: Tailwind CSS

---

## Architecture

### Server Components

React Server Components are the default.

A component MUST NOT use `"use client"` unless it genuinely requires:

* browser APIs
* React state
* React effects
* event handlers
* client-side interaction
* client-only third-party libraries

When `"use client"` is necessary:

* Keep the Client Component boundary as small as possible.
* Do not convert an entire page into a Client Component when only a child component requires client-side behavior.
* Prefer passing server-fetched data into Client Components as props.
* Keep data fetching outside Client Components whenever practical.

Do not add `"use client"` merely because a component displays dynamic data.

---

## Data Fetching

Initial page data should preferably be fetched on the server.

Do not use:

```tsx
useEffect(() => {
  fetch(...)
}, [])
```

for initial page data unless there is a specific technical reason.

Prefer:

```text
Server Component
    ↓
Server-side API request
    ↓
Render page
    ↓
Client Components only where interaction is required
```

Server-side requests should happen before rendering whenever practical.

Do not move server-side data fetching to the client simply to simplify implementation.

---

## HTTP / Axios

Use axios instance in app/lib/api/client.ts

Do not access:

* `window`
* `document`
* `localStorage`
* `sessionStorage`

from code that may execute on the server.

Browser-only authentication or storage behavior must be isolated to Client Components or browser-specific utilities.

---

## Absolute Rule: No Next.js API

NEVER create an API or backend endpoint inside the Next.js application.

This means:

- NEVER create app/api/
- NEVER create a Next.js Route Handler
- NEVER create route.ts or route.js
- NEVER create API endpoints inside Next.js
- NEVER create a proxy endpoint that forwards requests to the backend
- NEVER recreate or wrap an existing backend endpoint in Next.js
- NEVER create a Next.js API layer that exists only to communicate with the actual backend

All API requests must go directly between the frontend and the existing backend.

If the frontend needs data from the backend:

Next.js Frontend
      ↓
apiClient
      ↓
Existing Backend API

Never:

Next.js Component
      ↓
Next.js Route Handler
      ↓
Backend API

If a task appears to require creating a Next.js API endpoint, do not create it. Re-evaluate the requirement and use the existing backend API directly.

## Authentication

Authentication logic must be centralized.

Pages and UI components must not independently implement authentication rules or duplicate authentication state logic.

Authentication-related API calls should be implemented in the API layer.

Authentication redirects should be handled through a centralized mechanism where practical.

Distinguish between:

1. authenticated state
2. email verification state
3. account setup completion state

Do not use `sessionStorage` as the primary source of authentication state.

`sessionStorage` may be used for temporary UI flow state, such as the email address required for resending an email verification request.

---

## Components

Separate:

* page composition
* server-side data fetching
* API communication
* business logic
* reusable UI
* client-side interaction

Prefer reusable components when the same UI pattern appears in multiple pages.

Do not create abstractions prematurely when a component is only used once.

---

## Design System

Use the following semantic color tokens throughout the application.

The colors must be configured as Tailwind theme variables so they can be used through semantic Tailwind classes such as:

```text
bg-surface
text-on-surface
bg-primary
text-on-primary
bg-primary-container
text-on-primary-container
border-outline
```

Do not repeatedly use raw hexadecimal values inside components.

### Colors

```text
surface: '#faf8ff'
surface-dim: '#d2d9f4'
surface-bright: '#faf8ff'
surface-container-lowest: '#ffffff'
surface-container-low: '#f2f3ff'
surface-container: '#eaedff'
surface-container-high: '#e2e7ff'
surface-container-highest: '#dae2fd'

on-surface: '#131b2e'
on-surface-variant: '#404942'

inverse-surface: '#283044'
inverse-on-surface: '#eef0ff'

outline: '#707971'
outline-variant: '#c0c9c0'

surface-tint: '#2d6a48'

primary: '#003820'
on-primary: '#ffffff'
primary-container: '#0f5132'
on-primary-container: '#84c39b'
inverse-primary: '#95d4ac'

secondary: '#006c49'
on-secondary: '#ffffff'
secondary-container: '#6cf8bb'
on-secondary-container: '#00714d'

tertiary: '#1000a8'
on-tertiary: '#ffffff'
tertiary-container: '#2e2dbe'
on-tertiary-container: '#abadff'

error: '#ba1a1a'
on-error: '#ffffff'
error-container: '#ffdad6'
on-error-container: '#93000a'

primary-fixed: '#b0f1c7'
primary-fixed-dim: '#95d4ac'
on-primary-fixed: '#002111'
on-primary-fixed-variant: '#0f5132'

secondary-fixed: '#6ffbbe'
secondary-fixed-dim: '#4edea3'
on-secondary-fixed: '#002113'
on-secondary-fixed-variant: '#005236'

tertiary-fixed: '#e1e0ff'
tertiary-fixed-dim: '#c0c1ff'
on-tertiary-fixed: '#07006c'
on-tertiary-fixed-variant: '#2f2ebe'

background: '#faf8ff'
on-background: '#131b2e'

surface-variant: '#dae2fd'
```

---

## Typography

Use `Manrope` as the global font.

Do not introduce another font unless explicitly requested.

---

## Icons

Use library `react-icons` for icons. Only generate SVG code when the icon you want to create isn't available in `react-icons`.

## Figma

When implementing a page from a Figma selection:

1. Inspect the selected Figma design.
2. Understand its layout hierarchy.
3. Identify reusable patterns.
4. Identify responsive behavior.
5. Implement the page.
6. Compare the implementation against the Figma design.
7. Fix relevant visual discrepancies.

Do not modify unrelated pages or components.

Do not redesign the Figma design unless explicitly requested.

The Figma design is the visual source of truth for the page being implemented.

---

## Responsive Design

Implement the design responsively.

Preserve the intended visual hierarchy across:

* desktop
* tablet
* mobile

Do not create separate page implementations for each breakpoint unless technically necessary.

---

## Scope Control

When implementing a task:

* Modify only files relevant to the task.
* Do not modify the backend unless explicitly requested.
* Do not refactor unrelated code.
* Do not introduce new dependencies unless necessary.
* Do not redesign existing pages.
* Do not change API contracts.
* Do not implement future features speculatively.
* Do not create duplicate components when an existing component can be reused.
* Do not make unrelated improvements merely because they are possible.

If an existing implementation conflicts with these rules and fixing it is necessary for the requested task, fix only the minimum required portion.

---

## Verification

After implementation:

1. Run the appropriate type checking/build checks.
2. Check for lint errors.
3. Verify that the requested page/flow works.
4. Verify that unrelated existing functionality was not broken.

Do not perform broad refactoring as part of verification.
