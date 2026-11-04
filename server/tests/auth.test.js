const request = require('supertest');
const { app, setupDB, resetDB, teardownDB, createUserAgent } = require('./helpers');

beforeAll(setupDB);
beforeEach(resetDB);
afterAll(teardownDB);

const valid = { name: 'Asha', email: 'asha@example.com', password: 'Secret123' };

describe('POST /api/v1/auth/register', () => {
  it('creates a user, sets an httpOnly cookie and never returns the password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(valid).expect(201);

    expect(res.body.data.user).toMatchObject({ name: 'Asha', email: 'asha@example.com' });
    expect(res.body.data.user.password).toBeUndefined();

    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/^token=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
  });

  it('normalizes email casing and rejects duplicates with 409', async () => {
    await request(app).post('/api/v1/auth/register').send(valid).expect(201);
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...valid, email: 'ASHA@example.com' })
      .expect(409);
    expect(res.body.success).toBe(false);
  });

  it.each([
    [{ ...valid, email: 'not-an-email' }, 'email'],
    [{ ...valid, password: 'short1' }, 'password'],
    [{ ...valid, password: 'nonumbers' }, 'password'],
    [{ ...valid, name: '' }, 'name'],
  ])('returns 400 with field details for invalid input (%#)', async (body, field) => {
    const res = await request(app).post('/api/v1/auth/register').send(body).expect(400);
    expect(res.body.error.details.map((d) => d.field)).toContain(field);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => request(app).post('/api/v1/auth/register').send(valid));

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: valid.email, password: valid.password })
      .expect(200);
    expect(res.headers['set-cookie'][0]).toMatch(/^token=/);
  });

  it('returns the same 401 message for a wrong password and an unknown email', async () => {
    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: valid.email, password: 'Wrong1234' })
      .expect(401);
    const unknownEmail = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'Wrong1234' })
      .expect(401);
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message);
  });
});

describe('protected routes', () => {
  it('rejects requests without a token', async () => {
    await request(app).get('/api/v1/auth/me').expect(401);
    await request(app).get('/api/v1/expenses').expect(401);
  });

  it('rejects a tampered token', async () => {
    await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not.a.valid.jwt')
      .expect(401);
  });

  it('returns the current user via cookie, and logout clears the session', async () => {
    const { agent, credentials } = await createUserAgent();

    const me = await agent.get('/api/v1/auth/me').expect(200);
    expect(me.body.data.user.email).toBe(credentials.email);

    await agent.post('/api/v1/auth/logout').expect(200);
    await agent.get('/api/v1/auth/me').expect(401);
  });
});
