const socket = io();


// ======================================================
// HTML ELEMENTS
// ======================================================

const permissionPage =
    document.getElementById("permissionPage");

const trackerPage =
    document.getElementById("trackerPage");

const allowLocationButton =
    document.getElementById("allowLocationButton");

const permissionMessage =
    document.getElementById("permissionMessage");

const startButton =
    document.getElementById("startButton");

const stopButton =
    document.getElementById("stopButton");

const deviceName =
    document.getElementById("deviceName");

const status =
    document.getElementById("status");

const deviceList =
    document.getElementById("deviceList");


// ======================================================
// MAP
// ======================================================

const map = L.map("map").setView(
    [20.5937, 78.9629],
    5
);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
    }
).addTo(map);

let marker = null;


// ======================================================
// GPS VARIABLES
// ======================================================

let watchId = null;

let bestAccuracy = Infinity;

let bestPosition = null;

let firstLocation = false;

let improvementTimer = null;


// ======================================================
// REQUEST LOCATION
// ======================================================

function requestLocation() {

    if (!navigator.geolocation) {

        permissionMessage.textContent =
            "❌ Your browser does not support location.";

        return;
    }


    permissionMessage.textContent =
        "📡 Finding your location...";


    console.log("");
    console.log("======================================");
    console.log("📡 STARTING LOCATION SEARCH");
    console.log("======================================");


    bestAccuracy = Infinity;

    bestPosition = null;

    firstLocation = false;


    // Start watching location
    watchId =
        navigator.geolocation.watchPosition(

            function(position) {

                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;

                const accuracy =
                    position.coords.accuracy;


                console.log("");
                console.log("📍 LOCATION READING");

                console.log(
                    "Latitude :",
                    latitude
                );

                console.log(
                    "Longitude:",
                    longitude
                );

                console.log(
                    "Accuracy :",
                    Math.round(accuracy),
                    "meters"
                );


                // Keep best reading
                if (accuracy < bestAccuracy) {

                    bestAccuracy = accuracy;

                    bestPosition = position;


                    console.log(
                        "⭐ BEST ACCURACY:",
                        Math.round(accuracy),
                        "meters"
                    );
                }


                // ------------------------------------------
                // ACCEPT LOCATION
                // ------------------------------------------

                if (!firstLocation) {

                    /*
                     * Don't accept extremely inaccurate
                     * location readings.
                     */

                    if (accuracy <= 200) {

                        firstLocation = true;


                        console.log("");
                        console.log(
                            "✅ LOCATION ACCEPTED"
                        );


                        showTracker();


                        sendLocation(
                            latitude,
                            longitude,
                            accuracy
                        );


                        /*
                         * Keep GPS running for a few seconds
                         * so we can improve the position.
                         */

                        improvementTimer =
                            setTimeout(
                                finishGPS,
                                10000
                            );

                    }

                    else {

                        permissionMessage.textContent =
                            `📡 Searching for GPS... Accuracy: ${Math.round(accuracy)}m`;

                    }

                }

                // ------------------------------------------
                // BETTER LOCATION AFTER FIRST FIX
                // ------------------------------------------

                else {

                    if (
                        accuracy <
                        bestAccuracy
                    ) {

                        console.log(
                            "⭐ Better location found."
                        );


                        sendLocation(
                            latitude,
                            longitude,
                            accuracy
                        );

                    }

                }

            },


            // ==========================================
            // ERROR
            // ==========================================

            function(error) {

                console.log("");
                console.log(
                    "❌ LOCATION ERROR"
                );

                console.log(
                    "Code:",
                    error.code
                );

                console.log(
                    "Message:",
                    error.message
                );


                if (error.code === 1) {

                    permissionMessage.textContent =
                        "❌ Location permission denied. Please allow location.";

                }

                else if (error.code === 2) {

                    permissionMessage.textContent =
                        "❌ Location unavailable. Turn on Location.";

                }

                else if (error.code === 3) {

                    permissionMessage.textContent =
                        "❌ Location timed out. Trying again...";

                }

            },


            // ==========================================
            // OPTIONS
            // ==========================================

            {

                enableHighAccuracy: true,

                timeout: 20000,

                maximumAge: 0

            }
        );


    // ==========================================
    // MAXIMUM WAIT
    // ==========================================

    setTimeout(
        function() {

            if (!firstLocation && bestPosition) {

                console.log(
                    "⏱️ Using best available location."
                );


                firstLocation = true;


                showTracker();


                sendLocation(

                    bestPosition.coords.latitude,

                    bestPosition.coords.longitude,

                    bestPosition.coords.accuracy

                );


                finishGPS();

            }

        },
        20000
    );
}


// ======================================================
// SHOW TRACKER
// ======================================================

function showTracker() {

    permissionPage.style.display =
        "none";

    trackerPage.style.display =
        "block";


    setTimeout(
        function() {

            map.invalidateSize();

        },
        200
    );
}


// ======================================================
// SEND LOCATION TO SERVER
// ======================================================

function sendLocation(
    latitude,
    longitude,
    accuracy
) {

    const name =
        deviceName.value.trim() ||
        "User";


    // Send to Node.js
    socket.emit(
        "location",
        {

            name: name,

            latitude: latitude,

            longitude: longitude,

            accuracy: accuracy

        }
    );


    // Update map
    showLocation(
        latitude,
        longitude,
        name,
        accuracy
    );


    // Update page
    status.textContent =
        `📍 Location found — accuracy ${Math.round(accuracy)}m`;


    deviceList.innerHTML = `

        <h3>📱 ${name}</h3>

        <p>
            <b>Latitude:</b>
            ${latitude}
        </p>

        <p>
            <b>Longitude:</b>
            ${longitude}
        </p>

        <p>
            <b>Accuracy:</b>
            ${Math.round(accuracy)} meters
        </p>

    `;

}


// ======================================================
// SHOW LOCATION ON MAP
// ======================================================

function showLocation(
    latitude,
    longitude,
    name,
    accuracy
) {

    // Remove old marker
    if (marker) {

        map.removeLayer(marker);

    }


    // New marker
    marker =
        L.marker(
            [
                latitude,
                longitude
            ]
        )
        .addTo(map);


    marker.bindPopup(`

        <b>📍 ${name}</b>

        <br><br>

        Latitude:
        ${latitude}

        <br>

        Longitude:
        ${longitude}

        <br>

        Accuracy:
        ${Math.round(accuracy)} meters

    `);


    marker.openPopup();


    // Move map
    map.setView(
        [
            latitude,
            longitude
        ],
        17
    );
}


// ======================================================
// FINISH GPS SEARCH
// ======================================================

function finishGPS() {

    console.log("");
    console.log(
        "🛑 GPS IMPROVEMENT FINISHED"
    );


    if (watchId !== null) {

        navigator.geolocation.clearWatch(
            watchId
        );

        watchId = null;

    }


    if (improvementTimer !== null) {

        clearTimeout(
            improvementTimer
        );

        improvementTimer = null;

    }


    console.log(
        "Final best accuracy:",
        Math.round(bestAccuracy),
        "meters"
    );

}


// ======================================================
// ALLOW LOCATION BUTTON
// ======================================================

allowLocationButton.addEventListener(
    "click",
    function() {

        requestLocation();

    }
);


// ======================================================
// GET LOCATION AGAIN
// ======================================================

startButton.addEventListener(
    "click",
    function() {

        finishGPS();

        requestLocation();

    }
);


// ======================================================
// STOP
// ======================================================

stopButton.addEventListener(
    "click",
    function() {

        finishGPS();


        status.textContent =
            "Location sharing stopped.";


        startButton.disabled =
            false;


        stopButton.disabled =
            true;


        console.log(
            "🛑 LOCATION STOPPED"
        );

    }
);


// ======================================================
// SOCKET CONNECTED
// ======================================================

socket.on(
    "connect",
    function() {

        console.log(
            "🟢 Connected to GPS server"
        );

    }
);


// ======================================================
// SOCKET DISCONNECTED
// ======================================================

socket.on(
    "disconnect",
    function() {

        console.log(
            "🔴 Disconnected from GPS server"
        );

    }
);


// ======================================================
// LOCATION FROM SERVER
// ======================================================

socket.on(
    "locationUpdate",
    function(location) {

        console.log(
            "📡 Server location:",
            location
        );

    }
);