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

// ── Checkout popup avec embed Whop ───────────────────────
let _scriptLoaded = false;

function loadWhopScript() {
  if (_scriptLoaded) return Promise.resolve();
  return new Promise(resolve => {
    const s = document.createElement('script');
    s.src   = 'https://js.whop.com/static/checkout/loader.js';
    s.async = true;
    s.defer = true;
    s.onload = () => { _scriptLoaded = true; resolve(); };
    s.onerror = () => resolve(); // continuer même si le script échoue
    document.head.appendChild(s);
  });
}

export async function createCheckout(planId, footzyUserId, metadata = {}) {
  document.getElementById('fz-checkout-modal')?.remove();

  // Encoder userId dans le return URL comme fallback d'identification
  const returnUrl = `${window.location.origin}/src/pages/payment-success.html?uid=${encodeURIComponent(footzyUserId)}`;

  // ── Créer le modal ──
  const modal = document.createElement('div');
  modal.id = 'fz-checkout-modal';
  modal.style.cssText = [
    'position:fixed;inset:0;z-index:99999',
    'background:rgba(15,15,14,0.75);backdrop-filter:blur(8px)',
    'display:flex;align-items:flex-end;justify-content:center',
    'animation:fzFadeIn .18s ease',
  ].join(';');

  modal.innerHTML = `
    <style>
      @keyframes fzFadeIn  { from{opacity:0} to{opacity:1} }
      @keyframes fzSlideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
      #fz-checkout-inner { animation: fzSlideUp .28s cubic-bezier(.32,.72,0,1); }
      #fz-checkout-inner [data-whop-checkout-plan-id] { min-height: 400px; }
    </style>
    <div id="fz-checkout-inner" style="
      background: #0F0F0E;
      border-radius: 28px 28px 0 0;
      width: 100%; max-width: 480px;
      max-height: 92vh;
      display: flex; flex-direction: column;
      overflow: hidden;
    ">
      <!-- Handle + close -->
      <div style="padding:12px 20px 8px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;border-bottom:1px solid rgba(255,255,255,0.08)">
        <div style="width:36px;height:4px;background:rgba(255,255,255,0.15);border-radius:4px;margin:0 auto;position:absolute;left:50%;transform:translateX(-50%)"></div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:16px">💳</span>
          <span style="font-size:14px;font-weight:700;color:#fff">Paiement sécurisé</span>
        </div>
        <button id="fz-checkout-close" style="
          background:rgba(255,255,255,0.08);border:none;border-radius:50%;
          width:30px;height:30px;color:#999;font-size:20px;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
        ">×</button>
      </div>

      <!-- Zone checkout Whop -->
      <div id="fz-checkout-body" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch">
        <!-- Loader pendant le chargement du script -->
        <div id="fz-checkout-loader" style="
          padding:60px 20px;text-align:center;
          display:flex;flex-direction:column;align-items:center;gap:14px;
        ">
          <div style="font-size:36px">💳</div>
          <div style="font-size:15px;font-weight:700;color:#fff">Chargement...</div>
          <div style="font-size:12px;color:#666">Apple Pay · Google Pay · Carte</div>
        </div>

        <!-- Div mountée par le script Whop -->
        <div
          id="fz-whop-checkout-mount"
          data-whop-checkout-plan-id="${planId}"
          data-whop-checkout-return-url="${returnUrl}"
          style="display:none"
        ></div>
      </div>
    </div>`;

  document.body.appendChild(modal);

  // Fermeture
  const close = () => modal.remove();
  document.getElementById('fz-checkout-close').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  // Charger le script Whop puis révéler le mount
  await loadWhopScript();

  // Laisser le script parser le DOM
  setTimeout(() => {
    const loader = document.getElementById('fz-checkout-loader');
    const mount  = document.getElementById('fz-whop-checkout-mount');
    if (loader) loader.style.display = 'none';
    if (mount)  mount.style.display  = 'block';

    // Si après 6s le formulaire n'est toujours pas monté → fallback redirect
    setTimeout(() => {
      if (!document.getElementById('fz-checkout-modal')) return;
      const hasForm = mount?.querySelector('input, iframe, form');
      if (!hasForm) {
        modal.remove();
        const params = new URLSearchParams({
          d: planId,
          metadata: JSON.stringify({ footzy_user_id: footzyUserId, ...metadata }),
          redirect_url: returnUrl,
        });
        window.location.href = `https://whop.com/checkout/?${params.toString()}`;
      }
    }, 6000);
  }, 300);

  // Écouter la complétion via postMessage
  window.addEventListener('message', function onMsg(e) {
    if (!String(e.origin).includes('whop')) return;
    const d = e.data;
    if (d?.type === 'checkout.complete' || d?.status === 'success') {
      window.removeEventListener('message', onMsg);
      modal.remove();
      window.location.href = returnUrl;
    }
  });
}
