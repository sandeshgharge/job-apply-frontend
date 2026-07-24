# JobApply.de — Claude Instructions

## Project Stack
- Angular 21, standalone components, no NgModules
- NgRx for state management (Store, Effects, Actions, Selectors)
- SCSS with component-scoped styles — NO Angular Material, NO Tailwind
- Angular Signals preferred over RxJS Observables where possible
- Custom Multilingual support (dynamic TranslationService driven by Angular Signals)

## Folder Structure
src/app/
├── ...        # pages and components kept together
├── utils/           # supporting features and connections in this folder
    ├── store/           # actions, reducers, effects, selectors per feature
    ├── guards/          # auth.guard.ts
    ├── pipes/           # job-count.pipe.ts, cat-class.pipe.ts
    ├── entities/        # interfaces for data management
    ├── services/        # connections outside this projects
        ├── translation/ # translation.service.ts, fallback-en.ts
public/
└── job-apply-translations/  # manifest.json, en.json, de.json

### Styling Rules
- Each component has its own .scss file
- No global utility classes — styles are component-scoped
- Color palette: primary #1a56db, border #e5e7eb, text #111827
- Border radius: cards 12px, buttons 8px, chips 20px
- Toast notifications: inject ToastService, call this.toast.show('message')

### Translation & Multilingual Rules
- Inject `TranslationService` in components: `public translate = inject(TranslationService);`
- Reference translation keys in templates: `{{ translate.t().section.key }}`
- For TypeScript logic (e.g. alerts, modals, toast messages), use `this.translate.t().section.key` or check `this.translate.currentLang() === 'de'` for conditionals.
- Synchronize new keys across:
  - `src/app/utils/services/translation/fallback-en.ts` (offline typescript dictionary)
  - `public/temp/job-apply-translations/en.json` (English translation file)
  - `public/temp/job-apply-translations/de.json` (German translation file)

Do NOT rebuild the whole project unless explicitly asked.