// Amadeus 프록시 — mode=metrics(과거 가격분포) | mode=offers(현재 최저가). 시크릿은 서버에만.
export default {
  async fetch(req, env) {
    const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,OPTIONS', 'Access-Control-Allow-Headers':'*' };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const J = (o, s=200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type':'application/json' } });
    try {
      const u = new URL(req.url), p = u.searchParams;
      const o = p.get('origin'), d = p.get('destination'), date = p.get('date');
      const cur = p.get('currency') || 'KRW', mode = p.get('mode') || 'metrics';
      const oneWay = p.get('oneWay') === 'true', ret = p.get('returnDate') || '';
      const adt = p.get('adults') || '1', chd = p.get('children') || '0', inf = p.get('infants') || '0';
      if (!o || !d || !date) return J({ error: 'origin, destination, date 필요' }, 400);
      if (!env.AMADEUS_ID || !env.AMADEUS_SECRET) return J({ error: 'Amadeus 키 미설정' }, 503);
      const base = env.AMADEUS_BASE || 'https://test.api.amadeus.com';
      const tr = await fetch(base + '/v1/security/oauth2/token', {
        method: 'POST', headers: { 'Content-Type':'application/x-www-form-urlencoded' },
        body: `grant_type=client_credentials&client_id=${encodeURIComponent(env.AMADEUS_ID)}&client_secret=${encodeURIComponent(env.AMADEUS_SECRET)}`
      });
      const tk = await tr.json();
      if (!tk.access_token) return J({ error: 'token 실패', detail: tk }, 502);
      const auth = { Authorization: 'Bearer ' + tk.access_token };
      let url;
      if (mode === 'offers') {
        let q = `originLocationCode=${o}&destinationLocationCode=${d}&departureDate=${date}&adults=${adt}&currencyCode=${cur}&max=8&nonStop=false`;
        if (!oneWay && ret) q += `&returnDate=${ret}`;
        if (+chd > 0) q += `&children=${chd}`;
        if (+inf > 0) q += `&infants=${inf}`;
        url = base + '/v2/shopping/flight-offers?' + q;
      } else {
        url = base + `/v1/analytics/itinerary-price-metrics?originIataCode=${o}&destinationIataCode=${d}&departureDate=${date}&currencyCode=${cur}&oneWay=${oneWay}`;
      }
      const r = await fetch(url, { headers: auth });
      const data = await r.json();
      return J(data, r.status);
    } catch (e) { return J({ error: String(e) }, 500); }
  }
};
