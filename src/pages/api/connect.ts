import type { APIRoute } from 'astro';
import { getSecret } from 'astro:env/server';

export const prerender = false;

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 4;
const requestLog = new Map<string, number[]>();

const topicLabels: Record<string, string> = {
  workshop: 'Workshop or training',
  adoption: 'Adoption and support',
  collaboration: 'Open-source collaboration',
  other: 'Something else',
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isRateLimited(key: string) {
  const now = Date.now();
  const recent = (requestLog.get(key) ?? []).filter((time) => now - time < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    requestLog.set(key, recent);
    return true;
  }

  recent.push(now);
  requestLog.set(key, recent);
  return false;
}

export const POST: APIRoute = async ({ request }) => {
  const origin = request.headers.get('origin');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const requestHost = request.headers.get('host');
  const requestOrigin = forwardedProto && requestHost
    ? `${forwardedProto}://${requestHost}`
    : new URL(request.url).origin;

  if (origin && origin !== requestOrigin) {
    return json({ error: 'This request could not be verified.' }, 403);
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 12_000) {
    return json({ error: 'That message is too large.' }, 413);
  }

  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const clientKey = request.headers.get('x-real-ip') || forwardedFor || 'local';
  if (isRateLimited(clientKey)) {
    return json({ error: 'A few hellos are already on their way. Please try again shortly.' }, 429);
  }

  let payload: Record<string, unknown>;

  try {
    if (request.headers.get('content-type')?.includes('application/json')) {
      const parsedPayload: unknown = await request.json();
      if (!parsedPayload || Array.isArray(parsedPayload) || typeof parsedPayload !== 'object') {
        return json({ error: 'We could not read that message.' }, 400);
      }
      payload = parsedPayload as Record<string, unknown>;
    } else {
      payload = Object.fromEntries(await request.formData());
    }
  } catch {
    return json({ error: 'We could not read that message.' }, 400);
  }

  const name = text(payload.name);
  const email = text(payload.email).toLowerCase();
  const company = text(payload.company);
  const topic = text(payload.topic);
  const message = text(payload.message);
  const website = text(payload.website);
  const startedAt = Number(payload.startedAt ?? 0);

  if (website || (startedAt > 0 && Date.now() - startedAt < 800)) {
    return json({ ok: true });
  }

  if (name.length < 2 || name.length > 80) {
    return json({ error: 'Please add your name.' }, 400);
  }

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Please add a valid email address.' }, 400);
  }

  if (company.length > 120 || !topicLabels[topic] || message.length < 12 || message.length > 1_200) {
    return json({ error: 'Please check the form and try again.' }, 400);
  }

  const webhookUrl = getSecret('CONTACT_WEBHOOK_URL');
  if (!webhookUrl) {
    console.error('CONTACT_WEBHOOK_URL is not configured.');
    return json({ error: 'The connection is temporarily unavailable.' }, 503);
  }

  try {
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Credentics website',
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: 'A new hello from credentics.io',
            description: message,
            color: 0x5b3df5,
            fields: [
              { name: 'Name', value: name, inline: true },
              { name: 'Email', value: email, inline: true },
              { name: 'Team', value: company || 'Not shared', inline: true },
              { name: 'Looking for', value: topicLabels[topic] },
            ],
            footer: { text: 'Sent from the website connection form' },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!webhookResponse.ok) {
      console.error(`Contact webhook returned ${webhookResponse.status}.`);
      return json({ error: 'The message did not make it through. Please try again.' }, 502);
    }
  } catch (error) {
    console.error('Contact webhook request failed.', error instanceof Error ? error.message : error);
    return json({ error: 'The message did not make it through. Please try again.' }, 502);
  }

  return json({ ok: true });
};
