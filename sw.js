// PWAのインストール要件を満たしつつ、キャッシュトラブルを防ぐ安全なService Worker
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// 常に最新のネットワークデータを取得する（古い画面が残るのを防ぐ）
self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request));
});