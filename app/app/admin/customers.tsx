import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { apiGet } from '@/lib/api';
import { formatDate, formatPhone } from '@/lib/format';
import type { AdminCustomer } from '@/lib/types';
import { AdminScreen } from '@/components/AdminScreen';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { ScreenSkeleton } from '@/components/Skeleton';
import { TextField } from '@/components/TextField';

export default function AdminCustomersScreen() {
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 320);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useQuery({
    queryKey: ['admin', 'customers', term],
    queryFn: ({ signal }) =>
      apiGet<{ customers: AdminCustomer[] }>(
        `/api/admin/customers?q=${encodeURIComponent(term)}`,
        signal,
      ),
  });

  const customers = query.data?.customers ?? [];

  return (
    <AdminScreen
      title="Customers"
      subtitle={`${customers.length} verified member${customers.length === 1 ? '' : 's'}`}
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
    >
      <View style={styles.content}>
        <TextField
          icon={Search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, phone or email"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          containerStyle={styles.search}
        />

        {query.isLoading ? (
          <ScreenSkeleton blocks={3} />
        ) : query.isError ? (
          <ErrorState
            title="Customers unavailable"
            message="We could not load the member list."
            onRetry={() => query.refetch()}
          />
        ) : customers.length === 0 ? (
          <Card>
            <EmptyState
              icon={Users}
              title={term ? 'No matching members' : 'No members yet'}
              body={
                term
                  ? 'Try a different name, phone number or email.'
                  : 'Customers appear here after they verify and finish onboarding.'
              }
            />
          </Card>
        ) : (
          <View style={styles.stack}>
            {customers.map((person) => (
              <Card key={person.id} style={styles.personCard}>
                <View style={styles.personTop}>
                  <View style={styles.avatar}>
                    <AppText variant="smallStrong" color={colors.orangeDark}>
                      {person.name.charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong">{person.name}</AppText>
                    <AppText variant="small" color={colors.muted}>
                      {formatPhone(person.phoneNumber)}
                    </AppText>
                  </View>
                  <Badge
                    label={person.role === 'admin' ? 'Admin' : 'Member'}
                    tone={person.role === 'admin' ? 'orange' : 'muted'}
                  />
                </View>

                {person.email ? (
                  <AppText variant="small" color={colors.muted}>
                    {person.email}
                  </AppText>
                ) : null}

                <View style={styles.metaRow}>
                  <View style={styles.meta}>
                    <AppText variant="smallStrong">{person.voteCount}</AppText>
                    <AppText variant="small" color={colors.muted}>
                      votes
                    </AppText>
                  </View>
                  <View style={styles.meta}>
                    <AppText variant="smallStrong">{person.referralCount}</AppText>
                    <AppText variant="small" color={colors.muted}>
                      referrals
                    </AppText>
                  </View>
                  <View style={styles.meta}>
                    <AppText variant="smallStrong">
                      {formatDate(person.createdAt)}
                    </AppText>
                    <AppText variant="small" color={colors.muted}>
                      joined
                    </AppText>
                  </View>
                </View>
              </Card>
            ))}
          </View>
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
  search: {
    marginBottom: 2,
  },
  stack: {
    gap: spacing.md,
  },
  personCard: {
    gap: spacing.sm,
  },
  personTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: spacing.sm,
  },
  meta: {
    gap: 1,
  },
});
