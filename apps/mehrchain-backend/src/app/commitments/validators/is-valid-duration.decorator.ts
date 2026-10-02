import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false, name: 'IsValidDurationConstraint' })
export class IsValidDurationConstraint implements ValidatorConstraintInterface {
  validate(value: any, args?: ValidationArguments): boolean {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      return false;
    }
    // Must be -1 (Endless Journey) or at least 1 day
    return value === -1 || value >= 1;
  }

  defaultMessage(args?: ValidationArguments): string {
    return 'totalDays must be -1 (Endless Journey) or an integer greater than or equal to 1';
  }
}

export function IsValidDuration(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidDurationConstraint,
    });
  };
}
