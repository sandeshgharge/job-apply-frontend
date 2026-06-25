# Project Overview: JobApply

JobApply is a personal job application assistant built with Angular 21, designed to manage the full job application lifecycle. It leverages AI (Claude via a backend proxy) for job description parsing, CV building, and cover letter generation.

## Tech Stack
- **Framework:** Angular 21 (Standalone Components, no NgModules).
- **State Management & Reactivity:**
    - **NgRx:** Used primarily for Authentication state (Store, Effects, Actions, Selectors).
    - **Angular Signals:** Used for feature state (Jobs, CV, Toast notifications) and multilingual translation support (`t` and `currentLang` signals).
- **Styling:** Component-scoped SCSS with CSS custom properties for theming.
- **Multilingual Support (i18n):** Custom dynamic translation service using Angular Signals to fetch and cache translations (via a JSON manifest and locale dictionaries) for offline/online capability.

## Architecture & Conventions
- **Dependency Injection:** Use the `inject()` function for all DI instead of constructor parameters.
- **Standalone Components:** All components are standalone; do not use NgModules.
- **State Management:**
    - Use Signals for local and feature state that needs to be reactive.
    - Use NgRx for global state that requires complex async flows (like Auth).
- **Translations:** Always inject `TranslationService` as `public translate` and reference keys via `translate.t().path.to.key` in templates. Avoid hardcoding user-facing text.
- **Asynchronous Logic:** Prefer `switchMap` + `catchError` in NgRx effects.
- **Service Layer:** Logic should reside in services, with components focusing on presentation and user interaction.

## Building and Running
- **Install Dependencies:** `npm install`
- **Development Server:** `ng serve` (runs on `http://localhost:4200`)
- **Production Build:** `ng build`
- **Testing:** `ng test` (Note: Currently, there are no `.spec.ts` files in the project).

## Key Directories
- `src/app/utils/services/`: Core logic services (Auth, Jobs, Storage, etc.).
- `src/app/utils/services/translation/`: Custom translation service (`translation.service.ts`) and offline default dictionary (`fallback-en.ts`).
- `src/app/utils/store/`: NgRx state management files.
- `src/app/utils/supabase/`: Supabase client configuration.
- `src/app/utils/entities/`: TypeScript interfaces and types for domain entities.
- `src/app/apply-job/`: Multi-step wizard for new applications.
- `src/app/cv-builder/`: Structured CV editor.
- `src/app/job-tracker/`: Application status management.
- `public/job-apply-translations/`: Local JSON translation files (`manifest.json`, `en.json`, `de.json`) used for dynamic translation loading.
