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
      #fz-whop-checkout-mount { min-height: 400px; }
      /* Remonter le bouton Apple Pay au dessus du form Whop */
      #fz-checkout-body { display:flex; flex-direction:column; }
    </style>
    <div id="fz-checkout-inner" style="
      background: #0F0F0E;
      border-radius: 28px 28px 0 0;
      width: 100%; max-width: 480px;
      max-height: 96vh;
      display: flex; flex-direction: column;
      overflow: hidden;
    ">
      <!-- Handle bar -->
      <div style="padding:10px 0 0;flex-shrink:0;display:flex;justify-content:center">
        <div style="width:36px;height:4px;background:rgba(255,255,255,0.15);border-radius:4px"></div>
      </div>

      <!-- Header compact -->
      <div style="padding:10px 20px 10px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;border-bottom:1px solid rgba(255,255,255,0.08)">
        <span style="font-size:13px;font-weight:700;color:#fff;opacity:0.7">Paiement sécurisé 🔒</span>
        <button id="fz-checkout-close" style="
          background:rgba(255,255,255,0.08);border:none;border-radius:50%;
          width:28px;height:28px;color:#999;font-size:18px;cursor:pointer;
          display:flex;align-items:center;justify-content:center;line-height:1;
        ">×</button>
      </div>

      <!-- Zone checkout Whop — scroll complet -->
      <div id="fz-checkout-body" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch">

        <!-- Loader -->
        <div id="fz-checkout-loader" style="
          padding:60px 20px;text-align:center;
          display:flex;flex-direction:column;align-items:center;gap:14px;
        ">
          <div style="font-size:36px">💳</div>
          <div style="font-size:15px;font-weight:700;color:#fff">Chargement...</div>
          <div style="font-size:12px;color:#666">Apple Pay · Carte</div>
        </div>

        <!-- Mount Whop — le bouton Apple Pay apparaît en haut -->
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
    const body   = document.getElementById('fz-checkout-body');
    if (loader) loader.style.display = 'none';
    if (mount)  mount.style.display  = 'block';
    // Scroller tout en haut pour que Apple Pay soit visible
    if (body) body.scrollTop = 0;

    // Si après 6s le formulaire n'est toujours pas monté → fallback redirect
    setTimeout(() => {
      if (!document.getElementById('fz-checkout-modal')) return;
      const hasForm = mount?.querySelector('input, iframe, form');
      if (!hasForm) {
        modal.remove();
        window.location.href = `https://whop.com/checkout/${planId}?redirect_url=${encodeURIComponent(returnUrl)}`;
      }
    }, 6000);
  }, 300);

  // ── Redirection après paiement ───────────────────────────
  function redirectSuccess() {
    if (!document.getElementById('fz-checkout-modal')) return; // déjà fermé
    window.removeEventListener('message', onMsg);
    modal.remove();
    window.location.href = returnUrl;
  }

  // 1) postMessage Whop (tous formats possibles)
  function onMsg(e) {
    const origin = String(e.origin);
    if (!origin.includes('whop') && !origin.includes('apple') && !origin.includes('stripe')) return;
    const d = e.data;
    if (!d) return;

    const isComplete =
      d?.type === 'checkout.complete'     ||
      d?.type === 'checkout_completed'    ||
      d?.type === 'payment.success'       ||
      d?.type === 'payment_success'       ||
      d?.type === 'purchase.completed'    ||
      d?.type === 'CHECKOUT_COMPLETE'     ||
      d?.status === 'success'             ||
      d?.status === 'completed'           ||
      d?.event === 'checkout.complete'    ||
      d?.event === 'purchase_completed'   ||
      (typeof d?.type === 'string' && (d.type.includes('success') || d.type.includes('complete')));

    if (isComplete) redirectSuccess();
  }
  window.addEventListener('message', onMsg);

  // 2) Poll Supabase en backup — détecte si un achat apparaît en DB
  //    (couvre Apple Pay qui ne fire pas toujours de postMessage)
  let _pollCount = 0;
  const _pollCheckout = setInterval(async () => {
    _pollCount++;
    if (!document.getElementById('fz-checkout-modal') || _pollCount > 60) {
      clearInterval(_pollCheckout);
      return;
    }
    try {
      const { supabase } = await import('/src/js/lib/supabase.js');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (planId === PLANS.premium) {
        const { data: p } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
        if (p?.plan === 'premium') { clearInterval(_pollCheckout); redirectSuccess(); }
      } else {
        // Pour les paiements one-time : vérifier si un achat récent existe
        const since = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 min
        const { data: achats } = await supabase.from('achats_boost')
          .select('id').eq('user_id', user.id).gte('created_at', since).limit(1);
        if (achats?.length) { clearInterval(_pollCheckout); redirectSuccess(); }
      }
    } catch {}
  }, 3000);
}
