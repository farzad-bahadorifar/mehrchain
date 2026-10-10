import { describe, it, expect, vi } from 'vitest';
import {
  validateCustomDuration,
  handleDurationKeydown,
} from './duration-validator';

describe('duration-validator utility', () => {
  describe('validateCustomDuration', () => {
    it('should validate standard positive days within range', () => {
      const res1 = validateCustomDuration('1');
      expect(res1.isValid).toBe(true);
      expect(res1.duration).toBe(1);
      expect(res1.errorMessage).toBeNull();

      const res21 = validateCustomDuration('21');
      expect(res21.isValid).toBe(true);
      expect(res21.duration).toBe(21);
      expect(res21.errorMessage).toBeNull();

      const res365 = validateCustomDuration('365');
      expect(res365.isValid).toBe(true);
      expect(res365.duration).toBe(365);
      expect(res365.errorMessage).toBeNull();
    });

    it('should reject empty or whitespace input', () => {
      const empty = validateCustomDuration('');
      expect(empty.isValid).toBe(false);
      expect(empty.duration).toBe(0);
      expect(empty.errorMessage).toBe('Duration must be at least 1 day');

      const whitespace = validateCustomDuration('   ');
      expect(whitespace.isValid).toBe(false);
      expect(whitespace.duration).toBe(0);
      expect(whitespace.errorMessage).toBe('Duration must be at least 1 day');
    });

    it('should reject leading zero and zero-prefixed numbers like 0111', () => {
      const zero = validateCustomDuration('0');
      expect(zero.isValid).toBe(false);
      expect(zero.duration).toBe(0);
      expect(zero.errorMessage).toBe('Duration cannot start with 0');

      const zero111 = validateCustomDuration('0111');
      expect(zero111.isValid).toBe(false);
      expect(zero111.duration).toBe(0);
      expect(zero111.errorMessage).toBe('Duration cannot start with 0');

      const zeroSeven = validateCustomDuration('07');
      expect(zeroSeven.isValid).toBe(false);
      expect(zeroSeven.duration).toBe(0);
      expect(zeroSeven.errorMessage).toBe('Duration cannot start with 0');

      const doubleZero = validateCustomDuration('00');
      expect(doubleZero.isValid).toBe(false);
      expect(doubleZero.duration).toBe(0);
      expect(doubleZero.errorMessage).toBe('Duration cannot start with 0');
    });

    it('should reject negative numbers and special characters', () => {
      const neg = validateCustomDuration('-5');
      expect(neg.isValid).toBe(false);
      expect(neg.duration).toBe(0);
      expect(neg.errorMessage).toBe('Duration must contain digits only');

      const decimal = validateCustomDuration('21.5');
      expect(decimal.isValid).toBe(false);
      expect(decimal.duration).toBe(0);
      expect(decimal.errorMessage).toBe('Duration must contain digits only');

      const exponential = validateCustomDuration('1e2');
      expect(exponential.isValid).toBe(false);
      expect(exponential.duration).toBe(0);
      expect(exponential.errorMessage).toBe('Duration must contain digits only');

      const text = validateCustomDuration('abc');
      expect(text.isValid).toBe(false);
      expect(text.duration).toBe(0);
      expect(text.errorMessage).toBe('Duration must contain digits only');
    });

    it('should reject numbers greater than 365', () => {
      const res366 = validateCustomDuration('366');
      expect(res366.isValid).toBe(false);
      expect(res366.duration).toBe(0);
      expect(res366.errorMessage).toBe('Maximum duration is 365 days');

      const res1000 = validateCustomDuration('1000');
      expect(res1000.isValid).toBe(false);
      expect(res1000.duration).toBe(0);
      expect(res1000.errorMessage).toBe('Maximum duration is 365 days');
    });
  });

  describe('handleDurationKeydown', () => {
    function createMockEvent(key: string, options: Partial<KeyboardEvent> = {}) {
      const preventDefault = vi.fn();
      const event = {
        key,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        preventDefault,
        target: {
          selectionStart: 0,
          selectionEnd: 0,
          value: '',
        },
        ...options,
      } as unknown as KeyboardEvent;
      return { event, preventDefault };
    }

    it('should allow valid digit keys', () => {
      const { event, preventDefault } = createMockEvent('5', {
        target: { selectionStart: 1, selectionEnd: 1, value: '1' } as any,
      });
      handleDurationKeydown(event, '1');
      expect(preventDefault).not.toHaveBeenCalled();
    });

    it('should block non-digit characters like -, +, ., e', () => {
      for (const char of ['-', '+', '.', 'e', 'E', 'a', '$']) {
        const { event, preventDefault } = createMockEvent(char);
        handleDurationKeydown(event, '');
        expect(preventDefault).toHaveBeenCalled();
      }
    });

    it('should block key "0" when input is empty', () => {
      const { event, preventDefault } = createMockEvent('0', {
        target: { selectionStart: 0, selectionEnd: 0, value: '' } as any,
      });
      handleDurationKeydown(event, '');
      expect(preventDefault).toHaveBeenCalled();
    });

    it('should block key "0" when cursor is at start of input', () => {
      const { event, preventDefault } = createMockEvent('0', {
        target: { selectionStart: 0, selectionEnd: 0, value: '25' } as any,
      });
      handleDurationKeydown(event, '25');
      expect(preventDefault).toHaveBeenCalled();
    });

    it('should allow key "0" when cursor is after a digit (e.g. typing 10 or 100)', () => {
      const { event, preventDefault } = createMockEvent('0', {
        target: { selectionStart: 1, selectionEnd: 1, value: '1' } as any,
      });
      handleDurationKeydown(event, '1');
      expect(preventDefault).not.toHaveBeenCalled();
    });

    it('should allow control keys like Backspace and navigation', () => {
      for (const key of ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter']) {
        const { event, preventDefault } = createMockEvent(key);
        handleDurationKeydown(event, '20');
        expect(preventDefault).not.toHaveBeenCalled();
      }
    });

    it('should allow shortcut combinations like Ctrl+A, Ctrl+C, Ctrl+V', () => {
      const { event, preventDefault } = createMockEvent('v', { ctrlKey: true });
      handleDurationKeydown(event, '');
      expect(preventDefault).not.toHaveBeenCalled();
    });
  });
});
