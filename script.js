// ============================================
// LUXE PLAYER - OFFLINE MUSIC STORAGE
// ============================================

const audio = document.getElementById("audio");
const fileInput = document.getElementById("fileInput");
const addBtn = document.getElementById("addBtn");
const songsEl = document.getElementById("songs");
const searchInput = document.getElementById("search");

const titleEl = document.getElementById("title");
const artistEl = document.getElementById("artist");
const albumArt = document.getElementById("albumArt");
const miniTitle = document.getElementById("miniTitle");
const miniArtist = document.getElementById("miniArtist");

const playBtn = document.getElementById("play");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const progressTrack = document.getElementById("progressTrack");
const progress = document.getElementById("progress");

const currentTimeEl = document.getElementById("current");
const totalTimeEl = document.getElementById("total");

const volume = document.getElementById("volume");
const volText = document.getElementById("volText");

const favoriteBtn = document.getElementById("favorite");

const miniPlay = document.getElementById("miniPlay");
const miniProgress = document.getElementById("miniProgress");
const miniCurrent = document.getElementById("miniCurrent");
const miniTotal = document.getElementById("miniTotal");

const countEl = document.getElementById("count");
const sectionTitle = document.getElementById("sectionTitle");
const pageTitle = document.getElementById("pageTitle");

const dropzone = document.getElementById("dropzone");
const shuffleBtn = document.getElementById("shuffle");
const repeatBtn = document.getElementById("repeat");


// ============================================
// VARIABLES
// ============================================

let songs = [];
let currentIndex = -1;

let currentObjectURL = null;

let isShuffle = false;
let isRepeat = false;

let currentPage = "home";

let favorites = JSON.parse(
    localStorage.getItem("luxeFavorites") || "[]"
);

let recentlyPlayed = JSON.parse(
    localStorage.getItem("luxeRecent") || "[]"
);


// ============================================
// INDEXEDDB
// ============================================

const DB_NAME = "LUXE_PLAYER_DB";
const DB_VERSION = 1;
const STORE_NAME = "music";

let db;


// Open database
function openDatabase() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(
            DB_NAME,
            DB_VERSION
        );

        request.onupgradeneeded = (event) => {

            const database = event.target.result;

            if (!database.objectStoreNames.contains(STORE_NAME)) {

                database.createObjectStore(
                    STORE_NAME,
                    {
                        keyPath: "id"
                    }
                );

            }

        };

        request.onsuccess = () => {

            db = request.result;

            resolve(db);

        };

        request.onerror = () => {

            reject(request.error);

        };

    });

}


// Save song to IndexedDB
function saveSong(song) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        store.put(song);

        transaction.oncomplete = resolve;

        transaction.onerror = () => {
            reject(transaction.error);
        };

    });

}


// Get all saved songs
function getSavedSongs() {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readonly"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        const request =
            store.getAll();

        request.onsuccess = () => {

            resolve(request.result || []);

        };

        request.onerror = () => {

            reject(request.error);

        };

    });

}


// Delete song
function deleteSong(id) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        store.delete(id);

        transaction.oncomplete = resolve;

        transaction.onerror = () => {
            reject(transaction.error);
        };

    });

}


// ============================================
// FORMAT TIME
// ============================================

function formatTime(seconds) {

    if (!seconds || !isFinite(seconds)) {
        return "0:00";
    }

    const mins =
        Math.floor(seconds / 60);

    const secs =
        Math.floor(seconds % 60)
            .toString()
            .padStart(2, "0");

    return `${mins}:${secs}`;

}


// ============================================
// CREATE SONG
// ============================================

async function addFiles(files) {

    if (!files || files.length === 0) {
        return;
    }

    for (const file of files) {

        if (!file.type.startsWith("audio/")) {
            continue;
        }

        // Unique ID
        const id =
            `${file.name}_${file.size}_${file.lastModified}`;

        // Avoid duplicate
        if (songs.some(song => song.id === id)) {
            continue;
        }

        const song = {

            id: id,

            name: file.name,

            artist: "Local Music",

            size: file.size,

            lastModified: file.lastModified,

            blob: file

        };

        await saveSong(song);

        songs.push(song);

    }

    renderSongs();

}


// ============================================
// LOAD MUSIC FROM DATABASE
// ============================================

async function loadMusic() {

    try {

        songs = await getSavedSongs();

        renderSongs();

        console.log(
            `LUXE: ${songs.length} songs loaded from offline storage.`
        );

    } catch (error) {

        console.error(
            "Could not load music:",
            error
        );

    }

}


// ============================================
// RENDER SONGS
// ============================================

function renderSongs() {

    if (!songsEl) {
        return;
    }

    let visibleSongs = [...songs];

    // Search
    const query =
        searchInput?.value
            ?.toLowerCase()
            .trim() || "";

    if (query) {

        visibleSongs =
            visibleSongs.filter(song =>
                song.name
                    .toLowerCase()
                    .includes(query)
            );

    }


    // Pages
    if (currentPage === "favorites") {

        visibleSongs =
            visibleSongs.filter(song =>
                favorites.includes(song.id)
            );

    }

    if (currentPage === "recent") {

        visibleSongs =
            recentlyPlayed
                .map(id =>
                    songs.find(song =>
                        song.id === id
                    )
                )
                .filter(Boolean);

    }

    if (currentPage === "queue") {

        visibleSongs = [...songs];

    }


    // Empty state
    if (visibleSongs.length === 0) {

        songsEl.innerHTML = `
            <div class="empty-state">
                <div>♫</div>
                <h3>No music here</h3>
                <p>Add songs to your LUXE library.</p>
            </div>
        `;

    } else {

        songsEl.innerHTML =
            visibleSongs.map((song, index) => {

                const originalIndex =
                    songs.findIndex(
                        item => item.id === song.id
                    );

                const isFav =
                    favorites.includes(song.id);

                return `

                <div
                    class="song"
                    data-index="${originalIndex}"
                >

                    <div class="song-number">
                        ${index + 1}
                    </div>

                    <div class="song-art">
                        ♫
                    </div>

                    <div class="song-info">

                        <b>
                            ${escapeHTML(song.name)}
                        </b>

                        <small>
                            ${escapeHTML(song.artist)}
                        </small>

                    </div>

                    <button
                        class="song-favorite"
                        data-favorite="${song.id}"
                    >
                        ${isFav ? "♥" : "♡"}
                    </button>

                    <button
                        class="song-delete"
                        data-delete="${song.id}"
                        title="Remove"
                    >
                        ×
                    </button>

                </div>

                `;

            }).join("");

    }


    // Count
    if (countEl) {

        countEl.textContent =
            `${songs.length} ${
                songs.length === 1
                    ? "song"
                    : "songs"
            }`;

    }

}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHTML(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ============================================
// PLAY SONG
// ============================================

function playSong(index) {

    if (
        index < 0 ||
        index >= songs.length
    ) {
        return;
    }

    currentIndex = index;

    const song = songs[index];

    // Remove old object URL
    if (currentObjectURL) {

        URL.revokeObjectURL(
            currentObjectURL
        );

    }

    currentObjectURL =
        URL.createObjectURL(song.blob);

    audio.src = currentObjectURL;

    audio.volume =
        parseFloat(volume?.value || 0.8);

    titleEl.textContent =
        removeExtension(song.name);

    artistEl.textContent =
        song.artist;

    miniTitle.textContent =
        removeExtension(song.name);

    miniArtist.textContent =
        song.artist;

    albumArt.innerHTML =
        "<span>♫</span>";


    // Favorites
    updateFavoriteButton(song.id);


    // Recent
    recentlyPlayed =
        recentlyPlayed.filter(
            id => id !== song.id
        );

    recentlyPlayed.unshift(
        song.id
    );

    recentlyPlayed =
        recentlyPlayed.slice(0, 30);

    localStorage.setItem(
        "luxeRecent",
        JSON.stringify(recentlyPlayed)
    );


    audio.play()
        .then(() => {

            updatePlayButtons();

        })
        .catch(error => {

            console.log(
                "Playback waiting for user interaction.",
                error
            );

        });


    renderSongs();

}


// ============================================
// REMOVE FILE EXTENSION
// ============================================

function removeExtension(name) {

    return name.replace(
        /\.[^/.]+$/,
        ""
    );

}


// ============================================
// PLAY / PAUSE
// ============================================

function togglePlay() {

    if (currentIndex === -1) {

        if (songs.length > 0) {
            playSong(0);
        }

        return;
    }

    if (audio.paused) {

        audio.play();

    } else {

        audio.pause();

    }

}


// ============================================
// PLAY BUTTON UI
// ============================================

function updatePlayButtons() {

    const playing =
        !audio.paused;

    if (playBtn) {

        playBtn.textContent =
            playing ? "Ⅱ" : "▶";

    }

    if (miniPlay) {

        miniPlay.textContent =
            playing ? "Ⅱ" : "▶";

    }

    const visualizer =
        document.getElementById(
            "visualizer"
        );

    if (visualizer) {

        visualizer.classList.toggle(
            "playing",
            playing
        );

    }

}


// ============================================
// NEXT
// ============================================

function nextSong() {

    if (songs.length === 0) {
        return;
    }

    let nextIndex;

    if (isShuffle) {

        nextIndex =
            Math.floor(
                Math.random() *
                songs.length
            );

    } else {

        nextIndex =
            currentIndex + 1;

        if (
            nextIndex >= songs.length
        ) {

            nextIndex = 0;

        }

    }

    playSong(nextIndex);

}


// ============================================
// PREVIOUS
// ============================================

function previousSong() {

    if (songs.length === 0) {
        return;
    }

    if (audio.currentTime > 3) {

        audio.currentTime = 0;

        return;

    }

    let previousIndex =
        currentIndex - 1;

    if (previousIndex < 0) {

        previousIndex =
            songs.length - 1;

    }

    playSong(previousIndex);

}


// ============================================
// FAVORITES
// ============================================

function updateFavoriteButton(id) {

    if (!favoriteBtn) {
        return;
    }

    favoriteBtn.textContent =
        favorites.includes(id)
            ? "♥"
            : "♡";

}


function toggleFavorite(id) {

    if (favorites.includes(id)) {

        favorites =
            favorites.filter(
                item => item !== id
            );

    } else {

        favorites.push(id);

    }

    localStorage.setItem(
        "luxeFavorites",
        JSON.stringify(favorites)
    );

    updateFavoriteButton(id);

    renderSongs();

}


// ============================================
// DELETE SONG
// ============================================

async function removeSong(id) {

    const index =
        songs.findIndex(
            song => song.id === id
        );

    if (index === -1) {
        return;
    }

    // If playing this song
    if (currentIndex === index) {

        audio.pause();

        audio.removeAttribute(
            "src"
        );

        audio.load();

        currentIndex = -1;

        titleEl.textContent =
            "No song selected";

        artistEl.textContent =
            "Add music to start listening";

    }


    await deleteSong(id);

    songs.splice(index, 1);

    favorites =
        favorites.filter(
            item => item !== id
        );

    recentlyPlayed =
        recentlyPlayed.filter(
            item => item !== id
        );

    localStorage.setItem(
        "luxeFavorites",
        JSON.stringify(favorites)
    );

    localStorage.setItem(
        "luxeRecent",
        JSON.stringify(recentlyPlayed)
    );

    renderSongs();

}


// ============================================
// FILE INPUT
// ============================================

if (addBtn) {

    addBtn.addEventListener(
        "click",
        () => {

            fileInput.click();

        }
    );

}


if (fileInput) {

    fileInput.addEventListener(
        "change",
        async (event) => {

            await addFiles(
                Array.from(
                    event.target.files
                )
            );

            // Allow selecting same file again
            event.target.value = "";

        }
    );

}


// ============================================
// DRAG & DROP
// ============================================

if (dropzone) {

    ["dragenter", "dragover"]
        .forEach(eventName => {

            dropzone.addEventListener(
                eventName,
                event => {

                    event.preventDefault();

                    dropzone.classList.add(
                        "dragging"
                    );

                }
            );

        });


    ["dragleave", "drop"]
        .forEach(eventName => {

            dropzone.addEventListener(
                eventName,
                event => {

                    event.preventDefault();

                    dropzone.classList.remove(
                        "dragging"
                    );

                }
            );

        });


    dropzone.addEventListener(
        "drop",
        async event => {

            const files =
                Array.from(
                    event.dataTransfer.files
                );

            await addFiles(files);

        }
    );

}


// ============================================
// SONG CLICK
// ============================================

if (songsEl) {

    songsEl.addEventListener(
        "click",
        async event => {

            const favorite =
                event.target.closest(
                    "[data-favorite]"
                );

            if (favorite) {

                toggleFavorite(
                    favorite.dataset.favorite
                );

                return;

            }


            const deleteButton =
                event.target.closest(
                    "[data-delete]"
                );

            if (deleteButton) {

                await removeSong(
                    deleteButton.dataset.delete
                );

                return;

            }


            const song =
                event.target.closest(
                    ".song"
                );

            if (song) {

                playSong(
                    Number(
                        song.dataset.index
                    )
                );

            }

        }
    );

}


// ============================================
// PLAYER CONTROLS
// ============================================

playBtn?.addEventListener(
    "click",
    togglePlay
);

miniPlay?.addEventListener(
    "click",
    togglePlay
);

nextBtn?.addEventListener(
    "click",
    nextSong
);

prevBtn?.addEventListener(
    "click",
    previousSong
);


// ============================================
// AUDIO EVENTS
// ============================================

audio.addEventListener(
    "play",
    updatePlayButtons
);

audio.addEventListener(
    "pause",
    updatePlayButtons
);


audio.addEventListener(
    "loadedmetadata",
    () => {

        totalTimeEl.textContent =
            formatTime(
                audio.duration
            );

        miniTotal.textContent =
            formatTime(
                audio.duration
            );

    }
);


audio.addEventListener(
    "timeupdate",
    () => {

        if (!audio.duration) {
            return;
        }

        const percent =
            (audio.currentTime /
                audio.duration) * 100;

        progress.style.width =
            `${percent}%`;

        miniProgress.style.width =
            `${percent}%`;

        currentTimeEl.textContent =
            formatTime(
                audio.currentTime
            );

        miniCurrent.textContent =
            formatTime(
                audio.currentTime
            );

    }
);


audio.addEventListener(
    "ended",
    () => {

        if (isRepeat) {

            audio.currentTime = 0;

            audio.play();

        } else {

            nextSong();

        }

    }
);


// ============================================
// SEEK
// ============================================

progressTrack?.addEventListener(
    "click",
    event => {

        if (!audio.duration) {
            return;
        }

        const rect =
            progressTrack.getBoundingClientRect();

        const percent =
            (event.clientX - rect.left) /
            rect.width;

        audio.currentTime =
            percent * audio.duration;

    }
);


document
    .getElementById("miniTrack")
    ?.addEventListener(
        "click",
        event => {

            if (!audio.duration) {
                return;
            }

            const rect =
                event.currentTarget
                    .getBoundingClientRect();

            const percent =
                (event.clientX - rect.left) /
                rect.width;

            audio.currentTime =
                percent * audio.duration;

        }
    );


// ============================================
// VOLUME
// ============================================

volume?.addEventListener(
    "input",
    () => {

        audio.volume =
            parseFloat(volume.value);

        volText.textContent =
            `${Math.round(
                volume.value * 100
            )}%`;

    }
);


// ============================================
// FAVORITE CURRENT SONG
// ============================================

favoriteBtn?.addEventListener(
    "click",
    () => {

        if (currentIndex === -1) {
            return;
        }

        toggleFavorite(
            songs[currentIndex].id
        );

    }
);


// ============================================
// SHUFFLE
// ============================================

shuffleBtn?.addEventListener(
    "click",
    () => {

        isShuffle = !isShuffle;

        shuffleBtn.classList.toggle(
            "active",
            isShuffle
        );

    }
);


// ============================================
// REPEAT
// ============================================

repeatBtn?.addEventListener(
    "click",
    () => {

        isRepeat = !isRepeat;

        repeatBtn.classList.toggle(
            "active",
            isRepeat
        );

    }
);


// ============================================
// SEARCH
// ============================================

searchInput?.addEventListener(
    "input",
    renderSongs
);


// ============================================
// SIDEBAR NAVIGATION
// ============================================

document
    .querySelectorAll(".nav")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".nav")
                    .forEach(item =>
                        item.classList.remove(
                            "active"
                        )
                    );

                button.classList.add(
                    "active"
                );

                currentPage =
                    button.dataset.page;

                updatePageText();

                renderSongs();

            }
        );

    });


function updatePageText() {

    if (currentPage === "home") {

        sectionTitle.textContent =
            "Your Songs";

        pageTitle.innerHTML =
            "Good music.<br><em>Good mood.</em>";

    }

    if (currentPage === "favorites") {

        sectionTitle.textContent =
            "Favorites";

        pageTitle.innerHTML =
            "Your favorite.<br><em>sounds.</em>";

    }

    if (currentPage === "recent") {

        sectionTitle.textContent =
            "Recently Played";

        pageTitle.innerHTML =
            "Your recent.<br><em>listens.</em>";

    }

    if (currentPage === "queue") {

        sectionTitle.textContent =
            "Queue";

        pageTitle.innerHTML =
            "Ready to<br><em>play.</em>";

    }

}


// ============================================
// KEYBOARD CONTROLS
// ============================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.target.tagName ===
            "INPUT"
        ) {
            return;
        }


        if (
            event.code ===
            "Space"
        ) {

            event.preventDefault();

            togglePlay();

        }


        if (
            event.key ===
            "ArrowRight"
        ) {

            audio.currentTime =
                Math.min(
                    audio.currentTime + 5,
                    audio.duration || 0
                );

        }


        if (
            event.key ===
            "ArrowLeft"
        ) {

            audio.currentTime =
                Math.max(
                    audio.currentTime - 5,
                    0
                );

        }


        if (
            event.key ===
            "ArrowUp"
        ) {

            volume.value =
                Math.min(
                    1,
                    parseFloat(
                        volume.value
                    ) + 0.05
                );

            volume.dispatchEvent(
                new Event("input")
            );

        }


        if (
            event.key ===
            "ArrowDown"
        ) {

            volume.value =
                Math.max(
                    0,
                    parseFloat(
                        volume.value
                    ) - 0.05
                );

            volume.dispatchEvent(
                new Event("input")
            );

        }

    }
);


// ============================================
// START LUXE
// ============================================

async function initLuxe() {

    try {

        await openDatabase();

        await loadMusic();

    } catch (error) {

        console.error(
            "LUXE initialization error:",
            error
        );

    }

}


// Start
initLuxe();
