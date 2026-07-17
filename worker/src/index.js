// Travelpayouts 프록시. 토큰은 서버에만.
// 단일노선:  ?origin=ICN&destination=NRT&date=2026-08-20[&returnDate=..&oneWay=false]&currency=KRW
// 배치(특가): ?origin=KR&dests=NRT,KIX,BKK,..&oneWay=false&currency=KRW  → 도시별 날짜무관 최저가 랭킹
const TP = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates';

function distOf(rows) {
  const prices = rows.map(x => +x.price).filter(Boolean).sort((a, b) => a - b);
  if (!prices.length) return null;
  const q = f => prices[Math.min(prices.length - 1, Math.round(f * (prices.length - 1)))];
  return { min: prices[0], q1: q(.25), med: q(.5), q3: q(.75), max: prices[prices.length - 1] };
}
// 한 노선의 rows 가져오기. month 없으면 날짜무관(최저가 anytime).
async function fetchRows(env, { origin, dest, month, retMonth, oneWay, cur }) {
  let url = `${TP}?origin=${origin}&destination=${dest}&currency=${cur}`
    + `&sorting=price&direct=false&limit=1000&one_way=${oneWay ? 'true' : 'false'}&token=${env.TP_TOKEN}`;
  if (month) url += `&departure_at=${month}`;
  if (!oneWay && retMonth) url += `&return_at=${retMonth}`;
  const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
  const data = await r.json();
  if (data && data.error) throw new Error(data.error);
  return (data && data.data) || [];
}

export default {
  async fetch(req, env) {
    const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,OPTIONS', 'Access-Control-Allow-Headers':'*' };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const J = (o, s=200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type':'application/json' } });
    try {
      const p = new URL(req.url).searchParams;
      const cur = (p.get('currency') || 'KRW').toLowerCase();
      const oneWay = p.get('oneWay') === 'true';
      if (!env.TP_TOKEN) return J({ error: 'Travelpayouts 토큰 미설정' }, 503);

      // ── 배치 모드: 한국발(KR) → 여러 도시 날짜무관 최저가 ──
      const destsRaw = p.get('dests');
      if (destsRaw) {
        const origin = p.get('origin') || 'KR';
        const dests = [...new Set(destsRaw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean))].slice(0, 80);
        const cache = caches.default;
        async function oneDeal(dest) {
          const ckey = new Request(`https://tp-cache/deal?o=${origin}&d=${dest}&ow=${oneWay}&c=${cur}`);
          const hit = await cache.match(ckey);
          if (hit) return hit.json();
          let out = null;
          try {
            const rows = await fetchRows(env, { origin, dest, oneWay, cur });
            if (rows.length) {
              let b = rows[0]; rows.forEach(x => { if (+x.price < +b.price) b = x; });
              out = { dest, origin: b.origin || origin, price: +b.price, airline: b.airline || '',
                date: String(b.departure_at || '').slice(0, 10), dist: distOf(rows) };
            }
          } catch (e) { out = null; }
          const res = new Response(JSON.stringify(out), { headers: { 'Content-Type':'application/json', 'Cache-Control':'max-age=1800' } });
          await cache.put(ckey, res.clone());
          return res.json();
        }
        const deals = [];
        for (let i = 0; i < dests.length; i += 10) {
          const chunk = await Promise.all(dests.slice(i, i + 10).map(oneDeal));
          chunk.forEach(x => { if (x) deals.push(x); });
        }
        deals.sort((a, b) => a.price - b.price);
        return J({ deals, currency: cur.toUpperCase() });
      }

      // ── 단일노선 모드: 현재 최저가 + 분포 ──
      const o = p.get('origin'), d = p.get('destination'), date = p.get('date');
      const ret = p.get('returnDate') || '';
      if (!o || !d) return J({ error: 'origin, destination 필요' }, 400);
      const rows = await fetchRows(env, {
        origin: o, dest: d, cur, oneWay,
        month: date ? date.slice(0, 7) : '', retMonth: (!oneWay && ret) ? ret.slice(0, 7) : ''
      });
      const dist = distOf(rows);
      const dayRows = date ? rows.filter(x => String(x.departure_at || '').slice(0, 10) === date) : [];
      const pick = dayRows.length ? dayRows : rows;
      let current = null, airline = '', bestDate = '';
      if (pick.length) { let b = pick[0]; pick.forEach(x => { if (+x.price < +b.price) b = x; });
        current = +b.price; airline = b.airline || ''; bestDate = String(b.departure_at || '').slice(0, 10); }
      return J({ current, airline, bestDate, currency: cur.toUpperCase(), dist, exact: dayRows.length > 0, count: rows.length });
    } catch (e) { return J({ error: String(e) }, 500); }
  }
};
