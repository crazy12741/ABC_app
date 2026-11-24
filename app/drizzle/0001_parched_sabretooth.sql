CREATE TABLE "menu_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price_paise" integer NOT NULL,
	"image_url" text,
	"is_veg" boolean DEFAULT false NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"menu_item_id" integer,
	"name_snapshot" text NOT NULL,
	"unit_price_paise" integer NOT NULL,
	"quantity" integer NOT NULL,
	"line_total_paise" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"user_id" text NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"status" text DEFAULT 'placed' NOT NULL,
	"fulfilment" text DEFAULT 'pickup' NOT NULL,
	"payment_method" text DEFAULT 'cash' NOT NULL,
	"subtotal_paise" integer NOT NULL,
	"delivery_fee_paise" integer DEFAULT 0 NOT NULL,
	"total_paise" integer NOT NULL,
	"address" text,
	"notes" text,
	"placed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "ordering_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "delivery_fee_paise" integer DEFAULT 3900 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "min_order_paise" integer DEFAULT 19900 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "ordering_note" text;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "menu_categories_sort_idx" ON "menu_categories" USING btree ("sort_order","id");--> statement-breakpoint
CREATE INDEX "menu_items_category_idx" ON "menu_items" USING btree ("category_id","sort_order");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_number_unique" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id","placed_at");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status","placed_at");