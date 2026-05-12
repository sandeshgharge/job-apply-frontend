import { Component, signal, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../utils/services/toast';
import { Store } from '@ngrx/store';
import { selectCurrentUserLocation, selectCurrentUserName } from '../utils/store/auth/auth.selectors';
import { JobDetails } from '../utils/entities/job-details';
import { JobsService } from '../utils/services/jobs';
import { AsyncPipe } from '@angular/common';
import { CoverLetterSection } from '../utils/entities/cover-letter';

@Component({
  selector: 'app-cover-letter',
  imports: [FormsModule, AsyncPipe],
  templateUrl: './cover-letter.html',
  styleUrl: './cover-letter.scss'
})
export class CoverLetterComponent {
  private toast = inject(ToastService);
  private jobsService = inject(JobsService);
  private store = inject(Store);

  // ── Common prompt — applied globally to every section call ─────
  commonPrompt = signal('');


  
  applicantName = this.store.selectSignal(selectCurrentUserName) ?? '';
  applicantLocation = this.store.selectSignal(selectCurrentUserLocation) ?? '';
  jobDetails = this.jobsService.jobDetails$;

  meta = signal({
    applicantName: this.applicantName(),
    applicantLocation: this.applicantLocation(),
    companyName: '',
    companyLocation: '',
    role: '',
    date: new Date().toISOString().split('T')[0],
    hiringManager: ''
  });

  constructor() {
    this.jobDetails.subscribe((j) => {
      this.meta.update(m => ({
        ...m,
        companyName: j?.companyName || '',
        companyLocation: j?.companyLocation || '',
        role: j?.role || '',
        hiringManager: j ?.contactName || 'Hiring Manager'
      }))
    }); 
  }
  
  sections = signal<CoverLetterSection[]>([
    { id: '1', title: 'Introduction',      content: '', sectionPrompt: '', loading: false },
    { id: '2', title: 'Why this company?', content: '', sectionPrompt: '', loading: false },
    { id: '3', title: 'Why me?',           content: '', sectionPrompt: '', loading: false },
    { id: '4', title: 'Closing',           content: '', sectionPrompt: '', loading: false }
  ]);

  generatingFull = signal(false);
  previewMode    = signal(false);
  copySuccess    = signal(false);

  // ── Meta ───────────────────────────────────────────────────────
  updateField(field: keyof JobDetails, value: string) {
    this.jobsService.updateField(field, value);
  }

  // ── Sections ───────────────────────────────────────────────────
  addSection() {
    this.sections.update(s => [
      ...s,
      { id: Date.now().toString(), title: 'New Section', content: '', sectionPrompt: '', loading: false }
    ]);
  }

  removeSection(id: string) {
    this.sections.update(s => s.filter(sec => sec.id !== id));
  }

  updateSection(id: string, field: keyof CoverLetterSection, value: string) {
    this.sections.update(s =>
      s.map(sec => sec.id === id ? { ...sec, [field]: value } : sec)
    );
  }

  formatDisplayDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('de-DE', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  // ── Prompt builder ─────────────────────────────────────────────
  // Combines common prompt + section-specific prompt into one message.
  // Common: global tone, background, skills context.
  // Section: targeted instruction for that specific paragraph.
  private buildSectionPrompt(section: CoverLetterSection): string {
    const m     = this.meta();
    const common   = this.commonPrompt().trim();
    const specific = section.sectionPrompt.trim();

    const context =
      `Applicant: ${m.applicantName || '[Name]'}, ${m.applicantLocation || '[Location]'}. ` +
      `Applying for: ${m.role || '[Role]'} at ${m.companyName || '[Company]'}, ` +
      `${m.companyLocation || '[Location]'}. Hiring manager: ${m.hiringManager || 'Hiring Team'}.`;

    const parts: string[] = [`Section to write: "${section.title}"`, `Context: ${context}`];

    if (common)   parts.push(`Global guidance (tone, background, skills):\n${common}`);
    if (specific) parts.push(`Specific instruction for this section:\n${specific}`);
    if (section.content) parts.push(`Existing draft to improve:\n"${section.content}"`);

    if (!common && !specific) {
      parts.push('Write 3–4 sentences. Warm but professional. Suitable for the German job market.');
    }

    return parts.join('\n\n');
  }

  // ── Generate single section ────────────────────────────────────
  async generateSection(sectionId: string) {
    const section = this.sections().find(s => s.id === sectionId);
    if (!section) return;

    this.sections.update(s =>
      s.map(sec => sec.id === sectionId ? { ...sec, loading: true } : sec)
    );

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          system: `You are an expert career coach for German job applications (Bewerbungen).
Write professional cover letter paragraphs in English.
Return only the paragraph text — no preamble, no labels, no markdown.`,
          messages: [{ role: 'user', content: this.buildSectionPrompt(section) }]
        })
      });

      const data = await res.json();
      const text = data.content?.find((c: any) => c.type === 'text')?.text ?? '';

      this.sections.update(s =>
        s.map(sec => sec.id === sectionId ? { ...sec, content: text, loading: false } : sec)
      );
      this.toast.show(`"${section.title}" generated!`);
    } catch {
      this.sections.update(s =>
        s.map(sec => sec.id === sectionId ? { ...sec, loading: false } : sec)
      );
      this.toast.show('Generation failed. Try again.', 'error');
    }
  }

  // ── Generate full letter ───────────────────────────────────────
  async generateFullLetter() {
    this.generatingFull.set(true);
    const m      = this.meta();
    const common = this.commonPrompt().trim();
    const titles = this.sections().map(s => s.title).join(', ');

    const prompt = [
      common ? `Global guidance:\n${common}\n` : '',
      `Write all cover letter sections for:`,
      `Applicant: ${m.applicantName || '[Name]'} from ${m.applicantLocation || '[Location]'}.`,
      `Role: ${m.role || '[Role]'} at ${m.companyName || '[Company]'} in ${m.companyLocation || '[Location]'}.`,
      `Hiring manager: ${m.hiringManager || 'Hiring Team'}.`,
      `Sections: ${titles}.`,
      `Return ONLY a JSON array: [{"title":"...","content":"..."}]. 3–4 sentences each.`
    ].filter(Boolean).join('\n');

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1200,
          system: `You are an expert career coach. Generate cover letter sections as a JSON array only. No markdown, no preamble.`,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await res.json();
      const raw  = data.content?.find((c: any) => c.type === 'text')?.text ?? '[]';
      const parsed: { title: string; content: string }[] = JSON.parse(
        raw.replace(/```json|```/g, '').trim()
      );

      this.sections.update(secs =>
        secs.map(sec => {
          const match = parsed.find(p =>
            p.title.toLowerCase().includes(sec.title.toLowerCase().split(' ')[0])
          );
          return match ? { ...sec, content: match.content } : sec;
        })
      );

      this.previewMode.set(true);
      this.toast.show('Cover letter generated!');
    } catch {
      this.toast.show('Generation failed. Try again.', 'error');
    } finally {
      this.generatingFull.set(false);
    }
  }

  // ── Preview ────────────────────────────────────────────────────
  get previewText(): string {
    const m    = this.meta();
    const body = this.sections().map(s => s.content).filter(Boolean).join('\n\n');
    return [
      m.applicantName,
      m.applicantLocation,
      '',
      this.formatDisplayDate(m.date),
      '',
      m.companyName,
      m.companyLocation,
      '',
      `Dear ${m.hiringManager || 'Hiring Team'},`,
      '',
      body,
      '',
      'Yours sincerely,',
      m.applicantName
    ].join('\n');
  }

  async copyToClipboard() {
    await navigator.clipboard.writeText(this.previewText);
    this.copySuccess.set(true);
    this.toast.show('Copied to clipboard!');
    setTimeout(() => this.copySuccess.set(false), 2000);
  }
}
