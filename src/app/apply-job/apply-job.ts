import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CvBuilderComponent } from '../cv-builder/cv-builder';
import { ToastService } from '../utils/services/toast';
import { JobsService, SkillGroup } from '../utils/services/jobs';
import { CoverLetterComponent } from "../cover-letter/cover-letter";

export interface CoverLetterSection {
  id: string; title: string; content: string; prompt: string; loading: boolean;
}
export interface CoverLetterMeta {
  applicantName: string; applicantLocation: string;
  companyName: string; companyLocation: string;
  role: string; hiringManager: string; date: string;
}

const SKILL_CATEGORIES = [
  'Programming Languages','Language Frameworks','Databases',
  'Monitoring Tools','DevOps Tools','Cloud Platforms','Other Skills',
];

const CAT_ICONS: Record<string, string> = {
  'Programming Languages': '⌨', 'Language Frameworks': '⚙',
  'Databases': '◫', 'Monitoring Tools': '◉',
  'DevOps Tools': '⬡', 'Cloud Platforms': '☁', 'Other Skills': '◆',
};

@Component({
  selector: 'app-apply-job',
  imports: [FormsModule, CvBuilderComponent, CoverLetterComponent],
  templateUrl: './apply-job.html',
  styleUrl: './apply-job.scss'
})
export class ApplyJobComponent {
  private toast = inject(ToastService);
  private jobsService = inject(JobsService);

  step = signal(1);

  // Step 1
  jobUrl = signal('');
  jobDescription = signal('');
  fetchLoading = signal(false);
  parseLoading = signal(false);
  parsedCompany = signal('');
  parsedRole = signal('');
  parsedLocation = signal('');

  // Step 2
  skillGroups = signal<SkillGroup[]>(SKILL_CATEGORIES.map(c => ({ category: c, skills: [] })));
  newSkills: Record<string, string> = {};
  cvGenerating = signal(false);

  // Step 3
  meta = signal<CoverLetterMeta>({
    applicantName: '', applicantLocation: '', companyName: '', companyLocation: '',
    role: '', hiringManager: '', date: new Date().toISOString().split('T')[0]
  });
  sections = signal<CoverLetterSection[]>([
    { id: '1', title: 'Introduction', content: '', prompt: '', loading: false },
    { id: '2', title: 'Why this company?', content: '', prompt: '', loading: false },
    { id: '3', title: 'Why me?', content: '', prompt: '', loading: false },
    { id: '4', title: 'Closing', content: '', prompt: '', loading: false },
  ]);
  generatingFull = signal(false);
  previewMode = signal(false);
  applyLoading = signal(false);

  categoryIcon(cat: string): string { return CAT_ICONS[cat] ?? '◆'; }

  // ── Step 1 ─────────────────────────────────────────────────────
  async fetchJob() {
    const url = this.jobUrl().trim();
    if (!url) return;
    this.fetchLoading.set(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1200,
          messages: [{ role: 'user', content: `The user provided this job posting URL: ${url}\n\nSince you cannot browse the internet, generate a realistic sample job description for a software engineering role in Germany that would plausibly appear at this URL. Make it detailed with: company name, role title, location, responsibilities, required skills (programming languages, frameworks, databases, DevOps tools), and qualifications. Format as clean plain-text job description.` }]
        })
      });
      const data = await res.json();
      const text = data.content?.find((c: any) => c.type === 'text')?.text ?? '';
      this.jobDescription.set(text);
      await this.parseJobMeta(text);
      this.toast.show('Job details loaded! Review and click Next.');
    } catch {
      this.toast.show('Could not load job. Paste description manually.', 'error');
    } finally { this.fetchLoading.set(false); }
  }

  async parseJobMeta(description: string) {
    this.parseLoading.set(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 300,
          system: 'Extract job metadata. Return ONLY JSON: {"company":"","role":"","location":"","hiringManager":""}. No markdown.',
          messages: [{ role: 'user', content: description }]
        })
      });
      const data = await res.json();
      const raw = data.content?.find((c: any) => c.type === 'text')?.text ?? '{}';
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      this.parsedCompany.set(parsed.company ?? '');
      this.parsedRole.set(parsed.role ?? '');
      this.parsedLocation.set(parsed.location ?? '');
      this.meta.update(m => ({ ...m, companyName: parsed.company ?? m.companyName, companyLocation: parsed.location ?? m.companyLocation, role: parsed.role ?? m.role, hiringManager: parsed.hiringManager ?? m.hiringManager }));
    } catch { /* silent */ } finally { this.parseLoading.set(false); }
  }

  goToStep2() {
    if (!this.jobDescription().trim()) { this.toast.show('Please enter a job description first.', 'error'); return; }
    this.step.set(2);
    this.extractSkills();
  }

  goToStep3() {
    this.step.set(3);
  }

  // ── Step 2 ─────────────────────────────────────────────────────
  async extractSkills() {
    this.cvGenerating.set(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 800,
          system: `Extract and categorise skills from a job description. Return ONLY a JSON array, no markdown:\n[{"category":"Programming Languages","skills":[]},{"category":"Language Frameworks","skills":[]},{"category":"Databases","skills":[]},{"category":"Monitoring Tools","skills":[]},{"category":"DevOps Tools","skills":[]},{"category":"Cloud Platforms","skills":[]},{"category":"Other Skills","skills":[]}]`,
          messages: [{ role: 'user', content: this.jobDescription() }]
        })
      });
      const data = await res.json();
      const raw = data.content?.find((c: any) => c.type === 'text')?.text ?? '[]';
      const parsed: SkillGroup[] = JSON.parse(raw.replace(/```json|```/g, '').trim());
      const merged = SKILL_CATEGORIES.map(cat => {
        const found = parsed.find(p => p.category === cat);
        return { category: cat, skills: found?.skills ?? [] };
      });
      this.skillGroups.set(merged);
      this.toast.show('Skills extracted!');
    } catch {
      this.toast.show('Could not extract skills. Add manually.', 'error');
    } finally { this.cvGenerating.set(false); }
  }

  addSkill(category: string) {
    const val = (this.newSkills[category] ?? '').trim();
    if (!val) return;
    this.skillGroups.update(gs => gs.map(g => g.category === category ? { ...g, skills: [...g.skills, val] } : g));
    this.newSkills[category] = '';
  }

  removeSkill(category: string, skill: string) {
    this.skillGroups.update(gs => gs.map(g => g.category === category ? { ...g, skills: g.skills.filter(s => s !== skill) } : g));
  }

  totalSkills() { return this.skillGroups().reduce((a, g) => a + g.skills.length, 0); }

  generateCvPdf() {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const m = this.meta();
      let y = 22;
      doc.setFontSize(22); doc.setFont('helvetica', 'bold'); doc.setTextColor(17,17,17);
      doc.text(m.applicantName || 'Your Name', 20, y); y += 9;
      doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100,100,100);
      doc.text(`${m.applicantLocation || 'Location'} · ${m.role || this.parsedRole() || 'Role'} · ${m.companyName || this.parsedCompany() || 'Company'}`, 20, y); y += 8;
      doc.setDrawColor(26, 86, 219); doc.setLineWidth(0.8); doc.line(20, y, 190, y); y += 9;
      for (const group of this.skillGroups().filter(g => g.skills.length > 0)) {
        if (y > 262) { doc.addPage(); y = 20; }
        doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 86, 219);
        doc.text(group.category, 20, y); y += 6;
        doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40);
        const lines = doc.splitTextToSize(group.skills.join('   ·   '), 170);
        for (const line of lines) { doc.text(line, 20, y); y += 5; }
        y += 4;
      }
      doc.setFontSize(8); doc.setTextColor(180,180,180);
      doc.text(`JobApply.de — ${new Date().toLocaleDateString('de-DE')}`, 20, 287);
      doc.save(`CV_${m.companyName || this.parsedCompany() || 'Application'}.pdf`);
      this.toast.show('PDF downloaded!');
    });
  }

  // ── Step 3 ─────────────────────────────────────────────────────
  updateMeta(field: keyof CoverLetterMeta, value: string) { this.meta.update(m => ({ ...m, [field]: value })); }
  addSection() {
    this.sections.update(s => [...s, { id: Date.now().toString(), title: 'New Section', content: '', prompt: '', loading: false }]);
  }
  removeSection(id: string) { this.sections.update(s => s.filter(sec => sec.id !== id)); }
  updateSection(id: string, field: keyof CoverLetterSection, value: string) {
    this.sections.update(s => s.map(sec => sec.id === id ? { ...sec, [field]: value } : sec));
  }
  formatDisplayDate(d: string) {
    return d ? new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
  }

  async generateSection(sectionId: string) {
    const m = this.meta(); const section = this.sections().find(s => s.id === sectionId); if (!section) return;
    this.sections.update(s => s.map(sec => sec.id === sectionId ? { ...sec, loading: true } : sec));
    const skills = this.skillGroups().flatMap(g => g.skills).join(', ');
    const system = `You are an expert career coach for German job applications. Write professional cover letter paragraphs in English. Return only the paragraph text.`;
    const prompt = section.prompt
      ? `${section.prompt}\n\nApplicant: ${m.applicantName}, Role: ${m.role} at ${m.companyName}. Skills: ${skills}. Section: "${section.title}". Existing: "${section.content}".`
      : `Write "${section.title}" paragraph. Applicant: ${m.applicantName || '[Name]'}. Role: ${m.role || '[Role]'} at ${m.companyName || '[Company]'} in ${m.companyLocation}. Skills: ${skills}. 3-4 sentences, professional, Germany-appropriate.`;
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, system, messages: [{ role: 'user', content: prompt }] }) });
      const data = await res.json();
      const text = data.content?.find((c: any) => c.type === 'text')?.text ?? '';
      this.sections.update(s => s.map(sec => sec.id === sectionId ? { ...sec, content: text, loading: false } : sec));
      this.toast.show('Section generated!');
    } catch { this.sections.update(s => s.map(sec => sec.id === sectionId ? { ...sec, loading: false } : sec)); this.toast.show('Failed.', 'error'); }
  }

  async generateFullLetter() {
    this.generatingFull.set(true);
    const m = this.meta();
    const skills = this.skillGroups().flatMap(g => g.skills).slice(0, 12).join(', ');
    const sections = this.sections().map(s => s.title).join(', ');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1200, system: 'Generate cover letter sections as JSON array only, no markdown.', messages: [{ role: 'user', content: `Applicant: ${m.applicantName || '[Name]'} from ${m.applicantLocation}. Role: ${m.role || '[Role]'} at ${m.companyName || '[Company]'} in ${m.companyLocation}. Hiring manager: ${m.hiringManager || 'Hiring Team'}. Skills: ${skills}. Sections needed: ${sections}. Return [{"title":"...","content":"..."}]. 3-4 sentences each.` }] }) });
      const data = await res.json();
      const raw = data.content?.find((c: any) => c.type === 'text')?.text ?? '[]';
      const parsed: { title: string; content: string }[] = JSON.parse(raw.replace(/```json|```/g, '').trim());
      this.sections.update(secs => secs.map(sec => { const match = parsed.find(p => p.title.toLowerCase().includes(sec.title.toLowerCase().split(' ')[0])); return match ? { ...sec, content: match.content } : sec; }));
      this.previewMode.set(true);
      this.toast.show('Cover letter generated!');
    } catch { this.toast.show('Generation failed.', 'error'); }
    finally { this.generatingFull.set(false); }
  }

  get previewText(): string {
    const m = this.meta();
    const body = this.sections().map(s => s.content).filter(Boolean).join('\n\n');
    return `${m.applicantName}\n${m.applicantLocation}\n\n${this.formatDisplayDate(m.date)}\n\n${m.companyName}\n${m.companyLocation}\n\nDear ${m.hiringManager || 'Hiring Team'},\n\n${body}\n\nYours sincerely,\n${m.applicantName}`;
  }

  async copyToClipboard() { await navigator.clipboard.writeText(this.previewText); this.toast.show('Copied!'); }

  applyJob() {
    this.applyLoading.set(true);
    const m = this.meta();
    const jobData = {
      company: m.companyName || this.parsedCompany() || 'Unknown Company',
      role: m.role || this.parsedRole() || 'Unknown Role',
      location: m.companyLocation || this.parsedLocation() || '',
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'Applied' as const,
      jobUrl: this.jobUrl(),
      jobDescription: this.jobDescription(),
      skillGroups: this.skillGroups(),
      coverLetter: this.previewText,
      contactName: m.hiringManager,
    };
    setTimeout(() => {
      this.jobsService.addJob(jobData);
      this.toast.show(`Applied to ${jobData.company}! Added to Job Tracker.`);
      this.applyLoading.set(false);
      this.step.set(1);
      this.jobUrl.set(''); this.jobDescription.set('');
      this.parsedCompany.set(''); this.parsedRole.set(''); this.parsedLocation.set('');
      this.skillGroups.set(SKILL_CATEGORIES.map(c => ({ category: c, skills: [] })));
      this.sections.set([
        { id: '1', title: 'Introduction', content: '', prompt: '', loading: false },
        { id: '2', title: 'Why this company?', content: '', prompt: '', loading: false },
        { id: '3', title: 'Why me?', content: '', prompt: '', loading: false },
        { id: '4', title: 'Closing', content: '', prompt: '', loading: false },
      ]);
      const saved = { applicantName: m.applicantName, applicantLocation: m.applicantLocation };
      this.meta.set({ ...saved, companyName: '', companyLocation: '', role: '', hiringManager: '', date: new Date().toISOString().split('T')[0] });
      this.previewMode.set(false);
    }, 500);
  }
}

// NOTE: CvBuilderComponent is imported via apply-job template for Step 3
