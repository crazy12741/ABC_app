const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const suffix = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${hours}:${minutes} ${suffix}`;
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return '';
  const diff = Date.now() - time;

  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return formatDate(iso);
}

export function formatPhone(value: string): string {
  if (!value) return '';
  if (value.startsWith('+91') && value.length === 13) {
    return `+91 ${value.slice(3, 8)} ${value.slice(8)}`;
  }
  return value;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

export function splitDateTime(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: '', time: '' };
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return { date: '', time: '' };
  const year = value.getFullYear();
  const month = (value.getMonth() + 1).toString().padStart(2, '0');
  const day = value.getDate().toString().padStart(2, '0');
  const hours = value.getHours().toString().padStart(2, '0');
  const minutes = value.getMinutes().toString().padStart(2, '0');
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
}

export function combineDateTime(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (!/^\d{2}:\d{2}$/.test(time)) return null;
  const value = new Date(`${date}T${time}:00`);
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString();
}

export function maskEmail(email: string | null): string {
  if (!email) return 'Not added';
  return email;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || 'there';
}

export function formatMoney(paise: number): string {
  const rupees = paise / 100;
  const fractionDigits = Number.isInteger(rupees) ? 0 : 2;
  return `₹${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  }).format(rupees)}`;
}

export function paiseToRupees(paise: number): string {
  return paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2);
}

export function parseRupeesValue(value: string): number | null {
  const cleaned = value.replace(/[₹,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const rupees = Number(cleaned);
  if (!Number.isFinite(rupees) || rupees < 0) return null;
  return Math.round(rupees * 100);
}

export function parseRupees(value: string): number | null {
  const amount = parseRupeesValue(value);
  return amount === null || amount <= 0 ? null : amount;
}
