import { buildPushPayload } from "@block65/webcrypto-web-push";

type Admin = (typeof import("@/integrations/supabase/client.server"))["supabaseAdmin"];

export interface PushResult {
  total: number;
  sent: number;
  failed: number;
  expired: number;
}

/** Sends the same generic message to every active subscription. Never throws. */
export async function sendPushToAll(
  admin: Admin,
  msg: { title: string; body: string; url: string },
): Promise<PushResult> {
  const result: PushResult = { total: 0, sent: 0, failed: 0, expired: 0 };
  const publicKey = process.env["VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  if (!publicKey || !privateKey) return result;
  const { data: subs } = await admin.from("push_subscriptions").select("*").eq("status", "active");
  result.total = subs?.length ?? 0;
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        const payload = await buildPushPayload(
          { data: JSON.stringify(msg), options: { ttl: 86400, urgency: "high" } },
          { endpoint: s.endpoint, expirationTime: null, keys: { p256dh: s.p256dh, auth: s.auth } },
          { subject: "mailto:longphu-gym-buddy@example.com", publicKey, privateKey },
        );
        const res = await fetch(s.endpoint, payload);
        if (res.ok) {
          result.sent++;
          await admin.from("push_subscriptions").update({ last_success_at: new Date().toISOString(), last_error: null }).eq("id", s.id);
        } else if (res.status === 404 || res.status === 410) {
          result.expired++;
          await admin.from("push_subscriptions").update({ status: "expired", last_error: `HTTP ${res.status}` }).eq("id", s.id);
        } else {
          result.failed++;
          await admin.from("push_subscriptions").update({ last_error: `HTTP ${res.status}` }).eq("id", s.id);
        }
      } catch (e) {
        result.failed++;
        console.error("push failed", e);
      }
    }),
  );
  return result;
}
