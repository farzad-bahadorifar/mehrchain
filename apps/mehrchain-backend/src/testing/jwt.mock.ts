export class JwtService {
  sign(payload: any, options?: any): string {
    return 'mocked_jwt_token_123';
  }
  verify(token: string, options?: any): any {
    return { sub: 'mock-user-id', email: 'mock@example.com' };
  }
}

export class JwtModule {
  static register(options?: any): any {
    return { module: JwtModule };
  }
}
