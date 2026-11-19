const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Role, RefreshToken, AuditLog } = require('../src/models');
const passwordUtils = require('../src/utils/password');
const { generateAccessToken } = require('../src/utils/jwt');

describe('Auth Service — Admin User Management Endpoints', () => {
  const originalEnv = process.env;
  let mockTransaction;

  const validTokenSecret = 'test_jwt_secret_key_for_user_endpoints_2026';
  const validResetSecret = 'test_jwt_reset_secret_key_for_user_endpoints_2026';

  let adminToken;
  let nonAdminToken;

  // Helper to generate access tokens with specific roles and permissions
  const createTestToken = ({ id = 1, email = 'admin@leadflow.in', role = 'Admin', permissions = [] }) => {
    return generateAccessToken({ id, email, role, permissions });
  };

  beforeAll(() => {
    process.env = {
      ...originalEnv,
      JWT_SECRET: validTokenSecret,
      JWT_RESET_SECRET: validResetSecret,
      JWT_EXPIRES_IN: '15m',
    };

    adminToken = createTestToken({
      id: 1,
      email: 'admin@leadflow.in',
      role: 'Admin',
      permissions: ['users:read', 'users:create', 'users:update', 'users:delete'],
    });

    nonAdminToken = createTestToken({
      id: 42,
      email: 'rep@leadflow.in',
      role: 'sales_rep',
      permissions: ['leads:read', 'leads:create'],
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    mockTransaction = {
      LOCK: { UPDATE: 'UPDATE' },
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
    };

    jest.spyOn(sequelize, 'transaction').mockImplementation(async (callback) => {
      if (callback) {
        try {
          const result = await callback(mockTransaction);
          await mockTransaction.commit();
          return result;
        } catch (err) {
          await mockTransaction.rollback();
          throw err;
        }
      }
      return mockTransaction;
    });

    jest.spyOn(RefreshToken, 'update').mockResolvedValue([1]);
    jest.spyOn(AuditLog, 'create').mockResolvedValue({ id: 101 });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // =========================================================================
  // 1. GET /users (List Users with Pagination & Filters)
  // =========================================================================
  describe('GET /users', () => {
    const mockUsersList = [
      {
        id: 1,
        name: 'Admin User',
        email: 'admin@leadflow.in',
        role_id: 1,
        manager_id: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: { id: 1, name: 'Admin' },
        manager: null,
      },
      {
        id: 2,
        name: 'Sales Manager',
        email: 'manager@leadflow.in',
        role_id: 2,
        manager_id: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: { id: 2, name: 'Sales Manager' },
        manager: { id: 1, name: 'Admin User', email: 'admin@leadflow.in' },
      },
    ];

    test('1. Admin with users:read successfully lists users with default pagination (200)', async () => {
      jest.spyOn(User, 'findAndCountAll').mockResolvedValue({
        count: 2,
        rows: mockUsersList,
      });

      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });

      // Verify password_hash is strictly excluded
      res.body.data.forEach((u) => {
        expect(u.password_hash).toBeUndefined();
        expect(u.password).toBeUndefined();
      });
    });

    test('2. Custom page, limit, and filter query parameters are accepted', async () => {
      jest.spyOn(User, 'findAndCountAll').mockResolvedValue({
        count: 50,
        rows: [mockUsersList[0]],
      });

      const res = await request(app)
        .get('/users?page=2&limit=10&role_id=1&is_active=true&search=admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.meta.page).toBe(2);
      expect(res.body.meta.limit).toBe(10);
      expect(res.body.meta.total).toBe(50);
      expect(res.body.meta.totalPages).toBe(5);
    });

    test('3. Invalid query parameters (e.g. page < 1, limit > 100) are rejected with 422', async () => {
      const res = await request(app)
        .get('/users?page=0&limit=500')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'page')).toBe(true);
      expect(res.body.errors.some((e) => e.field === 'limit')).toBe(true);
    });

    test('4. Unexpected query parameters are rejected with 422 via checkExact', async () => {
      const res = await request(app)
        .get('/users?unexpectedParam=malicious')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    test('5. Missing Authorization header returns 401', async () => {
      const res = await request(app).get('/users');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('6. User without users:read permission is rejected with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${nonAdminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('insufficient permissions');
    });
  });

  // =========================================================================
  // 2. GET /users/:userId (Get User by ID)
  // =========================================================================
  describe('GET /users/:userId', () => {
    const mockUserDetail = {
      id: 2,
      name: 'Sales Manager',
      email: 'manager@leadflow.in',
      role_id: 2,
      manager_id: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      role: { id: 2, name: 'Sales Manager' },
      manager: { id: 1, name: 'Admin User', email: 'admin@leadflow.in' },
    };

    test('1. Admin successfully retrieves existing user details with 200', async () => {
      jest.spyOn(User, 'findByPk').mockResolvedValue(mockUserDetail);

      const res = await request(app)
        .get('/users/2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(2);
      expect(res.body.data.user.email).toBe('manager@leadflow.in');
      expect(res.body.data.user.password_hash).toBeUndefined();
    });

    test('2. Non-existent user ID returns 404 Not Found', async () => {
      jest.spyOn(User, 'findByPk').mockResolvedValue(null);

      const res = await request(app)
        .get('/users/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });

    test('3. Non-integer or invalid user ID returns 422', async () => {
      const res = await request(app)
        .get('/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'userId')).toBe(true);
    });

    test('4. Missing token returns 401 and non-permitted user returns 403', async () => {
      const unauthRes = await request(app).get('/users/2');
      expect(unauthRes.status).toBe(401);

      const forbiddenRes = await request(app)
        .get('/users/2')
        .set('Authorization', `Bearer ${nonAdminToken}`);
      expect(forbiddenRes.status).toBe(403);
    });
  });

  // =========================================================================
  // 3. POST /users (Create User)
  // =========================================================================
  describe('POST /users', () => {
    const validCreatePayload = {
      name: 'Test Executive',
      email: 'test.exec@leadflow.in',
      password: 'ExecPass@123',
      role_id: 3,
      manager_id: 2,
      is_active: true,
    };

    test('1. Admin successfully creates a new user (201) and generates USER_CREATED audit log', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null); // No duplicate email
      jest.spyOn(Role, 'findByPk').mockResolvedValue({ id: 3, name: 'sales_rep' });
      jest.spyOn(User, 'findByPk').mockResolvedValue({ id: 2, name: 'Manager', is_active: true });
      jest.spyOn(passwordUtils, 'hashPassword').mockResolvedValue('bcrypt_hashed_password_mock_123');

      const mockCreated = {
        id: 10,
        name: 'Test Executive',
        email: 'test.exec@leadflow.in',
        password_hash: 'bcrypt_hashed_password_mock_123',
        role_id: 3,
        manager_id: 2,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      jest.spyOn(User, 'create').mockResolvedValue(mockCreated);

      const res = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreatePayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(10);
      expect(res.body.data.user.email).toBe('test.exec@leadflow.in');
      expect(res.body.data.user.password_hash).toBeUndefined();

      // Verify audit log creation
      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1, // Admin actor
          action: 'USER_CREATED',
          entity: 'users',
          entity_id: '10',
        }),
        expect.objectContaining({ transaction: mockTransaction })
      );
    });

    test('2. Duplicate email is rejected with 422', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue({ id: 9, email: 'test.exec@leadflow.in' });

      const res = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreatePayload);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already registered');
    });

    test('3. Non-existent role_id is rejected with 422', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      jest.spyOn(Role, 'findByPk').mockResolvedValue(null); // Role not found

      const res = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validCreatePayload, role_id: 99 });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'role_id')).toBe(true);
    });

    test('4. Non-existent or inactive manager_id is rejected with 422', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      jest.spyOn(Role, 'findByPk').mockResolvedValue({ id: 3, name: 'sales_rep' });
      jest.spyOn(User, 'findByPk').mockResolvedValue({ id: 2, is_active: false }); // Inactive manager

      const res = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validCreatePayload, manager_id: 2 });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'manager_id')).toBe(true);
    });

    test('5. Weak password (less than 8 chars or no numbers) is rejected with 422', async () => {
      const res = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validCreatePayload, password: 'weak' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
    });

    test('6. Unexpected body fields are rejected with 422 via checkExact', async () => {
      const res = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validCreatePayload, extraField: 'unauthorized' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    test('7. User without users:create permission is rejected with 403', async () => {
      const res = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send(validCreatePayload);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 4. PUT /users/:userId (Update User)
  // =========================================================================
  describe('PUT /users/:userId', () => {
    let mockTargetUser;

    beforeEach(() => {
      mockTargetUser = {
        id: 5,
        name: 'Existing User',
        email: 'existing@leadflow.in',
        password_hash: 'old_bcrypt_hash_123',
        role_id: 3,
        manager_id: 2,
        is_active: true,
        update: jest.fn().mockImplementation(function (fields) {
          Object.assign(this, fields);
          return Promise.resolve(this);
        }),
      };
    });

    test('1. Admin successfully updates basic details (name, manager) with 200', async () => {
      jest.spyOn(User, 'findByPk').mockImplementation(async (id) => {
        if (id === 5) return mockTargetUser;
        if (id === 2) return { id: 2, is_active: true };
        return null;
      });

      const res = await request(app)
        .put('/users/5')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name', manager_id: 2 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Updated Name');
      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_UPDATED',
          entity_id: '5',
        }),
        expect.anything()
      );
    });

    test('2. Changing role revokes all active refresh tokens and records USER_ROLE_CHANGED', async () => {
      jest.spyOn(User, 'findByPk').mockResolvedValue(mockTargetUser);
      jest.spyOn(Role, 'findByPk').mockResolvedValue({ id: 2, name: 'Sales Manager' });

      const res = await request(app)
        .put('/users/5')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role_id: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role_id).toBe(2);

      // Verify active refresh token revocation
      expect(RefreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ revoked_at: expect.any(Date) }),
        expect.objectContaining({ where: { user_id: 5, revoked_at: null } })
      );

      // Verify USER_ROLE_CHANGED audit log
      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_ROLE_CHANGED',
          entity_id: '5',
        }),
        expect.anything()
      );
    });

    test('3. Deactivating a user revokes refresh tokens and records USER_DEACTIVATED', async () => {
      jest.spyOn(User, 'findByPk').mockResolvedValue(mockTargetUser);

      const res = await request(app)
        .put('/users/5')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_active: false });

      expect(res.status).toBe(200);
      expect(res.body.data.user.is_active).toBe(false);

      expect(RefreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ revoked_at: expect.any(Date) }),
        expect.objectContaining({ where: { user_id: 5, revoked_at: null } })
      );

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_DEACTIVATED',
          entity_id: '5',
        }),
        expect.anything()
      );
    });

    test('4. Admin updating password hashes new password and revokes refresh tokens', async () => {
      jest.spyOn(User, 'findByPk').mockResolvedValue(mockTargetUser);
      jest.spyOn(passwordUtils, 'hashPassword').mockResolvedValue('new_hashed_pass_456');

      const res = await request(app)
        .put('/users/5')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: 'NewSecurePassword123!' });

      expect(res.status).toBe(200);
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith('NewSecurePassword123!');
      expect(RefreshToken.update).toHaveBeenCalled();
      expect(res.body.data.user.password_hash).toBeUndefined();
    });

    test('5. Self-deactivation by an administrator is rejected with 400 Bad Request', async () => {
      // req.user.id === 1 (adminToken) and targetUserId === 1
      const adminSelfUser = { ...mockTargetUser, id: 1, role_id: 1 };
      jest.spyOn(User, 'findByPk').mockResolvedValue(adminSelfUser);

      const res = await request(app)
        .put('/users/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_active: false });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('cannot deactivate their own account');
    });

    test('6. Self-role change by an administrator is rejected with 400 Bad Request', async () => {
      const adminSelfUser = { ...mockTargetUser, id: 1, role_id: 1 };
      jest.spyOn(User, 'findByPk').mockResolvedValue(adminSelfUser);

      const res = await request(app)
        .put('/users/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role_id: 3 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('cannot modify their own role');
    });

    test('7. Setting manager_id to target user ID (self-management) is rejected with 422', async () => {
      jest.spyOn(User, 'findByPk').mockResolvedValue(mockTargetUser);

      const res = await request(app)
        .put('/users/5')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ manager_id: 5 });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'manager_id')).toBe(true);
    });

    test('8. Circular manager chain is rejected with 422', async () => {
      // User 5 wants User 6 as manager, but User 6 already reports to User 5
      jest.spyOn(User, 'findByPk').mockImplementation(async (id) => {
        if (id === 5) return mockTargetUser;
        if (id === 6) return { id: 6, is_active: true, manager_id: 5 }; // reports to 5!
        return null;
      });

      const res = await request(app)
        .put('/users/5')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ manager_id: 6 });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.message.includes('Circular manager'))).toBe(true);
    });

    test('9. Updating to duplicate email returns 422', async () => {
      jest.spyOn(User, 'findByPk').mockResolvedValue(mockTargetUser);
      jest.spyOn(User, 'findOne').mockResolvedValue({ id: 9, email: 'taken@leadflow.in' });

      const res = await request(app)
        .put('/users/5')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'taken@leadflow.in' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already registered');
    });

    test('10. Updating non-existent user returns 404 Not Found', async () => {
      jest.spyOn(User, 'findByPk').mockResolvedValue(null);

      const res = await request(app)
        .put('/users/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Does Not Exist' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });

    test('11. User without users:update permission is rejected with 403', async () => {
      const res = await request(app)
        .put('/users/5')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send({ name: 'Unauthorized Update' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 5. Transaction Rollback Safety
  // =========================================================================
  describe('Transaction Rollback Safety', () => {
    test('1. Creation transaction rolls back if AuditLog insertion fails', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      jest.spyOn(Role, 'findByPk').mockResolvedValue({ id: 3 });
      jest.spyOn(passwordUtils, 'hashPassword').mockResolvedValue('hash');
      jest.spyOn(User, 'create').mockResolvedValue({ id: 99 });
      jest.spyOn(AuditLog, 'create').mockRejectedValue(new Error('Audit DB Failure'));

      const res = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Rollback User',
          email: 'rollback@leadflow.in',
          password: 'Password123!',
          role_id: 3,
        });

      expect(res.status).toBe(500);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('2. Update transaction rolls back if AuditLog insertion fails', async () => {
      const mockUser = {
        id: 7,
        role_id: 3,
        email: 'user7@leadflow.in',
        update: jest.fn().mockResolvedValue(),
      };
      jest.spyOn(User, 'findByPk').mockResolvedValue(mockUser);
      jest.spyOn(AuditLog, 'create').mockRejectedValue(new Error('Audit DB Failure'));

      const res = await request(app)
        .put('/users/7')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(500);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });
});
