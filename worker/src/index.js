// Travelpayouts 프록시 — 노선 현재 최저가 + 이번 달 가격 분포. 토큰은 서버에만.
// GET ?origin=ICN&destination=NRT&date=2026-08-20[&returnDate=2026-08-27&oneWay=false]&currency=KRW
export default {
  async fetch(req, env) {
    const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,OPTIONS', 'Access-Control-Allow-Headers':'*' };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const J = (o, s=200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type':'application/json' } });
    try {
      const p = new URL(req.url).searchParams;
      const o = p.get('origin'), d = p.get('destination'), date = p.get('date');
      const cur = (p.get('currency') || 'KRW').toLowerCase();
      const oneWay = p.get('oneWay') === 'true', ret = p.get('returnDate') || '';
      if (!o || !d || !date) return J({ error: 'origin, destination, date 필요' }, 400);
      if (!env.TP_TOKEN) return J({ error: 'Travelpayouts 토큰 미설정' }, 503);
      const month = date.slice(0, 7);
      let url = `https://api.travelpayouts.com/aviasales/v3/prices_for_dates?origin=${o}&destination=${d}`
        + `&departure_at=${month}&currency=${cur}&sorting=price&direct=false&limit=1000&one_way=${oneWay ? 'true' : 'false'}&token=${env.TP_TOKEN}`;
      if (!oneWay && ret) url += `&return_at=${ret.slice(0, 7)}`;
      const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const data = await r.json();
      if (data && data.error) return J({ error: data.error }, 502);
      const rows = (data && data.data) || [];
      const prices = rows.map(x => +x.price).filter(Boolean).sort((a, b) => a - b);
      let dist = null;
      if (prices.length) { const q = f => prices[Math.min(prices.length - 1, Math.round(f * (prices.length - 1)))];
        dist = { min: prices[0], q1: q(.25), med: q(.5), q3: q(.75), max: prices[prices.length - 1] }; }
      const dayRows = rows.filter(x => String(x.departure_at || '').slice(0, 10) === date);
      const pick = dayRows.length ? dayRows : rows;
      let current = null, airline = '';
      if (pick.length) { let b = pick[0]; pick.forEach(x => { if (+x.price < +b.price) b = x; }); current = +b.price; airline = b.airline || ''; }
      return J({ current, airline, currency: cur.toUpperCase(), dist, exact: dayRows.length > 0, count: rows.length });
    } catch (e) { return J({ error: String(e) }, 500); }
  }
};
