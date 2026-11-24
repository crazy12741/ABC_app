import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, UtensilsCrossed } from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { confirmAction } from '@/lib/confirm';
import { paiseToRupees, parseRupees } from '@/lib/format';
import type { AdminMenuData } from '@/lib/types';
import { AdminScreen } from '@/components/AdminScreen';
import { AppText } from '@/components/AppText';
import { BurgerImage } from '@/components/BurgerImage';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { InlineMessage } from '@/components/InlineMessage';
import { ScreenSkeleton } from '@/components/Skeleton';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/ToastProvider';

export default function MenuEditorScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id?: string; categoryId?: string }>();
  const id = typeof params.id === 'string' ? Number(params.id) : null;
  const editing = Number.isInteger(id) && id !== null && id > 0;

  const query = useQuery({
    queryKey: ['admin', 'menu'],
    queryFn: ({ signal }) => apiGet<AdminMenuData>('/api/admin/menu', signal),
  });

  const existing = editing
    ? query.data?.items.find((item) => item.id === id) ?? null
    : null;

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isVeg, setIsVeg] = useState(false);
  const [available, setAvailable] = useState(true);
  const [sortOrder, setSortOrder] = useState('0');
  const [initialised, setInitialised] = useState(!editing);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (editing) {
      if (!existing) return;
      setCategoryId(existing.categoryId);
      setName(existing.name);
      setDescription(existing.description ?? '');
      setPrice(paiseToRupees(existing.pricePaise));
      setImageUrl(existing.imageUrl ?? '');
      setIsVeg(existing.isVeg);
      setAvailable(existing.available);
      setSortOrder(String(existing.sortOrder));
      setInitialised(true);
      return;
    }

    if (categoryId === null) {
      const initial =
        (params.categoryId ? Number(params.categoryId) : null) ??
        query.data?.categories[0]?.id ??
        null;
      if (initial && Number.isInteger(initial)) setCategoryId(initial);
    }
  }, [editing, existing?.id, params.categoryId, query.data?.categories, categoryId]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'menu'] });
    queryClient.invalidateQueries({ queryKey: ['menu'] });
    queryClient.invalidateQueries({ queryKey: ['home'] });
  };

  const save = async () => {
    const pricePaise = parseRupees(price);
    if (!categoryId) {
      setError('Choose a category for this item.');
      return;
    }
    if (name.trim().length < 2) {
      setError('Add an item name.');
      return;
    }
    if (!pricePaise) {
      setError('Enter a valid price in rupees, for example 249 or 249.50.');
      return;
    }

    const parsedSort = Number(sortOrder);
    const sortValue = Number.isInteger(parsedSort) && parsedSort >= 0 ? parsedSort : 0;

    setError(null);
    setSaving(true);
    try {
      const body = {
        categoryId,
        name: name.trim(),
        description: description.trim().length > 0 ? description.trim() : null,
        pricePaise,
        imageUrl: imageUrl.trim().length > 0 ? imageUrl.trim() : null,
        isVeg,
        available,
        sortOrder: sortValue,
      };

      if (editing && id) {
        await apiPatch(`/api/admin/menu/${id}`, body);
        showToast('Menu item updated.', 'success');
      } else {
        await apiPost('/api/admin/menu', body);
        showToast('Menu item created.', 'success');
      }
      refresh();
      router.back();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'The menu item could not be saved.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (!id) return;
    confirmAction(
      'Delete this item?',
      'It will disappear from the customer menu. Past orders keep their snapshots.',
      'Delete item',
      async () => {
        setDeleting(true);
        try {
          await apiDelete(`/api/admin/menu/${id}`);
          showToast('Menu item deleted.', 'success');
          refresh();
          router.back();
        } catch (err) {
          showToast(
            err instanceof Error ? err.message : 'Could not delete the item.',
            'error',
          );
        } finally {
          setDeleting(false);
        }
      },
    );
  };

  const categories = query.data?.categories ?? [];

  return (
    <AdminScreen title={editing ? 'Edit menu item' : 'New menu item'} subtitle="Menu">
      {query.isLoading ? (
        <ScreenSkeleton blocks={2} />
      ) : editing && !existing && !query.isLoading ? (
        <InlineMessage message="That menu item could not be found." tone="error" />
      ) : !initialised ? (
        <ScreenSkeleton blocks={2} />
      ) : categories.length === 0 ? (
        <View style={styles.content}>
          <InlineMessage
            message="Create a category on the Menu screen before adding items."
            tone="info"
          />
          <Button label="Back to menu" variant="secondary" onPress={() => router.back()} />
        </View>
      ) : (
        <View style={styles.content}>
          <Card style={styles.formCard}>
            <View style={styles.heading}>
              <View style={styles.headingIcon}>
                <UtensilsCrossed size={19} strokeWidth={2.1} color={colors.orangeDark} />
              </View>
              <AppText variant="small" color={colors.muted} style={styles.flex}>
                Customers see available items on the menu straight away. Sold-out
                items stay visible but cannot be added.
              </AppText>
            </View>

            <View style={styles.categoryBlock}>
              <AppText variant="label">Category</AppText>
              <View style={styles.chips}>
                {categories.map((category) => {
                  const active = categoryId === category.id;
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => setCategoryId(category.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={({ pressed }) => [
                        styles.chip,
                        active && styles.chipActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <AppText
                        variant="smallStrong"
                        color={active ? colors.white : colors.body}
                      >
                        {category.name}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <TextField
              label="Item name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError(null);
              }}
              placeholder="The Five"
              maxLength={80}
            />

            <TextField
              label="Description"
              hint="Optional"
              value={description}
              onChangeText={setDescription}
              placeholder="Double smashed patty, cheddar, house sauce…"
              multiline
              maxLength={300}
              inputStyle={styles.descriptionInput}
            />

            <View style={styles.row}>
              <TextField
                label="Price"
                hint="₹, e.g. 249"
                value={price}
                onChangeText={(text) => {
                  setPrice(text);
                  if (error) setError(null);
                }}
                placeholder="249"
                keyboardType="decimal-pad"
                maxLength={10}
                containerStyle={styles.flex}
              />
              <TextField
                label="Sort order"
                hint="Lower first"
                value={sortOrder}
                onChangeText={setSortOrder}
                keyboardType="number-pad"
                maxLength={3}
                containerStyle={styles.flex}
              />
            </View>

            <TextField
              label="Image URL"
              hint="Optional"
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="https://…"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              maxLength={500}
            />

            {imageUrl.trim().length > 0 ? (
              <BurgerImage
                uri={imageUrl.trim()}
                height={150}
                borderRadius={radius.md}
                accessibilityLabel="Item image preview"
              />
            ) : null}

            <View style={styles.switchRow}>
              <View style={styles.flex}>
                <AppText variant="smallStrong">Vegetarian</AppText>
                <AppText variant="small" color={colors.muted}>
                  Shows a green diet mark on the menu.
                </AppText>
              </View>
              <Switch
                value={isVeg}
                onValueChange={setIsVeg}
                trackColor={{ false: colors.lineStrong, true: colors.orange }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.lineStrong}
                accessibilityLabel="Vegetarian item"
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.flex}>
                <AppText variant="smallStrong">Available</AppText>
                <AppText variant="small" color={colors.muted}>
                  Turn off to mark the item sold out.
                </AppText>
              </View>
              <Switch
                value={available}
                onValueChange={setAvailable}
                trackColor={{ false: colors.lineStrong, true: colors.orange }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.lineStrong}
                accessibilityLabel="Item availability"
              />
            </View>

            {error ? <InlineMessage message={error} tone="error" /> : null}
          </Card>

          <Button
            label={editing ? 'Save item' : 'Create item'}
            loadingLabel="Saving…"
            loading={saving}
            onPress={save}
            disabled={saving || deleting}
          />

          {editing ? (
            <Button
              label="Delete item"
              icon={Trash2}
              variant="danger"
              loading={deleting}
              loadingLabel="Deleting…"
              onPress={remove}
              disabled={saving || deleting}
            />
          ) : null}
        </View>
      )}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  formCard: {
    gap: spacing.lg,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headingIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  categoryBlock: {
    gap: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.charcoal,
    borderColor: colors.charcoal,
  },
  pressed: {
    opacity: 0.75,
  },
  descriptionInput: {
    minHeight: 84,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
  },
});
