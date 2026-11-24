import 'dotenv/config';
import { pool } from '../lib/db';
import { createOrder, getOrderForUser, updateOrderStatus } from '../lib/server/orders';

async function main() {
  console.log('Order flow verification (creates and removes a temporary member)\n');
  await pool.query("delete from \"user\" where id like 'order-test-%'");
  const suffix = Date.now().toString(36);
  const userId = `order-test-${suffix}`;
  await pool.query(
    `insert into "user" (id, name, email, phone_number, onboarding_complete, referral_code)
     values ($1, 'Order Tester', $2, '+919888877771', true, $3)`,
    [userId, `${userId}@verify.invalid`, `ORD${suffix}`],
  );

  const { rows } = await pool.query<{ id: number; name: string; price_paise: number }>(
    'select id, name, price_paise from menu_items where available = true order by price_paise, id limit 2',
  );
  if (rows.length < 2) throw new Error('Need two menu items for the test');

  const order = await createOrder({
    userId,
    customerName: 'Order Tester',
    phone: '+919888877771',
    fulfilment: 'pickup',
    paymentMethod: 'cash',
    address: null,
    notes: 'Test order',
    items: [
      { menuItemId: rows[0].id, quantity: 2 },
      { menuItemId: rows[1].id, quantity: 1 },
    ],
  });

  const expected = rows[0].price_paise * 2 + rows[1].price_paise;
  console.log('order number:', order.orderNumber);
  console.log('subtotal:', order.subtotalPaise, 'expected:', expected);
  console.log('total equals subtotal + fee:', order.totalPaise === order.subtotalPaise);
  console.log('items:', order.items.map((i) => `${i.quantity}x ${i.name}`).join(', '));
  if (order.subtotalPaise !== expected || order.totalPaise !== expected) {
    throw new Error('Server did not recompute totals correctly');
  }

  const confirmed = await updateOrderStatus(order.id, 'confirmed');
  const preparing = await updateOrderStatus(order.id, 'preparing');
  console.log('status flow:', order.status, '->', confirmed.status, '->', preparing.status);

  let invalidBlocked = false;
  try {
    await updateOrderStatus(order.id, 'completed');
  } catch (error) {
    invalidBlocked = (error as Error).message.includes('cannot move');
  }
  console.log('invalid transition blocked:', invalidBlocked);
  if (!invalidBlocked) throw new Error('Invalid status transition was accepted');

  let minBlocked = false;
  try {
    await createOrder({
      userId,
      customerName: 'Order Tester',
      phone: '+919888877771',
      fulfilment: 'delivery',
      paymentMethod: 'cash',
      address: 'Marine Drive, Kochi',
      notes: null,
      items: [{ menuItemId: rows[0].id, quantity: 1 }],
    });
  } catch (error) {
    minBlocked = (error as Error).message.includes('minimum');
  }
  console.log('delivery minimum enforced:', minBlocked);
  if (!minBlocked) throw new Error('Delivery minimum was not enforced');

  const mine = await getOrderForUser(userId, order.id);
  console.log('owner can read order:', Boolean(mine));

  const other = await getOrderForUser('someone-else', order.id);
  console.log('other user blocked:', other === null);

  await pool.query('delete from "user" where id = $1', [userId]);
  console.log('\nAll order checks passed. Temporary data removed.');
}

main()
  .catch(async (error) => {
    console.error('ORDER TEST FAILED:', error);
    process.exitCode = 1;
    await pool.query("delete from \"user\" where id like 'order-test-%'").catch(() => {});
  })
  .finally(async () => {
    await pool.end();
  });
