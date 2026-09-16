const CACHE_NAME = "luxe-player-v2";

const APP_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "./favicon.png"
];


// INSTALL
self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches.open(CACHE_NAME)
                .then(cache => {

                    return cache.addAll(
                        APP_FILES
                    );

                })

        );

        self.skipWaiting();

    }
);


// ACTIVATE
self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches.keys()
                .then(keys => {

                    return Promise.all(

                        keys
                            .filter(
                                key =>
                                    key !==
                                    CACHE_NAME
                            )
                            .map(
                                key =>
                                    caches.delete(
                                        key
                                    )
                            )

                    );

                })

        );

        self.clients.claim();

    }
);


// FETCH
self.addEventListener(
    "fetch",
    event => {

        if (
            event.request.method !==
            "GET"
        ) {
            return;
        }

        event.respondWith(

            caches.match(
                event.request
            )
            .then(cachedResponse => {

                if (cachedResponse) {

                    return cachedResponse;

                }

                return fetch(
                    event.request
                )
                .then(response => {

                    // Save new files
                    const copy =
                        response.clone();

                    caches.open(
                        CACHE_NAME
                    )
                    .then(cache => {

                        cache.put(
                            event.request,
                            copy
                        );

                    });

                    return response;

                })
                .catch(() => {

                    return caches.match(
                        "./index.html"
                    );

                });

            })

        );

    }
);
