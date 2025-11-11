const DEFAULT_ICON = "/vercel.svg";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      data = { title: "복약 알림", body: event.data.text() };
    }
  }

  const title = data.title ?? "복약 알림";
  const body = data.body ?? "정해진 복약 스케줄을 확인하세요.";
  const icon = data.icon ?? DEFAULT_ICON;
  const options = {
    body,
    icon,
    badge: icon,
    data: data.data ?? {},
    tag: data.tag ?? undefined,
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/client/mypage";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const matchingClient = clients.find((client) => client.url.includes(targetUrl));
      if (matchingClient) {
        return matchingClient.focus();
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
