// ── Plans ────────────────────────────────────────────────
export const PLANS = {
  premium:          import.meta.env.VITE_WHOP_PLAN_PREMIUM          || 'premium',
  change_vainqueur: import.meta.env.VITE_WHOP_PLAN_CHANGE_VAINQUEUR || 'change_vainqueur',
  groupe_action:    import.meta.env.VITE_WHOP_PLAN_GROUPE_ACTION     || 'groupe_action',
};

export const BOOST_PRICES = {
  x2:           { 'j-24h': 99,  'j-1h': 149, live: 199 },
  joker:        { 'j-24h': 99,  'j-1h': 149, live: 199 },
  malus:        { 'j-24h': 99,  'j-1h': 149, live: 199 },
  boost_buteur: { 'j-24h': 99,  'j-1h': 149, live: 199 },
};

export function getBoostTiming(kickoffAt) {
  const now = Date.now();
  const kickoff = new Date(kickoffAt).getTime();
  const diff = kickoff - now;
  if (diff > 60 * 60 * 1000) return 'j-24h';
  if (diff > 0) return 'j-1h';
  return 'live';
}

export function getBoostPrice(type, kickoffAt) {
  const timing = getBoostTiming(kickoffAt);
  return BOOST_PRICES[type]?.[timing] ?? 199;
}

export async function checkPremiumAccess(profile) {
  if (!profile) return false;
  if (profile.plan !== 'premium') return false;
  if (profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date()) return false;
  return true;
}

// ── Checkout : overlay de transition + redirection Whop ──
export function createCheckout(planId, footzyUserId, metadata = {}) {
  const params = new URLSearchParams({
    d: planId,
    metadata: JSON.stringify({ footzy_user_id: footzyUserId, ...metadata }),
    redirect_url: `${window.location.origin}/src/pages/payment-success.html`,
  });
  const checkoutUrl = `https://whop.com/checkout/?${params.toString()}`;

  // Overlay de transition
  const overlay = document.createElement('div');
  overlay.id = 'fz-checkout-transition';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;animation:fzFadeIn .15s ease';
  overlay.innerHTML = `
    <style>@keyframes fzFadeIn{from{opacity:0}to{opacity:1}}@keyframes fzSpin{to{transform:rotate(360deg)}}</style>
    <div style="font-size:48px">💳</div>
    <div style="font-size:17px;font-weight:800;letter-spacing:-0.02em;color:var(--fg)">Paiement sécurisé</div>
    <div style="font-size:13px;color:var(--fg-faint)">Redirection vers Whop…</div>
    <div style="display:flex;gap:8px;margin-top:4px">
      <span style="font-size:20px">🍎</span>
      <span style="font-size:20px">🌐</span>
      <span style="font-size:20px">💳</span>
    </div>
    <div style="width:36px;height:36px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:fzSpin .8s linear infinite;margin-top:8px"></div>`;

  document.body.appendChild(overlay);
  setTimeout(() => { window.location.href = checkoutUrl; }, 700);
}
