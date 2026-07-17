const CACHE = 'flightdeal-v5';
self.addEventListener('message', e => { if (e.data === 'skip-waiting') self.skipWaiting(); });
const CORE = ['./','./index.html','./assets/app.css','./assets/app.js','./manifest.webmanifest','./assets/icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE).catch(()=>{}))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const req=e.request; if(req.method!=='GET') return;
  if(new URL(req.url).origin!==self.location.origin) return;
  e.respondWith(fetch(req).then(res=>{ const c=res.clone(); caches.open(CACHE).then(x=>x.put(req,c)).catch(()=>{}); return res; })
    .catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));
});
