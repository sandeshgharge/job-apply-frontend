import { Component, signal, inject, computed, Input, OnInit, DestroyRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../utils/services/toast.service';
import { CvCertification, CvCustomSection, CvEducation, CvExperience, CVInfo, CvProject, CvSection, CvSkills, defaultCV } from '../utils/entities/cv';
import { CvService } from '../utils/services/cv.service';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../utils/store/auth/auth.selectors';
import { selectCVInfoList } from '../utils/store/cv/cv.selectors';
import { saveNewCVInfo, saveNewCVInfoSuccess, updateCVInfo } from '../utils/store/cv/cv.actions';
import { Actions, ofType } from '@ngrx/effects';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';



function makeId() { return Math.random().toString(36).slice(2, 9); }

const PROFICIENCY_LEVELS = ['Beginner', 'Elementary', 'Intermediate', 'Upper-Intermediate', 'Advanced', 'Native'];

@Component({
  selector: 'app-cv-builder',
  imports: [FormsModule, DatePipe],
  templateUrl: './cv-builder.html',
  styleUrl: './cv-builder.scss'
})
export class CvBuilderComponent implements OnInit {

  private toast = inject(ToastService);
  private store = inject(Store)
  private actions$ = inject(Actions);
  private destroyRef = inject(DestroyRef);

  cvInfoList = this.store.selectSignal(selectCVInfoList);
  selectedVersion = signal(0);
  cv = signal<CVInfo>(defaultCV());
  userID = this.store.selectSignal(selectCurrentUser)()?.id

  ngOnInit(): void {

    this.actions$.pipe(
      ofType(saveNewCVInfoSuccess),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ cvInfo }) => {
      this.selectedVersion.set(cvInfo.version); // cv computed updates automatically
    });

    if (this.cvInfoList().length != 0)
      this.cv.set(this.cvInfoList()[this.selectedVersion()])
    else
      this.cv.update(c => ({ ...c, userId: this.userID || '' }))
  }

  // Optional: pre-fill from job description skills
  @Input() set prefillSkills(groups: Array<{ category: string; skills: string[] }>) {
    if (!groups?.length) return;
    const cv = this.cv().cvData;
    const tech = groups.find(g => g.category === 'Frontend')?.skills ?? [];
    const fw = groups.find(g => g.category === 'Backend')?.skills ?? [];
    const tools = [
      ...(groups.find(g => g.category === 'DevOps Tools')?.skills ?? []),
      ...(groups.find(g => g.category === 'Monitoring Tools')?.skills ?? []),
      ...(groups.find(g => g.category === 'Cloud Platforms')?.skills ?? []),
    ];
    this.cv.update(c => ({
      ...c,
      cvData: {
        ...c.cvData,
        skills: {
          ...c.cvData.skills,
          technical: [...new Set([...c.cvData.skills.technical, ...tech])],
          frameworks: [...new Set([...c.cvData.skills.frameworks, ...fw])],
          tools: [...new Set([...c.cvData.skills.tools, ...tools])],
        },
      }
    }));
    this.toast.show('Skills pre-filled from job description!');
  }

  // Global edit mode — shows checkboxes and edit controls
  editMode = signal(false);

  // Save As dialog
  showSaveAsDialog = signal(false);
  saveAsTitle = '';

  // Drag state
  dragSectionId = signal<string | null>(null);
  dragItemId = signal<string | null>(null);
  dragOverId = signal<string | null>(null);

  // Inline add inputs
  newSkillInputs: Record<string, string> = {};
  newInterest = signal('');
  newTechInput = signal('');
  newSoftInput = signal('');
  newToolInput = signal('');
  newFrameworkInput = signal('');

  // Sections config — drives order and visibility
  sections = signal<CvSection[]>([
    { id: 'personal', label: 'Personal Info', icon: '👤', include: true, collapsed: false },
    { id: 'summary', label: 'Professional Summary', icon: '📝', include: true, collapsed: false },
    { id: 'experience', label: 'Work Experience', icon: '💼', include: true, collapsed: false },
    { id: 'education', label: 'Education', icon: '🎓', include: true, collapsed: false },
    { id: 'skills', label: 'Skills', icon: '⚡', include: true, collapsed: false },
    { id: 'projects', label: 'Projects', icon: '◈', include: true, collapsed: true },
    { id: 'certifications', label: 'Certifications', icon: '🏅', include: false, collapsed: true },
    { id: 'awards', label: 'Awards', icon: '★', include: false, collapsed: true },
    { id: 'publications', label: 'Publications', icon: '📄', include: false, collapsed: true },
    { id: 'volunteer', label: 'Volunteer Experience', icon: '🤝', include: false, collapsed: true },
    { id: 'interests', label: 'Interests', icon: '✦', include: false, collapsed: true },
    { id: 'references', label: 'References', icon: '👥', include: false, collapsed: true },
    { id: 'custom', label: 'Custom Sections', icon: '＋', include: false, collapsed: true },
  ]);

  proficiencyLevels = PROFICIENCY_LEVELS;

  saveNow() {
    if (this.cvInfoList().length == 0 && this.userID) {
      this.saveNew();
      return;
    }
    this.store.dispatch(updateCVInfo({ cvInfo: this.cv() }));
  }

  openSaveAsDialog() {
    this.showSaveAsDialog.set(true);
  }

  closeSaveAsDialog() {
    this.showSaveAsDialog.set(false);
  }

  confirmSaveAs() {
    const title = this.cv().title;
    if (!title) {
      this.toast.show('Title is required', 'error');
      return;
    }
    // Get the current CV to save as new version
    this.store.dispatch(saveNewCVInfo({ cvInfo: this.cv() }))
  }

  saveNew() {
    this.openSaveAsDialog();
  }

  clearCv() {
    if (!confirm('Clear all CV data? This cannot be undone.')) return;
    this.cv.set(defaultCV())
    this.toast.show('CV cleared.', 'info');
  }

  // ── CV Data Helpers ────────────────────────────────────────────
  onVersionChange(value: any) {
    // handle either direct value or event from <select (change)="$event">
    let v: string | number = value;
    if (value && value.target) {
      v = (value.target as HTMLSelectElement).value;
    }
    const num = typeof v === 'string' ? parseInt(v, 10) : v;
    if (Number.isNaN(num)) return;
    this.selectedVersion.set(num);
    const found = this.cvInfoList().find(c => c.version == this.selectedVersion());
    if (found) this.cv.set(found);
  }

  updateTitle(field: string, value: string) {
    this.cv.update(c => ({ ...c, [field]: value }))
  }
  updatePersonal(field: string, value: string) {
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, personalInfo: { ...c.cvData.personalInfo, [field]: value } } }));
  }
  updateLink(field: string, value: string) {
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, personalInfo: { ...c.cvData.personalInfo, links: { ...c.cvData.personalInfo.links, [field]: value } } } }));
  }
  updateSummary(value: string) {
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, summary: value } }));
  }

  // ── Skills ────────────────────────────────────────────────────
  addSkillToList(field: keyof Omit<CvSkills, 'languages'>, value: string) {
    const v = value.trim();
    if (!v) return;
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, skills: { ...c.cvData.skills, [field]: [...c.cvData.skills[field] as string[], v] } } }));
  }
  removeSkillFromList(field: keyof Omit<CvSkills, 'languages'>, idx: number) {
    this.cv.update(c => {
      const arr = [...c.cvData.skills[field] as string[]];
      arr.splice(idx, 1);
      return { ...c, cvData: { ...c.cvData, skills: { ...c.cvData.skills, [field]: arr } } };
    });
  }
  addLanguage() {
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, skills: { ...c.cvData.skills, languages: [...c.cvData.skills.languages, { id: makeId(), language: '', proficiency: 'Intermediate' }] } } }));
  }
  removeLanguage(id: string) {
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, skills: { ...c.cvData.skills, languages: c.cvData.skills.languages.filter(l => l.id !== id) } } }));
  }
  updateLanguage(id: string, field: 'language' | 'proficiency', value: string) {
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, skills: { ...c.cvData.skills, languages: c.cvData.skills.languages.map(l => l.id === id ? { ...l, [field]: value } : l) } } }));
  }

  // ── Experience ─────────────────────────────────────────────────
  addExperience() {
    const exp: CvExperience = { id: makeId(), jobTitle: '', company: '', location: '', startDate: '', endDate: '', current: false, responsibilities: [], include: true };
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, experience: [exp, ...c.cvData.experience] } }));
  }
  removeExperience(id: string) {
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, experience: c.cvData.experience.filter(e => e.id !== id) } }));
  }
  updateExp(id: string, field: string, value: any) {
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, experience: c.cvData.experience.map(e => e.id === id ? { ...e, [field]: value } : e) } }));
  }
  addResponsibility(expId: string) {
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, experience: c.cvData.experience.map(e => e.id === expId ? { ...e, responsibilities: [...e.responsibilities, { id: makeId(), text: '', include: true }] } : e) } }));
  }
  removeResponsibility(expId: string, rId: string) {
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, experience: c.cvData.experience.map(e => e.id === expId ? { ...e, responsibilities: e.responsibilities.filter(r => r.id !== rId) } : e) } }));
  }
  updateResponsibility(expId: string, rId: string, field: string, value: any) {
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, experience: c.cvData.experience.map(e => e.id === expId ? { ...e, responsibilities: e.responsibilities.map(r => r.id === rId ? { ...r, [field]: value } : r) } : e) } }));
  }

  // ── Education ─────────────────────────────────────────────────
  addEducation() {
    const edu: CvEducation = { id: makeId(), degree: '', fieldOfStudy: '', institution: '', location: '', startDate: '', endDate: '', include: true };
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, education: [edu, ...c.cvData.education] } }));
  }
  removeEducation(id: string) { this.cv.update(c => ({ ...c, cvData: { ...c.cvData, education: c.cvData.education.filter(e => e.id !== id) } })); }
  updateEdu(id: string, field: string, value: any) { this.cv.update(c => ({ ...c, cvData: { ...c.cvData, education: c.cvData.education.map(e => e.id === id ? { ...e, [field]: value } : e) } })); }

  // ── Projects ──────────────────────────────────────────────────
  addProject() {
    const p: CvProject = { id: makeId(), title: '', description: '', technologies: [], role: '', startDate: '', endDate: '', link: '', include: true };
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, projects: [p, ...c.cvData.projects] } }));
  }
  removeProject(id: string) { this.cv.update(c => ({ ...c, cvData: { ...c.cvData, projects: c.cvData.projects.filter(p => p.id !== id) } })); }
  updateProject(id: string, field: string, value: any) { this.cv.update(c => ({ ...c, cvData: { ...c.cvData, projects: c.cvData.projects.map(p => p.id === id ? { ...p, [field]: value } : p) } })); }
  addProjectTech(id: string, val: string) {
    const v = val.trim(); if (!v) return;
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, projects: c.cvData.projects.map(p => p.id === id ? { ...p, technologies: [...p.technologies, v] } : p) } }));
  }
  removeProjectTech(id: string, idx: number) {
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, projects: c.cvData.projects.map(p => { if (p.id !== id) return p; const t = [...p.technologies]; t.splice(idx, 1); return { ...p, technologies: t }; }) } }));
  }

  // ── Certifications ────────────────────────────────────────────
  addCertification() {
    const cert: CvCertification = { id: makeId(), name: '', issuer: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '', include: true };
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, certifications: [cert, ...c.cvData.certifications] } }));
  }
  removeCertification(id: string) { this.cv.update(c => ({ ...c, cvData: { ...c.cvData, certifications: c.cvData.certifications.filter(x => x.id !== id) } })); }
  updateCert(id: string, field: string, value: any) { this.cv.update(c => ({ ...c, cvData: { ...c.cvData, certifications: c.cvData.certifications.map(x => x.id === id ? { ...x, [field]: value } : x) } })); }

  // ── Awards ────────────────────────────────────────────────────
  addAward() {
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, awards: [{ id: makeId(), title: '', issuer: '', date: '', description: '', include: true }, ...c.cvData.awards] } }));
  }
  removeAward(id: string) { this.cv.update(c => ({ ...c, cvData: { ...c.cvData, awards: c.cvData.awards.filter(x => x.id !== id) } })); }
  updateAward(id: string, field: string, value: any) { this.cv.update(c => ({ ...c, cvData: { ...c.cvData, awards: c.cvData.awards.map(x => x.id === id ? { ...x, [field]: value } : x) } })); }

  // ── Publications ──────────────────────────────────────────────
  addPublication() {
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, publications: [{ id: makeId(), title: '', publisher: '', date: '', link: '', description: '', include: true }, ...c.cvData.publications] } }));
  }
  removePublication(id: string) { this.cv.update(c => ({ ...c, cvData: { ...c.cvData, publications: c.cvData.publications.filter(x => x.id !== id) } })); }
  updatePub(id: string, field: string, value: any) { this.cv.update(c => ({ ...c, cvData: { ...c.cvData, publications: c.cvData.publications.map(x => x.id === id ? { ...x, [field]: value } : x) } })); }

  // ── Volunteer ─────────────────────────────────────────────────
  addVolunteer() {
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, volunteerExperience: [{ id: makeId(), role: '', organization: '', location: '', startDate: '', endDate: '', description: '', include: true }, ...c.cvData.volunteerExperience] } }));
  }
  removeVolunteer(id: string) { this.cv.update(c => ({ ...c, cvData: { ...c.cvData, volunteerExperience: c.cvData.volunteerExperience.filter(x => x.id !== id) } })); }
  updateVol(id: string, field: string, value: any) { this.cv.update(c => ({ ...c, cvData: { ...c.cvData, volunteerExperience: c.cvData.volunteerExperience.map(x => x.id === id ? { ...x, [field]: value } : x) } })); }

  // ── Interests ─────────────────────────────────────────────────
  addInterest() {
    const v = this.newInterest().trim(); if (!v) return;
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, interests: [...c.cvData.interests, v] } }));
    this.newInterest.set('');
  }
  removeInterest(idx: number) { this.cv.update(c => { const a = [...c.cvData.interests]; a.splice(idx, 1); return { ...c, cvData: { ...c.cvData, interests: a } }; }); }

  // ── References ────────────────────────────────────────────────
  addReference() {
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, references: [{ id: makeId(), name: '', position: '', company: '', email: '', phone: '', include: true }, ...c.cvData.references] } }));
  }
  removeReference(id: string) { this.cv.update(c => ({ ...c, cvData: { ...c.cvData, references: c.cvData.references.filter(x => x.id !== id) } })); }
  updateRef(id: string, field: string, value: any) { this.cv.update(c => ({ ...c, cvData: { ...c.cvData, references: c.cvData.references.map(x => x.id === id ? { ...x, [field]: value } : x) } })); }

  // ── Custom Sections ───────────────────────────────────────────
  addCustomSection() {
    const sec: CvCustomSection = { id: makeId(), sectionTitle: 'New Section', include: true, items: [] };
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, customSections: [...c.cvData.customSections, sec] } }));
    this.sections.update(s => s.map(x => x.id === 'custom' ? { ...x, include: true, collapsed: false } : x));
  }
  removeCustomSection(id: string) { this.cv.update(c => ({ ...c, cvData: { ...c.cvData, customSections: c.cvData.customSections.filter(x => x.id !== id) } })); }
  updateCustomSection(id: string, field: string, value: any) { this.cv.update(c => ({ ...c, cvData: { ...c.cvData, customSections: c.cvData.customSections.map(x => x.id === id ? { ...x, [field]: value } : x) } })); }
  addCustomItem(secId: string) {
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, customSections: c.cvData.customSections.map(x => x.id === secId ? { ...x, items: [...x.items, { id: makeId(), text: '', include: true }] } : x) } }));
  }
  removeCustomItem(secId: string, itemId: string) {
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, customSections: c.cvData.customSections.map(x => x.id === secId ? { ...x, items: x.items.filter(i => i.id !== itemId) } : x) } }));
  }
  updateCustomItem(secId: string, itemId: string, value: string) {
    this.cv.update(c => ({ ...c, cvData: { ...c.cvData, customSections: c.cvData.customSections.map(x => x.id === secId ? { ...x, items: x.items.map(i => i.id === itemId ? { ...i, text: value } : i) } : x) } }));
  }

  // ── Sections management ───────────────────────────────────────
  toggleCollapse(id: string) {
    this.sections.update(s => s.map(x => x.id === id ? { ...x, collapsed: !x.collapsed } : x));
  }
  toggleSectionInclude(id: string) {
    this.sections.update(s => s.map(x => x.id === id ? { ...x, include: !x.include } : x));
  }

  // ── Drag & Drop (sections) ────────────────────────────────────
  onSectionDragStart(id: string, e: DragEvent) {
    this.dragSectionId.set(id);
    e.dataTransfer!.effectAllowed = 'move';
  }
  onSectionDragOver(id: string, e: DragEvent) {
    e.preventDefault();
    this.dragOverId.set(id);
  }
  onSectionDrop(targetId: string) {
    const fromId = this.dragSectionId();
    if (!fromId || fromId === targetId) { this.dragSectionId.set(null); this.dragOverId.set(null); return; }
    this.sections.update(secs => {
      const arr = [...secs];
      const fromIdx = arr.findIndex(s => s.id === fromId);
      const toIdx = arr.findIndex(s => s.id === targetId);
      const [item] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr;
    });
    this.dragSectionId.set(null); this.dragOverId.set(null);
  }
  onSectionDragEnd() { this.dragSectionId.set(null); this.dragOverId.set(null); }

  // ── Drag & Drop (list items inside sections) ──────────────────
  dragListContext = signal<{ field: string; fromIdx: number } | null>(null);

  onItemDragStart(field: string, fromIdx: number, e: DragEvent) {
    this.dragListContext.set({ field, fromIdx });
    e.dataTransfer!.effectAllowed = 'move';
  }
  onItemDrop(field: string, toIdx: number) {
    const ctx = this.dragListContext();
    if (!ctx || ctx.field !== field || ctx.fromIdx === toIdx) { this.dragListContext.set(null); return; }
    this.cv.update(c => {
      const cvData = { ...c.cvData } as any;
      const arr = [...cvData[field]];
      const [item] = arr.splice(ctx.fromIdx, 1);
      arr.splice(toIdx, 0, item);
      cvData[field] = arr;
      return { ...c, cvData };
    });
    this.dragListContext.set(null);
  }
  onItemDragOver(e: DragEvent) { e.preventDefault(); }

  // ── Drag & Drop (responsibilities inside an experience entry) ──
  respDragContext = signal<{ expId: string; fromIdx: number } | null>(null);

  onRespDragStart(expId: string, fromIdx: number, e: DragEvent) {
    // Stop propagation so the parent experience item-card drag doesn't fire
    e.stopPropagation();
    this.respDragContext.set({ expId, fromIdx });
    e.dataTransfer!.effectAllowed = 'move';
  }
  onRespDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }
  onRespDrop(expId: string, toIdx: number, e: DragEvent) {
    e.stopPropagation();
    const ctx = this.respDragContext();
    if (!ctx || ctx.expId !== expId || ctx.fromIdx === toIdx) { this.respDragContext.set(null); return; }
    this.cv.update(c => ({
      ...c,
      cvData: {
        ...c.cvData,
        experience: c.cvData.experience.map(exp => {
          if (exp.id !== expId) return exp;
          const arr = [...exp.responsibilities];
          const [moved] = arr.splice(ctx.fromIdx, 1);
          arr.splice(toIdx, 0, moved);
          return { ...exp, responsibilities: arr };
        })
      }
    }));
    this.respDragContext.set(null);
  }
  onRespDragEnd(e: DragEvent) {
    e.stopPropagation();
    this.respDragContext.set(null);
  }

  exportJson() {
    const blob = new Blob([JSON.stringify(this.cv().cvData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `cv_${this.cv().cvData.personalInfo.firstName || 'export'}.json`; a.click();
    this.toast.show('CV exported as JSON!');
  }

  completionScore = computed(() => {
    const c = this.cv().cvData;
    let score = 0; let total = 0;
    const check = (v: any) => { total++; if (v && (Array.isArray(v) ? v.length > 0 : String(v).trim())) score++; };
    check(c.personalInfo.firstName); check(c.personalInfo.lastName);
    check(c.personalInfo.email); check(c.personalInfo.phone);
    check(c.personalInfo.headline); check(c.personalInfo.address);
    check(c.summary); check(c.skills.technical.length);
    check(c.experience.length); check(c.education.length);
    return Math.round((score / total) * 100);
  });

  sectionHasData(id: string): boolean {
    const c = this.cv().cvData;
    switch (id) {
      case 'personal': return !!(c.personalInfo.firstName || c.personalInfo.email);
      case 'summary': return !!c.summary;
      case 'experience': return c.experience.length > 0;
      case 'education': return c.education.length > 0;
      case 'skills': return c.skills.technical.length > 0 || c.skills.soft.length > 0 || c.skills.frameworks.length > 0 || c.skills.tools.length > 0;
      case 'projects': return c.projects.length > 0;
      case 'certifications': return c.certifications.length > 0;
      case 'awards': return c.awards.length > 0;
      case 'publications': return c.publications.length > 0;
      case 'volunteer': return c.volunteerExperience.length > 0;
      case 'interests': return c.interests.length > 0;
      case 'references': return c.references.length > 0;
      case 'custom': return c.customSections.length > 0;
      default: return false;
    }
  }
}
