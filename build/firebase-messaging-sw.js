importScripts("https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js");

const firebaseConfig = {
    apiKey: "AIzaSyB3qYCGqzw2mz83rvGdnRMBjFr-8VV4x4s",
    authDomain: "smalloffice-67f8e.firebaseapp.com",
    projectId: "smalloffice-67f8e",
    storageBucket: "smalloffice-67f8e.appspot.com",
    messagingSenderId: "825052312770",
    appId: "1:825052312770:web:6226436f03aa334bec775b",
    measurementId: "G-1S1DMMPBXJ"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ✅ Background handler
messaging.onBackgroundMessage((payload) => {
    // console.log("📩 Background:", payload);

    const notificationTitle = payload.data?.title || "No Title";

    const notificationOptions = {
        body: payload.data?.body || "No Body",
        icon: "/firebase-logo.png",
        data: payload.data || {},
    };

    //  self.clients.matchAll({ includeUncontrolled: true, type: "window" })
    //     .then((clients) => {
    //         clients.forEach((client) => {
    //             client.postMessage({
    //                 type: "FCM_MESSAGE",
    //                 payload: payload,
    //             });
    //         });
    //     });

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// ✅ Click handler (IMPROVED)
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const url = event.notification.data?.url || "/";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(url) && "focus" in client) {
                    return client.focus();
                }
            }
            return clients.openWindow(url);
        })
    );
});
