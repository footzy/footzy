import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('defis_quotidiens')
    .select('id, question, reponses, difficulte')
    .eq('date', today)
    .maybeSingle();

  if (!data) return new Response(JSON.stringify({ defi: null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

  return new Response(JSON.stringify({ defi: data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' }
  });
}
