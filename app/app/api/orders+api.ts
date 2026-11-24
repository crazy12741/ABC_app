import { z } from 'zod';
import { readBody, requireSession, route } from '@/lib/server/http';
import { createOrder, getOrdersForUser } from '@/lib/server/orders';
import type { OrdersData } from '@/lib/types';

const orderSchema = z.object({
  fulfilment: z.enum(['pickup', 'delivery']),
  paymentMethod: z.enum(['cash', 'upi']).default('cash'),
  phone: z
    .string()
    .trim()
    .min(7, 'Add a contact number for this order.')
    .max(20, 'Use 20 characters or fewer.')
    .refine((value) => value.replace(/\D/g, '').length >= 10, {
      message: 'Add a full contact number for this order.',
    }),
  address: z.string().trim().max(500, 'Use 500 characters or fewer.').nullable().optional(),
  notes: z.string().trim().max(500, 'Use 500 characters or fewer.').nullable().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1, 'Add at least one item to your order.')
    .max(30),
});

export const GET = route(async (request) => {
  const session = await requireSession(request);
  const orders = await getOrdersForUser(session.user.id);
  const data: OrdersData = { orders };
  return Response.json(data);
});

export const POST = route(async (request) => {
  const session = await requireSession(request);
  const body = await readBody(request, orderSchema);

  const order = await createOrder({
    userId: session.user.id,
    customerName: session.user.name?.trim() || 'Club member',
    phone: body.phone,
    fulfilment: body.fulfilment,
    paymentMethod: body.paymentMethod,
    address: body.address && body.address.length > 0 ? body.address : null,
    notes: body.notes && body.notes.length > 0 ? body.notes : null,
    items: body.items,
  });

  return Response.json({ order }, { status: 201 });
});
