# Frontend Engineering Rules

## 1. Project Principles

This project is a frontend application built with Next.js and TypeScript.

The backend already exists separately in:

```text
../backend
```

The backend is the **only backend/API of this project**.

Next.js is used only as the frontend application.

### Absolute Rule: No Next.js API

**NEVER create an API or backend endpoint inside the Next.js application.**

This means:

- NEVER create `app/api/`
- NEVER create a Next.js Route Handler
- NEVER create `route.ts` or `route.js`
- NEVER create API endpoints inside Next.js
- NEVER create a proxy endpoint that forwards requests to the backend
- NEVER recreate or wrap an existing backend endpoint in Next.js
- NEVER create a Next.js API layer that exists only to communicate with the actual backend

All API requests must go directly between the frontend and the existing backend.

If the frontend needs data from the backend:

```text
Next.js Frontend
      ↓
apiClient
      ↓
Existing Backend API
```

Never:

```text
Next.js Component
      ↓
Next.js Route Handler
      ↓
Backend API
```

If a task appears to require creating a Next.js API endpoint, **do not create it**. Re-evaluate the requirement and use the existing backend API directly.

---



# 2. Stack

- Framework: Next.js
- Language: TypeScript
- HTTP client: Axios
- Styling: Tailwind CSS
- Backend location: `../backend`

---



# 3. Minimize Files and Abstractions

Prefer the **simplest implementation that satisfies the requirement**.

Do not create files merely to follow an abstract architecture.

### Strong rule

**Do not create a new file unless it is actually needed.**

Before creating a new file, determine whether the functionality can reasonably exist in:

- the current page
- the current component
- an existing component
- an existing utility
- an existing action
- the existing `apiClient`

Avoid creating:

- unnecessary service files
- unnecessary repository files
- unnecessary API modules
- unnecessary utility files
- unnecessary wrapper components
- unnecessary hooks
- unnecessary types files
- unnecessary abstraction layers

Do not split a simple piece of logic into a separate file just because it technically could be extracted.

Prefer:

```text
Simple requirement
      ↓
Existing file
```

over:

```text
Simple requirement
      ↓
New abstraction
      ↓
New service
      ↓
New utility
      ↓
New wrapper
```

Only introduce an abstraction when:

1. the logic is genuinely complex,
2. the logic is reused,
3. the logic requires a server-only boundary,
4. or keeping it in the current file would make the code substantially harder to understand.

---



# 4. Server Components

React Server Components are the default.

Prefer Server Components whenever possible.

A component MUST NOT use:

```tsx
"use client"
```

unless it genuinely requires client-side functionality such as:

- browser APIs
- React state
- React effects
- event handlers
- client-side interaction
- client-only third-party libraries

When `"use client"` is required:

- keep the Client Component boundary as small as possible
- do not convert an entire page into a Client Component unnecessarily
- keep unrelated parts of the page as Server Components

Do not use `"use client"` simply because a component displays dynamic data.

---



# 5. Data Fetching

Prefer server-side data fetching for data required during the initial page render.

For example:

```text
Server Component
      ↓
apiClient
      ↓
Backend API
      ↓
Render page
```

Do not use:

```tsx
useEffect(() => {
  fetch(...)
}, [])
```

for initial page data unless there is a specific technical reason.

Do not move server-side data fetching to the client merely for convenience.

However, do not create additional abstraction files merely to make server-side data fetching possible.

Use the simplest appropriate implementation.

---



# 6. Axios

The application MUST use exactly **one Axios instance**.

The instance is named:

```text
apiClient
```



### Absolute rule

**NEVER create another Axios instance.**

Do not use:

```ts
axios.create(...)
```

anywhere except the existing `apiClient` definition.

Do not create:

- another Axios instance
- feature-specific Axios instances
- authentication-specific Axios instances
- server-specific Axios instances
- client-specific Axios instances

All backend requests must use:

```ts
apiClient
```

Example:

```ts
apiClient.get(...)
apiClient.post(...)
apiClient.put(...)
apiClient.patch(...)
apiClient.delete(...)
```

Do not create another HTTP client unless explicitly instructed.

---



# 7. API Calls

API calls should use the simplest reasonable location.

### Simple API calls

If an API call is simple and only used by one component/page, it may be performed directly in that component/page using `apiClient`.

For example:

```ts
const response = await apiClient.get("/profile")
```

Do not create a separate file such as:

```text
services/profile.ts
api/profile.ts
repositories/profile.ts
```

just for a simple request.

### Complex API logic

Extract API-related logic only when the operation is genuinely complex, for example when it:

- requires multiple API calls
- requires significant data transformation
- contains complicated business logic
- is reused by multiple places
- requires server-only functionality
- requires a meaningful reusable abstraction

Even then, keep the number of new files to the minimum necessary.

### Important

Do NOT interpret "centralized API communication" as a requirement to create an API/service file for every endpoint.

The centralized part is the **single** `apiClient` **instance**, not a large collection of API wrapper files.

---



# 8. Server-Only Operations

Sometimes the frontend needs access to functionality that is only available on the server, such as:

- cookies
- server-only request information
- other Next.js server APIs

When this is genuinely required, use:

```text
app/actions/
```

for the relevant server-side action.

For example:

```text
app/actions/auth.ts
```



### Important

Server Actions are NOT API endpoints.

They are used only when the frontend itself needs to perform a server-only operation that cannot be performed directly in a Client Component.

Example:

```text
Client Component
      ↓
Server Action
      ↓
cookies()
```

Do not use Server Actions as a proxy for ordinary backend API calls.

If a backend request can be made directly using `apiClient`, do that instead.

### Example

If reading a cookie is required:

```text
app/actions/auth.ts
```

may contain the server-only logic.

But do NOT create:

```text
app/api/auth/route.ts
```

or any other Route Handler.

---



# 9. Server Actions

Use Server Actions sparingly.

A Server Action should only be introduced when server-only capabilities are genuinely required.

Do NOT create Server Actions simply to:

- wrap a normal API request
- hide an API request
- create a service layer
- avoid calling `apiClient` directly
- create an abstraction that is not needed

If a Client Component can safely call the backend using `apiClient`, it should do so.

---



# 10. Authentication

Authentication must use the existing backend authentication system.

Do not recreate authentication logic in Next.js.

Do not create a Next.js authentication API.

Do not create:

```text
app/api/auth/*
```

Do not create authentication Route Handlers.

The frontend should communicate directly with the existing backend authentication endpoints through `apiClient`.

Authentication state should come from the actual backend authentication mechanism.

Do not invent a separate frontend authentication system.

---



# 11. Cookies and Browser Storage

Understand the difference between server-only and browser-only storage.

### Cookies

If cookies must be accessed through Next.js server APIs, use an appropriate file under:

```text
app/actions/
```

Do not create a Route Handler.

### sessionStorage

`sessionStorage` is browser-only.

It must only be accessed from Client Components or browser-specific code.

Do not access:

```ts
sessionStorage
```

from Server Components.

Do not use `sessionStorage` as the primary authentication state.

It may be used for temporary UI flow state when explicitly required.

---



# 12. Forms

A custom form hook named:

```text
useForm
```

already exists in this project.

### Absolute rule

**Use the existing** `useForm` **hook for form-related functionality.**

Do not create another form hook unless explicitly requested.

Do not replace the existing `useForm` implementation.

Do not introduce another form library unless explicitly requested.

**Do not implement manual frontend validation** (such as checking whether an input is empty, validating input format, or duplicating backend validation rules). Form validation is handled by the backend. When the backend returns form validation errors through `useForm`, display the corresponding error message next to each relevant input. Only display these messages when the returned error is a **form validation error**; do not treat other types of errors as field validation errors

When implementing a form:

```text
Form UI
   ↓
existing useForm
   ↓
apiClient
   ↓
Backend API
```

Follow the existing `useForm` API and conventions.

Before implementing a new form, inspect the existing `useForm` implementation to understand how it is intended to be used.

---



# 13. Components

Separate concerns only when useful.

A component may contain:

- UI
- simple API calls
- simple event handling
- simple local state

Do not force every concern into a separate file.

For simple pages, it is acceptable for the page/component to contain the relevant API call directly.

Extract logic only when complexity or reuse justifies it.

Avoid premature abstraction.

---



# 14. Client Components

Use Client Components only when required.

Typical reasons include:

- forms
- interactive controls
- browser storage
- browser APIs
- local state
- event handlers

Keep the Client Component boundary as small as possible.

For example:

```text
Server Page
│
├── Static Content
├── Server Data
│
└── InteractiveForm
        ↑
    Client Component
```

Do not make the entire page a Client Component merely because it contains one form.

---



# 15. Design System

Use the following semantic color tokens throughout the application.

Configure these colors as Tailwind theme variables.

Use semantic classes such as:

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

## Colors

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



# 16. Typography

Use:

```text
Manrope
```

as the global font.

Do not introduce another font unless explicitly requested.

---



# 17. Icons

**Do not implement icons yourself.**

When a design contains an icon:

```text
[Icon]
```

must be used as a placeholder during implementation.

Do NOT:

- create SVG icons
- write inline SVG
- generate SVG paths
- create custom icon components
- install another icon library
- replace the icon with another icon

The developer will replace `[Icon]` placeholders manually later.

Preserve the approximate size, position, spacing, and visual footprint of the icon from the Figma design.

---



# 18. Figma

When implementing a page from a Figma selection:

1. Inspect the selected Figma design.
2. Understand its layout hierarchy.
3. Identify reusable patterns.
4. Identify responsive behavior.
5. Implement the page.
6. Compare the implementation against the Figma design.
7. Fix relevant visual discrepancies.

The Figma design is the visual source of truth for the page being implemented.

Do not redesign the Figma design unless explicitly requested.

Do not inspect unrelated Figma pages or selections unless necessary.

---



# 19. Responsive Design

Implement the design responsively.

Preserve the intended visual hierarchy across:

- desktop
- tablet
- mobile

Do not create separate page implementations for each breakpoint unless technically necessary.

---



# 20. Dependencies

Do not install new dependencies unless they are genuinely necessary.

Before installing a dependency:

1. Check whether the existing project already provides the required functionality.
2. Check whether the functionality can reasonably be implemented with existing tools.
3. Prefer the existing project dependencies.

Do not add libraries merely for convenience.

---



# 21. Scope Control

When implementing a task:

- Modify only files relevant to the task.
- Do not modify the backend unless explicitly requested.
- Do not refactor unrelated code.
- Do not create unnecessary files.
- Do not create unnecessary abstractions.
- Do not create Next.js API routes.
- Do not create Route Handlers.
- Do not create another Axios instance.
- Do not create another form hook.
- Do not create custom icons.
- Do not introduce unrelated dependencies.
- Do not redesign existing pages.
- Do not change API contracts.
- Do not implement future features speculatively.
- Do not modify unrelated components.

If an existing implementation conflicts with these rules and fixing it is necessary for the requested task, make the smallest possible change.

---



# 22. Before Creating a New File

Before creating a new file, ask:

1. Is this file actually necessary?
2. Can the logic reasonably stay in the current file?
3. Does an existing utility/component/action already provide this functionality?
4. Is the new abstraction justified by complexity or reuse?
5. Am I creating this file only because of an architectural convention?

If the answer to the last question is yes, **do not create the file**.

Prefer fewer files and simpler code.

---



# 23. Forbidden Next.js API Patterns

The following are explicitly forbidden:

```text
app/api/
app/api/**/route.ts
app/api/**/route.js
route.ts
route.js
Next.js API proxy
Next.js API wrapper
Next.js backend endpoint
```

Unless explicitly instructed by the developer, none of these may be created.

---



# 24. Verification

After implementation:

1. Run TypeScript/type checking.
2. Run linting if available.
3. Verify the requested functionality.
4. Verify that the frontend communicates directly with the existing backend.
5. Verify that no Next.js API/Route Handler was created.
6. Verify that no additional Axios instance was created.
7. Verify that no unnecessary files were created.
8. Verify that existing functionality was not broken.

Do not perform broad refactoring during verification.