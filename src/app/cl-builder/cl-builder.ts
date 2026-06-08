import { Component, signal, inject, Input, effect, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../utils/services/toast.service';
import { Store } from '@ngrx/store';
import { selectUserID } from '../utils/store/auth/auth.selectors';
import { JobDetails } from '../utils/entities/job-details';
import { JobsService } from '../utils/services/jobs.service';
import { AsyncPipe } from '@angular/common';
import { CoverLetterSection, CoverLetterDocInfo } from '../utils/entities/cover-letter';
import { selectCoverLetterInfoList, selectCurrentCoverLetter } from '../utils/store/cover-letter/cover-letter.selectors';
import { selectProfileInfo } from '../utils/store/profile/profile.selector';
import { saveNewCoverLetterInfo, saveNewCoverLetterInfoSuccess, selectCoverLetterVersion, updateCoverLetterInfo } from '../utils/store/cover-letter/cover-letter.actions';
import { LocalAiService } from '../utils/services/local-ai-service';
import { firstValueFrom } from 'rxjs';
import { CLService } from '@app/utils/services/cl.service';

@Component({
  selector: 'app-cover-letter',
  imports: [FormsModule, AsyncPipe],
  templateUrl: './cl-builder.html',
  styleUrl: './cl-builder.scss'
})
export class CoverLetterComponent implements OnInit {
  private toast = inject(ToastService);
  private jobsService = inject(JobsService);
  private store = inject(Store);
  private aiService = inject(LocalAiService);
  private clService = inject(CLService);

  profileInfo = this.store.selectSignal(selectProfileInfo);
  jobDetails = this.jobsService.jobDetails$;
  clInfoList = this.store.selectSignal(selectCoverLetterInfoList);
  coverLetterInfo = this.clService.draftCoverLetter;

  userID = this.store.selectSignal(selectUserID);

  meta = signal<CoverLetterDocInfo>({
    applicantName: '',
    applicantLocation: '',
    applicantEmail: '',
    companyName: '',
    companyLocation: '',
    contactName: '',
    date: new Date().toISOString().split('T')[0],
    role: '',
    paragraphs: [],
    signUrl: ''
  });

  jobDescription = signal('');

  constructor() {
    this.jobDetails.subscribe((j) => {
      this.meta.update(m => ({
        ...m,
        companyName: j?.companyName || '',
        companyLocation: j?.companyLocation || '',
        role: j?.role || '',
        contactName: j?.contactName || 'Hiring Manager'
      }));
      this.jobDescription.set(j?.jobDescription || '');
    });

    effect(() => {
      const tempInfo = this.profileInfo();
      if (tempInfo)
        this.meta.update(m => (
          {
            ...m,
            applicantName: tempInfo.firstName + ' ' + tempInfo.lastName,
            applicantLocation: tempInfo.location,
            applicantEmail: tempInfo.email
          }))
    });

    effect(() => {
      const cl = this.coverLetterInfo();
      if (cl && cl.clData && cl.clData.sectionPrompts) {
        this.meta.update(m => ({
          ...m,
          paragraphs: cl.clData.sectionPrompts.map(s => s.content)
        }));
      }
    });

    // Reactively load data when store is populated (e.g. after refresh)
    const currentCL = this.store.selectSignal(selectCurrentCoverLetter);
    effect(() => {
      const current = currentCL();
      if (current && !this.hasLoadedInitialData) {
        this.hasLoadedInitialData = true;
        this.coverLetterInfo.set(current);
      }
    });
  }

  hasLoadedInitialData = false;

  ngOnInit(): void {
  }

  generatingFull = signal(false);
  previewMode = signal(false);
  copySuccess = signal(false);

  // ── Versioning ────────────────────────────────────────────────
  coverLetterTitle = signal('Cover Letter');
  showSaveAsDialog = signal(false);



  saveNow() {
    if (this.clInfoList().length === 0 && this.userID()) {
      this.saveNew();
      return;
    }
    this.store.dispatch(updateCoverLetterInfo({ coverLetterInfo: this.coverLetterInfo() }));
  }

  openSaveAsDialog() {
    this.showSaveAsDialog.set(true);
  }

  closeSaveAsDialog() {
    this.showSaveAsDialog.set(false);
  }

  confirmSaveAs() {
    const title = this.coverLetterTitle();
    if (!title) {
      this.toast.show('Title is required', 'error');
      return;
    }
    this.closeSaveAsDialog();
    console.log(this.coverLetterInfo())
    this.store.dispatch(saveNewCoverLetterInfo({ coverLetterInfo: this.coverLetterInfo() }));
  }

  saveNew() {
    this.openSaveAsDialog();
  }

  // ── Meta ───────────────────────────────────────────────────────
  updateField(field: keyof JobDetails, value: string) {
    this.jobsService.updateField(field, value);
  }

  // ── Sections ───────────────────────────────────────────────────
  addSection() {
    this.coverLetterInfo.update(info => ({
      ...info,
      clData: {
        ...info.clData,
        sectionPrompts: [
          ...info.clData.sectionPrompts,
          { id: (info.clData.sectionPrompts.length + 1).toString(), title: 'New Section', content: '', sectionPrompt: '', loading: false }
        ]
      }
    }));
  }

  removeSection(id: string) {
    this.coverLetterInfo.update(info => ({
      ...info,
      clData: {
        ...info.clData,
        sectionPrompts: info.clData.sectionPrompts.filter(sec => sec.id !== id)
      }
    }));
  }

  updateSection(id: string, field: keyof CoverLetterSection, value: string) {
    this.coverLetterInfo.update(info => ({
      ...info,
      clData: {
        ...info.clData,
        sectionPrompts: info.clData.sectionPrompts.map(sec =>
          sec.id === id ? { ...sec, [field]: value } : sec
        )
      }
    }));
  }

  updateCommonPrompt(val: string) {
    this.coverLetterInfo.update(info => ({
      ...info,
      clData: {
        ...info.clData,
        commonPrompt: val
      }
    }));
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
    const jd = this.jobDescription();
    const common = this.coverLetterInfo().clData.commonPrompt.trim();
    let specific = common;

    if (jd) {
      specific = specific.replace('[job_description]', jd);
    }

    const parts: string[] = [`${specific}`];
    if (section.sectionPrompt) {
      parts.push('Input:');
      parts.push(`${section.sectionPrompt}`);
    }

    if (!specific) {
      parts.push('Write 3–4 sentences. Warm but professional. Suitable for the German job market.');
    }

    return parts.join('\n\n');
  }

  // ── Generate single section ─────────────────────────────────────
  async generateSection(sectionId: string) {
    const section = this.coverLetterInfo().clData.sectionPrompts.find(s => s.id === sectionId);
    if (!section) return;

    this.coverLetterInfo.update(info => ({
      ...info,
      clData: {
        ...info.clData,
        sectionPrompts: info.clData.sectionPrompts.map(sec =>
          sec.id === sectionId ? { ...sec, loading: true } : sec
        )
      }
    }));

    try {
      const pInfo = this.profileInfo();
      if (!pInfo) {
        this.toast.show('Profile information not available. Cannot generate section.', 'error');
        this.coverLetterInfo.update(info => ({
          ...info,
          clData: {
            ...info.clData,
            sectionPrompts: info.clData.sectionPrompts.map(sec =>
              sec.id === sectionId ? { ...sec, loading: false } : sec
            )
          }
        }));
        return;
      }

      const apiUrl = pInfo.agentApiUrl;
      const apiKey = pInfo.agentApiKey;
      const modelName = pInfo.modelName;

      if (!apiUrl || !apiKey || !modelName) {
        this.toast.show('AI API URL, API Key, or Model Name not configured in profile.', 'error');
        this.coverLetterInfo.update(info => ({
          ...info,
          clData: {
            ...info.clData,
            sectionPrompts: info.clData.sectionPrompts.map(sec =>
              sec.id === sectionId ? { ...sec, loading: false } : sec
            )
          }
        }));
        return;
      }

      const userMessage = this.buildSectionPrompt(section);
      console.log("FInal prompt: ", userMessage)

      const data = await firstValueFrom (this.aiService.generate(userMessage))
      console.log(data.output)

      const text = typeof data.output === 'string' ? data.output : data.output.toString();

      this.coverLetterInfo.update(info => ({
        ...info,
        clData: {
          ...info.clData,
          sectionPrompts: info.clData.sectionPrompts.map(sec =>
            sec.id === sectionId ? { ...sec, content: text, loading: false } : sec
          )
        }
      }));
      this.toast.show(`"${section.title}" generated!`);
    } catch {
      this.coverLetterInfo.update(info => ({
        ...info,
        clData: {
          ...info.clData,
          sectionPrompts: info.clData.sectionPrompts.map(sec =>
            sec.id === sectionId ? { ...sec, loading: false } : sec
          )
        }
      }));
      this.toast.show('Generation failed. Try again.', 'error');
    }
  }

  // ── Generate full letter ───────────────────────────────────────
  async generateFullLetter() {
    this.generatingFull.set(true);
    const m = this.meta();
    const common = this.coverLetterInfo().clData.commonPrompt.trim();
    const titles = this.coverLetterInfo().clData.sectionPrompts.map(s => s.title).join(', ');

    const prompt = [
      common ? `Global guidance:\n${common}\n` : '',
      `Write all cover letter sections for:`,
      `Applicant: ${m.applicantName || '[Name]'} from ${m.applicantLocation || '[Location]'}.`,
      `Role: ${m.role || '[Role]'} at ${m.companyName || '[Company]'} in ${m.companyLocation || '[Location]'}.`,
      `Hiring manager: ${m.contactName || 'Hiring Team'}.`,
      `Sections: ${titles}.`,
      `Return ONLY a JSON array: [{"title":"...","content":"..."}]. 3–4 sentences each.`
    ].filter(Boolean).join('\n');

    try {
      const pInfo = this.profileInfo();
      if (!pInfo) {
        this.toast.show('Profile information not available. Cannot generate full letter.', 'error');
        return;
      }

      const apiUrl = pInfo.agentApiUrl;
      const apiKey = pInfo.agentApiKey;
      const modelName = pInfo.modelName;

      if (!apiUrl || !apiKey || !modelName) {
        this.toast.show('AI API URL, API Key, or Model Name not configured in profile.', 'error');
        return;
      }

      const systemPrompt = `You are an expert career coach. Generate cover letter sections as a JSON array only. No markdown, no preamble.`;
      const userMessage = [
        common ? `Global guidance:\n${common}\n` : '',
        `Write all cover letter sections for:`,
        `Applicant: ${m.applicantName || '[Name]'} from ${m.applicantLocation || '[Location]'}.`,
        `Role: ${m.role || '[Role]'} at ${m.companyName || '[Company]'} in ${m.companyLocation || '[Location]'}.`,
        `Hiring manager: ${m.contactName || 'Hiring Team]'}.`,
        `Sections: ${titles}.`,
        `Return ONLY a JSON array: [{"title":"...","content":"..."}]. 3–4 sentences each.`
      ].filter(Boolean).join('\n');

      const promptBody = JSON.stringify({
        model: modelName,
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      });

      const data = await firstValueFrom(this.aiService.generate(promptBody))

      const raw = data.content?.find((c: any) => c.type === 'text')?.text ?? '[]';
      const parsed: { title: string; content: string }[] = JSON.parse(
        raw.replace(/```json|```/g, '').trim()
      );

      this.coverLetterInfo.update(info => ({
        ...info,
        clData: {
          ...info.clData,
          sectionPrompts: info.clData.sectionPrompts.map(sec => {
            const match = parsed.find(p =>
              p.title.toLowerCase().includes(sec.title.toLowerCase().split(' ')[0])
            );
            return match ? { ...sec, content: match.content } : sec;
          })
        }
      }));

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
    const m = this.meta();
    const body = m.paragraphs.filter(Boolean).join('\n\n');
    return [
      m.applicantName,
      m.applicantLocation,
      '',
      this.formatDisplayDate(m.date),
      '',
      m.companyName,
      m.companyLocation,
      '',
      `Dear ${m.contactName || 'Hiring Team'},`,
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

  // ── Versioning Methods ────────────────────────────────────────
  onVersionChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const version = select.value;
    this.store.dispatch(selectCoverLetterVersion({ version }));
    const selected = this.clInfoList().find(v => v.version === version);
    if (selected) {
      this.coverLetterInfo.set(selected);
      this.coverLetterTitle.set(selected.title);
    }
  }

  clearCoverLetter() {
    if (!confirm('Clear all Cover Letter data? This cannot be undone.')) return;
    this.clService.clearDraft();
    this.toast.show('Cover Letter cleared.', 'info');
  }

  updateTitle(event: any) {
    const value = typeof event === 'string' ? event : event.target.value;
    this.coverLetterTitle.set(value);
    this.coverLetterInfo.update(c => ({ ...c, title: value }));
  }
}