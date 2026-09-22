export function Cron(cronExpression?: string, options?: any) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    return descriptor;
  };
}

export enum CronExpression {
  EVERY_DAY_AT_MIDNIGHT = '0 0 * * *',
  EVERY_MINUTE = '* * * * *',
}

export class ScheduleModule {
  static forRoot(options?: any): any {
    return { module: ScheduleModule };
  }
}
