// Este arquivo é importado pelo service worker principal.

self.addEventListener('push', (event) => {
  try {
    const data = event.data.json();
    console.log('Push recebido:', data);

    const options = {
      body: data.body,
      icon: '/icon-192x192.svg', // Ícone para a notificação
      badge: '/icon-192x192.svg', // Ícone para a barra de status (Android)
      data: {
        url: data.url, // URL para abrir ao clicar
      },
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch (e) {
    console.error('Erro ao manipular o evento push:', e);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se o site já estiver aberto, foca na aba existente
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(urlToOpen, self.location.origin);
        if (clientUrl.pathname === targetUrl.pathname && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não houver uma aba aberta com a URL, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});