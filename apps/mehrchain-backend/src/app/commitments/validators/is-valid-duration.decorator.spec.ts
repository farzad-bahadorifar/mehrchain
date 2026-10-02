import { IsValidDurationConstraint } from './is-valid-duration.decorator';

describe('IsValidDurationConstraint', () => {
  let validator: IsValidDurationConstraint;

  beforeEach(() => {
    validator = new IsValidDurationConstraint();
  });

  it('should accept -1 for Endless Journey', () => {
    expect(validator.validate(-1)).toBe(true);
  });

  it('should accept positive integers', () => {
    expect(validator.validate(1)).toBe(true);
    expect(validator.validate(7)).toBe(true);
    expect(validator.validate(21)).toBe(true);
    expect(validator.validate(100)).toBe(true);
  });

  it('should reject 0', () => {
    expect(validator.validate(0)).toBe(false);
  });

  it('should reject negative numbers other than -1', () => {
    expect(validator.validate(-2)).toBe(false);
    expect(validator.validate(-10)).toBe(false);
  });

  it('should reject floating point numbers', () => {
    expect(validator.validate(21.5)).toBe(false);
    expect(validator.validate(-1.0001)).toBe(false);
  });

  it('should reject non-numeric values', () => {
    expect(validator.validate('21')).toBe(false);
    expect(validator.validate(null)).toBe(false);
    expect(validator.validate(undefined)).toBe(false);
    expect(validator.validate({})).toBe(false);
  });

  it('should provide informative default message', () => {
    expect(validator.defaultMessage()).toContain('-1 (Endless Journey)');
  });
});
