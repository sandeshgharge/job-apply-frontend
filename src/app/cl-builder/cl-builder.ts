import { Component, signal, inject, computed, effect, untracked, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../utils/services/toast.service';
import { Store } from '@ngrx/store';
import { selectUserID } from '../utils/store/auth/auth.selectors';
import { JobDetails } from '../utils/entities/job-details';
import { AsyncPipe } from '@angular/common';
import { CoverLetterSection, CoverLetterDocInfo, CoverLetterInfo, defaultcl } from '../utils/entities/cover-letter';
import { selectCoverLetterInfoList, selectCurrentCoverLetter } from '../utils/store/cover-letter/cover-letter.selectors';
import { selectProfileInfo, selectProfileUseDefaultApi } from '../utils/store/profile/profile.selector';
import { saveNewCoverLetterInfo, selectCoverLetterVersion, updateCoverLetterInfo } from '../utils/store/cover-letter/cover-letter.actions';
import { AIServiceInterface, AIPrompt } from '../utils/services/ai-service/ai.service.interface';
import { firstValueFrom } from 'rxjs';
import { CLService } from '@app/utils/services/cl.service';
import { TranslationService } from '@app/utils/services/translation/translation.service';
import {
  selectJobDetails,
  selectCoverLetterDetails,
  selectCoverLetterInfo,
  selectJobDescription
} from '../utils/store/apply-wizard/apply-wizard.selectors';
import {
  updateJobDetailsField,
  setCoverLetterInfo,
  clearCoverLetterInfo
} from '../utils/store/apply-wizard/apply-wizard.actions';

@Component({
  selector: 'app-cover-letter',
  imports: [FormsModule, AsyncPipe],
  templateUrl: './cl-builder.html',
  styleUrl: './cl-builder.scss'
})
export class CoverLetterComponent implements OnInit {
  private toast = inject(ToastService);
  private store = inject(Store);
  private aiService = inject(AIServiceInterface);
  private clService = inject(CLService);
  public translate = inject(TranslationService);

  profileInfo = this.store.selectSignal(selectProfileInfo);
  jobDetails$ = this.store.select(selectJobDetails);
  clInfoList = this.store.selectSignal(selectCoverLetterInfoList);
  private storedInfo = this.store.selectSignal(selectCoverLetterInfo);
  coverLetterInfo = computed(() => this.storedInfo() || defaultcl());
  useDefaultApi = this.store.selectSignal(selectProfileUseDefaultApi);
  userID = this.store.selectSignal(selectUserID);

  meta = this.store.selectSignal(selectCoverLetterDetails);

  jobDescription = this.store.selectSignal(selectJobDescription);

  /** Tracks which section IDs are collapsed */
  collapsedSections = signal<Set<string>>(new Set());

  toggleSection(id: string): void {
    this.collapsedSections.update(set => {
      const next = new Set(set);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  isSectionCollapsed(id: string): boolean {
    return this.collapsedSections().has(id);
  }

  constructor() {
    // Reactively load saved CL version when store is populated (e.g. after refresh)
    const currentCL = this.store.selectSignal(selectCurrentCoverLetter);
    effect(() => {
      const current = currentCL();
      if (current && !this.hasLoadedInitialData) {
        untracked(() => {
          this.hasLoadedInitialData = true;
          this.store.dispatch(setCoverLetterInfo({ coverLetterInfo: current }));
        });
      }
    });
  }

  private updateCl(updater: (c: CoverLetterInfo) => CoverLetterInfo) {
    const next = updater(this.coverLetterInfo());
    this.store.dispatch(setCoverLetterInfo({ coverLetterInfo: next }));
  }

  hasLoadedInitialData = false;

  ngOnInit(): void {
  }

  generatingFull = signal(false);
  previewMode = signal(false);
  copySuccess = signal(false);

  // ── Versioning ────────────────────────────────────────────────
  coverLetterTitle = signal('Cover Letter');

  // Save As / Rename dialog (unified)
  titleDialogMode = signal<'saveAs' | 'rename' | null>(null);
  dialogTitle = '';



  isSaving = signal(false);

  saveNow() {
    this.isSaving.set(true);
    if (this.clInfoList().length === 0 && this.userID()) {
      this.saveNew();
      this.isSaving.set(false);
      return;
    }
    this.store.dispatch(updateCoverLetterInfo({ coverLetterInfo: this.coverLetterInfo() }));
    setTimeout(() => this.isSaving.set(false), 500);
  }

  openSaveAsDialog() {
    this.dialogTitle = this.coverLetterInfo().title;
    this.titleDialogMode.set('saveAs');
  }

  openRenameTitleDialog() {
    this.dialogTitle = this.coverLetterInfo().title;
    this.titleDialogMode.set('rename');
  }

  closeTitleDialog() {
    this.titleDialogMode.set(null);
  }

  confirmTitleDialog() {
    this.isSaving.set(true);
    const title = this.dialogTitle.trim();
    if (!title) {
      this.toast.show(this.translate.t().cvBuilder.toastTitleRequired, 'error');
      this.isSaving.set(false);
      return;
    }

    this.coverLetterTitle.set(title);
    this.updateCl(c => ({ ...c, title }));

    if (this.titleDialogMode() === 'saveAs') {
      this.store.dispatch(saveNewCoverLetterInfo({ coverLetterInfo: this.coverLetterInfo() }));
    } else {
      this.store.dispatch(updateCoverLetterInfo({ coverLetterInfo: this.coverLetterInfo() }));
      this.toast.show(this.translate.t().cvBuilder.toastTitleUpdated);
    }

    setTimeout(() => {
      this.isSaving.set(false);
      this.closeTitleDialog();
    }, 500);
  }

  saveNew() {
    this.openSaveAsDialog();
  }

  // ── Meta ───────────────────────────────────────────────────────
  updateField(field: keyof JobDetails, value: string) {
    this.store.dispatch(updateJobDetailsField({ key: field as string, value }));
  }

  // ── Sections ───────────────────────────────────────────────────
  addSection() {
    this.updateCl(info => ({
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
    this.updateCl(info => ({
      ...info,
      clData: {
        ...info.clData,
        sectionPrompts: info.clData.sectionPrompts.filter(sec => sec.id !== id)
      }
    }));
  }

  updateSection(id: string, field: keyof CoverLetterSection, value: string) {
    this.updateCl(info => ({
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
    this.updateCl(info => ({
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
  // Separates commonPrompt (System) and section-specific prompt (User).
  private buildSectionPrompt(section: CoverLetterSection): AIPrompt {
    const jd = this.jobDescription();
    let common = this.coverLetterInfo().clData.commonPrompt.trim();

    if (jd && common) {
      common = common.replace('[job_description]', jd);
    }

    if (!common) {
      common = 'Write 3–4 sentences. Warm but professional. Suitable for the German job market.';
    }

    common += '\n\nReturn ONLY a valid JSON object in the format: {"paragraph": "..."}. No preamble, no markdown formatting.';

    const userPrompt = section.sectionPrompt.trim() || `Write the "${section.title}" section for the cover letter.`;

    return {
      system: common,
      user: userPrompt
    };
  }

  // ── Generate single section ─────────────────────────────────────
  async generateSection(sectionId: string) {
    const section = this.coverLetterInfo().clData.sectionPrompts.find(s => s.id === sectionId);
    if (!section) return;

    this.updateCl(info => ({
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
        this.toast.show(this.translate.t().clBuilder.toastProfileMissing, 'error');
        this.updateCl(info => ({
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

      const promptObj = this.buildSectionPrompt(section);
      const data = await firstValueFrom(this.aiService.generate(promptObj));

      let text = '';
      try {
        const parsed = typeof data.text === 'string' ? JSON.parse(data.text) : data.text;
        text = parsed?.paragraph ?? data.text ?? '';
      } catch {
        text = data.text ?? '';
      }

      this.updateCl(info => ({
        ...info,
        clData: {
          ...info.clData,
          sectionPrompts: info.clData.sectionPrompts.map(sec =>
            sec.id === sectionId ? { ...sec, content: text, loading: false } : sec
          )
        }
      }));
          this.toast.show(this.translate.t().clBuilder.toastSectionGenerated);


        } catch {
          this.updateCl(info => ({
            ...info,
            clData: {
              ...info.clData,
              sectionPrompts: info.clData.sectionPrompts.map(sec =>
                sec.id === sectionId ? { ...sec, loading: false } : sec
              )
            }
          }));
          this.toast.show(this.translate.t().clBuilder.toastGenerationFailed, 'error');
        }
      }

  // ── Generate full letter ───────────────────────────────────────
  async generateFullLetter() {
        this.generatingFull.set(true);
        const m = this.meta();
        const common = this.coverLetterInfo().clData.commonPrompt.trim();
        const titles = this.coverLetterInfo().clData.sectionPrompts.map(s => s.title).join(', ');

        try {
          const pInfo = this.profileInfo();
          if (!pInfo) {
            this.toast.show(this.translate.t().clBuilder.toastProfileMissing, 'error');
            return;
          }

          const systemPrompt = `You are an expert career coach. Generate cover letter sections as a JSON array only. No markdown, no preamble.`;
          const userMessage = [
            common ? `Global guidance:\n${common}\n` : '',
            `Write all cover letter sections for:`,
            `Applicant: ${m.applicantName || '[Name]'} from ${m.applicantLocation || '[Location]'}.`,
            `Role: ${m.role || '[Role]'} at ${m.companyName || '[Company]'} in ${m.companyLocation || '[Location]'}.`,
            `Hiring manager: ${m.contactName || 'Hiring Team'}.`,
            `Sections: ${titles}.`,
            `Return ONLY a JSON array: [{"title":"...","content":"..."}]. 3–4 sentences each.`
          ].filter(Boolean).join('\n');

          const data: any = await firstValueFrom(this.aiService.generate({ system: systemPrompt, user: userMessage }));

          const raw = typeof data?.text === 'string' ? data.text : (typeof data === 'string' ? data : JSON.stringify(data));
          const parsed: { title: string; content: string }[] = JSON.parse(raw);

          this.updateCl(info => ({
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
          this.toast.show(this.translate.t().clBuilder.toastFullLetterGenerated);
        } catch {
          this.toast.show(this.translate.t().clBuilder.toastGenerationFailed, 'error');
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
      onVersionChange(value: any) {
        let version: string | number = value;
        if (value && value.target) {
          version = (value.target as HTMLSelectElement).value;
        }
        const num = typeof version === 'string' ? parseInt(version, 10) : version;
        if (Number.isNaN(num)) return;
        this.store.dispatch(selectCoverLetterVersion({ version: num }));
        const selected = this.clInfoList().find(v => v.version === num);
        if (selected) {
          this.store.dispatch(setCoverLetterInfo({ coverLetterInfo: selected }));
          this.coverLetterTitle.set(selected.title);
        }
      }

      clearCoverLetter() {
        if (!confirm(this.translate.t().clBuilder.clearConfirm)) return;
        this.store.dispatch(clearCoverLetterInfo());
        this.toast.show(this.translate.t().clBuilder.toastCleared, 'info');
      }

      updateTitle(event: any) {
        const value = typeof event === 'string' ? event : event.target.value;
        this.coverLetterTitle.set(value);
        this.updateCl(c => ({ ...c, title: value }));
      }
    }