// Kavak Belediyesi Araç Sorgu Sistemi - Service Worker
// Sürüm numarasını her önemli güncellemede artır (cache'i tazelemek için)
const CACHE_VERSION = 'v1';
const CACHE_NAME = 'arac-sorgu-' + CACHE_VERSION;

const CORE_ASSETS = [
  './Araç_Sorgu_Sistemi.html',
  './manifest.json',
  './res/kavak-logo.png'
];

// Kurulum: temel dosyaları önbelleğe al
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// Aktivasyon: eski sürüm cache'lerini temizle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('arac-sorgu-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// İstek yakalama: cache-first, ağ yoksa önbellekten dön
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      // Önbellekte varsa hemen onu döndür, arka planda güncelle (stale-while-revalidate)
      return cached || networkFetch;
    })
  );
});
