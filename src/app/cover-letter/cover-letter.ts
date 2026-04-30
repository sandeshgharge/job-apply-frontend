import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../utils/services/toast';

export interface CoverLetterSection {
  id: string;
  title: string;
  content: string;
  prompt: string;
  loading: boolean;
}

export interface CoverLetterMeta {
  applicantName: string;
  applicantLocation: string;
  companyName: string;
  companyLocation: string;
  role: string;
  hiringManager: string;
  date: string;
}

@Component({
  selector: 'app-cover-letter',
  imports: [FormsModule],
  templateUrl: './cover-letter.html',
  styleUrl: './cover-letter.scss'
})
export class CoverLetterComponent {
  private toast = inject(ToastService);

  meta = signal<CoverLetterMeta>({
    applicantName: '', applicantLocation: '', companyName: '', companyLocation: '',
    role: '', hiringManager: '', date: new Date().toISOString().split('T')[0]
  });

  sections = signal<CoverLetterSection[]>([
    { id: '1', title: 'Introduction', content: '', prompt: '', loading: false },
    { id: '2', title: 'Why this company?', content: '', prompt: '', loading: false },
    { id: '3', title: 'Why me?', content: '', prompt: '', loading: false },
    { id: '4', title: 'Closing', content: '', prompt: '', loading: false }
  ]);

  generatingFull = signal(false);
  previewMode = signal(false);
  copySuccess = signal(false);

  updateMeta(field: keyof CoverLetterMeta, value: string) {
    this.meta.update(m => ({ ...m, [field]: value }));
  }

  addSection() {
    const id = Date.now().toString();
    this.sections.update(s => [...s, { id, title: 'New Section', content: '', prompt: '', loading: false }]);
  }

  removeSection(id: string) {
    this.sections.update(s => s.filter(sec => sec.id !== id));
  }

  updateSection(id: string, field: keyof CoverLetterSection, value: string) {
    this.sections.update(s => s.map(sec => sec.id === id ? { ...sec, [field]: value } : sec));
  }

  formatDisplayDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  async generateSection(sectionId: string) {
    const m = this.meta();
    const section = this.sections().find(s => s.id === sectionId);
    if (!section) return;

    this.sections.update(s => s.map(sec => sec.id === sectionId ? { ...sec, loading: true } : sec));

    const systemPrompt = `You are an expert career coach specialising in German job applications. Write professional, concise cover letter paragraphs in English suitable for the German job market. Return only the paragraph text, no preamble.`;
    const userPrompt = section.prompt
      ? `${section.prompt}\n\nContext: Applicant: ${m.applicantName || 'the applicant'}, applying for ${m.role || 'the role'} at ${m.companyName || 'the company'} in ${m.companyLocation || 'Germany'}. Applicant location: ${m.applicantLocation || 'Germany'}. Hiring manager: ${m.hiringManager || 'Hiring Team'}. Section: "${section.title}". Existing content: "${section.content}".`
      : `Write a professional "${section.title}" paragraph for a cover letter. Applicant: ${m.applicantName || '[Name]'}. Role: ${m.role || '[Role]'}. Company: ${m.companyName || '[Company]'} in ${m.companyLocation || '[Location]'}. Keep it 3-4 sentences, warm but professional, suitable for the German job market.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          system: systemPrompt, messages: [{ role: 'user', content: userPrompt }]
        })
      });
      const data = await response.json();
      const text = data.content?.find((c: any) => c.type === 'text')?.text ?? '';
      this.sections.update(s => s.map(sec => sec.id === sectionId ? { ...sec, content: text, loading: false } : sec));
    } catch {
      this.sections.update(s => s.map(sec => sec.id === sectionId ? { ...sec, loading: false } : sec));
    }
  }

  async generateFullLetter() {
    this.generatingFull.set(true);
    const m = this.meta();
    const sectionTitles = this.sections().map(s => s.title).join(', ');
    const systemPrompt = `You are an expert career coach. Generate complete cover letter sections as a JSON array. Return only the JSON array, no markdown fences, no preamble.`;
    const userPrompt = `Write cover letter sections for: Applicant: ${m.applicantName || '[Name]'} from ${m.applicantLocation || '[Location]'}. Role: ${m.role || '[Role]'} at ${m.companyName || '[Company]'} in ${m.companyLocation || '[Location]'}. Hiring manager: ${m.hiringManager || 'Hiring Team'}. Sections: ${sectionTitles}. Return JSON array: [{"title":"...","content":"..."}]. Each section 3-4 sentences.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          system: systemPrompt, messages: [{ role: 'user', content: userPrompt }]
        })
      });
      const data = await response.json();
      const raw = data.content?.find((c: any) => c.type === 'text')?.text ?? '[]';
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed: { title: string; content: string }[] = JSON.parse(clean);
      this.sections.update(secs =>
        secs.map(sec => {
          const match = parsed.find(p => p.title.toLowerCase().includes(sec.title.toLowerCase().split(' ')[0]));
          return match ? { ...sec, content: match.content } : sec;
        })
      );
      this.previewMode.set(true);
      this.toast.show('Cover letter generated! Switch to Preview to review.')
    } catch (err) {
      console.error('Full generation error', err);
    } finally {
      this.generatingFull.set(false);
    }
  }

  get previewText(): string {
    const m = this.meta();
    const body = this.sections().map(s => s.content).filter(Boolean).join('\n\n');
    return `${m.applicantName}\n${m.applicantLocation}\n\n${this.formatDisplayDate(m.date)}\n\n${m.companyName}\n${m.companyLocation}\n\nDear ${m.hiringManager || 'Hiring Team'},\n\n${body}\n\nYours sincerely,\n${m.applicantName}`;
  }

  async copyToClipboard() {
    await navigator.clipboard.writeText(this.previewText);
    this.copySuccess.set(true);
    this.toast.show('Copied to clipboard!');
    setTimeout(() => this.copySuccess.set(false), 2000);
  }
}
