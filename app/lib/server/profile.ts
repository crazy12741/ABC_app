import type { Profile } from '../types';

type UserLike = {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  role?: string | null;
  onboardingComplete?: boolean | null;
  referralCode?: string | null;
  emailUpdates?: boolean | null;
  pushEnabled?: boolean | null;
  createdAt: Date | string;
};

const TEMP_EMAIL_DOMAIN = '@phone.americanburgerclub.invalid';

export function isPlaceholderEmail(email: string | null | undefined): boolean {
  return !email || email.endsWith(TEMP_EMAIL_DOMAIN);
}

export function toProfile(user: UserLike): Profile {
  return {
    id: user.id,
    name: user.name,
    email: isPlaceholderEmail(user.email) ? null : user.email,
    phoneNumber: user.phoneNumber ?? '',
    role: user.role ?? 'customer',
    onboardingComplete: Boolean(user.onboardingComplete),
    referralCode: user.referralCode ?? null,
    emailUpdates: Boolean(user.emailUpdates),
    pushEnabled: Boolean(user.pushEnabled),
    createdAt: new Date(user.createdAt).toISOString(),
  };
}

export function displayName(name: string, masked = false): string {
  if (!masked) return name;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

export function normalisePhone(value: string): string {
  return value.replace(/[^\d+]/g, '');
}

export function adminPhones(): string[] {
  return (process.env.ADMIN_PHONES ?? '')
    .split(/[,;\s]+/)
    .map(normalisePhone)
    .filter(Boolean);
}

export function isAdminPhone(phoneNumber: string | null | undefined): boolean {
  if (!phoneNumber) return false;
  return adminPhones().includes(normalisePhone(phoneNumber));
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
