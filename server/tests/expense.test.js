const clock = require('../src/utils/clock');
const { setupDB, resetDB, teardownDB, createUserAgent, getCategoryId } = require('./helpers');

beforeAll(setupDB);
beforeEach(resetDB);
afterAll(teardownDB);

const base = '/api/v1/expenses';

async function seedExpenses(agent) {
  const food = await getCategoryId(agent, 'Food');
  const travel = await getCategoryId(agent, 'Travel');
  const rows = [
    { amount: 250, category: food, date: '2026-09-03', note: 'Pizza night', paymentMethod: 'upi' },
    {
      amount: 1200,
      category: travel,
      date: '2026-09-15',
      note: 'Train to Pune',
      paymentMethod: 'card',
    },
    { amount: 90, category: food, date: '2026-10-01', note: 'Coffee', paymentMethod: 'cash' },
    { amount: 640, category: food, date: '2026-10-20', note: 'Groceries', paymentMethod: 'upi' },
    {
      amount: 300,
      category: travel,
      date: '2026-10-31',
      note: 'Uber to airport',
      paymentMethod: 'upi',
    },
  ];
  for (const row of rows) await agent.post(base).send(row).expect(201);
  return { food, travel };
}

describe('expense CRUD', () => {
  it('creates, reads, updates and deletes an expense', async () => {
    const { agent } = await createUserAgent();
    const food = await getCategoryId(agent, 'Food');

    const created = await agent
      .post(base)
      .send({ amount: 199.999, category: food, date: '2026-10-05', note: 'Lunch' })
      .expect(201);
    const expense = created.body.data;
    expect(expense.amount).toBe(200); // rounded to 2 decimals
    expect(expense.category.name).toBe('Food');
    expect(expense.paymentMethod).toBe('cash'); // default

    await agent.get(`${base}/${expense._id}`).expect(200);

    const updated = await agent
      .patch(`${base}/${expense._id}`)
      .send({ amount: 350, paymentMethod: 'upi' })
      .expect(200);
    expect(updated.body.data).toMatchObject({ amount: 350, paymentMethod: 'upi', note: 'Lunch' });

    await agent.delete(`${base}/${expense._id}`).expect(204);
    await agent.get(`${base}/${expense._id}`).expect(404);
  });

  it('validates input', async () => {
    const { agent } = await createUserAgent();
    const food = await getCategoryId(agent, 'Food');

    await agent.post(base).send({ amount: -5, category: food, date: '2026-10-05' }).expect(400);
    await agent.post(base).send({ amount: 10, category: food, date: 'nope' }).expect(400);
    await agent
      .post(base)
      .send({ amount: 10, category: food, date: '2026-10-05', paymentMethod: 'bitcoin' })
      .expect(400);
    await agent.patch(`${base}/not-an-id`).send({ amount: 5 }).expect(400);
    await agent
      .patch(`${base}/${'a'.repeat(24)}`)
      .send({})
      .expect(400);
  });

  it("rejects another user's custom category", async () => {
    const alice = await createUserAgent();
    const bob = await createUserAgent();
    const cat = await alice.agent.post('/api/v1/categories').send({ name: 'Gaming' }).expect(201);

    const res = await bob.agent
      .post(base)
      .send({ amount: 10, category: cat.body.data._id, date: '2026-10-05' })
      .expect(400);
    expect(res.body.error.message).toMatch(/category/i);
  });

  it("isolates users from each other's expenses", async () => {
    const alice = await createUserAgent();
    const bob = await createUserAgent();
    const food = await getCategoryId(alice.agent, 'Food');
    const created = await alice.agent
      .post(base)
      .send({ amount: 10, category: food, date: '2026-10-05' })
      .expect(201);
    const id = created.body.data._id;

    await bob.agent.get(`${base}/${id}`).expect(404);
    await bob.agent.patch(`${base}/${id}`).send({ amount: 1 }).expect(404);
    await bob.agent.delete(`${base}/${id}`).expect(404);
    const list = await bob.agent.get(base).expect(200);
    expect(list.body.data.items).toHaveLength(0);
  });
});

describe('GET /expenses filters and pagination', () => {
  let agent;
  let ids;
  beforeEach(async () => {
    ({ agent } = await createUserAgent());
    ids = await seedExpenses(agent);
  });

  it('sorts by date descending and paginates', async () => {
    const res = await agent.get(`${base}?limit=2&page=2`).expect(200);
    const { items, pagination, totalAmount } = res.body.data;
    expect(pagination).toEqual({ page: 2, limit: 2, total: 5, totalPages: 3 });
    expect(items.map((e) => e.note)).toEqual(['Coffee', 'Train to Pune']);
    expect(totalAmount).toBe(2480);
  });

  it('filters by an inclusive date range', async () => {
    const res = await agent.get(`${base}?from=2026-10-01&to=2026-10-31`).expect(200);
    expect(res.body.data.items).toHaveLength(3);
  });

  it('filters by category, amount range and keyword', async () => {
    const byCat = await agent.get(`${base}?category=${ids.travel}`).expect(200);
    expect(byCat.body.data.items).toHaveLength(2);

    const byAmount = await agent.get(`${base}?minAmount=200&maxAmount=700`).expect(200);
    expect(byAmount.body.data.items.map((e) => e.amount).sort()).toEqual([250, 300, 640]);

    const byKeyword = await agent.get(`${base}?q=UBER`).expect(200);
    expect(byKeyword.body.data.items.map((e) => e.note)).toEqual(['Uber to airport']);
  });

  it('treats regex characters in the keyword literally', async () => {
    const res = await agent.get(`${base}?q=.*`).expect(200);
    expect(res.body.data.items).toHaveLength(0);
  });

  it('rejects an inverted amount range', async () => {
    await agent.get(`${base}?minAmount=500&maxAmount=100`).expect(400);
  });

  it('exports filtered expenses as CSV', async () => {
    const res = await agent.get(`${base}/export?category=${ids.food}`).expect(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="expenses-/);
    const lines = res.text.replace(/^\uFEFF/, '').split('\r\n');
    expect(lines[0]).toBe('Date,Category,Amount,Payment Method,Note');
    expect(lines).toHaveLength(4);
    expect(lines[1]).toBe('2026-10-20,Food,640.00,upi,Groceries');
  });
});

describe('analytics and budgets', () => {
  it('computes monthly summary, category breakdown and trend', async () => {
    const { agent } = await createUserAgent();
    await seedExpenses(agent);

    const summary = await agent.get('/api/v1/analytics/summary?month=2026-10').expect(200);
    expect(summary.body.data).toMatchObject({
      total: 1030,
      count: 3,
      previous: { month: '2026-09', total: 1450 },
      change: { basis: 'full-month', amount: -420, percent: -28.97 },
    });

    const byCat = await agent.get('/api/v1/analytics/by-category?month=2026-10').expect(200);
    expect(byCat.body.data.top.map((c) => [c.name, c.total])).toEqual([
      ['Food', 730],
      ['Travel', 300],
    ]);

    const daily = await agent.get('/api/v1/analytics/trend?granularity=daily&month=2026-10');
    expect(daily.body.data.points).toHaveLength(31);
    expect(daily.body.data.points[19]).toEqual({ period: '2026-10-20', total: 640, count: 1 });

    const monthly = await agent.get(
      '/api/v1/analytics/trend?granularity=monthly&month=2026-10&months=3',
    );
    expect(monthly.body.data.points.map((p) => p.total)).toEqual([0, 1450, 1030]);
  });

  it('compares an in-progress month with the same days of the previous month', async () => {
    const spy = jest.spyOn(clock, 'now').mockReturnValue(new Date('2026-10-05T12:00:00Z'));
    try {
      const { agent } = await createUserAgent();
      const food = await getCategoryId(agent, 'Food');
      for (const [amount, date] of [
        [100, '2026-09-02'], // inside Sep 1-5
        [900, '2026-09-20'], // outside the same period
        [150, '2026-10-03'],
      ]) {
        await agent.post(base).send({ amount, category: food, date }).expect(201);
      }

      const res = await agent.get('/api/v1/analytics/summary?month=2026-10').expect(200);
      expect(res.body.data.daysElapsed).toBe(5);
      expect(res.body.data.previous).toMatchObject({ total: 1000, samePeriodTotal: 100 });
      expect(res.body.data.change).toEqual({
        basis: 'same-period',
        baseline: 100,
        amount: 50,
        percent: 50,
      });
    } finally {
      spy.mockRestore();
    }
  });

  it('reports budget progress with warning/exceeded status', async () => {
    const { agent } = await createUserAgent();
    const { food, travel } = await seedExpenses(agent);
    const month = '2026-10';

    await agent.put('/api/v1/budgets').send({ month, limit: 1000 }).expect(200); // overall: 103%
    await agent.put('/api/v1/budgets').send({ month, category: food, limit: 900 }).expect(200); // 81%
    await agent.put('/api/v1/budgets').send({ month, category: travel, limit: 1000 }).expect(200); // 30%
    // Upserting the same budget updates it instead of creating a duplicate.
    await agent.put('/api/v1/budgets').send({ month, category: travel, limit: 600 }).expect(200); // 50%

    const res = await agent.get(`/api/v1/budgets?month=${month}`).expect(200);
    const view = res.body.data.map((b) => [b.category?.name ?? 'Overall', b.percent, b.status]);
    expect(view).toEqual([
      ['Overall', 103, 'exceeded'],
      ['Food', 81.1, 'warning'],
      ['Travel', 50, 'ok'],
    ]);
  });
});
