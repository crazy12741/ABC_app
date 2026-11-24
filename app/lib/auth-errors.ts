type AuthErrorLike =
  | {
      message?: string | null;
      code?: string | null;
      status?: number | null;
    }
  | null
  | undefined;

export function authErrorMessage(error: AuthErrorLike, fallback: string): string {
  if (!error) return fallback;

  const code = (error.code ?? '').toUpperCase();
  const message = (error.message ?? '').trim();
  const lower = message.toLowerCase();

  if (code.includes('TOO_MANY') || lower.includes('too many') || lower.includes('rate limit')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }

  if (lower.includes('expired')) {
    return 'That code has expired. Request a new one and try again.';
  }

  if (
    code.includes('INVALID') ||
    lower.includes('invalid code') ||
    lower.includes('invalid otp') ||
    lower.includes('incorrect')
  ) {
    return 'That code is not correct. Check the SMS and try again.';
  }

  if (lower.includes('blocked') || lower.includes('disabled')) {
    return 'This number cannot receive codes right now. Contact the club for help.';
  }

  if (lower.includes('invalid phone') || lower.includes('phone number')) {
    return 'Enter a valid mobile number with the country code.';
  }

  if (message.length > 0) return message;
  return fallback;
}
