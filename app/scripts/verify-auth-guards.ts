import 'dotenv/config';

type Params = Record<string, string>;
type Handler = (request: Request, params: Params) => Promise<Response>;

type Case = {
  name: string;
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  load: () => Promise<{ handler: Handler }>;
  body?: unknown;
  params?: Params;
};

const json = (method: string, body?: unknown) =>
  new Request('http://localhost/api/verify', {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

async function main() {
  const cases: Case[] = [
    {
      name: 'GET /api/home',
      method: 'GET',
      load: async () => ({ handler: (await import('../app/api/home+api')).GET }),
    },
    {
      name: 'GET /api/mystery',
      method: 'GET',
      load: async () => ({ handler: (await import('../app/api/mystery+api')).GET }),
    },
    {
      name: 'GET /api/polls',
      method: 'GET',
      load: async () => ({ handler: (await import('../app/api/polls+api')).GET }),
    },
    {
      name: 'POST /api/polls/[id]/vote',
      method: 'POST',
      body: { optionId: 1 },
      params: { id: '1' },
      load: async () => ({
        handler: (await import('../app/api/polls/[id]/vote+api')).POST,
      }),
    },
    {
      name: 'GET /api/profile',
      method: 'GET',
      load: async () => ({ handler: (await import('../app/api/profile+api')).GET }),
    },
    {
      name: 'PATCH /api/profile',
      method: 'PATCH',
      body: { name: 'Test' },
      load: async () => ({ handler: (await import('../app/api/profile+api')).PATCH }),
    },
    {
      name: 'POST /api/profile/complete',
      method: 'POST',
      body: { name: 'Test' },
      load: async () => ({
        handler: (await import('../app/api/profile/complete+api')).POST,
      }),
    },
    {
      name: 'GET /api/referrals',
      method: 'GET',
      load: async () => ({ handler: (await import('../app/api/referrals+api')).GET }),
    },
    {
      name: 'GET /api/notifications',
      method: 'GET',
      load: async () => ({
        handler: (await import('../app/api/notifications+api')).GET,
      }),
    },
    {
      name: 'POST /api/notifications/read',
      method: 'POST',
      body: { all: true },
      load: async () => ({
        handler: (await import('../app/api/notifications/read+api')).POST,
      }),
    },
    {
      name: 'POST /api/push/register',
      method: 'POST',
      body: { token: 'ExponentPushToken[verify]', platform: 'android' },
      load: async () => ({ handler: (await import('../app/api/push/register+api')).POST }),
    },
    {
      name: 'GET /api/admin/overview',
      method: 'GET',
      load: async () => ({
        handler: (await import('../app/api/admin/overview+api')).GET,
      }),
    },
    {
      name: 'GET /api/admin/customers',
      method: 'GET',
      load: async () => ({
        handler: (await import('../app/api/admin/customers+api')).GET,
      }),
    },
    {
      name: 'GET /api/admin/announcements',
      method: 'GET',
      load: async () => ({
        handler: (await import('../app/api/admin/announcements+api')).GET,
      }),
    },
    {
      name: 'POST /api/admin/announcements',
      method: 'POST',
      body: { title: 'Test', body: 'Test body' },
      load: async () => ({
        handler: (await import('../app/api/admin/announcements+api')).POST,
      }),
    },
    {
      name: 'PATCH /api/admin/announcements/[id]',
      method: 'PATCH',
      body: { published: true },
      params: { id: '1' },
      load: async () => ({
        handler: (await import('../app/api/admin/announcements/[id]+api')).PATCH,
      }),
    },
    {
      name: 'DELETE /api/admin/announcements/[id]',
      method: 'DELETE',
      params: { id: '1' },
      load: async () => ({
        handler: (await import('../app/api/admin/announcements/[id]+api')).DELETE,
      }),
    },
    {
      name: 'POST /api/admin/mystery',
      method: 'POST',
      body: { title: 'Test', body: 'Test body' },
      load: async () => ({
        handler: (await import('../app/api/admin/mystery+api')).POST,
      }),
    },
    {
      name: 'GET /api/admin/polls',
      method: 'GET',
      load: async () => ({ handler: (await import('../app/api/admin/polls+api')).GET }),
    },
    {
      name: 'POST /api/admin/polls',
      method: 'POST',
      body: { question: 'Test?', options: ['A', 'B'] },
      load: async () => ({ handler: (await import('../app/api/admin/polls+api')).POST }),
    },
    {
      name: 'PATCH /api/admin/polls/[id]',
      method: 'PATCH',
      body: { status: 'closed' },
      params: { id: '1' },
      load: async () => ({
        handler: (await import('../app/api/admin/polls/[id]+api')).PATCH,
      }),
    },
    {
      name: 'GET /api/admin/settings',
      method: 'GET',
      load: async () => ({
        handler: (await import('../app/api/admin/settings+api')).GET,
      }),
    },
    {
      name: 'PUT /api/admin/settings',
      method: 'PUT',
      body: { venue: 'Test' },
      load: async () => ({
        handler: (await import('../app/api/admin/settings+api')).PUT,
      }),
    },
    {
      name: 'POST /api/admin/notifications',
      method: 'POST',
      body: { title: 'Test', body: 'Test body' },
      load: async () => ({
        handler: (await import('../app/api/admin/notifications+api')).POST,
      }),
    },
    {
      name: 'GET /api/admin/referrals',
      method: 'GET',
      load: async () => ({
        handler: (await import('../app/api/admin/referrals+api')).GET,
      }),
    },
    {
      name: 'PATCH /api/admin/referrals/[id]',
      method: 'PATCH',
      body: { rewardStatus: 'rewarded' },
      params: { id: '1' },
      load: async () => ({
        handler: (await import('../app/api/admin/referrals/[id]+api')).PATCH,
      }),
    },
    {
      name: 'GET /api/orders',
      method: 'GET',
      load: async () => ({ handler: (await import('../app/api/orders+api')).GET }),
    },
    {
      name: 'POST /api/orders',
      method: 'POST',
      body: {
        fulfilment: 'pickup',
        phone: '+919999999999',
        items: [{ menuItemId: 1, quantity: 1 }],
      },
      load: async () => ({ handler: (await import('../app/api/orders+api')).POST }),
    },
    {
      name: 'GET /api/orders/[id]',
      method: 'GET',
      params: { id: '1' },
      load: async () => ({
        handler: (await import('../app/api/orders/[id]+api')).GET,
      }),
    },
    {
      name: 'POST /api/orders/[id]/cancel',
      method: 'POST',
      params: { id: '1' },
      load: async () => ({
        handler: (await import('../app/api/orders/[id]/cancel+api')).POST,
      }),
    },
    {
      name: 'GET /api/admin/menu',
      method: 'GET',
      load: async () => ({
        handler: (await import('../app/api/admin/menu+api')).GET,
      }),
    },
    {
      name: 'POST /api/admin/menu',
      method: 'POST',
      body: { categoryId: 1, name: 'Test item', pricePaise: 100 },
      load: async () => ({
        handler: (await import('../app/api/admin/menu+api')).POST,
      }),
    },
    {
      name: 'PATCH /api/admin/menu/[id]',
      method: 'PATCH',
      body: { available: false },
      params: { id: '1' },
      load: async () => ({
        handler: (await import('../app/api/admin/menu/[id]+api')).PATCH,
      }),
    },
    {
      name: 'DELETE /api/admin/menu/[id]',
      method: 'DELETE',
      params: { id: '1' },
      load: async () => ({
        handler: (await import('../app/api/admin/menu/[id]+api')).DELETE,
      }),
    },
    {
      name: 'POST /api/admin/menu/categories',
      method: 'POST',
      body: { name: 'Test category' },
      load: async () => ({
        handler: (await import('../app/api/admin/menu/categories+api')).POST,
      }),
    },
    {
      name: 'DELETE /api/admin/menu/categories/[id]',
      method: 'DELETE',
      params: { id: '1' },
      load: async () => ({
        handler: (await import('../app/api/admin/menu/categories/[id]+api')).DELETE,
      }),
    },
    {
      name: 'GET /api/admin/orders',
      method: 'GET',
      load: async () => ({
        handler: (await import('../app/api/admin/orders+api')).GET,
      }),
    },
    {
      name: 'GET /api/admin/orders/[id]',
      method: 'GET',
      params: { id: '1' },
      load: async () => ({
        handler: (await import('../app/api/admin/orders/[id]+api')).GET,
      }),
    },
    {
      name: 'PATCH /api/admin/orders/[id]',
      method: 'PATCH',
      body: { status: 'confirmed' },
      params: { id: '1' },
      load: async () => ({
        handler: (await import('../app/api/admin/orders/[id]+api')).PATCH,
      }),
    },
  ];

  let failures = 0;

  for (const item of cases) {
    try {
      const { handler } = await item.load();
      const response = await handler(json(item.method, item.body), item.params ?? {});
      const ok = response.status === 401;
      if (!ok) failures += 1;
      console.log(
        `${ok ? 'PASS' : 'FAIL'}  ${item.name} — expected 401, got ${response.status}`,
      );
    } catch (error) {
      failures += 1;
      console.log(
        `FAIL  ${item.name} — threw ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  const guardedFailures = failures;

  const publicMenu = await (await import('../app/api/menu+api')).GET(json('GET'));
  const publicMenuOk = publicMenu.status === 200;
  if (!publicMenuOk) failures += 1;
  console.log(
    `${publicMenuOk ? 'PASS' : 'FAIL'}  GET /api/menu — public menu readable, got ${publicMenu.status}`,
  );

  console.log(
    `\n${cases.length - guardedFailures}/${cases.length} unauthenticated requests were rejected.`,
  );
  if (failures > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error('Auth guard verification failed:', error);
  process.exitCode = 1;
});
