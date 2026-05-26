import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

async function verifyHmac(secret, body, signature) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return expected === signature;
}

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const body = await req.text();
  const signature = req.headers.get('whop-signature');

  const valid = await verifyHmac(process.env.WHOP_WEBHOOK_SECRET, body, signature);
  if (!valid) {
    return new Response('Invalid signature', { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (event.type === 'payment.succeeded') {
    const { user_id, plan_id, amount, transaction_id, metadata } = event.data;

    if (plan_id === 'mid_monthly' || plan_id === 'mid_cdm') {
      const expires = plan_id === 'mid_monthly'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : new Date('2026-07-19T23:59:59Z');

      const { error } = await supabase
        .from('profiles')
        .update({
          plan: 'mid',
          plan_expires_at: expires.toISOString(),
          whop_user_id: user_id
        })
        .eq('id', metadata.footzy_user_id);

      if (error) return new Response('DB error: ' + error.message, { status: 500 });
    }

    else if (plan_id.startsWith('boost_')) {
      const boostType = plan_id.replace('boost_', '').split('_')[0];

      const { data: existing } = await supabase
        .from('achats_boost')
        .select('id')
        .eq('whop_transaction_id', transaction_id)
        .maybeSingle();

      if (existing) return new Response('Already processed', { status: 200 });

      const { error: insertError } = await supabase.from('achats_boost').insert({
        user_id: metadata.footzy_user_id,
        match_id: metadata.match_id,
        pronostic_id: metadata.pronostic_id || null,
        type: boostType,
        prix_centimes: amount,
        whop_transaction_id: transaction_id,
        applique: true
      });

      if (insertError) return new Response('DB error: ' + insertError.message, { status: 500 });

      if ((boostType === 'x2' || boostType === 'boost_buteur') && metadata.pronostic_id) {
        await supabase
          .from('pronostics')
          .update({ boost: boostType })
          .eq('id', metadata.pronostic_id)
          .eq('user_id', metadata.footzy_user_id);
      }
    }
  }

  return new Response('OK', { status: 200 });
}
