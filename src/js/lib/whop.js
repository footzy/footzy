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

// ── Prix dynamiques depuis Whop ───────────────────────────
let _planPrices = null;

export async function loadPlanPrices() {
  if (_planPrices) return _planPrices;
  try {
    const res = await fetch('/api/whop-prices');
    if (res.ok) {
      const data = await res.json();
      if (Object.keys(data).length > 0) { _planPrices = data; return _planPrices; }
    }
  } catch {}
  _planPrices = { premium: 999, change_vainqueur: 199, groupe_action: 199 };
  return _planPrices;
}

export function formatPrice(cents) {
  if (cents == null) return '…';
  return (cents / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }) + ' €';
}

export async function checkPremiumAccess(profile) {
  if (!profile) return false;
  if (profile.plan !== 'premium') return false;
  if (profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date()) return false;
  return true;
}

// ── Script Whop ───────────────────────────────────────────
let _scriptLoaded = false;

function loadWhopScript() {
  if (_scriptLoaded) return Promise.resolve();
  return new Promise(resolve => {
    const s = document.createElement('script');
    s.src    = 'https://js.whop.com/static/checkout/loader.js';
    s.async  = true;
    s.defer  = true;
    s.onload  = () => { _scriptLoaded = true; resolve(); };
    s.onerror = () => resolve();
    document.head.appendChild(s);
  });
}

// ── Checkout redirect Whop ────────────────────────────────
export async function createCheckout(planId, footzyUserId, userEmail = '', metadata = {}) {
  const returnUrl = `${window.location.origin}/src/pages/payment-success.html?uid=${encodeURIComponent(footzyUserId)}`;

  const checkoutUrl = new URL(`https://whop.com/checkout/${planId}/`);
  checkoutUrl.searchParams.set('d', returnUrl);
  if (userEmail) checkoutUrl.searchParams.set('email', userEmail);

  window.location.href = checkoutUrl.toString();
}

/* ── ANCIENNE VERSION EMBED (backup) ────────────────────────
export async function createCheckout_EMBED(planId, footzyUserId, userEmail = '', metadata = {}) {
  document.getElementById('fz-checkout-modal')?.remove();

  const returnUrl = `${window.location.origin}/src/pages/payment-success.html?uid=${encodeURIComponent(footzyUserId)}`;


  const modal = document.createElement('div');
  modal.id = 'fz-checkout-modal';
  modal.style.cssText = [
    'position:fixed;inset:0;z-index:99999',
    'background:rgba(0,0,0,0.55);backdrop-filter:blur(6px)',
    'display:flex;align-items:flex-end;justify-content:center',
  ].join(';');

  modal.innerHTML = `
    <style>
      @keyframes fzSlideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
      #fz-checkout-inner { animation: fzSlideUp .28s cubic-bezier(.32,.72,0,1); }
      @keyframes fzSpin { to { transform: rotate(360deg); } }
    </style>

    <div id="fz-checkout-inner" style="
      background: #fff;
      border-radius: 20px 20px 0 0;
      width: 100%; max-width: 480px;
      max-height: 94vh;
      display: flex; flex-direction: column;
      overflow: hidden;
    ">

      <!-- Barre minimale : handle centré + bouton fermer à droite -->
      <div style="
        display:flex; align-items:center; justify-content:space-between;
        padding: 10px 14px 6px; flex-shrink:0;
      ">
        <div style="width:28px"></div>
        <div style="width:36px;height:4px;border-radius:4px;background:rgba(0,0,0,0.15)"></div>
        <button id="fz-checkout-close" style="
          width:28px;height:28px;border-radius:50%;border:none;
          background:rgba(0,0,0,0.08);color:#555;font-size:18px;
          cursor:pointer;display:flex;align-items:center;justify-content:center;
          line-height:1;
        ">×</button>
      </div>

      <!-- Corps scrollable -->
      <div id="fz-checkout-body" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;min-height:0">

        <!-- Loader -->
        <div id="fz-checkout-loader" style="
          padding:56px 20px; display:flex; flex-direction:column;
          align-items:center; gap:14px;
        ">
          <div style="
            width:36px;height:36px;border-radius:50%;
            border:3px solid rgba(0,0,0,0.08);border-top-color:#333;
            animation:fzSpin .8s linear infinite;
          "></div>
          <div style="font-size:14px;font-weight:600;color:#333">Chargement du paiement…</div>
        </div>

        <div
          id="fz-whop-checkout-mount"
          data-whop-checkout-plan-id="${planId}"
          data-whop-checkout-return-url="${returnUrl}"
          data-whop-checkout-metadata='{"footzy_user_id":"${footzyUserId}"}'
          ${userEmail ? `data-whop-checkout-prefill-email="${userEmail}"` : ''}
          data-whop-checkout-on-complete="fzWhopCheckoutComplete"
          style="display:none"
        ></div>

      </div>
    </div>`;

  document.body.appendChild(modal);

  // Fermeture
  const close = () => modal.remove();
  document.getElementById('fz-checkout-close').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  await loadWhopScript();

  setTimeout(() => {
    const loader = document.getElementById('fz-checkout-loader');
    const mount  = document.getElementById('fz-whop-checkout-mount');
    if (loader) loader.style.display = 'none';
    if (mount)  mount.style.display  = 'block';

    // Fallback après 10s si le form n'a pas monté
    setTimeout(() => {
      if (!document.getElementById('fz-checkout-modal')) return;
      const hasContent = mount && (mount.childNodes.length > 0 || mount.shadowRoot);
      if (!hasContent) {
        const loader = document.getElementById('fz-checkout-loader');
        if (loader) {
          loader.innerHTML = `
            <div style="font-size:15px;font-weight:700;color:#333;text-align:center">Impossible de charger<br>le paiement 😕</div>
            <div style="font-size:13px;color:#666;text-align:center;margin-top:4px">Vérifiez votre connexion et réessayez.</div>
            <button id="fz-retry-btn" style="
              margin-top:14px;padding:10px 22px;border-radius:10px;border:none;
              background:#333;color:#fff;font-size:14px;font-weight:700;cursor:pointer;
            ">Réessayer</button>
          `;
          loader.style.display = 'flex';
          document.getElementById('fz-retry-btn')?.addEventListener('click', () => {
            modal.remove();
            createCheckout(planId, footzyUserId, userEmail, metadata);
          });
        }
      }
    }, 10000);
  }, 350);

  // ── Détection du succès de paiement ─────────────────────
  function redirectSuccess() {
    if (!document.getElementById('fz-checkout-modal')) return;
    window.removeEventListener('message', onMsg);
    clearInterval(_pollCheckout);
    delete window.fzWhopCheckoutComplete;
    modal.remove();
    window.location.href = returnUrl;
  }

  // 1) Callback officiel Whop (data-whop-checkout-on-complete)
  //    Appelé par le SDK Whop avec (planId, receiptId) dès que le paiement est validé
  window.fzWhopCheckoutComplete = (_pId, _receiptId) => {
    redirectSuccess();
  };

  // 2) postMessage depuis Whop / Apple / Stripe (backup)
  function onMsg(e) {
    const origin = String(e.origin);
    if (!origin.includes('whop') && !origin.includes('apple') && !origin.includes('stripe')) return;
    const d = e.data;
    if (!d) return;
    const ok =
      d?.type === 'checkout.complete'   || d?.type === 'checkout_completed' ||
      d?.type === 'payment.success'     || d?.type === 'payment_success'    ||
      d?.type === 'purchase.completed'  || d?.type === 'CHECKOUT_COMPLETE'  ||
      d?.status === 'success'           || d?.status === 'completed'        ||
      d?.event === 'checkout.complete'  || d?.event === 'purchase_completed'||
      (typeof d?.type === 'string' && (d.type.includes('success') || d.type.includes('complete')));
    if (ok) redirectSuccess();
  }
  window.addEventListener('message', onMsg);

  // 3) Poll Supabase en backup (Apple Pay ne fire pas toujours les events)
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
        const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: achats } = await supabase.from('achats_boost')
          .select('id').eq('user_id', user.id).gte('created_at', since).limit(1);
        if (achats?.length) { clearInterval(_pollCheckout); redirectSuccess(); }
      }
    } catch {}
  }, 3000);
}
── FIN BACKUP ─────────────────────────────────────────── */
