import { TestBed } from '@angular/core/testing';
import { ColdStartService } from './cold-start.service';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

describe('ColdStartService', () => {
  let service: ColdStartService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ColdStartService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created with initial isColdStarting as false', () => {
    expect(service).toBeTruthy();
    expect(service.isColdStarting()).toBe(false);
  });

  it('should trigger isColdStarting after 5000ms of active request', () => {
    service.startRequest();
    expect(service.isColdStarting()).toBe(false);

    vi.advanceTimersByTime(4999);
    expect(service.isColdStarting()).toBe(false);

    vi.advanceTimersByTime(1);
    expect(service.isColdStarting()).toBe(true);

    service.finishRequest();
    expect(service.isColdStarting()).toBe(false);
  });

  it('should not trigger isColdStarting if request finishes before 5000ms', () => {
    service.startRequest();
    vi.advanceTimersByTime(2000);
    service.finishRequest();

    vi.advanceTimersByTime(3000);
    expect(service.isColdStarting()).toBe(false);
  });

  it('should track promises with trackPromise', async () => {
    let resolved = false;
    const promise = new Promise((resolve) => {
      setTimeout(() => {
        resolved = true;
        resolve('done');
      }, 6000);
    });

    const trackingPromise = service.trackPromise(promise);

    vi.advanceTimersByTime(5000);
    expect(service.isColdStarting()).toBe(true);

    vi.advanceTimersByTime(1000);
    await trackingPromise;

    expect(resolved).toBe(true);
    expect(service.isColdStarting()).toBe(false);
  });
});
