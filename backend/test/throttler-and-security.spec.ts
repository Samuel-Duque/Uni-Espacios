import { Reflector } from '@nestjs/core';
import { AuthController } from '../src/modules/auth/auth.controller';

describe('Throttler & Security Hardening', () => {
  it('AuthController debe tener definidos los métodos login y register con decoradores', () => {
    const loginHandler = AuthController.prototype.login;
    const registerHandler = AuthController.prototype.register;

    expect(loginHandler).toBeDefined();
    expect(registerHandler).toBeDefined();

    const loginKeys = Reflect.getMetadataKeys(loginHandler);
    const registerKeys = Reflect.getMetadataKeys(registerHandler);

    expect(loginKeys.length).toBeGreaterThan(0);
    expect(registerKeys.length).toBeGreaterThan(0);
  });
});
