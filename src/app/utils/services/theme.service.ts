import { Injectable, signal, effect, inject } from '@angular/core';
import { StorageService } from './storage.service';

export type ThemeType = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private storageService = inject(StorageService);
  
  theme = signal<ThemeType>(this.getInitialTheme());

  constructor() {
    // Automatically apply theme updates to document attribute
    effect(() => {
      const activeTheme = this.theme();
      document.documentElement.setAttribute('data-theme', activeTheme);
      this.storageService.set('theme', activeTheme);
    });
  }

  toggleTheme() {
    this.theme.update(current => (current === 'light' ? 'dark' : 'light'));
  }

  private getInitialTheme(): ThemeType {
    const saved = this.storageService.get<ThemeType | null>('theme', null);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Fallback to system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    return mediaQuery.matches ? 'dark' : 'light';
  }
}
