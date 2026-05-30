/**
 * /api/push-subscribe — Sauvegarde la subscription push d'un user
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).end();

  const { subscription, userId } = req.body;
  if (!subscription || !userId) return res.status(400).json({ error: 'missing params' });

  // Upsert la subscription (un user peut avoir plusieurs appareils)
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id:      userId,
    endpoint:     subscription.endpoint,
    p256dh:       subscription.keys?.p256dh,
    auth:         subscription.keys?.auth,
    updated_at:   new Date().toISOString(),
  }, { onConflict: 'endpoint' });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
}
