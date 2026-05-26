const WHOP_PUBLIC_KEY = import.meta.env.VITE_WHOP_PUBLIC_KEY;

export const PLANS = {
  mid_monthly: 'mid_monthly',
  mid_cdm: 'mid_cdm',
};

export const BOOST_PRICES = {
  x2: { 'j-24h': 99, 'j-1h': 149, live: 199 },
  joker: { 'j-24h': 99, 'j-1h': 149, live: 199 },
  malus: { 'j-24h': 99, 'j-1h': 149, live: 199 },
  boost_buteur: { 'j-24h': 99, 'j-1h': 149, live: 199 },
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

export async function createCheckout(planId, footzyUserId, metadata = {}) {
  const params = new URLSearchParams({
    d: planId,
    metadata: JSON.stringify({ footzy_user_id: footzyUserId, ...metadata }),
    redirect_url: `${window.location.origin}/src/pages/payment-success.html`,
  });
  window.location.href = `https://whop.com/checkout/?${params.toString()}`;
}

export async function checkMidAccess(profile) {
  if (!profile) return false;
  if (profile.plan !== 'mid') return false;
  if (profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date()) return false;
  return true;
}
