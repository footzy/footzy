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
  const expected = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  return expected === signature;
}

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const body = await req.text();
  const signature = req.headers.get('whop-signature');

  const valid = await verifyHmac(process.env.WHOP_WEBHOOK_SECRET, body, signature);
  if (!valid) return new Response('Invalid signature', { status: 401 });

  let event;
  try { event = JSON.parse(body); }
  catch { return new Response('Invalid JSON', { status: 400 }); }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const PLAN_PREMIUM          = process.env.VITE_WHOP_PLAN_PREMIUM;
  const PLAN_CHANGE_VAINQUEUR = process.env.VITE_WHOP_PLAN_CHANGE_VAINQUEUR;

  // ── membership.went_valid → abonnement Premium activé ──
  if (event.action === 'membership.went_valid') {
    const { user_id, product_id, metadata } = event.data;
    const footzyUserId = metadata?.footzy_user_id;

    if (product_id === PLAN_PREMIUM && footzyUserId) {
      // Premium : pas d'expiration fixe (Whop gère les renouvellements)
      const { error } = await supabase
        .from('profiles')
        .update({
          plan: 'premium',
          plan_expires_at: null,
          whop_user_id: user_id,
        })
        .eq('id', footzyUserId);

      if (error) return new Response('DB error: ' + error.message, { status: 500 });
    }
  }

  // ── membership.went_invalid → abonnement expiré/annulé ──
  if (event.action === 'membership.went_invalid') {
    const { product_id, metadata } = event.data;
    const footzyUserId = metadata?.footzy_user_id;

    if (product_id === PLAN_PREMIUM && footzyUserId) {
      await supabase
        .from('profiles')
        .update({ plan: 'free', plan_expires_at: null })
        .eq('id', footzyUserId);
    }
  }

  // ── payment.succeeded → paiement one-time (change vainqueur, boosts) ──
  if (event.action === 'payment.succeeded') {
    const { user_id, product_id, amount, transaction_id, metadata } = event.data;
    const footzyUserId = metadata?.footzy_user_id;

    // Changement de pronostic vainqueur (1,99€)
    if (product_id === PLAN_CHANGE_VAINQUEUR && footzyUserId) {
      // Le flag localStorage côté client gère l'ouverture du modal.
      // On log juste la transaction pour éviter les doublons.
      const { data: existing } = await supabase
        .from('achats_boost')
        .select('id')
        .eq('whop_transaction_id', transaction_id)
        .maybeSingle();

      if (!existing) {
        await supabase.from('achats_boost').insert({
          user_id: footzyUserId,
          match_id: null,
          type: 'change_vainqueur',
          prix_centimes: amount,
          whop_transaction_id: transaction_id,
          applique: true,
        });
      }
    }

    // Boosts (x2, joker, malus, boost_buteur)
    else if (product_id?.startsWith('boost_')) {
      const boostType = product_id.replace('boost_', '').split('_')[0];

      const { data: existing } = await supabase
        .from('achats_boost')
        .select('id')
        .eq('whop_transaction_id', transaction_id)
        .maybeSingle();

      if (existing) return new Response('Already processed', { status: 200 });

      await supabase.from('achats_boost').insert({
        user_id: footzyUserId,
        match_id: metadata?.match_id,
        pronostic_id: metadata?.pronostic_id || null,
        type: boostType,
        prix_centimes: amount,
        whop_transaction_id: transaction_id,
        applique: true,
      });

      if ((boostType === 'x2' || boostType === 'boost_buteur') && metadata?.pronostic_id) {
        await supabase
          .from('pronostics')
          .update({ boost: boostType })
          .eq('id', metadata.pronostic_id)
          .eq('user_id', footzyUserId);
      }
    }
  }

  return new Response('OK', { status: 200 });
}
