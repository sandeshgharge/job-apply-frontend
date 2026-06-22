import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { fallbackEn, TranslationDictionary } from './fallback-en';

export interface LanguageInfo {
  code: string;
  name: string;
}

export interface TranslationManifest {
  default: string;
  languages: LanguageInfo[];
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private http = inject(HttpClient);
  
  // Public raw config URL or local folder
  private readonly baseUrl = environment.translationBaseUrl;

  // Signal for available languages. Default is English.
  languages = signal<LanguageInfo[]>([{ code: 'en', name: 'English' }]);
  
  // Signal for active language code
  currentLang = signal<string>('en');
  
  // Signal for active translation dictionary (defaults to bundled English)
  t = signal<TranslationDictionary>(fallbackEn);

  constructor() {
    this.initTranslations();
  }

  private async initTranslations() {
    try {
      // 1. Fetch manifest.json
      const manifestUrl = this.baseUrl.startsWith('http') 
        ? `${this.baseUrl}/manifest.json` 
        : `${window.location.origin}${this.baseUrl}/manifest.json`;

      const manifest = await firstValueFrom(
        this.http.get<TranslationManifest>(manifestUrl)
      );
      
      this.languages.set(manifest.languages);
      
      // 2. Select initial language (cached choice, or manifest default, or 'en')
      const savedLang = localStorage.getItem('preferred_lang') || manifest.default || 'en';
      
      // 3. Load that language
      await this.loadLanguage(savedLang);
    } catch (error) {
      console.warn('Unable to load translation manifest. Reverting to offline English.', error);
      
      // Try to load whatever language was last saved, using cache if available
      const savedLang = localStorage.getItem('preferred_lang') || 'en';
      await this.loadLanguage(savedLang);
    }
  }

  async loadLanguage(langCode: string) {
    // If it's English, we can default directly to fallbackEn or look for a cached/remote override
    if (langCode === 'en') {
      this.t.set(fallbackEn);
      this.currentLang.set('en');
      localStorage.setItem('preferred_lang', 'en');
      return;
    }

    // Try to fetch from remote/environment endpoint
    try {
      const fileUrl = this.baseUrl.startsWith('http') 
        ? `${this.baseUrl}/${langCode}.json` 
        : `${window.location.origin}${this.baseUrl}/${langCode}.json`;

      const dictionary = await firstValueFrom(
        this.http.get<TranslationDictionary>(fileUrl)
      );

      // Save to localStorage cache for offline usage
      localStorage.setItem(`cached_lang_${langCode}`, JSON.stringify(dictionary));
      
      this.t.set(dictionary);
      this.currentLang.set(langCode);
      localStorage.setItem('preferred_lang', langCode);
    } catch (error) {
      console.warn(`Failed to fetch translations for '${langCode}' from remote repository. Trying local cache.`, error);
      
      // Revert to local storage cache if available
      const cached = localStorage.getItem(`cached_lang_${langCode}`);
      if (cached) {
        try {
          const cachedDict = JSON.parse(cached) as TranslationDictionary;
          this.t.set(cachedDict);
          this.currentLang.set(langCode);
          localStorage.setItem('preferred_lang', langCode);
          return;
        } catch (e) {
          console.error('Error parsing cached language file', e);
        }
      }
      
      // If everything fails, fall back to bundled English
      console.warn(`Reverting to English fallback for language: ${langCode}`);
      this.t.set(fallbackEn);
      this.currentLang.set('en');
      localStorage.setItem('preferred_lang', 'en');
    }
  }
}
