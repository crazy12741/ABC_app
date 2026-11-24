import { asc, eq } from 'drizzle-orm';
import { db } from '../db';
import { menuCategories, menuItems } from '../schema';
import type {
  AdminMenuCategory,
  AdminMenuItem,
  MenuCategoryView,
  MenuItemView,
} from '../types';

type MenuItemRow = typeof menuItems.$inferSelect;

export function toMenuItemView(row: MenuItemRow): MenuItemView {
  return {
    id: row.id,
    categoryId: row.categoryId,
    name: row.name,
    description: row.description,
    pricePaise: row.pricePaise,
    imageUrl: row.imageUrl,
    isVeg: row.isVeg,
    available: row.available,
  };
}

export async function getMenu(): Promise<{
  categories: MenuCategoryView[];
  featured: MenuItemView[];
}> {
  const [categoryRows, itemRows] = await Promise.all([
    db
      .select()
      .from(menuCategories)
      .where(eq(menuCategories.active, true))
      .orderBy(asc(menuCategories.sortOrder), asc(menuCategories.id)),
    db
      .select()
      .from(menuItems)
      .orderBy(asc(menuItems.sortOrder), asc(menuItems.id)),
  ]);

  const byCategory = new Map<number, MenuItemView[]>();
  for (const row of itemRows) {
    const list = byCategory.get(row.categoryId) ?? [];
    list.push(toMenuItemView(row));
    byCategory.set(row.categoryId, list);
  }

  const categories: MenuCategoryView[] = categoryRows
    .map((category) => ({
      id: category.id,
      name: category.name,
      items: byCategory.get(category.id) ?? [],
    }))
    .filter((category) => category.items.length > 0);

  const activeCategoryIds = new Set(categories.map((category) => category.id));
  const featured = itemRows
    .filter((row) => row.available && activeCategoryIds.has(row.categoryId))
    .slice(0, 3)
    .map(toMenuItemView);

  return { categories, featured };
}

export async function getAdminMenu(): Promise<{
  categories: AdminMenuCategory[];
  items: AdminMenuItem[];
}> {
  const [categoryRows, itemRows] = await Promise.all([
    db
      .select()
      .from(menuCategories)
      .orderBy(asc(menuCategories.sortOrder), asc(menuCategories.id)),
    db
      .select({
        item: menuItems,
        categoryName: menuCategories.name,
      })
      .from(menuItems)
      .innerJoin(menuCategories, eq(menuCategories.id, menuItems.categoryId))
      .orderBy(
        asc(menuCategories.sortOrder),
        asc(menuItems.sortOrder),
        asc(menuItems.id),
      ),
  ]);

  const counts = new Map<number, number>();
  for (const row of itemRows) {
    counts.set(row.item.categoryId, (counts.get(row.item.categoryId) ?? 0) + 1);
  }

  return {
    categories: categoryRows.map((category) => ({
      id: category.id,
      name: category.name,
      sortOrder: category.sortOrder,
      active: category.active,
      itemCount: counts.get(category.id) ?? 0,
    })),
    items: itemRows.map((row) => ({
      ...toMenuItemView(row.item),
      categoryName: row.categoryName,
      sortOrder: row.item.sortOrder,
    })),
  };
}

export async function getMenuItem(id: number): Promise<MenuItemRow | null> {
  const [row] = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.id, id))
    .limit(1);
  return row ?? null;
}
