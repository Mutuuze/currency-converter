
let cacheName = 'currency-convertor-v1';
let cachesArray = [
  '/',
  '/index.html',
  '/css/index.css',
  'https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
  '/index.js',
  '/node_modules/idb/lib/idb.js',
  '/js/app.js',
  '/css/bootstrap-4.0.0/assets/js/vendor/holder.min.js',
  'https://code.jquery.com/jquery-3.3.1.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js',
  'https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName).then( cache => {
      return cache.addAll(cachesArray);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then( cacheNames => {
      return Promise.all(cacheNames.map( singleCache => {
        if (singleCache !== cacheName){
          return caches.delete(singleCache);
        }
      }));
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then( response => {
        return caches.open('cacheName').then( cache => {
          cache.put(event.request, response.clone());
          return response;
        })
      });
    })
  );
});
