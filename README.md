# JobApply

A personal job application assistant built for the job market where cover letter has considerable importance. Manage the full application lifecycle — from fetching job descriptions and generating tailored CVs to writing cover letters — in one place.

---

## Features

| Module | Description |
|---|---|
| **Dashboard** | Overview of applications, interview pipeline, and activity feed |
| **Apply Job** | 3-step wizard — fetch job details, write cover letter, build CV |
| **Job Tracker** | Track every application with status, sorting, and notes |
| **CV Builder** | Structured CV editor with 13 sections, drag-to-reorder, and PDF export |

---

## Tech Stack

- **Framework** — Angular 21 (standalone components, no NgModules)
- **State** — Angular Signals + NgRx (Store, Effects, Actions, Selectors)
- **Styling** — Component-scoped SCSS, CSS custom properties for theming
- **AI** — Anthropic Claude API (`claude-sonnet-4-20250514`)
- **PDF** — jsPDF
- **Persistence** — localStorage via `StorageService`

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone git@github.com:sandeshgharge/job-apply-frontend.git
cd job-apply-frontend

# Install dependencies
npm install

# Start the development server
ng serve
```

Open `http://localhost:4200` in your browser.

### Login

Currently, this project uses demo authentication. Sign in with any valid email and a password of 6 or more characters.

---

## Apply Job Wizard

The core flow for each new application:

```
Step 1 — Fetch Job
  Paste a URL or job description
  AI extracts company, role, and location

Step 2 — Cover Letter
  Fill applicant and position details
  Add sections (Introduction, Why this company?, Why me?, Closing)
  Generate each section or the full letter with AI
  Edit wherever needed for personal touch
  Preview and copy to clipboard

Step 3 — CV Builder
  Skills from the job description are pre-filled automatically
  Edit 13 sections: Personal Info, Summary, Experience, Education,
  Skills, Projects, Certifications, Awards, Publications,
  Volunteer, Interests, References, Custom Sections
  Drag to reorder sections and items
  Toggle sections in/out of the CV with checkboxes
  Download as PDF

→ Click "Mark as Applied" to save to the Job Tracker
```

---

## CV Builder

| Feature | Detail |
|---|---|
| Sections | 13 collapsible sections, all draggable |
| Edit mode | Toggle to show/hide include checkboxes |
| Include/exclude | Per section and per item (responsibilities, bullets) |
| Drag & drop | Reorder sections, experience entries, responsibilities |
| Autosave | Debounced save to localStorage every 800ms |
| PDF export | A4 skills summary PDF via jsPDF |
| JSON export | Full CV data as `.json` |
| Prefill | Skills auto-populated from job description in wizard |
| Completion score | Progress indicator for key fields |

---

## State Management

NgRx is used for authentication state. All other state is managed via Angular Signals.

```
store/
├── auth.actions.ts     # createActionGroup — Login, LoginSuccess, LoginFailure, Logout
├── auth.reducer.ts     # Handles loading, user, token, error, initialized
├── auth.effects.ts     # Login API call, session persistence, navigation, rehydration
└── auth.selectors.ts   # selectUser, selectIsAuthenticated, selectAuthLoading, selectAuthError
```

Feature state (jobs, CV, interview prep) uses Signals with localStorage persistence via `StorageService`.

---

## Services

| Service | Responsibility |
|---|---|
| `AuthService` | Login, logout, session via sessionStorage |
| `JobsService` | CRUD for job applications, stats computation |
| `StorageService` | Typed localStorage wrapper |
| `ToastService` | Signal-based toast notifications |

---

## AI Integration

The app calls the Anthropic API directly from the browser for:

- Job description parsing (company, role, location extraction)
- Skill categorisation from job description
- Cover letter section generation
- Full cover letter generation
- Interview answer generation

All calls use `claude-sonnet-4-20250514` with structured JSON responses where applicable.

> **Note** — In production, API calls should be proxied through a backend to protect credentials. Direct browser calls are suitable for local/personal use only.

---

## Coding Conventions

- `inject()` for all dependency injection — never constructor parameters
- `switchMap` + `catchError` in all async NgRx effects
- `{ dispatch: false }` on every side-effect-only effect
- `StorageService` for all localStorage access — never call `localStorage` directly
- CSS variables for all colours — never hardcoded hex values in component SCSS
- Standalone components only — no NgModules

---

## Roadmap

- [ ] Backend API with real authentication
- [ ] Cover letter PDF export
- [ ] CV live preview alongside editor
- [ ] Multi-language support (German / English)
- [ ] Email integration for application tracking
- [ ] Browser extension for one-click job import

---

## License

Proprietary. All rights reserved. See the [LICENSE](LICENSE) file for details.