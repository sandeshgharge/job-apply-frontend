import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('StorageService', () => {
  let service: StorageService;
  
  // Mock localStorage manually
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      })
    };
  })();

  beforeEach(() => {
    // Stub the global localStorage with our mock
    vi.stubGlobal('localStorage', localStorageMock);
    
    TestBed.configureTestingModule({
      providers: [StorageService]
    });
    service = TestBed.inject(StorageService);
    
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('get', () => {
    it('should return fallback when key does not exist', () => {
      const result = service.get('missingKey', 'fallbackValue');
      expect(result).toBe('fallbackValue');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('missingKey');
    });

    it('should return parsed JSON when key exists', () => {
      localStorageMock.setItem('myKey', JSON.stringify({ a: 1 }));
      const result = service.get('myKey', { a: 0 });
      expect(result).toEqual({ a: 1 });
    });

    it('should return fallback if JSON parsing fails', () => {
      // Set invalid JSON
      localStorageMock.setItem('badKey', '{ bad json');
      const result = service.get('badKey', 'fallbackValue');
      expect(result).toBe('fallbackValue');
    });
  });

  describe('set', () => {
    it('should stringify and store the value', () => {
      service.set('newKey', { b: 2 });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('newKey', '{"b":2}');
    });
  });

  describe('remove', () => {
    it('should remove the key from localStorage', () => {
      service.remove('someKey');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('someKey');
    });
  });
});
