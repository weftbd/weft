import crypto from 'crypto';

export interface MetaUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
  externalId?: string;
}

export interface MetaCapiEventPayload {
  eventName: string; // e.g. 'Purchase', 'InitiateCheckout', 'OrderConfirmed', 'OrderCancelled', etc.
  eventId: string; // Critical for deduplication with browser pixel
  eventTime?: number; // Unix timestamp in seconds
  eventSourceUrl?: string;
  actionSource?: 'website' | 'system_generated' | 'app';
  userData: MetaUserData;
  customData?: Record<string, any>;
}

// In-memory set to prevent duplicate server CAPI dispatches for the same eventId
const dispatchedCapiEventIds = new Set<string>();

/**
 * SHA256 Hash helper (Meta CAPI requirement for PII)
 */
export function hashSha256(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const clean = value.trim().toLowerCase();
  if (!clean) return undefined;
  return crypto.createHash('sha256').update(clean).digest('hex');
}

/**
 * Normalize Bangladeshi / International phone number to digits-only E.164 format
 */
export function normalizePhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('01') && digits.length === 11) {
    digits = '88' + digits;
  }
  return digits;
}

/**
 * Format user data object for Meta Graph API
 */
export function formatUserDataForMeta(userData: MetaUserData): Record<string, any> {
  const formatted: Record<string, any> = {};

  if (userData.phone) {
    const normPh = normalizePhone(userData.phone);
    if (normPh) formatted.ph = [hashSha256(normPh)];
  }

  if (userData.email) {
    formatted.em = [hashSha256(userData.email)];
  }

  if (userData.firstName) {
    formatted.fn = [hashSha256(userData.firstName)];
  }

  if (userData.lastName) {
    formatted.ln = [hashSha256(userData.lastName)];
  }

  if (userData.city) {
    formatted.ct = [hashSha256(userData.city)];
  }

  formatted.country = [hashSha256('bd')];

  if (userData.clientIpAddress) {
    formatted.client_ip_address = userData.clientIpAddress;
  }

  if (userData.clientUserAgent) {
    formatted.client_user_agent = userData.clientUserAgent;
  }

  if (userData.fbp) {
    formatted.fbp = userData.fbp;
  }

  if (userData.fbc) {
    formatted.fbc = userData.fbc;
  }

  if (userData.externalId) {
    formatted.external_id = [hashSha256(userData.externalId)];
  }

  return formatted;
}

/**
 * Send event to Meta Conversions API
 */
export async function sendMetaCapiEvent(
  payload: MetaCapiEventPayload
): Promise<{ success: boolean; events_received?: number; fbtrace_id?: string; error?: string; skipped?: boolean }> {
  const pixelId = process.env.META_PIXEL_ID || '1005176032544398';
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  const apiVersion = process.env.META_API_VERSION || 'v19.0';
  const testEventCode = process.env.META_TEST_EVENT_CODE;

  // Deduplication check
  if (payload.eventId) {
    if (dispatchedCapiEventIds.has(payload.eventId)) {
      console.log(`[Meta CAPI] Skipped duplicate event: ${payload.eventName} (eventId: ${payload.eventId})`);
      return { success: true, skipped: true };
    }
    dispatchedCapiEventIds.add(payload.eventId);
  }

  const eventTime = payload.eventTime || Math.floor(Date.now() / 1000);
  const formattedUserData = formatUserDataForMeta(payload.userData);

  const eventItem: Record<string, any> = {
    event_name: payload.eventName,
    event_time: eventTime,
    event_id: payload.eventId,
    action_source: payload.actionSource || 'website',
    event_source_url: payload.eventSourceUrl || 'https://weftbd.com',
    user_data: formattedUserData,
    custom_data: payload.customData || {},
  };

  const capiBody: Record<string, any> = {
    data: [eventItem],
  };

  if (testEventCode) {
    capiBody.test_event_code = testEventCode;
  }

  console.log(`[Meta CAPI] Dispatching ${payload.eventName} (event_id: ${payload.eventId})`);

  if (!accessToken) {
    console.log(
      `[Meta CAPI] Notice: META_CAPI_ACCESS_TOKEN is not configured in .env. Event logged safely without outbound request:`,
      JSON.stringify(eventItem, null, 2)
    );
    return {
      success: true,
      events_received: 1,
      skipped: false,
    };
  }

  try {
    const url = `https://graph.facebook.com/${apiVersion}/${pixelId}/events?access_token=${encodeURIComponent(
      accessToken
    )}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(capiBody),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`[Meta CAPI] Error response from Meta:`, result);
      return {
        success: false,
        error: result.error?.message || 'Meta CAPI request failed',
      };
    }

    console.log(
      `[Meta CAPI] Success: ${payload.eventName} sent (events_received: ${result.events_received}, trace: ${result.fbtrace_id})`
    );

    return {
      success: true,
      events_received: result.events_received,
      fbtrace_id: result.fbtrace_id,
    };
  } catch (err: any) {
    console.error(`[Meta CAPI] Network error sending event:`, err);
    return {
      success: false,
      error: err.message,
    };
  }
}
