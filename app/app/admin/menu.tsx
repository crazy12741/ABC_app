import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Pencil,
  Plus,
  Settings2,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { confirmAction } from '@/lib/confirm';
import { formatMoney } from '@/lib/format';
import type { AdminMenuData, AdminMenuItem } from '@/lib/types';
import { AdminScreen } from '@/components/AdminScreen';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { ScreenSkeleton } from '@/components/Skeleton';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/ToastProvider';

export default function AdminMenuScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  const query = useQuery({
    queryKey: ['admin', 'menu'],
    queryFn: ({ signal }) => apiGet<AdminMenuData>('/api/admin/menu', signal),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'menu'] });
    queryClient.invalidateQueries({ queryKey: ['menu'] });
    queryClient.invalidateQueries({ queryKey: ['home'] });
  };

  const toggleAvailable = async (item: AdminMenuItem) => {
    setBusyId(item.id);
    try {
      await apiPatch(`/api/admin/menu/${item.id}`, { available: !item.available });
      showToast(
        item.available ? `${item.name} marked sold out.` : `${item.name} is available.`,
        'success',
      );
      refresh();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Could not update availability.',
        'error',
      );
    } finally {
      setBusyId(null);
    }
  };

  const removeItem = (item: AdminMenuItem) => {
    confirmAction(
      'Delete this item?',
      `${item.name} will be removed from the menu. Past orders keep their item snapshots.`,
      'Delete item',
      async () => {
        setBusyId(item.id);
        try {
          await apiDelete(`/api/admin/menu/${item.id}`);
          showToast('Menu item deleted.', 'success');
          refresh();
        } catch (error) {
          showToast(
            error instanceof Error ? error.message : 'Could not delete the item.',
            'error',
          );
        } finally {
          setBusyId(null);
        }
      },
    );
  };

  const removeCategory = (id: number, name: string) => {
    confirmAction(
      'Delete this category?',
      `${name} must be empty before it can be deleted.`,
      'Delete category',
      async () => {
        try {
          await apiDelete(`/api/admin/menu/categories/${id}`);
          showToast('Category deleted.', 'success');
          refresh();
        } catch (error) {
          showToast(
            error instanceof Error ? error.message : 'Could not delete the category.',
            'error',
          );
        }
      },
    );
  };

  const addCategory = async () => {
    if (newCategory.trim().length < 2) {
      showToast('Add a category name first.', 'error');
      return;
    }
    setAddingCategory(true);
    try {
      await apiPost('/api/admin/menu/categories', {
        name: newCategory.trim(),
        sortOrder: query.data?.categories.length ?? 0,
      });
      setNewCategory('');
      showToast('Category added.', 'success');
      refresh();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Could not add the category.',
        'error',
      );
    } finally {
      setAddingCategory(false);
    }
  };

  const data = query.data;

  return (
    <AdminScreen
      title="Menu"
      subtitle="Items, prices and availability"
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
    >
      <View style={styles.content}>
        <Button
          label="New menu item"
          icon={Plus}
          onPress={() =>
            router.push({
              pathname: '/admin/menu-editor',
              params: data?.categories[0]
                ? { categoryId: String(data.categories[0].id) }
                : {},
            })
          }
        />

        {query.isLoading ? (
          <ScreenSkeleton blocks={4} />
        ) : query.isError || !data ? (
          <ErrorState
            title="Menu unavailable"
            message="Check your connection and try again."
            onRetry={() => query.refetch()}
          />
        ) : (
          <>
            <Card tone="charcoal" style={styles.statusCard}>
              <View style={styles.statusTop}>
                <View style={styles.flex}>
                  <AppText variant="caption" color="#C9BBA9">
                    Ordering
                  </AppText>
                  <AppText variant="h2" color={colors.white}>
                    {data.ordering.enabled ? 'Kitchen is taking orders' : 'Ordering paused'}
                  </AppText>
                </View>
                <Badge
                  label={data.ordering.enabled ? 'Open' : 'Paused'}
                  tone={data.ordering.enabled ? 'green' : 'muted'}
                />
              </View>
              <View style={styles.statusMeta}>
                <AppText variant="small" color="#C9BBA9">
                  Delivery {formatMoney(data.ordering.deliveryFeePaise)} · Min order{' '}
                  {formatMoney(data.ordering.minOrderPaise)}
                </AppText>
              </View>
              <Button
                label="Change ordering settings"
                icon={Settings2}
                variant="secondary"
                onPress={() => router.push('/admin/settings')}
              />
            </Card>

            <Card style={styles.categoryCard}>
              <AppText variant="h3">Categories</AppText>
              {data.categories.length === 0 ? (
                <AppText variant="small" color={colors.muted}>
                  Add a category first, then create items inside it.
                </AppText>
              ) : (
                <View style={styles.categoryList}>
                  {data.categories.map((category) => (
                    <View key={category.id} style={styles.categoryRow}>
                      <View style={styles.flex}>
                        <AppText variant="smallStrong">{category.name}</AppText>
                        <AppText variant="small" color={colors.muted}>
                          {category.itemCount}{' '}
                          {category.itemCount === 1 ? 'item' : 'items'}
                        </AppText>
                      </View>
                      <Badge
                        label={category.active ? 'Visible' : 'Hidden'}
                        tone={category.active ? 'green' : 'muted'}
                      />
                      {category.itemCount === 0 ? (
                        <Pressable
                          onPress={() => removeCategory(category.id, category.name)}
                          accessibilityRole="button"
                          accessibilityLabel={`Delete ${category.name} category`}
                          hitSlop={8}
                          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                        >
                          <Trash2 size={16} strokeWidth={2.1} color={colors.danger} />
                        </Pressable>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.addRow}>
                <TextField
                  containerStyle={styles.flex}
                  label="New category"
                  value={newCategory}
                  onChangeText={setNewCategory}
                  placeholder="Desserts"
                  maxLength={60}
                />
                <Button
                  label="Add"
                  size="sm"
                  fullWidth={false}
                  loading={addingCategory}
                  onPress={addCategory}
                  style={styles.addButton}
                />
              </View>
            </Card>

            {data.items.length === 0 ? (
              <Card>
                <EmptyState
                  icon={UtensilsCrossed}
                  title="No menu items yet"
                  body="Create your first item so customers can start building an order."
                  actionLabel="New menu item"
                  onAction={() => router.push('/admin/menu-editor')}
                />
              </Card>
            ) : (
              <View style={styles.sections}>
                {data.categories.map((category) => {
                  const items = data.items.filter(
                    (item) => item.categoryId === category.id,
                  );
                  if (items.length === 0) return null;
                  return (
                    <View key={category.id} style={styles.section}>
                      <AppText variant="h2">{category.name}</AppText>
                      <View style={styles.stack}>
                        {items.map((item) => {
                          const busy = busyId === item.id;
                          return (
                            <Card key={item.id} style={styles.itemCard}>
                              <View style={styles.itemTop}>
                                <View style={styles.flex}>
                                  <View style={styles.itemNameRow}>
                                    <Badge
                                      label={item.isVeg ? 'Veg' : 'Non-veg'}
                                      tone={item.isVeg ? 'green' : 'muted'}
                                    />
                                    <AppText variant="smallStrong" style={styles.flex}>
                                      {item.name}
                                    </AppText>
                                  </View>
                                  <AppText variant="small" color={colors.muted}>
                                    {formatMoney(item.pricePaise)}
                                    {item.description ? ` · ${item.description}` : ''}
                                  </AppText>
                                </View>
                              </View>
                              <View style={styles.itemActions}>
                                <View style={styles.availableRow}>
                                  <AppText variant="small" color={colors.muted}>
                                    Available
                                  </AppText>
                                  <Switch
                                    value={item.available}
                                    onValueChange={() => toggleAvailable(item)}
                                    disabled={busy}
                                    trackColor={{
                                      false: colors.lineStrong,
                                      true: colors.orange,
                                    }}
                                    thumbColor={colors.white}
                                    ios_backgroundColor={colors.lineStrong}
                                    accessibilityLabel={`${item.name} availability`}
                                  />
                                </View>
                                <Button
                                  label="Edit"
                                  icon={Pencil}
                                  variant="secondary"
                                  size="sm"
                                  fullWidth={false}
                                  onPress={() =>
                                    router.push({
                                      pathname: '/admin/menu-editor',
                                      params: { id: String(item.id) },
                                    })
                                  }
                                  disabled={busy}
                                />
                                <Button
                                  label="Delete"
                                  icon={Trash2}
                                  variant="danger"
                                  size="sm"
                                  fullWidth={false}
                                  onPress={() => removeItem(item)}
                                  disabled={busy}
                                />
                              </View>
                            </Card>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </View>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  flex: {
    flex: 1,
  },
  statusCard: {
    gap: spacing.md,
  },
  statusTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  statusMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryCard: {
    gap: spacing.md,
  },
  categoryList: {
    gap: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  addButton: {
    marginBottom: 4,
  },
  sections: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  stack: {
    gap: spacing.md,
  },
  itemCard: {
    gap: spacing.md,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
});
