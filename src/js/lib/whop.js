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

// ── Checkout modal (popup in-app) ──────────────────────
export function createCheckout(planId, footzyUserId, metadata = {}) {
  const successUrl = `${window.location.origin}/src/pages/payment-success.html`;
  const params = new URLSearchParams({
    d: planId,
    metadata: JSON.stringify({ footzy_user_id: footzyUserId, ...metadata }),
    redirect_url: successUrl,
  });
  const checkoutUrl = `https://whop.com/checkout/?${params.toString()}`;

  // ── Supprimer un éventuel modal existant ──
  document.getElementById('fz-checkout-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'fz-checkout-modal';
  modal.style.cssText = [
    'position:fixed;inset:0;z-index:99999',
    'background:rgba(15,15,14,0.72);backdrop-filter:blur(6px)',
    'display:flex;align-items:flex-end;justify-content:center',
    'animation:fzFadeIn .2s ease',
  ].join(';');

  modal.innerHTML = `
    <style>
      @keyframes fzFadeIn  { from { opacity:0 } to { opacity:1 } }
      @keyframes fzSlideUp { from { transform:translateY(60px);opacity:0 } to { transform:translateY(0);opacity:1 } }
    </style>
    <div style="
      background:var(--bg-card);border-radius:28px 28px 0 0;
      width:100%;max-width:480px;
      height:88vh;display:flex;flex-direction:column;overflow:hidden;
      animation:fzSlideUp .28s cubic-bezier(.32,.72,0,1);
    ">
      <!-- Header -->
      <div style="
        padding:14px 20px;flex-shrink:0;
        display:flex;align-items:center;gap:10px;
        border-bottom:1px solid var(--border);
      ">
        <div style="width:36px;height:4px;background:var(--border);border-radius:4px;position:absolute;left:50%;transform:translateX(-50%);top:10px"></div>
        <span style="font-size:18px">💳</span>
        <span style="font-size:15px;font-weight:800;letter-spacing:-0.01em">Paiement sécurisé</span>
        <div style="flex:1"></div>
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--fg-faint);font-weight:600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          SSL
        </div>
        <button id="fz-checkout-close" style="
          background:var(--bg-card-2);border:1px solid var(--border);
          border-radius:50%;width:32px;height:32px;
          font-size:20px;cursor:pointer;color:var(--fg-muted);
          display:flex;align-items:center;justify-content:center;
          line-height:1;margin-left:6px;
        ">×</button>
      </div>

      <!-- Loader -->
      <div id="fz-checkout-loader" style="
        flex:1;display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:14px;
      ">
        <div style="font-size:40px">💳</div>
        <div style="font-size:14px;font-weight:700;color:var(--fg)">Chargement du paiement…</div>
        <div style="font-size:12px;color:var(--fg-faint)">Apple Pay · Google Pay · Carte bancaire</div>
      </div>

      <!-- iframe Whop checkout -->
      <iframe
        id="fz-checkout-iframe"
        src="${checkoutUrl}"
        allow="payment *; camera *"
        style="position:absolute;inset:0;top:61px;width:100%;height:calc(100% - 61px);border:none;display:none;border-radius:0 0 28px 28px"
      ></iframe>
    </div>`;

  document.body.appendChild(modal);

  // Montrer l'iframe dès qu'elle est chargée
  const iframe = modal.querySelector('#fz-checkout-iframe');
  iframe.addEventListener('load', () => {
    document.getElementById('fz-checkout-loader').style.display = 'none';
    iframe.style.display = 'block';
  });

  // Si l'iframe ne charge pas en 8s (X-Frame-Options bloqué) → fallback redirect
  const fallbackTimer = setTimeout(() => {
    if (iframe.style.display === 'none') {
      modal.remove();
      window.location.href = checkoutUrl;
    }
  }, 8000);

  // Fermeture
  const close = () => { clearTimeout(fallbackTimer); modal.remove(); };
  document.getElementById('fz-checkout-close').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  // Écouter la completion du paiement via postMessage
  window.addEventListener('message', function onMsg(e) {
    if (!e.origin.includes('whop.com')) return;
    const d = e.data;
    if (d?.type === 'checkout.complete' || d?.status === 'success' || d?.event === 'payment.succeeded') {
      clearTimeout(fallbackTimer);
      window.removeEventListener('message', onMsg);
      modal.remove();
      window.location.href = successUrl;
    }
  });
}
