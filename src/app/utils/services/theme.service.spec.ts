import { TestBed } from '@angular/core/testing';
import { ThemeService, ThemeType } from './theme.service';
import { StorageService } from './storage.service';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';

describe('ThemeService', () => {
  let mockStorageService: Partial<StorageService>;
  let mockMatchMedia: Mock;
  let mockFavicon: Partial<HTMLLinkElement>;

  beforeEach(() => {
    mockStorageService = {
      get: vi.fn(),
      set: vi.fn(),
    };

    mockMatchMedia = vi.fn();
    vi.stubGlobal('matchMedia', mockMatchMedia);

    mockFavicon = { href: '' };
    vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      if (id === 'app-favicon') return mockFavicon as HTMLElement;
      return null;
    });

    vi.spyOn(document.documentElement, 'setAttribute');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const setupService = () => {
    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: StorageService, useValue: mockStorageService }
      ]
    });
    // The effect in constructor runs in injection context automatically in TestBed
    return TestBed.inject(ThemeService);
  };

  describe('Initialization', () => {
    it('should initialize with light theme if stored in StorageService', () => {
      (mockStorageService.get as Mock).mockReturnValue('light');
      
      const service = setupService();
      
      expect(service.theme()).toBe('light');
      expect(mockStorageService.get).toHaveBeenCalledWith('theme', null);
    });

    it('should initialize with dark theme if stored in StorageService', () => {
      (mockStorageService.get as Mock).mockReturnValue('dark');
      
      const service = setupService();
      
      expect(service.theme()).toBe('dark');
    });

    it('should fallback to system preference (dark) if nothing is stored', () => {
      (mockStorageService.get as Mock).mockReturnValue(null);
      mockMatchMedia.mockReturnValue({ matches: true }); // Prefers dark
      
      const service = setupService();
      
      expect(service.theme()).toBe('dark');
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('should fallback to system preference (light) if nothing is stored', () => {
      (mockStorageService.get as Mock).mockReturnValue(null);
      mockMatchMedia.mockReturnValue({ matches: false }); // Prefers light
      
      const service = setupService();
      
      expect(service.theme()).toBe('light');
    });
  });

  describe('Effects and Toggling', () => {
    it('should apply theme to document, storage, and favicon on init (effect)', () => {
      (mockStorageService.get as Mock).mockReturnValue('dark');
      
      const service = setupService();
      
      TestBed.flushEffects();
      
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
      expect(mockStorageService.set).toHaveBeenCalledWith('theme', 'dark');
      expect(mockFavicon.href).toContain('logo-dark.svg?theme=dark');
    });

    it('should toggle theme from dark to light', () => {
      (mockStorageService.get as Mock).mockReturnValue('dark');
      const service = setupService();
      
      // Clear initial effect calls
      (mockStorageService.set as Mock).mockClear();
      (document.documentElement.setAttribute as Mock).mockClear();

      service.toggleTheme();
      
      expect(service.theme()).toBe('light');
      
      // Angular TestBed auto-flushes effects in tests when signals change
      TestBed.flushEffects(); 

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
      expect(mockStorageService.set).toHaveBeenCalledWith('theme', 'light');
      expect(mockFavicon.href).toContain('logo-light.svg?theme=light');
    });
  });
});
