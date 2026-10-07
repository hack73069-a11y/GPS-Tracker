const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve website
app.use(express.static(path.join(__dirname, "../public")));

// Health check
app.get("/health", (req, res) => {
    res.json({
        status: "online",
        message: "GPS Tracker server is running"
    });
});


// ======================================================
// ACTIVE USERS
// ======================================================

const users = new Map();


// ======================================================
// SOCKET CONNECTION
// ======================================================

io.on("connection", (socket) => {

    console.log("");
    console.log("🟢 DEVICE CONNECTED");
    console.log("Socket ID:", socket.id);
    console.log("");


    // --------------------------------------------------
    // Send existing users to the newly connected user
    // --------------------------------------------------

    socket.emit(
        "activeUsers",
        Array.from(users.values())
    );


    // --------------------------------------------------
    // REGISTER USER
    // --------------------------------------------------

    socket.on("register", (device) => {

        const user = {
            id: socket.id,
            name: device.name || "User",
            latitude: null,
            longitude: null,
            accuracy: null
        };

        users.set(socket.id, user);

        console.log(
            "📱 USER REGISTERED:",
            user.name,
            socket.id
        );

    });


    // --------------------------------------------------
    // LOCATION RECEIVED
    // --------------------------------------------------

    socket.on("location", (location) => {

        const user = {
            id: socket.id,

            name:
                location.name ||
                "User",

            latitude:
                location.latitude,

            longitude:
                location.longitude,

            accuracy:
                location.accuracy
        };


        // Save/update user
        users.set(
            socket.id,
            user
        );


        console.log("");
        console.log("================================");
        console.log("📍 LOCATION RECEIVED");
        console.log("================================");

        console.log(
            "Device   :",
            user.name
        );

        console.log(
            "Socket ID:",
            user.id
        );

        console.log(
            "Latitude :",
            user.latitude
        );

        console.log(
            "Longitude:",
            user.longitude
        );

        console.log(
            "Accuracy :",
            Math.round(user.accuracy),
            "meters"
        );

        console.log("================================");
        console.log("");


        // Send this user's location to EVERYONE
        io.emit(
            "userLocation",
            user
        );

    });


    // --------------------------------------------------
    // DISCONNECT
    // --------------------------------------------------

    socket.on("disconnect", () => {

        const user = users.get(socket.id);

        users.delete(socket.id);


        console.log("");
        console.log("🔴 DEVICE DISCONNECTED");
        console.log("Socket ID:", socket.id);


        if (user) {

            console.log(
                "User:",
                user.name
            );

        }

        console.log("");


        // Tell everyone to remove this user
        io.emit(
            "userDisconnected",
            socket.id
        );

    });

});


// ======================================================
// START SERVER
// ======================================================

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");
        console.log("================================");
        console.log("🚀 GPS TRACKER SERVER STARTED");
        console.log("================================");
        console.log("Port:", PORT);
        console.log("================================");
        console.log("");

    }
);