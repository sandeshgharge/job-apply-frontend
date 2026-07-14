import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService]
    });
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    // Restore real timers after each test to prevent leaking fake time to other tests
    vi.useRealTimers();
  });

  it('should initialize with an empty array of toasts', () => {
    expect(service.toasts()).toHaveLength(0);
  });

  it('should add a toast and auto-dismiss it after the specified duration', () => {
    // Enable fake timers
    vi.useFakeTimers();
    
    // Call show with 3000ms duration
    service.show('Saved successfully', 'success', 3000);
    
    // Assert the toast was added
    expect(service.toasts()).toHaveLength(1);
    expect(service.toasts()[0].message).toBe('Saved successfully');
    expect(service.toasts()[0].type).toBe('success');

    // Advance time by 2999ms - toast should still exist
    vi.advanceTimersByTime(2999);
    expect(service.toasts()).toHaveLength(1);

    // Advance time by 1ms (total 3000ms) - toast should disappear
    vi.advanceTimersByTime(1);
    expect(service.toasts()).toHaveLength(0);
  });

  it('should allow manually dismissing a toast by id', () => {
    vi.useFakeTimers();

    service.show('Error occurred', 'error');
    vi.advanceTimersByTime(1); // Advance 1ms so Date.now() changes for the next ID
    service.show('Info message', 'info');
    
    expect(service.toasts()).toHaveLength(2);
    
    const firstToastId = service.toasts()[0].id;
    
    service.dismiss(firstToastId);
    
    expect(service.toasts()).toHaveLength(1);
    expect(service.toasts()[0].message).toBe('Info message');
  });
});
