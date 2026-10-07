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

        attribution:
            "&copy; OpenStreetMap contributors"
    }
).addTo(map);


// Store all markers
const markers = {};


// Store all users
const users = {};


// ======================================================
// SHOW TRACKER
// ======================================================

function showTracker() {

    permissionPage.style.display =
        "none";

    trackerPage.style.display =
        "block";


    setTimeout(
        () => {
            map.invalidateSize();
        },
        200
    );
}


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


    navigator.geolocation.getCurrentPosition(

        function(position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            const accuracy =
                position.coords.accuracy;


            console.log("");
            console.log("📍 MY LOCATION");

            console.log(
                "Latitude:",
                latitude
            );

            console.log(
                "Longitude:",
                longitude
            );

            console.log(
                "Accuracy:",
                Math.round(accuracy),
                "meters"
            );


            showTracker();


            sendMyLocation(
                latitude,
                longitude,
                accuracy
            );

        },


        function(error) {

            console.log(
                "❌ Location error:",
                error.message
            );


            if (error.code === 1) {

                permissionMessage.textContent =
                    "❌ Location permission denied.";

            }

            else if (error.code === 2) {

                permissionMessage.textContent =
                    "❌ Location unavailable.";

            }

            else if (error.code === 3) {

                permissionMessage.textContent =
                    "❌ Location request timed out.";

            }

        },


        {
            enableHighAccuracy: true,

            timeout: 20000,

            maximumAge: 0
        }
    );
}


// ======================================================
// SEND MY LOCATION
// ======================================================

function sendMyLocation(
    latitude,
    longitude,
    accuracy
) {

    const name =
        deviceName.value.trim() ||
        "User";


    const location = {

        name: name,

        latitude: latitude,

        longitude: longitude,

        accuracy: accuracy

    };


    socket.emit(
        "location",
        location
    );


    status.textContent =
        `📍 Your location — accuracy ${Math.round(accuracy)}m`;
}


// ======================================================
// SHOW / UPDATE USER MARKER
// ======================================================

function showUser(
    user
) {

    const id =
        user.id;


    users[id] = user;


    // --------------------------------------------------
    // Create marker if it doesn't exist
    // --------------------------------------------------

    if (!markers[id]) {

        markers[id] =
            L.marker(
                [
                    user.latitude,
                    user.longitude
                ]
            ).addTo(map);

    }

    // --------------------------------------------------
    // Update marker position
    // --------------------------------------------------

    else {

        markers[id].setLatLng(
            [
                user.latitude,
                user.longitude
            ]
        );

    }


    // --------------------------------------------------
    // Marker popup
    // --------------------------------------------------

    markers[id].bindPopup(`

        <b>📍 ${escapeHtml(user.name)}</b>

        <br><br>

        Latitude:
        ${user.latitude}

        <br>

        Longitude:
        ${user.longitude}

        <br>

        Accuracy:
        ${Math.round(user.accuracy)} meters

    `);


    updateUserList();
}


// ======================================================
// REMOVE USER
// ======================================================

function removeUser(
    id
) {

    if (markers[id]) {

        map.removeLayer(
            markers[id]
        );

        delete markers[id];

    }


    delete users[id];


    updateUserList();

    console.log(
        "❌ User removed:",
        id
    );
}


// ======================================================
// UPDATE USER LIST
// ======================================================

function updateUserList() {

    const userArray =
        Object.values(users);


    if (userArray.length === 0) {

        deviceList.innerHTML =
            "<p>No users sharing location.</p>";

        return;
    }


    let html = `

        <h3>
            👥 Active Users:
            ${userArray.length}
        </h3>

    `;


    userArray.forEach(
        (user) => {

            html += `

                <div
                    style="
                        background:#111827;
                        padding:12px;
                        margin:8px 0;
                        border-radius:8px;
                    "
                >

                    <b>📍 ${escapeHtml(user.name)}</b>

                    <br>

                    <small>
                        Latitude:
                        ${user.latitude}
                    </small>

                    <br>

                    <small>
                        Longitude:
                        ${user.longitude}
                    </small>

                    <br>

                    <small>
                        Accuracy:
                        ${Math.round(user.accuracy)}m
                    </small>

                </div>

            `;

        }
    );


    deviceList.innerHTML =
        html;
}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(
    text
) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;
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

        requestLocation();

    }
);


// ======================================================
// STOP
// ======================================================

stopButton.addEventListener(
    "click",
    function() {

        status.textContent =
            "Location sharing stopped.";

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


        // Register this device
        socket.emit(
            "register",
            {

                name:
                    deviceName.value.trim() ||
                    "User"

            }
        );

    }
);


// ======================================================
// EXISTING ACTIVE USERS
// ======================================================

socket.on(
    "activeUsers",
    function(activeUsers) {

        console.log(
            "👥 Active users:",
            activeUsers
        );


        activeUsers.forEach(
            function(user) {

                if (
                    user.latitude !== null &&
                    user.longitude !== null
                ) {

                    showUser(user);

                }

            }
        );

    }
);


// ======================================================
// NEW / UPDATED USER LOCATION
// ======================================================

socket.on(
    "userLocation",
    function(user) {

        console.log(
            "📍 USER LOCATION:",
            user
        );


        if (
            user.latitude !== null &&
            user.longitude !== null
        ) {

            showUser(user);

        }

    }
);


// ======================================================
// USER DISCONNECTED
// ======================================================

socket.on(
    "userDisconnected",
    function(id) {

        console.log(
            "🔴 USER DISCONNECTED:",
            id
        );


        removeUser(id);

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