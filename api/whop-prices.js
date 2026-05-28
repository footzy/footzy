export const config = { runtime: 'edge' };

export default async function handler(req) {
  const apiKey = process.env.WHOP_API_KEY;

  const plans = {
    premium:          process.env.VITE_WHOP_PLAN_PREMIUM,
    change_vainqueur: process.env.VITE_WHOP_PLAN_CHANGE_VAINQUEUR,
    groupe_action:    process.env.VITE_WHOP_PLAN_GROUPE_ACTION,
  };

  const prices = {};

  // Si pas de clé API, retourner objet vide (l'app utilisera les fallbacks)
  if (!apiKey) {
    return new Response(JSON.stringify(prices), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' }
    });
  }

  await Promise.all(
    Object.entries(plans).map(async ([key, planId]) => {
      if (!planId || planId === key) return;
      try {
        const res = await fetch(`https://api.whop.com/v5/plans/${planId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!res.ok) return;
        const json = await res.json();
        const data = json.data ?? json;
        // Whop retourne le prix en centimes (base_currency_price)
        const cents = data.base_currency_price ?? data.price_cents ?? data.amount ?? null;
        if (cents !== null) prices[key] = cents;
      } catch {}
    })
  );

  return new Response(JSON.stringify(prices), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' }
  });
}
