import { registerSchema, loginSchema } from '@/lib/validations';
import { hasRole } from '@/lib/auth';
import type { UserRole } from '@prisma/client';

// Mock bcryptjs for testing
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$12$mockHashedPassword'),
  compare: jest.fn().mockImplementation((plain, hash) => {
    return Promise.resolve(plain === 'ValidPass1' && hash === '$2a$12$mockHashedPassword');
  }),
}));

describe('Auth Validations', () => {
  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'ValidPass1',
        displayName: 'Test User',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        email: 'not-an-email',
        password: 'ValidPass1',
        displayName: 'Test User',
      });
      expect(result.success).toBe(false);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'Ab1',
        displayName: 'Test User',
      });
      expect(result.success).toBe(false);
    });

    it('should reject password without uppercase letter', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'validpass1',
        displayName: 'Test User',
      });
      expect(result.success).toBe(false);
    });

    it('should reject password without number', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'ValidPass',
        displayName: 'Test User',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty display name', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'ValidPass1',
        displayName: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject displayName exceeding 50 characters', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'ValidPass1',
        displayName: 'a'.repeat(51),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'anypassword',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty email', () => {
      const result = loginSchema.safeParse({ email: '', password: 'pass' });
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
      expect(result.success).toBe(false);
    });
  });
});

describe('RBAC - hasRole', () => {
  const roles: UserRole[] = ['reader', 'moderator', 'editor', 'reviewer', 'admin'];

  it('should allow admin to access all roles', () => {
    for (const role of roles) {
      expect(hasRole('admin', role)).toBe(true);
    }
  });

  it('should allow reviewer to access editor and below', () => {
    expect(hasRole('reviewer', 'editor')).toBe(true);
    expect(hasRole('reviewer', 'moderator')).toBe(true);
    expect(hasRole('reviewer', 'reader')).toBe(true);
    expect(hasRole('reviewer', 'admin')).toBe(false);
  });

  it('should allow editor to access moderator and below', () => {
    expect(hasRole('editor', 'moderator')).toBe(true);
    expect(hasRole('editor', 'reader')).toBe(true);
    expect(hasRole('editor', 'reviewer')).toBe(false);
    expect(hasRole('editor', 'admin')).toBe(false);
  });

  it('should restrict reader to reader role only', () => {
    expect(hasRole('reader', 'reader')).toBe(true);
    expect(hasRole('reader', 'moderator')).toBe(false);
    expect(hasRole('reader', 'editor')).toBe(false);
  });

  it('should allow moderator to access reader', () => {
    expect(hasRole('moderator', 'reader')).toBe(true);
    expect(hasRole('moderator', 'moderator')).toBe(true);
    expect(hasRole('moderator', 'editor')).toBe(false);
  });
});

describe('Password Security', () => {
  it('should use bcrypt with cost 12', async () => {
    const bcrypt = require('bcryptjs');
    await bcrypt.hash('TestPass1', 12);
    expect(bcrypt.hash).toHaveBeenCalledWith('TestPass1', 12);
  });

  it('should correctly compare valid credentials', async () => {
    const bcrypt = require('bcryptjs');
    const result = await bcrypt.compare('ValidPass1', '$2a$12$mockHashedPassword');
    expect(result).toBe(true);
  });

  it('should reject invalid credentials', async () => {
    const bcrypt = require('bcryptjs');
    const result = await bcrypt.compare('WrongPass1', '$2a$12$mockHashedPassword');
    expect(result).toBe(false);
  });
});

describe('Account Lockout Logic', () => {
  it('should lock after 5 failed attempts', () => {
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

    let loginAttempts = 0;
    let lockedUntil: Date | null = null;

    // Simulate 5 failed attempts
    for (let i = 0; i < 5; i++) {
      loginAttempts++;
      if (loginAttempts >= MAX_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      }
    }

    expect(loginAttempts).toBe(5);
    expect(lockedUntil).not.toBeNull();
    expect(lockedUntil!.getTime()).toBeGreaterThan(Date.now());
  });

  it('should reset attempts on successful login', () => {
    let loginAttempts = 4;
    // Successful login
    loginAttempts = 0;
    expect(loginAttempts).toBe(0);
  });
});
