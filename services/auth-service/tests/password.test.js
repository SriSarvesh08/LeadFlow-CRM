const bcrypt = require('bcrypt');
const { hashPassword, comparePassword } = require('../src/utils/password');

describe('Auth Service — Password Utility Unit Tests', () => {
  const plainPassword = 'SuperSecretPassword@2026';
  const wrongPassword = 'WrongPassword@123';

  describe('hashPassword', () => {
    test('1. Password hashing returns a valid bcrypt hash', async () => {
      const hash = await hashPassword(plainPassword);

      expect(typeof hash).toBe('string');
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/);
    });

    test('2. The generated hash is not equal to the plain-text password', async () => {
      const hash = await hashPassword(plainPassword);

      expect(hash).not.toBe(plainPassword);
      expect(hash.includes(plainPassword)).toBe(false);
    });

    test('5a. Empty or non-string password inputs are rejected when hashing', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password must be a non-empty string');
      await expect(hashPassword(null)).rejects.toThrow('Password must be a non-empty string');
      await expect(hashPassword(undefined)).rejects.toThrow('Password must be a non-empty string');
      await expect(hashPassword(12345)).rejects.toThrow('Password must be a non-empty string');
      await expect(hashPassword({})).rejects.toThrow('Password must be a non-empty string');
    });

    test('6. Hashing uses the expected 10 salt rounds configuration', async () => {
      const hash = await hashPassword(plainPassword);
      const rounds = bcrypt.getRounds(hash);

      expect(rounds).toBe(10);
      expect(hash.startsWith('$2b$10$')).toBe(true);
    });
  });

  describe('comparePassword', () => {
    test('3. The correct password returns true', async () => {
      const hash = await hashPassword(plainPassword);
      const isMatch = await comparePassword(plainPassword, hash);

      expect(isMatch).toBe(true);
    });

    test('4. An incorrect password returns false', async () => {
      const hash = await hashPassword(plainPassword);
      const isMatch = await comparePassword(wrongPassword, hash);

      expect(isMatch).toBe(false);
    });

    test('5b. Empty or non-string inputs are rejected when comparing', async () => {
      const hash = await hashPassword(plainPassword);

      // Invalid plainPassword
      await expect(comparePassword('', hash)).rejects.toThrow('Password must be a non-empty string');
      await expect(comparePassword(null, hash)).rejects.toThrow('Password must be a non-empty string');
      await expect(comparePassword(undefined, hash)).rejects.toThrow('Password must be a non-empty string');
      await expect(comparePassword(12345, hash)).rejects.toThrow('Password must be a non-empty string');

      // Invalid hashedPassword
      await expect(comparePassword(plainPassword, '')).rejects.toThrow('Hashed password must be a non-empty string');
      await expect(comparePassword(plainPassword, null)).rejects.toThrow('Hashed password must be a non-empty string');
      await expect(comparePassword(plainPassword, undefined)).rejects.toThrow('Hashed password must be a non-empty string');
      await expect(comparePassword(plainPassword, 98765)).rejects.toThrow('Hashed password must be a non-empty string');
    });
  });
});
