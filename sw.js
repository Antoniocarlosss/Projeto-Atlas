self.addEventListener('fetch', function(event) {
  // Esse código permite que o app funcione offline no futuro
  event.respondWith(fetch(event.request));
});
