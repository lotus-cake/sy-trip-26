/* 离线支持:页面和脚本缓存在手机上,没网也能打开;行程数据由 App 自己存在 IndexedDB */
const CACHE = "trip-shell-v3b";
const SKIP = ["firebaseio.com", "firebasedatabase.app", "api.anthropic.com", "frankfurter", "open-meteo.com", "nominatim.openstreetmap.org"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "./icon.png"]).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = req.url;
  if (SKIP.some(s => url.includes(s))) return;
  if (req.mode === "navigate") {   // 页面:先联网拿最新,没网用缓存(每个页面按自己的网址存,同仓库里的其他页面互不影响)
    const key = new URL(req.url); key.search = ""; key.hash = "";
    e.respondWith(fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(key.href, c)); } return r; })
      .catch(() => caches.match(key.href).then(r => r || caches.match("./"))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {   // 脚本/字体/图标:先用缓存
    if (r && (r.ok || r.type === "opaque")) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
    return r;
  })));
});
