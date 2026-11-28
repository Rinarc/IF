/* sw.js —— 无限極人生 PWA 离线缓存
 * 说明（给用户后面自己调整）：
 *  · 改顶部 VERSION（例如 v2.8.0 → v2.8.1），下次打开自动清旧缓存、重新预缓存
 *  · PRECACHE 只列「一定存在」的文件；media/opening.mp4 与 music/*.mp3
 *    是用户后放的，走运行时缓存，不会因为缺文件导致 SW 安装失败
 *  · 命中缓存后后台会覆盖同名条目，所以改了 js/css 后刷新一次就是新版本
 *  · 视频 Range 请求直接放行，保证 iOS / Chrome 能正常播片头
 *  · 只缓存同源 GET；用户贴的外链音乐不拦截
 */
const VERSION = 'v3.2.0';
const CACHE = 'infinite-lives-' + VERSION;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './icons/icon-192.jpeg',
  './icons/icon-512.jpeg',
  './icons/icon-maskable-512.jpeg',
  './icons/apple-touch-icon.jpeg',
  './icons/favicon-32.jpeg',
  './js/utils.js',
  './js/data.js',
  './js/art.js',
  './js/world.js',
  './js/entities.js',
  './js/systems.js',
  './js/estate.js',
  './js/play.js',
  './js/jobs.js',
  './js/music.js',
  './js/music-resume.js',
  './js/music-extra.js',
  './js/music-player.js',
  './js/events.js',
  './js/blueprint.js',
  './js/ui.js',
  './js/minimap.js',
  './js/phone.js',
  './js/main.js',
  './js/title.js',
  './js/opening.js',
  './js/pwa.js',
  './js/orientation.js',
  './js/basketball.js'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // 逐条 add：单个文件缺失也不会让整个 SW 安装失败
    await Promise.all(PRECACHE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => k.startsWith('infinite-lives-') && k !== CACHE)
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

const VIDEO_RE = /\.(mp4|webm|mov|m4v|ogv)$/i;
// 音频（music/*.mp3 等）和其他静态资源一样走 cacheFirst，离线也能听歌；
// 想给音频单独换策略，在这里加一个正则分支即可。

async function networkFirstNavigation(req) {
  const c = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res && res.ok) c.put(new Request('./index.html'), res.clone()).catch(() => {});
    return res;
  } catch (err) {
    // 离线：start_url 带 ?source=pwa，用 ignoreSearch 兜底
    return (await c.match(req, { ignoreSearch: true }))
        || (await c.match('./index.html'))
        || new Response('离线且无缓存，请联网打开一次。', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

async function cacheFirst(req) {
  const c = await caches.open(CACHE);
  const hit = await c.match(req);
  if (hit) {
    // 后台覆盖同名条目：改过 js / css / 图标后，刷新一次就是新版本
    fetch(req).then(res => { if (res && res.ok && res.type === 'basic') c.put(req, res); }).catch(() => {});
    return hit;
  }
  const res = await fetch(req);
  if (res && res.ok && res.type === 'basic') c.put(req, res.clone()).catch(() => {});
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // 外链不拦
  if (req.headers.has('range')) return;                     // 视频分片交给浏览器
  if (VIDEO_RE.test(url.pathname)) return;                 // 片头视频走原生网络，不塞进缓存
  if (req.mode === 'navigate') { e.respondWith(networkFirstNavigation(req)); return; }
  // 离线且缓存没命中时给一个干净的 503，不要 respondWith(undefined)
  const safe = cacheFirst(req).catch(async () =>
    (await caches.open(CACHE).then(c => c.match(req)))
    || new Response('离线且无缓存', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }));
  e.respondWith(safe);
});

/* 网页可以主动发消息让它立即更新（pwa.js 里暴露了 PC.PWA.update） */
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
