import { Component, inject, computed } from '@angular/core';
import { TranslationService } from '@app/utils/services/translation/translation.service';
import { environment } from '@env/environment';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class FooterComponent {
  public translate = inject(TranslationService);
  private guideLink = environment.guideUrl;

  /** Guide URL with current language appended as ?lang= query param */
  public helpUrl = computed(() => {
    const lang = this.translate.currentLang();
    const base = this.guideLink.endsWith('/')
      ? this.guideLink.slice(0, -1)
      : this.guideLink;
    return `${base}?lang=${lang}`;
  });

  public currentLanguageName = computed(() => {
    const code = this.translate.currentLang();
    const langs = this.translate.languages();
    const lang = langs.find(l => l.code === code);
    return lang ? lang.name : code;
  });
}
