// Amadeus 가격분석 프록시 (시크릿은 서버에만) — /price-metrics 대체 루트: ?origin&destination&date&currency&oneWay
export default {
  async fetch(req, env) {
    const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,OPTIONS', 'Access-Control-Allow-Headers':'*' };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const J = (o, s=200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type':'application/json' } });
    try {
      const u = new URL(req.url);
      const o = u.searchParams.get('origin'), d = u.searchParams.get('destination'), date = u.searchParams.get('date');
      const cur = u.searchParams.get('currency') || 'KRW', oneWay = u.searchParams.get('oneWay') || 'false';
      if (!o || !d || !date) return J({ error: 'origin, destination, date 필요' }, 400);
      if (!env.AMADEUS_ID || !env.AMADEUS_SECRET) return J({ error: 'Amadeus 키 미설정' }, 503);
      const base = env.AMADEUS_BASE || 'https://test.api.amadeus.com';
      const tr = await fetch(base + '/v1/security/oauth2/token', {
        method: 'POST', headers: { 'Content-Type':'application/x-www-form-urlencoded' },
        body: `grant_type=client_credentials&client_id=${encodeURIComponent(env.AMADEUS_ID)}&client_secret=${encodeURIComponent(env.AMADEUS_SECRET)}`
      });
      const tk = await tr.json();
      if (!tk.access_token) return J({ error: 'token 실패', detail: tk }, 502);
      const q = `originIataCode=${o}&destinationIataCode=${d}&departureDate=${date}&currencyCode=${cur}&oneWay=${oneWay}`;
      const r = await fetch(base + '/v1/analytics/itinerary-price-metrics?' + q, { headers: { Authorization: 'Bearer ' + tk.access_token } });
      const data = await r.json();
      return J(data, r.status);
    } catch (e) { return J({ error: String(e) }, 500); }
  }
};
