export interface DurationValidationResult {
  isValid: boolean;
  duration: number;
  errorMessage: string | null;
}

export const MIN_CUSTOM_DAYS = 1;
export const MAX_CUSTOM_DAYS = 365;

/**
 * Validates a custom duration string.
 *
 * Rules:
 * - Must not be empty.
 * - Must contain only digits (no special characters, decimals, negative signs).
 * - Must not have leading zeros (e.g., '0', '01', '0111' are rejected).
 * - Must be between 1 and 365 days.
 */
export function validateCustomDuration(value: string): DurationValidationResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      isValid: false,
      duration: 0,
      errorMessage: 'Duration must be at least 1 day',
    };
  }

  // Check for non-digit characters
  if (!/^\d+$/.test(trimmed)) {
    return {
      isValid: false,
      duration: 0,
      errorMessage: 'Duration must contain digits only',
    };
  }

  // Reject leading zeros (e.g. '0', '01', '0111')
  if (trimmed.startsWith('0')) {
    return {
      isValid: false,
      duration: 0,
      errorMessage: 'Duration cannot start with 0',
    };
  }

  const num = Number(trimmed);

  if (num > MAX_CUSTOM_DAYS) {
    return {
      isValid: false,
      duration: 0,
      errorMessage: `Maximum duration is ${MAX_CUSTOM_DAYS} days`,
    };
  }

  return {
    isValid: true,
    duration: num,
    errorMessage: null,
  };
}

/**
 * Handles keydown events on custom duration inputs:
 * - Allows control/navigation keys (backspace, arrows, delete, enter, tab, shortcuts).
 * - Prevents non-digit keys.
 * - Prevents '0' when the input is empty or when cursor/selection is at the start.
 */
export function handleDurationKeydown(event: KeyboardEvent, currentValue: string): void {
  // Allow shortcuts (Ctrl+A, Ctrl+C, Ctrl+V, Cmd+A, etc.)
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  // Allow standard control/navigation keys
  const allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ];
  if (allowedKeys.includes(event.key)) {
    return;
  }

  // Block any non-digit character (e.g. '-', '+', '.', 'e', 'E', letters)
  if (!/^[0-9]$/.test(event.key)) {
    event.preventDefault();
    return;
  }

  // Block '0' if the field is empty or typing at the start of the field
  const target = event.target as HTMLInputElement | null;
  if (event.key === '0') {
    const isAtStart = target ? target.selectionStart === 0 : false;
    const isReplacingAll =
      target && target.selectionStart === 0 && target.selectionEnd === target.value.length;
    if (!currentValue || isAtStart || isReplacingAll) {
      event.preventDefault();
    }
  }
}
