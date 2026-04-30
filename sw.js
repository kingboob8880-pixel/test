/**
 * RUKYA PRO Service Worker
 * Обеспечивает работу офлайн, кэширование ресурсов и фоновую синхронизацию
 */

const CACHE_NAME = 'rukya-pro-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/themes.css',
  '/css/components.css',
  '/css/print.css',
  '/js/app.js',
  '/js/router.js',
  '/js/storage.js',
  '/js/utils.js',
  '/js/dashboard.js',
  '/js/newcase.js',
  '/js/patients.js',
  '/js/diagnosis.js',
  '/js/settings.js',
  '/js/plan-builder.js',
  '/js/patient-monitor.js',
  '/js/advanced-diagnosis.js',
  '/data/illnesses.json',
  '/data/organs.json',
  '/data/programs.json',
  '/data/complaint-corpus.json',
  '/data/matrix.json',
  '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Установка Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Кэширование статических ресурсов');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Не удалось закэшировать некоторые ресурсы:', err);
        // Продолжаем установку даже при ошибке кэширования
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Активация Service Worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Стратегия Network First с fallback на Cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Игнорируем запросы не к нашему домену
  if (url.origin !== location.origin) {
    return;
  }

  // Для API запросов (если будут) - только сеть
  if (request.url.includes('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Стратегия: Network First -> Cache -> Fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Если успех, клонируем ответ в кэш
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Если сеть недоступна, пробуем кэш
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Возврат из кэша:', request.url);
            return cachedResponse;
          }
          
          // Fallback для навигации - возвращаем index.html
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          
          // Если ничего нет, возвращаем ошибку
          return new Response('Offline - ресурс не найден в кэше', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Фоновая синхронизация (когда появится соединение)
self.addEventListener('sync', (event) => {
  console.log('[SW] Синхронизация:', event.tag);
  
  if (event.tag === 'sync-patient-data') {
    event.waitUntil(syncPatientData());
  }
});

async function syncPatientData() {
  // Логика синхронизации данных пациента при появлении соединения
  console.log('[SW] Синхронизация данных пациентов...');
  // Здесь будет логика отправки накопленных изменений на сервер
  return Promise.resolve();
}

// Push уведомления (заготовка)
self.addEventListener('push', (event) => {
  console.log('[SW] Получено push-сообщение');
  
  const options = {
    body: event.data ? event.data.text() : 'Новое уведомление от RUKYA PRO',
    icon: '/manifest.json', // Ссылка на иконку
    badge: '/manifest.json',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'open', title: 'Открыть' },
      { action: 'close', title: 'Закрыть' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('RUKYA PRO', options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Клик по уведомлению');
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Проверяем, есть ли уже открытое окно
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Если нет, открываем новое
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
        return Promise.resolve();
      })
    );
  }
});

// Периодическая фоновая синхронизация (если поддерживается)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-backup') {
    event.waitUntil(performBackup());
  }
});

async function performBackup() {
  console.log('[SW] Выполнение периодического резервного копирования...');
  // Логика автоматического бэкапа
  return Promise.resolve();
}

console.log('[SW] Service Worker загружен');
