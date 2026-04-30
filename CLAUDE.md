# JobApply.de — Claude Instructions

## Project Stack
- Angular 21, standalone components, no NgModules
- NgRx for state management (Store, Effects, Actions, Selectors)
- SCSS with component-scoped styles — NO Angular Material, NO Tailwind
- Angular Signals preferred over RxJS Observables where possible
- jsPDF for PDF generation

## Folder Structure
src/app/
├── ...        # pages and components kept together
├── utils/           # supporting features and connections in this folder
    ├── store/           # actions, reducers, effects, selectors per feature
    ├── guards/          # auth.guard.ts
    ├── pipes/           # job-count.pipe.ts, cat-class.pipe.ts
    ├── entities/        # interfaces for data management
    ├── services/        # connections outside this projects

### Styling Rules
- Each component has its own .scss file
- No global utility classes — styles are component-scoped
- Color palette: primary #1a56db, border #e5e7eb, text #111827
- Border radius: cards 12px, buttons 8px, chips 20px
- Toast notifications: inject ToastService, call this.toast.show('message')

Do NOT rebuild the whole project unless explicitly asked.