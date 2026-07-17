// 항공특가 — 실데이터 링크 런처(네이버·스카이스캐너·카약) + Travelpayouts 가격분석
const BUILD = 'v6';
// Travelpayouts 프록시(Cloudflare Worker) URL — 배포 후 채워짐. 비어있으면 분석은 '설정 필요'로 표시.
const PROXY_URL = 'https://amadeus-proxy.junyoung-cha83.workers.dev';
const APP = document.getElementById('app');
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// [IATA, 한글, 국가]
const AIRPORTS = [
  ['ICN','인천','대한민국'],['GMP','김포','대한민국'],['PUS','부산(김해)','대한민국'],['CJU','제주','대한민국'],['TAE','대구','대한민국'],['KWJ','광주','대한민국'],['CJJ','청주','대한민국'],
  ['NRT','도쿄(나리타)','일본'],['HND','도쿄(하네다)','일본'],['KIX','오사카(간사이)','일본'],['FUK','후쿠오카','일본'],['CTS','삿포로','일본'],['OKA','오키나와','일본'],['NGO','나고야','일본'],['KOJ','가고시마','일본'],['KMJ','구마모토','일본'],['HIJ','히로시마','일본'],['SDJ','센다이','일본'],['KKJ','기타큐슈','일본'],
  ['PEK','베이징','중국'],['PKX','베이징(다싱)','중국'],['PVG','상하이(푸둥)','중국'],['SHA','상하이(훙차오)','중국'],['CAN','광저우','중국'],['SZX','선전','중국'],['CTU','청두','중국'],['XIY','시안','중국'],['TAO','칭다오','중국'],['DLC','다롄','중국'],['HGH','항저우','중국'],
  ['HKG','홍콩','홍콩'],['MFM','마카오','마카오'],['TPE','타이베이(타오위안)','대만'],['TSA','타이베이(쑹산)','대만'],['KHH','가오슝','대만'],
  ['BKK','방콕(수완나품)','태국'],['DMK','방콕(돈므앙)','태국'],['HKT','푸켓','태국'],['CNX','치앙마이','태국'],['SGN','호치민','베트남'],['HAN','하노이','베트남'],['DAD','다낭','베트남'],['CXR','나트랑','베트남'],['PQC','푸꾸옥','베트남'],
  ['MNL','마닐라','필리핀'],['CEB','세부','필리핀'],['CRK','클락','필리핀'],['SIN','싱가포르','싱가포르'],['KUL','쿠알라룸푸르','말레이시아'],['DPS','발리(덴파사르)','인도네시아'],['CGK','자카르타','인도네시아'],['PNH','프놈펜','캄보디아'],['REP','시엠립','캄보디아'],['VTE','비엔티안','라오스'],['RGN','양곤','미얀마'],
  ['DEL','델리','인도'],['BOM','뭄바이','인도'],['CMB','콜롬보','스리랑카'],['KTM','카트만두','네팔'],['MLE','몰디브(말레)','몰디브'],['ULN','울란바토르','몽골'],['TAS','타슈켄트','우즈베키스탄'],['ALA','알마티','카자흐스탄'],
  ['DXB','두바이','UAE'],['AUH','아부다비','UAE'],['DOH','도하','카타르'],['IST','이스탄불','튀르키예'],['SAW','이스탄불(사비하)','튀르키예'],['TLV','텔아비브','이스라엘'],['RUH','리야드','사우디'],['JED','제다','사우디'],
  ['LHR','런던(히스로)','영국'],['LGW','런던(개트윅)','영국'],['MAN','맨체스터','영국'],['EDI','에든버러','영국'],['DUB','더블린','아일랜드'],['CDG','파리(샤를드골)','프랑스'],['ORY','파리(오를리)','프랑스'],['FRA','프랑크푸르트','독일'],['MUC','뮌헨','독일'],['BER','베를린','독일'],['AMS','암스테르담','네덜란드'],['BRU','브뤼셀','벨기에'],
  ['MAD','마드리드','스페인'],['BCN','바르셀로나','스페인'],['LIS','리스본','포르투갈'],['FCO','로마','이탈리아'],['MXP','밀라노','이탈리아'],['VCE','베네치아','이탈리아'],['ZRH','취리히','스위스'],['GVA','제네바','스위스'],['VIE','빈','오스트리아'],['PRG','프라하','체코'],['BUD','부다페스트','헝가리'],['WAW','바르샤바','폴란드'],['ATH','아테네','그리스'],
  ['HEL','헬싱키','핀란드'],['ARN','스톡홀름','스웨덴'],['CPH','코펜하겐','덴마크'],['OSL','오슬로','노르웨이'],['SVO','모스크바','러시아'],['LED','상트페테르부르크','러시아'],
  ['JFK','뉴욕(JFK)','미국'],['EWR','뉴욕(뉴어크)','미국'],['LAX','로스앤젤레스','미국'],['SFO','샌프란시스코','미국'],['SEA','시애틀','미국'],['ORD','시카고','미국'],['ATL','애틀랜타','미국'],['DFW','댈러스','미국'],['IAD','워싱턴','미국'],['BOS','보스턴','미국'],['LAS','라스베이거스','미국'],['MCO','올랜도','미국'],['HNL','호놀룰루','미국'],['GUM','괌','미국'],['SPN','사이판','미국'],['YVR','밴쿠버','캐나다'],['YYZ','토론토','캐나다'],['YUL','몬트리올','캐나다'],
  ['SYD','시드니','호주'],['MEL','멜버른','호주'],['BNE','브리즈번','호주'],['OOL','골드코스트','호주'],['AKL','오클랜드','뉴질랜드'],['NAN','피지(난디)','피지'],
  ['GRU','상파울루','브라질'],['MEX','멕시코시티','멕시코'],['CUN','칸쿤','멕시코'],['LIM','리마','페루'],
];
const AP = {}; AIRPORTS.forEach(a=>AP[a[0]]=a);
function searchAP(q){ q=q.trim(); if(!q) return []; const u=q.toUpperCase();
  return AIRPORTS.filter(a=>a[0].startsWith(u)||a[0].includes(u)||a[1].includes(q)||a[2].includes(q)).slice(0,8); }
const apLabel = a => `${a[1]} (${a[0]})`;

// ── 상태 ──
const today=new Date(), addD=(n)=>{ const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
let S = { from:AP['ICN'], to:null, round:true, dep:addD(21), ret:addD(28), thr:'', adt:1, chd:0, inf:0 };
const SKEY='fd-routes-v1';
function loadRoutes(){ try{ return JSON.parse(localStorage.getItem(SKEY))||[]; }catch(_){ return []; } }
function saveRoutes(r){ localStorage.setItem(SKEY, JSON.stringify(r)); }

// ── 대륙(지역) → 대표 도시. 특가설정 탭에서 한국발 최저가 스캔용 ──
const CONTINENTS = [
  {key:'jp',   emoji:'🇯🇵', label:'일본',      def:300000, cities:['NRT','KIX','FUK','CTS','OKA','NGO']},
  {key:'sea',  emoji:'🌴', label:'동남아',    def:300000, cities:['BKK','DAD','CXR','SGN','HAN','CEB','MNL','DPS','SIN','KUL']},
  {key:'cn',   emoji:'🀄', label:'중화권',    def:250000, cities:['TPE','HKG','PVG','PEK','MFM','KHH']},
  {key:'guam', emoji:'🏝', label:'괌·사이판', def:400000, cities:['GUM','SPN']},
  {key:'eu',   emoji:'🇪🇺', label:'유럽',      def:900000, cities:['CDG','LHR','FCO','BCN','FRA','IST','ZRH','AMS','VIE','PRG']},
  {key:'us',   emoji:'🗽', label:'미주',      def:900000, cities:['JFK','LAX','SFO','HNL','YVR','SEA','ORD','YYZ']},
  {key:'oce',  emoji:'🦘', label:'대양주',    def:800000, cities:['SYD','MEL','BNE','AKL','OOL','NAN']},
  {key:'mid',  emoji:'🕌', label:'중동·기타', def:700000, cities:['DXB','DOH','AUH','TLV','ULN','TAS']},
];
const CMAP={}; CONTINENTS.forEach(c=>CMAP[c.key]=c);
const DKEY='fd-dealcfg-v1';
function loadCfg(){ try{ const c=JSON.parse(localStorage.getItem(DKEY)); if(c&&c.regions) return Object.assign({adt:1,chd:0,inf:0},c); }catch(_){}
  return {regions:[], round:true, targets:{}, adt:1, chd:0, inf:0}; }
function saveCfg(c){ localStorage.setItem(DKEY, JSON.stringify(c)); }
let CFG = loadCfg();

// ── 개인설정: 우리가족 프로필 (나이→항공 인원) ──
const FKEY='fd-family-v1';
const FAMILY_SEED=[{name:'아빠',age:44,sex:'m'},{name:'엄마',age:42,sex:'f'},{name:'아들',age:12,sex:'m'},{name:'딸',age:7,sex:'f'}];
function loadFamily(){ try{ const f=JSON.parse(localStorage.getItem(FKEY)); if(Array.isArray(f)) return f; }catch(_){} return null; }
function saveFamily(f){ localStorage.setItem(FKEY, JSON.stringify(f)); }
// 만12세+ = 성인, 2~11세 = 어린이(소아), 2세 미만 = 유아. 성인 최소 1.
function paxFromFamily(members){
  let adt=0, chd=0, inf=0;
  (members||[]).forEach(m=>{ const a=+m.age; if(a>=12) adt++; else if(a>=2) chd++; else inf++; });
  return { adt:Math.max(1,adt), chd, inf };
}
function applyFamilyPax(){ const p=paxFromFamily(FAM); CFG.adt=p.adt; CFG.chd=p.chd; CFG.inf=p.inf; saveCfg(CFG);
  S.adt=p.adt; S.chd=p.chd; S.inf=p.inf; }
let FAM = loadFamily();
if(!FAM){ FAM = FAMILY_SEED.map(m=>Object.assign({},m)); saveFamily(FAM); applyFamilyPax(); }  // 최초 1회 가족 인원 고정

let TAB = 'deals';        // 'deals'(특가설정) | 'search'(검색·예약) | 'family'(개인설정)
let _scannedOnce = false; // 앱 열 때 자동 특가 스캔 1회

// ── 딥링크 ──
const yymmdd = d => d.slice(2).replace(/-/g,'');
function naver(s){
  const dd=s.dep.replace(/-/g,''), rr=s.ret?s.ret.replace(/-/g,''):'';
  let u=`https://flight.naver.com/flights/international/${s.from[0]}-${s.to[0]}-${dd}`;
  if(s.round && rr) u+=`/${s.to[0]}-${s.from[0]}-${rr}`;
  return u+`?adult=${s.adt}&child=${s.chd}&infant=${s.inf}&fareType=Y`;
}
function skyscanner(s){
  let u=`https://www.skyscanner.co.kr/transport/flights/${s.from[0].toLowerCase()}/${s.to[0].toLowerCase()}/${yymmdd(s.dep)}/`;
  if(s.round && s.ret) u+=yymmdd(s.ret)+'/';
  return u+`?adults=${s.adt}&children=${s.chd}&infants=${s.inf}&cabinclass=economy&currency=KRW&locale=ko-KR`;
}
function kayak(s){
  let u=`https://www.kayak.co.kr/flights/${s.from[0]}-${s.to[0]}/${s.dep}`;
  if(s.round && s.ret) u+='/'+s.ret;
  u+=`/${s.adt}adults`;   // 카약은 성인 수만 경로로(소아·유아는 페이지에서 조정)
  return u+'?sort=price_a';
}

// ── 렌더 ──
const QUICK=['NRT','KIX','FUK','CTS','OKA','BKK','DAD','CEB','DPS','TPE','HKG','SIN','DXB','CDG','LHR','JFK','SYD','GUM'];
function stepper(label,key){
  return `<div class="stp"><span class="stp-l">${label}</span>
    <div class="stp-c"><button class="stp-b" data-k="${key}" data-d="-1">−</button>
    <b id="pax_${key}">${S[key]}</b>
    <button class="stp-b" data-k="${key}" data-d="1">+</button></div></div>`;
}
// 특가설정(CFG)용 인원 스테퍼
function cfgStepper(label,key){
  return `<div class="stp"><span class="stp-l">${label}</span>
    <div class="stp-c"><button class="dstp-b" data-k="${key}" data-d="-1">−</button>
    <b id="cpax_${key}">${CFG[key]}</b>
    <button class="dstp-b" data-k="${key}" data-d="1">+</button></div></div>`;
}
function render(){
  APP.innerHTML=`
    <div class="top"><div class="brand">✈️ 항공특가 <sup class="ver">${BUILD}</sup></div></div>
    <div class="tabs">
      <button class="tab ${TAB==='deals'?'on':''}" data-t="deals">🔥 특가설정<span class="tab-badge" id="tabBadge"></span></button>
      <button class="tab ${TAB==='search'?'on':''}" data-t="search">🔎 검색·예약</button>
      <button class="tab ${TAB==='family'?'on':''}" data-t="family">👤 개인설정</button>
    </div>
    <div id="tabbody"></div>`;
  APP.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{ TAB=b.dataset.t; render(); });
  if(TAB==='deals') renderDeals(); else if(TAB==='family') renderFamily(); else renderSearch();
  if(!_scannedOnce){ _scannedOnce=true; checkDealSettings(); }
}
function renderSearch(){
  const routes=loadRoutes();
  document.getElementById('tabbody').innerHTML=`
    <div class="sub">출발·도착을 넣으면 <b>지금 최저가·특가 여부</b>를 앱에서 바로 보고, 네이버·스카이스캐너·카약으로 이어서 예약해요.</div>

    <div class="card">
      <div class="ac-wrap">
        <label>출발</label>
        <input id="fromIn" class="in" autocomplete="off" placeholder="도시·공항·IATA" value="${S.from?esc(apLabel(S.from)):''}">
        <div class="ac-list" id="fromList"></div>
      </div>
      <button class="swap" id="swap" title="바꾸기">⇅</button>
      <div class="ac-wrap">
        <label>도착</label>
        <input id="toIn" class="in" autocomplete="off" placeholder="도시·공항·IATA" value="${S.to?esc(apLabel(S.to)):''}">
        <div class="ac-list" id="toList"></div>
      </div>

      <div class="quick">${QUICK.filter(c=>AP[c]).map(c=>`<button class="qchip" data-c="${c}">${AP[c][1]}</button>`).join('')}</div>

      <div class="trip">
        <button class="seg ${S.round?'on':''}" data-r="1">왕복</button>
        <button class="seg ${!S.round?'on':''}" data-r="0">편도</button>
      </div>
      <div class="dates">
        <div><label>가는 날</label><input type="date" id="dep" class="in" value="${S.dep}" min="${addD(0)}"></div>
        <div id="retBox" style="${S.round?'':'display:none'}"><label>오는 날</label><input type="date" id="ret" class="in" value="${S.ret}" min="${S.dep}"></div>
      </div>
      <div class="pax">
        <label>인원</label>
        ${stepper('성인','adt')}${stepper('소아 <span>(2~11세)</span>','chd')}${stepper('유아 <span>(0~1세)</span>','inf')}
      </div>
      <div><label>가격 임계값 (선택 · 원)</label><input id="thr" class="in" inputmode="numeric" placeholder="예: 400000 이하일 때 특가" value="${esc(S.thr)}"></div>

      <button class="go" id="go">🔎 특가 확인</button>
    </div>

    <div id="result"></div>

    <div class="card">
      <div class="ch"><b>⭐ 관심 노선</b><button class="mini" id="notify">🔔 알림 켜기</button><button class="mini" id="save">+ 저장</button></div>
      <div id="routes">${routes.length?routes.map((r,i)=>routeChip(r,i)).join(''):'<div class="muted">저장한 노선이 없어요. 저장해두면 앱 열 때 자동으로 특가를 진단하고 알림을 줘요.</div>'}</div>
    </div>

    <div class="note">
      🔥 <b>특가 표시(앱 안)</b>: 지금 <b>공홈 외 판매처(항공사·OTA) 포함 캐시된 시장 최저가</b>와 <b>이번 달 최저가 분포</b>를 비교해 특가 여부를 바로 보여줘요. (Travelpayouts)<br>
      🔔 <b>알림</b>: ‘알림 켜기’ 후 저장한 노선이 특가가 되면 <b>휴대폰 알림</b>이 떠요. (앱을 백그라운드에서도 확인하려면 서버 예약 확인 추가 필요 — 원하면 붙여드려요)<br>
      🔗 예약은 <b>네이버항공권·스카이스캐너·카약</b>에서 조건 그대로 이어서 확인.
    </div>`;
  bind();
  checkSavedDeals();
}
function routeChip(r,i){
  const f=AP[r.from]||[r.from,r.from], t=AP[r.to]||[r.to,r.to];
  return `<div class="rchip" data-i="${i}"><button class="ropen" data-i="${i}">${f[1]}(${r.from}) → ${t[1]}(${r.to}) · ${r.round?'왕복':'편도'}${r.thr?` · ~₩${Number(r.thr).toLocaleString()}`:''}<span class="rdeal"></span></button><button class="rdel" data-i="${i}">✕</button></div>`;
}

// ── 특가설정 탭: 한국발 → 대륙별 날짜무관 최저가 스캔 ──
function targetsHtml(){
  if(!CFG.regions.length) return '';
  return '<label style="margin-top:12px">목표가 (선택 · 원, 비우면 자동 판정)</label>'
    + CFG.regions.map(k=>{ const c=CMAP[k]; if(!c) return '';
        return `<div class="tgt"><span>${c.emoji} ${c.label}</span><input class="in tgt-in" data-k="${k}" inputmode="numeric" placeholder="예: ${c.def.toLocaleString()}" value="${CFG.targets[k]?esc(CFG.targets[k]):''}"></div>`;
      }).join('');
}
function renderDeals(){
  const sel=new Set(CFG.regions);
  document.getElementById('tabbody').innerHTML=`
    <div class="sub">🇰🇷 <b>한국 전체 출발</b> · 날짜 상관없이 지금 뜬 <b>대륙별 최저가</b>를 모아 보여줘요. 목표가를 넣으면 그 이하일 때 🔥로 강조·알림돼요.</div>
    <div class="card">
      <div class="trip">
        <button class="seg ${CFG.round?'on':''}" data-r="1">왕복</button>
        <button class="seg ${!CFG.round?'on':''}" data-r="0">편도</button>
      </div>
      <div class="pax">
        <label>인원 <span style="font-weight:600;color:var(--muted)">(예약·검색에 반영)</span></label>
        ${cfgStepper('성인','adt')}${cfgStepper('어린이 <span>(2~11세)</span>','chd')}${cfgStepper('유아 <span>(0~1세)</span>','inf')}
      </div>
      <label>관심 지역 (여러 개 선택)</label>
      <div class="quick">${CONTINENTS.map(c=>`<button class="qchip ${sel.has(c.key)?'on':''}" data-k="${c.key}">${c.emoji} ${c.label}</button>`).join('')}</div>
      <div id="targets">${targetsHtml()}</div>
      <button class="go" id="scan">🔎 지금 특가 보기</button>
      <button class="mini" id="dnotify" style="width:100%;margin-top:10px">🔔 특가 알림 켜기</button>
    </div>
    <div id="deals"></div>
    <div class="note">가격은 <b>Travelpayouts 캐시된 시장 최저가</b>(항공사·OTA 포함), <b>날짜 무관 최저값</b> 기준이에요. 실제 예약가는 항목을 눌러 예약 사이트에서 확인하세요.</div>`;
  bindDeals();
}
function bindTargets(){
  document.querySelectorAll('.tgt-in').forEach(inp=>inp.oninput=e=>{
    const k=inp.dataset.k, v=e.target.value.replace(/[^0-9]/g,'');
    if(v) CFG.targets[k]=v; else delete CFG.targets[k]; saveCfg(CFG);
  });
}
function bindDeals(){
  const body=document.getElementById('tabbody');
  body.querySelectorAll('.seg').forEach(b=>b.onclick=()=>{ CFG.round=b.dataset.r==='1'; saveCfg(CFG);
    body.querySelectorAll('.seg').forEach(x=>x.classList.toggle('on',x===b)); });
  body.querySelectorAll('.qchip').forEach(b=>b.onclick=()=>{ const k=b.dataset.k, i=CFG.regions.indexOf(k);
    if(i>=0) CFG.regions.splice(i,1); else CFG.regions.push(k); saveCfg(CFG);
    b.classList.toggle('on'); document.getElementById('targets').innerHTML=targetsHtml(); bindTargets(); });
  bindTargets();
  body.querySelectorAll('.dstp-b').forEach(b=>b.onclick=()=>{ const k=b.dataset.k, d=+b.dataset.d;
    let v=CFG[k]+d;
    if(k==='adt') v=Math.max(1,Math.min(9,v));
    else if(k==='chd') v=Math.max(0,Math.min(8,v));
    else if(k==='inf') v=Math.max(0,Math.min(CFG.adt,v));
    CFG[k]=v; if(k==='adt'&&CFG.inf>CFG.adt){ CFG.inf=CFG.adt; const ie=document.getElementById('cpax_inf'); if(ie)ie.textContent=CFG.inf; }
    saveCfg(CFG); const el=document.getElementById('cpax_'+k); if(el) el.textContent=v; });
  document.getElementById('scan').onclick=runDeals;
  const nb=document.getElementById('dnotify');
  if(nb){ if(('Notification' in window)&&Notification.permission==='granted') nb.textContent='🔔 특가 알림 ON';
    nb.onclick=()=>{ if(!('Notification' in window)){ alert('이 브라우저는 알림을 지원하지 않아요.'); return; }
      Notification.requestPermission().then(p=>{ if(p==='granted'){ nb.textContent='🔔 특가 알림 ON'; checkDealSettings(); } }); }; }
}
// 선택 지역 → 도시 합집합 → 프록시 배치 호출 → 지역 목표가로 판정
function dealScan(cfg){
  const destReg={}, dests=[];
  cfg.regions.forEach(k=>{ const c=CMAP[k]; if(!c) return; c.cities.forEach(city=>{ if(!destReg[city]){ destReg[city]=k; dests.push(city); } }); });
  if(!dests.length) return Promise.resolve([]);
  const url=`${PROXY_URL}?origin=KR&dests=${dests.join(',')}&oneWay=${!cfg.round}&currency=KRW`;
  return fetch(url).then(r=>r.json()).then(d=>{
    if(!d||d.error||!d.deals) return null;
    return d.deals.map(x=>{ const rk=destReg[x.dest]; const j=judge(x.price, x.dist, cfg.targets[rk]);
      return Object.assign({}, x, {region:rk}, j); });
  }).catch(()=>null);
}
function dealRow(x){
  const c=CMAP[x.region]||{emoji:'',label:''};
  const city=(AP[x.dest]||[x.dest,x.dest])[1];
  return `<button class="drow ${x.cl}" data-dest="${x.dest}" data-origin="${esc(x.origin||'')}" data-date="${x.date||''}">
    <div class="drow-l"><div class="drow-city">${c.emoji} ${esc(city)} <small>(${x.dest})</small></div>
      <div class="drow-sub">${x.date||''}${x.airline?` · ${esc(x.airline)}`:''}${x.tag?` · ${x.tag}`:''}</div></div>
    <div class="drow-p">${won(x.price)}</div></button>`;
}
function runDeals(){
  if(!CFG.regions.length){ alert('관심 지역을 하나 이상 선택하세요.'); return; }
  const box=document.getElementById('deals');
  box.innerHTML='<div class="ama-note">지금 특가 불러오는 중… (지역이 많으면 몇 초 걸려요)</div>';
  dealScan(CFG).then(rows=>{
    if(!rows){ box.innerHTML='<div class="ama-note">불러오지 못했어요. 잠시 후 다시 시도해 주세요.</div>'; return; }
    if(!rows.length){ box.innerHTML='<div class="ama-note">판매 중인 항공권을 못 찾았어요. 지역을 바꿔보세요.</div>'; return; }
    box.innerHTML=`<div class="card"><div class="ch"><b>🔥 지금 한국발 최저가</b><span class="muted" style="margin-left:auto">${CFG.round?'왕복':'편도'} · ${rows.length}곳</span></div>`
      + rows.map(dealRow).join('') + `</div>`;
    box.querySelectorAll('.drow').forEach(b=>b.onclick=()=>openDeal(b.dataset));
    box.scrollIntoView({behavior:'smooth',block:'start'});
  });
}
// 특가 행 탭 → 검색·예약 탭으로 프리필 이동
function openDeal(ds){
  let orig=(ds.origin||'').toUpperCase(); if(orig==='SEL') orig='ICN'; if(!AP[orig]) orig='ICN';
  S.from=AP[orig]; S.to=AP[ds.dest]||[ds.dest,ds.dest,''];
  S.round=CFG.round; S.dep=ds.date||addD(21);
  const rd=new Date(S.dep); rd.setDate(rd.getDate()+7); S.ret=rd.toISOString().slice(0,10);
  S.thr=''; S.adt=CFG.adt; S.chd=CFG.chd; S.inf=CFG.inf;   // 특가설정 인원 그대로 예약으로
  TAB='search'; render(); showResult(); window.scrollTo(0,0);
}
// ── 개인설정 탭: 우리가족 ──
function famRow(m,i){
  return `<div class="fam-row" data-i="${i}">
    <input class="in fam-name" data-i="${i}" value="${esc(m.name||'')}" placeholder="이름">
    <button class="fam-sex ${m.sex==='f'?'f':'m'}" data-i="${i}">${m.sex==='f'?'여':'남'}</button>
    <div class="stp-c fam-age"><button class="fstp-b" data-i="${i}" data-d="-1">−</button>
      <b id="fage_${i}">${+m.age||0}</b><span class="fage-u">세</span>
      <button class="fstp-b" data-i="${i}" data-d="1">+</button></div>
    <button class="rdel fam-del" data-i="${i}" title="삭제">✕</button></div>`;
}
function famSumHtml(){ const p=paxFromFamily(FAM); return `이 가족 = <b>성인 ${p.adt}</b> · 어린이 ${p.chd} · 유아 ${p.inf}`; }
function renderFamily(){
  document.getElementById('tabbody').innerHTML=`
    <div class="sub">👨‍👩‍👧‍👦 <b>우리가족</b>을 저장해두면 인원(성인·어린이·유아)이 자동 계산돼 특가설정·예약에 쓰여요.<br>나이 기준: <b>만 12세+ 성인 · 2~11세 어린이 · 2세 미만 유아</b>.</div>
    <div class="card">
      <div id="famList">${FAM.map((m,i)=>famRow(m,i)).join('')}</div>
      <button class="mini" id="famAdd" style="width:100%;margin-top:10px">+ 가족 추가</button>
    </div>
    <div class="card">
      <div class="fam-sum">${famSumHtml()}</div>
      <button class="go" id="famApply">✅ 우리가족 인원으로 적용</button>
    </div>
    <div class="note">인원은 여기(개인설정)나 특가설정 탭에서 언제든 바꿀 수 있어요. 설정값은 이 기기에 저장돼요.</div>`;
  bindFamily();
}
function bindFamily(){
  const body=document.getElementById('tabbody');
  body.querySelectorAll('.fam-name').forEach(inp=>inp.oninput=()=>{ FAM[+inp.dataset.i].name=inp.value; saveFamily(FAM); });
  body.querySelectorAll('.fam-sex').forEach(b=>b.onclick=()=>{ const m=FAM[+b.dataset.i]; m.sex=m.sex==='f'?'m':'f'; saveFamily(FAM);
    b.textContent=m.sex==='f'?'여':'남'; b.classList.toggle('f',m.sex==='f'); b.classList.toggle('m',m.sex!=='f'); });
  body.querySelectorAll('.fstp-b').forEach(b=>b.onclick=()=>{ const i=+b.dataset.i, m=FAM[i]; let a=(+m.age||0)+(+b.dataset.d);
    a=Math.max(0,Math.min(120,a)); m.age=a; saveFamily(FAM); const el=document.getElementById('fage_'+i); if(el)el.textContent=a;
    const sum=body.querySelector('.fam-sum'); if(sum) sum.innerHTML=famSumHtml(); });
  body.querySelectorAll('.fam-del').forEach(b=>b.onclick=()=>{ if(FAM.length<=1){ alert('최소 1명은 필요해요.'); return; }
    FAM.splice(+b.dataset.i,1); saveFamily(FAM); renderFamily(); });
  const add=document.getElementById('famAdd'); if(add) add.onclick=()=>{ FAM.push({name:'가족',age:30,sex:'m'}); saveFamily(FAM); renderFamily(); };
  const ap=document.getElementById('famApply'); if(ap) ap.onclick=()=>{ applyFamilyPax(); TAB='deals'; render(); };
}
// 앱 열 때 저장된 특가설정 자동 스캔 → 탭 뱃지 + 알림
function checkDealSettings(){
  if(!PROXY_URL || !CFG.regions.length) return;
  dealScan(CFG).then(rows=>{
    if(!rows) return;
    const deals=rows.filter(x=>x.deal);
    const badge=document.getElementById('tabBadge'); if(badge) badge.textContent=deals.length?` ${deals.length}`:'';
    if(deals.length && ('Notification' in window) && Notification.permission==='granted'){
      deals.slice(0,3).forEach(x=>{ const key='d'+x.dest+x.date;
        if(!_notified[key]){ _notified[key]=1; const city=(AP[x.dest]||[x.dest,x.dest])[1];
          new Notification('🔥 항공특가 발견!', { body:`한국 → ${city} ${won(x.price)} (${x.tag||'특가'})`, icon:'assets/icon.svg' }); } });
    }
  });
}

// 자동완성 부착
function attachAC(inputId, listId, setter){
  const inp=document.getElementById(inputId), list=document.getElementById(listId);
  const close=()=>{ list.classList.remove('open'); list.innerHTML=''; };
  inp.oninput=()=>{ const res=searchAP(inp.value); if(!res.length){ close(); return; }
    list.innerHTML=res.map(a=>`<button class="ac-item" data-i="${a[0]}"><b>${esc(a[1])}</b> <span>${a[0]} · ${esc(a[2])}</span></button>`).join('');
    list.classList.add('open');
    list.querySelectorAll('.ac-item').forEach(b=>b.onclick=()=>{ const a=AP[b.dataset.i]; setter(a); inp.value=apLabel(a); close(); });
  };
  inp.onblur=()=>setTimeout(close,180);
}
function bind(){
  attachAC('fromIn','fromList',a=>S.from=a);
  attachAC('toIn','toList',a=>S.to=a);
  document.getElementById('swap').onclick=()=>{ const a=S.from; S.from=S.to; S.to=a; render(); };
  APP.querySelectorAll('.qchip').forEach(b=>b.onclick=()=>{ S.to=AP[b.dataset.c]; render(); });
  APP.querySelectorAll('.seg').forEach(b=>b.onclick=()=>{ S.round=b.dataset.r==='1'; document.getElementById('retBox').style.display=S.round?'':'none'; APP.querySelectorAll('.seg').forEach(x=>x.classList.toggle('on', x===b)); });
  const dep=document.getElementById('dep'); dep.onchange=()=>{ S.dep=dep.value; const ret=document.getElementById('ret'); if(ret){ ret.min=S.dep; if(S.ret<S.dep){ S.ret=S.dep; ret.value=S.dep; } } };
  const ret=document.getElementById('ret'); if(ret) ret.onchange=()=>S.ret=ret.value;
  document.getElementById('thr').oninput=e=>S.thr=e.target.value.replace(/[^0-9]/g,'');
  APP.querySelectorAll('.stp-b').forEach(b=>b.onclick=()=>{ const k=b.dataset.k, d=+b.dataset.d;
    let v=S[k]+d;
    if(k==='adt') v=Math.max(1,Math.min(9,v));
    else if(k==='chd') v=Math.max(0,Math.min(8,v));
    else if(k==='inf') v=Math.max(0,Math.min(S.adt,v));
    S[k]=v; if(k==='adt'&&S.inf>S.adt){ S.inf=S.adt; const pe=document.getElementById('pax_inf'); if(pe)pe.textContent=S.inf; }
    const el=document.getElementById('pax_'+k); if(el) el.textContent=v; });
  document.getElementById('go').onclick=showResult;
  document.getElementById('save').onclick=()=>{ if(!S.from||!S.to){ alert('출발·도착을 선택하세요.'); return; }
    const r=loadRoutes(); r.unshift({from:S.from[0],to:S.to[0],round:S.round,dep:S.dep,ret:S.ret,thr:S.thr,adt:S.adt,chd:S.chd,inf:S.inf}); saveRoutes(r.slice(0,20)); render(); };
  APP.querySelectorAll('.ropen').forEach(b=>b.onclick=()=>{ const r=loadRoutes()[+b.dataset.i]; S.from=AP[r.from]||S.from; S.to=AP[r.to]||S.to; S.round=r.round; S.dep=r.dep; S.ret=r.ret; S.thr=r.thr||''; S.adt=r.adt||1; S.chd=r.chd||0; S.inf=r.inf||0; render(); showResult(); window.scrollTo(0,0); });
  APP.querySelectorAll('.rdel').forEach(b=>b.onclick=()=>{ const r=loadRoutes(); r.splice(+b.dataset.i,1); saveRoutes(r); render(); });
  const nb=document.getElementById('notify'); if(nb){ if(('Notification' in window)&&Notification.permission==='granted') nb.textContent='🔔 알림 ON';
    nb.onclick=()=>{ if(!('Notification' in window)){ alert('이 브라우저는 알림을 지원하지 않아요.'); return; }
      Notification.requestPermission().then(p=>{ if(p==='granted'){ nb.textContent='🔔 알림 ON'; checkSavedDeals(); } }); }; }
}
// 저장 노선 자동 특가 진단(앱 열 때) + 특가면 칩 표시·알림
const _notified={};
function checkSavedDeals(){
  if(!PROXY_URL) return; const routes=loadRoutes(); if(!routes.length) return;
  routes.forEach((r,i)=>{
    const s={from:AP[r.from]||[r.from,r.from],to:AP[r.to]||[r.to,r.to],round:r.round,dep:r.dep,ret:r.ret,thr:r.thr,adt:r.adt||1,chd:r.chd||0,inf:r.inf||0};
    diagnose(s).then(res=>{ if(!res||res.error||!res.deal) return;
      const el=document.querySelector(`.rchip[data-i="${i}"] .rdeal`); if(el) el.textContent=`🔥 ${won(res.cur)}`;
      const key=r.from+r.to+r.dep+r.ret;
      if(!_notified[key] && ('Notification' in window) && Notification.permission==='granted'){
        _notified[key]=1;
        new Notification('🔥 항공특가 발견!', { body:`${r.from} → ${r.to}  ${won(res.cur)}  (${res.tag||'특가'})`, icon:'assets/icon.svg' });
      }
    });
  });
}
function showResult(){
  if(!S.from||!S.to){ alert('출발·도착 공항을 선택하세요.'); return; }
  if(S.from[0]===S.to[0]){ alert('출발과 도착이 같아요.'); return; }
  const nav=naver(S), sky=skyscanner(S), kay=kayak(S);
  const thrTxt = S.thr? `<div class="thr">🎯 목표가 <b>₩${Number(S.thr).toLocaleString()} 이하</b>이면 특가로 표시돼요.</div>`:'';
  document.getElementById('result').innerHTML=`
    <div class="card result">
      <div class="rt">${esc(apLabel(S.from))} <span>→</span> ${esc(apLabel(S.to))}</div>
      <div class="rt-sub">${S.dep}${S.round?` ~ ${S.ret} · 왕복`:' · 편도'} · 성인${S.adt}${S.chd?`·소아${S.chd}`:''}${S.inf?`·유아${S.inf}`:''}</div>
      ${thrTxt}
      <div id="amaBox" class="ama-box"><div class="ama-note">특가 진단 불러오는 중…</div></div>
      <div class="svc-h">예약 사이트에서 바로 확인 (조건 그대로 검색)</div>
      <a class="svc n" href="${nav}" target="_blank" rel="noopener">🟢 네이버항공권 — 최저가 비교 <span>›</span></a>
      <a class="svc s" href="${sky}" target="_blank" rel="noopener">🔵 스카이스캐너 — 항공사별 최저가 <span>›</span></a>
      <a class="svc k" href="${kay}" target="_blank" rel="noopener">🟧 카약 — 가격순 정렬 <span>›</span></a>
    </div>`;
  analyze();
  document.getElementById('result').scrollIntoView({behavior:'smooth',block:'start'});
}
// ── 특가 진단: 현재 최저가(캐시 시장가) + 이번 달 가격 분포 (Travelpayouts) ──
const won = n => '₩'+Math.round(n).toLocaleString();
function apiBase(s){ return `${PROXY_URL}?origin=${s.from[0]}&destination=${s.to[0]}&date=${s.dep}&currency=KRW&oneWay=${!s.round}`
  + `&adults=${s.adt}&children=${s.chd}&infants=${s.inf}` + (s.round&&s.ret?`&returnDate=${s.ret}`:''); }
// 현재가 vs 분포(dist:{min,q1,med,q3,max}) + 목표가 → 특가 판정 (검색·특가설정 공용)
function judge(cur, dist, target){
  let deal=false, tag='', cl='mid';
  if(dist && cur!=null){
    if(cur<=dist.min){tag='🔥 이번 달 최저가!';cl='fire';deal=true;}
    else if(cur<=dist.q1){tag='👍 저렴 (하위 25%)';cl='good';deal=true;}
    else if(cur<=dist.med){tag='🙂 평균 이하';cl='good';}
    else if(cur<=dist.q3){tag='😐 평균 이상';cl='mid';}
    else {tag='💸 비싼 편';cl='bad';}
  }
  const t=+target;
  if(t && cur!=null && cur<=t){ deal=true; if(!/최저|저렴/.test(tag)){ tag=(tag?tag+' · ':'')+'🎯 목표가 이하'; cl='good'; } }
  return {deal,tag,cl};
}
// 현재 최저가 + 이번 달 분포로 특가 판정. 콜백(result)로도 넘겨줌(저장노선 자동진단용)
function diagnose(s, cb){
  return fetch(apiBase(s)).then(r=>r.json()).catch(()=>({error:true})).then(d=>{
    if(d&&d.error) return {error:true};
    // 프록시 정규화 응답: {current, airline, dist:{min,q1,med,q3,max}}
    const dd=d&&d.dist; let g=null;
    if(dd){ g={MINIMUM:+dd.min, FIRST_QUARTILE:+dd.q1, MEDIUM:+dd.med, THIRD_QUARTILE:+dd.q3, MAXIMUM:+dd.max}; }
    let cur=(d&&d.current!=null)?+d.current:null, carrier=(d&&d.airline)||'';
    const {deal,tag,cl}=judge(cur, dd, s.thr);
    const res={g,cur,carrier,deal,tag,cl};
    if(cb) cb(res);
    return res;
  }).catch(()=>({error:true}));
}
function analyze(){
  const box=document.getElementById('amaBox'); if(!box) return;
  if(!PROXY_URL){ box.innerHTML=keyNote(); return; }
  box.innerHTML='<div class="ama-note">특가 진단 불러오는 중…</div>';
  diagnose(S).then(r=>{
    if(!r || r.error){ box.innerHTML=keyNote(); return; }
    const {g,cur,carrier,deal,tag,cl}=r;
    let html='';
    if(cur!=null){
      const pct = g? Math.round((1-cur/g.MEDIUM)*100):0;
      html+=`<div class="cur ${cl}">
        <div class="cur-top">${deal?'🔥 특가 발견!':'지금 최저가'}</div>
        <div class="cur-p">${won(cur)}${carrier?` <small>· ${esc(carrier)}</small>`:''}</div>
        ${tag?`<div class="cur-cmp">${tag}${pct>0?` · 보통보다 ${pct}%↓`:''}</div>`:''}</div>`;
    } else {
      html+=`<div class="ama-note">지금 판매 중인 항공권을 못 찾았어요. (테스트 환경은 일부 노선만 · 날짜를 바꿔보세요)</div>`;
    }
    if(g){ html+=`<div class="ama-title">📊 이 노선 가격대 (이번 달 기준) <span>${S.dep}${S.round?' 왕복':' 편도'}</span></div>
      <div class="ama-grid">
        <div><span>최저</span><b>${won(g.MINIMUM)}</b></div><div><span>저렴 25%</span><b>${won(g.FIRST_QUARTILE)}</b></div>
        <div class="med"><span>보통</span><b>${won(g.MEDIUM)}</b></div><div><span>비쌈 75%</span><b>${won(g.THIRD_QUARTILE)}</b></div>
        <div><span>최고</span><b>${won(g.MAXIMUM)}</b></div></div>`; }
    html+=`<div class="ama-note">현재가는 <b>공홈 외 판매처(항공사·OTA) 포함 캐시된 시장 최저가</b>(Travelpayouts). 저장한 노선은 앱 열 때 자동 진단돼요.</div>`;
    box.innerHTML=html;
  });
}
function keyNote(){ return '<div class="ama-note">⚙️ 특가 진단 준비 중 — Travelpayouts 무료 토큰이 등록되면 <b>지금 최저가·특가 여부</b>가 여기 바로 표시돼요.</div>'; }
render();
if('serviceWorker' in navigator){
  let had=!!navigator.serviceWorker.controller, refreshing=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(had&&!refreshing){ refreshing=true; location.reload(); } });
  navigator.serviceWorker.register('sw.js').then(r=>{ r.update(); setInterval(()=>r.update(),60000); }).catch(()=>{});
}
