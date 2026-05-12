import { Component, signal, inject, computed, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../utils/services/toast';
import { StorageService } from '../utils/services/storage';
import { CvCertification, CvCustomSection, CvData, CvEducation, CvExperience, CvProject, CvSection, CvSkills } from '../utils/entities/cv';



function makeId() { return Math.random().toString(36).slice(2, 9); }

const DEFAULT_CV: CvData = {
  personalInfo: {
  firstName: '', lastName: '', headline: '', email: '', phone: '',
  address: { city: '', state: '', country: '' },
    links: { linkedin: '', github: '', portfolio: '', website: '' }
  },
  summary: '',
  skills: { technical: [], soft: [], tools: [], frameworks: [], languages: [] },
  experience: [], education: [], projects: [], certifications: [],
  awards: [], publications: [], volunteerExperience: [],
  interests: [], references: [], customSections: [],
  metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: '1.0', source: 'manual' }
};

const PROFICIENCY_LEVELS = ['Beginner', 'Elementary', 'Intermediate', 'Upper-Intermediate', 'Advanced', 'Native'];

@Component({
  selector: 'app-cv-builder',
  imports: [FormsModule, DatePipe],
  templateUrl: './cv-builder.html',
  styleUrl: './cv-builder.scss'
})
export class CvBuilderComponent {
  private toast = inject(ToastService);
  private storage = inject(StorageService);

  // Optional: pre-fill from job description skills
  @Input() set prefillSkills(groups: Array<{ category: string; skills: string[] }>) {
    if (!groups?.length) return;
    const cv = this.cv();
    const tech = groups.find(g => g.category === 'Programming Languages')?.skills ?? [];
    const fw = groups.find(g => g.category === 'Language Frameworks')?.skills ?? [];
    const tools = [
      ...(groups.find(g => g.category === 'DevOps Tools')?.skills ?? []),
      ...(groups.find(g => g.category === 'Monitoring Tools')?.skills ?? []),
      ...(groups.find(g => g.category === 'Cloud Platforms')?.skills ?? []),
    ];
    this.cv.update(c => ({
      ...c,
      skills: {
        ...c.skills,
        technical: [...new Set([...c.skills.technical, ...tech])],
        frameworks: [...new Set([...c.skills.frameworks, ...fw])],
        tools: [...new Set([...c.skills.tools, ...tools])],
      }
    }));
    this.toast.show('Skills pre-filled from job description!');
  }

  cv = signal<CvData>(this.storage.get<CvData>('jad_cv', DEFAULT_CV));

  // Global edit mode — shows checkboxes and edit controls
  editMode = signal(false);

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
    { id: 'personal',    label: 'Personal Info',       icon: '👤', include: true,  collapsed: false },
    { id: 'summary',     label: 'Professional Summary', icon: '📝', include: true,  collapsed: false },
    { id: 'experience',  label: 'Work Experience',      icon: '💼', include: true,  collapsed: false },
    { id: 'education',   label: 'Education',            icon: '🎓', include: true,  collapsed: false },
    { id: 'skills',      label: 'Skills',               icon: '⚡', include: true,  collapsed: false },
    { id: 'projects',    label: 'Projects',             icon: '◈',  include: true,  collapsed: true  },
    { id: 'certifications', label: 'Certifications',   icon: '🏅', include: false, collapsed: true  },
    { id: 'awards',      label: 'Awards',               icon: '★',  include: false, collapsed: true  },
    { id: 'publications',label: 'Publications',         icon: '📄', include: false, collapsed: true  },
    { id: 'volunteer',   label: 'Volunteer Experience', icon: '🤝', include: false, collapsed: true  },
    { id: 'interests',   label: 'Interests',            icon: '✦',  include: false, collapsed: true  },
    { id: 'references',  label: 'References',           icon: '👥', include: false, collapsed: true  },
    { id: 'custom',      label: 'Custom Sections',      icon: '＋',  include: false, collapsed: true  },
  ]);

  proficiencyLevels = PROFICIENCY_LEVELS;

  // ── CV Data Helpers ────────────────────────────────────────────
  updatePersonal(field: string, value: string) {
    this.cv.update(c => ({ ...c, personalInfo: { ...c.personalInfo, [field]: value } }));
    this.autosave();
  }
  updateAddress(field: string, value: string) {
    this.cv.update(c => ({ ...c, personalInfo: { ...c.personalInfo, address: { ...c.personalInfo.address, [field]: value } } }));
    this.autosave();
  }
  updateLink(field: string, value: string) {
    this.cv.update(c => ({ ...c, personalInfo: { ...c.personalInfo, links: { ...c.personalInfo.links, [field]: value } } }));
    this.autosave();
  }
  updateSummary(value: string) {
    this.cv.update(c => ({ ...c, summary: value }));
    this.autosave();
  }

  // ── Skills ────────────────────────────────────────────────────
  addSkillToList(field: keyof Omit<CvSkills, 'languages'>, value: string) {
    const v = value.trim();
    if (!v) return;
    this.cv.update(c => ({ ...c, skills: { ...c.skills, [field]: [...c.skills[field] as string[], v] } }));
    this.autosave();
  }
  removeSkillFromList(field: keyof Omit<CvSkills, 'languages'>, idx: number) {
    this.cv.update(c => {
      const arr = [...c.skills[field] as string[]];
      arr.splice(idx, 1);
      return { ...c, skills: { ...c.skills, [field]: arr } };
    });
    this.autosave();
  }
  addLanguage() {
    this.cv.update(c => ({ ...c, skills: { ...c.skills, languages: [...c.skills.languages, { id: makeId(), language: '', proficiency: 'Intermediate' }] } }));
  }
  removeLanguage(id: string) {
    this.cv.update(c => ({ ...c, skills: { ...c.skills, languages: c.skills.languages.filter(l => l.id !== id) } }));
    this.autosave();
  }
  updateLanguage(id: string, field: 'language' | 'proficiency', value: string) {
    this.cv.update(c => ({ ...c, skills: { ...c.skills, languages: c.skills.languages.map(l => l.id === id ? { ...l, [field]: value } : l) } }));
    this.autosave();
  }

  // ── Experience ─────────────────────────────────────────────────
  addExperience() {
    const exp: CvExperience = { id: makeId(), jobTitle: '', company: '', location: '', startDate: '', endDate: '', current: false, responsibilities: [], include: true };
    this.cv.update(c => ({ ...c, experience: [exp, ...c.experience] }));
  }
  removeExperience(id: string) {
    this.cv.update(c => ({ ...c, experience: c.experience.filter(e => e.id !== id) }));
    this.autosave();
  }
  updateExp(id: string, field: string, value: any) {
    this.cv.update(c => ({ ...c, experience: c.experience.map(e => e.id === id ? { ...e, [field]: value } : e) }));
    this.autosave();
  }
  addResponsibility(expId: string) {
    this.cv.update(c => ({ ...c, experience: c.experience.map(e => e.id === expId ? { ...e, responsibilities: [...e.responsibilities, { id: makeId(), text: '', include: true }] } : e) }));
  }
  removeResponsibility(expId: string, rId: string) {
    this.cv.update(c => ({ ...c, experience: c.experience.map(e => e.id === expId ? { ...e, responsibilities: e.responsibilities.filter(r => r.id !== rId) } : e) }));
    this.autosave();
  }
  updateResponsibility(expId: string, rId: string, field: string, value: any) {
    this.cv.update(c => ({ ...c, experience: c.experience.map(e => e.id === expId ? { ...e, responsibilities: e.responsibilities.map(r => r.id === rId ? { ...r, [field]: value } : r) } : e) }));
    this.autosave();
  }

  // ── Education ─────────────────────────────────────────────────
  addEducation() {
    const edu: CvEducation = { id: makeId(), degree: '', fieldOfStudy: '', institution: '', location: '', startDate: '', endDate: '', include: true };
    this.cv.update(c => ({ ...c, education: [edu, ...c.education] }));
  }
  removeEducation(id: string) { this.cv.update(c => ({ ...c, education: c.education.filter(e => e.id !== id) })); this.autosave(); }
  updateEdu(id: string, field: string, value: any) { this.cv.update(c => ({ ...c, education: c.education.map(e => e.id === id ? { ...e, [field]: value } : e) })); this.autosave(); }

  // ── Projects ──────────────────────────────────────────────────
  addProject() {
    const p: CvProject = { id: makeId(), title: '', description: '', technologies: [], role: '', startDate: '', endDate: '', link: '', include: true };
    this.cv.update(c => ({ ...c, projects: [p, ...c.projects] }));
  }
  removeProject(id: string) { this.cv.update(c => ({ ...c, projects: c.projects.filter(p => p.id !== id) })); this.autosave(); }
  updateProject(id: string, field: string, value: any) { this.cv.update(c => ({ ...c, projects: c.projects.map(p => p.id === id ? { ...p, [field]: value } : p) })); this.autosave(); }
  addProjectTech(id: string, val: string) {
    const v = val.trim(); if (!v) return;
    this.cv.update(c => ({ ...c, projects: c.projects.map(p => p.id === id ? { ...p, technologies: [...p.technologies, v] } : p) }));
    this.autosave();
  }
  removeProjectTech(id: string, idx: number) {
    this.cv.update(c => ({ ...c, projects: c.projects.map(p => { if (p.id !== id) return p; const t = [...p.technologies]; t.splice(idx, 1); return { ...p, technologies: t }; }) }));
    this.autosave();
  }

  // ── Certifications ────────────────────────────────────────────
  addCertification() {
    const cert: CvCertification = { id: makeId(), name: '', issuer: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '', include: true };
    this.cv.update(c => ({ ...c, certifications: [cert, ...c.certifications] }));
  }
  removeCertification(id: string) { this.cv.update(c => ({ ...c, certifications: c.certifications.filter(x => x.id !== id) })); this.autosave(); }
  updateCert(id: string, field: string, value: any) { this.cv.update(c => ({ ...c, certifications: c.certifications.map(x => x.id === id ? { ...x, [field]: value } : x) })); this.autosave(); }

  // ── Awards ────────────────────────────────────────────────────
  addAward() {
    this.cv.update(c => ({ ...c, awards: [{ id: makeId(), title: '', issuer: '', date: '', description: '', include: true }, ...c.awards] }));
  }
  removeAward(id: string) { this.cv.update(c => ({ ...c, awards: c.awards.filter(x => x.id !== id) })); this.autosave(); }
  updateAward(id: string, field: string, value: any) { this.cv.update(c => ({ ...c, awards: c.awards.map(x => x.id === id ? { ...x, [field]: value } : x) })); this.autosave(); }

  // ── Publications ──────────────────────────────────────────────
  addPublication() {
    this.cv.update(c => ({ ...c, publications: [{ id: makeId(), title: '', publisher: '', date: '', link: '', description: '', include: true }, ...c.publications] }));
  }
  removePublication(id: string) { this.cv.update(c => ({ ...c, publications: c.publications.filter(x => x.id !== id) })); this.autosave(); }
  updatePub(id: string, field: string, value: any) { this.cv.update(c => ({ ...c, publications: c.publications.map(x => x.id === id ? { ...x, [field]: value } : x) })); this.autosave(); }

  // ── Volunteer ─────────────────────────────────────────────────
  addVolunteer() {
    this.cv.update(c => ({ ...c, volunteerExperience: [{ id: makeId(), role: '', organization: '', location: '', startDate: '', endDate: '', description: '', include: true }, ...c.volunteerExperience] }));
  }
  removeVolunteer(id: string) { this.cv.update(c => ({ ...c, volunteerExperience: c.volunteerExperience.filter(x => x.id !== id) })); this.autosave(); }
  updateVol(id: string, field: string, value: any) { this.cv.update(c => ({ ...c, volunteerExperience: c.volunteerExperience.map(x => x.id === id ? { ...x, [field]: value } : x) })); this.autosave(); }

  // ── Interests ─────────────────────────────────────────────────
  addInterest() {
    const v = this.newInterest().trim(); if (!v) return;
    this.cv.update(c => ({ ...c, interests: [...c.interests, v] }));
    this.newInterest.set(''); this.autosave();
  }
  removeInterest(idx: number) { this.cv.update(c => { const a = [...c.interests]; a.splice(idx, 1); return { ...c, interests: a }; }); this.autosave(); }

  // ── References ────────────────────────────────────────────────
  addReference() {
    this.cv.update(c => ({ ...c, references: [{ id: makeId(), name: '', position: '', company: '', email: '', phone: '', include: true }, ...c.references] }));
  }
  removeReference(id: string) { this.cv.update(c => ({ ...c, references: c.references.filter(x => x.id !== id) })); this.autosave(); }
  updateRef(id: string, field: string, value: any) { this.cv.update(c => ({ ...c, references: c.references.map(x => x.id === id ? { ...x, [field]: value } : x) })); this.autosave(); }

  // ── Custom Sections ───────────────────────────────────────────
  addCustomSection() {
    const sec: CvCustomSection = { id: makeId(), sectionTitle: 'New Section', include: true, items: [] };
    this.cv.update(c => ({ ...c, customSections: [...c.customSections, sec] }));
    this.sections.update(s => s.map(x => x.id === 'custom' ? { ...x, include: true, collapsed: false } : x));
  }
  removeCustomSection(id: string) { this.cv.update(c => ({ ...c, customSections: c.customSections.filter(x => x.id !== id) })); this.autosave(); }
  updateCustomSection(id: string, field: string, value: any) { this.cv.update(c => ({ ...c, customSections: c.customSections.map(x => x.id === id ? { ...x, [field]: value } : x) })); this.autosave(); }
  addCustomItem(secId: string) {
    this.cv.update(c => ({ ...c, customSections: c.customSections.map(x => x.id === secId ? { ...x, items: [...x.items, { id: makeId(), text: '', include: true }] } : x) }));
  }
  removeCustomItem(secId: string, itemId: string) {
    this.cv.update(c => ({ ...c, customSections: c.customSections.map(x => x.id === secId ? { ...x, items: x.items.filter(i => i.id !== itemId) } : x) }));
    this.autosave();
  }
  updateCustomItem(secId: string, itemId: string, value: string) {
    this.cv.update(c => ({ ...c, customSections: c.customSections.map(x => x.id === secId ? { ...x, items: x.items.map(i => i.id === itemId ? { ...i, text: value } : i) } : x) }));
    this.autosave();
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
      const cv = { ...c } as any;
      const arr = [...cv[field]];
      const [item] = arr.splice(ctx.fromIdx, 1);
      arr.splice(toIdx, 0, item);
      cv[field] = arr;
      return cv;
    });
    this.dragListContext.set(null);
    this.autosave();
  }
  onItemDragOver(e: DragEvent) { e.preventDefault(); }

  // ── Autosave ──────────────────────────────────────────────────
  private saveTimer: any;
  autosave() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.cv.update(c => ({ ...c, metadata: { ...c.metadata, updatedAt: new Date().toISOString() } }));
      this.storage.set('jad_cv', this.cv());
    }, 800);
  }

  saveNow() {
    this.storage.set('jad_cv', this.cv());
    this.toast.show('CV saved!');
  }

  clearCv() {
    if (!confirm('Clear all CV data? This cannot be undone.')) return;
    this.cv.set({ ...DEFAULT_CV, metadata: { ...DEFAULT_CV.metadata, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } });
    this.storage.remove('jad_cv');
    this.toast.show('CV cleared.', 'info');
  }

  exportJson() {
    const blob = new Blob([JSON.stringify(this.cv(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `cv_${this.cv().personalInfo.firstName || 'export'}.json`; a.click();
    this.toast.show('CV exported as JSON!');
  }

  completionScore = computed(() => {
    const c = this.cv();
    let score = 0; let total = 0;
    const check = (v: any) => { total++; if (v && (Array.isArray(v) ? v.length > 0 : String(v).trim())) score++; };
    check(c.personalInfo.firstName); check(c.personalInfo.lastName);
    check(c.personalInfo.email); check(c.personalInfo.phone);
    check(c.personalInfo.headline); check(c.personalInfo.address.city);
    check(c.summary); check(c.skills.technical.length);
    check(c.experience.length); check(c.education.length);
    return Math.round((score / total) * 100);
  });

  sectionHasData(id: string): boolean {
    const c = this.cv();
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
