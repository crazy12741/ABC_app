const TWILIO_API = 'https://api.twilio.com/2010-04-01/Accounts';

function readConfig() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    throw new Error('SMS provider is not configured.');
  }

  return { sid, token, from };
}

export async function sendOtpSms(phoneNumber: string, code: string): Promise<string> {
  const { sid, token, from } = readConfig();

  const body = new URLSearchParams({
    To: phoneNumber,
    Body: `AMERICAN BURGER CLUB: ${code} is your verification code. It expires in 5 minutes. Never share this code.`,
  });

  if (from.startsWith('MG')) {
    body.set('MessagingServiceSid', from);
  } else {
    body.set('From', from);
  }

  const response = await fetch(`${TWILIO_API}/${encodeURIComponent(sid)}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error('Twilio rejected an OTP message', response.status, detail.slice(0, 240));
    throw new Error('The SMS could not be delivered.');
  }

  const message = (await response.json()) as { sid?: string };
  return message.sid ?? 'sent';
}
