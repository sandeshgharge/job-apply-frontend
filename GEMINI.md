# Project Overview: JobApply

JobApply is a personal job application assistant built with Angular 21, designed to manage the full job application lifecycle. It leverages AI (Claude via a backend proxy) for job description parsing, CV building, and cover letter generation.

## Tech Stack
- **Framework:** Angular 21 (Standalone Components, no NgModules).
- **State Management:**
    - **NgRx:** Used primarily for Authentication state (Store, Effects, Actions, Selectors).
    - **Angular Signals:** Used for feature state (Jobs, CV, Toast notifications).
- **Backend/Persistence:**
    - **Supabase:** Used for user authentication.
    - **localStorage:** Used for job data and CV persistence via `StorageService`.
- **AI Integration:** Uses Anthropic's Claude API (proxied through a backend) for intelligent tasks.
- **Styling:** Component-scoped SCSS with CSS custom properties for theming.

## Architecture & Conventions
- **Dependency Injection:** Use the `inject()` function for all DI instead of constructor parameters.
- **Standalone Components:** All components are standalone; do not use NgModules.
- **State Management:**
    - Use Signals for local and feature state that needs to be reactive.
    - Use NgRx for global state that requires complex async flows (like Auth).
- **Asynchronous Logic:** Prefer `switchMap` + `catchError` in NgRx effects.
- **Service Layer:** Logic should reside in services, with components focusing on presentation and user interaction.

## Building and Running
- **Install Dependencies:** `npm install`
- **Development Server:** `ng serve` (runs on `http://localhost:4200`)
- **Production Build:** `ng build`
- **Testing:** `ng test` (Note: Currently, there are no `.spec.ts` files in the project).

## Key Directories
- `src/app/utils/services/`: Core logic services (Auth, Jobs, Storage, etc.).
- `src/app/utils/store/`: NgRx state management files.
- `src/app/utils/supabase/`: Supabase client configuration.
- `src/app/utils/entities/`: TypeScript interfaces and types for domain entities.
- `src/app/apply-job/`: Multi-step wizard for new applications.
- `src/app/cv-builder/`: Structured CV editor.
- `src/app/job-tracker/`: Application status management.
