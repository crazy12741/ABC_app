ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_price_positive" CHECK ("menu_items"."price_paise" > 0);--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_range" CHECK ("order_items"."quantity" between 1 and 20);--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_line_total_matches" CHECK ("order_items"."line_total_paise" = "order_items"."unit_price_paise" * "order_items"."quantity");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_amounts_non_negative" CHECK ("orders"."subtotal_paise" >= 0 and "orders"."delivery_fee_paise" >= 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_matches" CHECK ("orders"."total_paise" = "orders"."subtotal_paise" + "orders"."delivery_fee_paise");