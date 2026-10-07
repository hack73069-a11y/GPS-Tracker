const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve frontend files
app.use(express.static(path.join(__dirname, "../public")));

// Health check
app.get("/health", (req, res) => {
    res.json({
        status: "online",
        message: "GPS Tracker server is running"
    });
});

// Socket.IO
io.on("connection", (socket) => {

    console.log("🟢 Device connected:", socket.id);

    socket.on("register", (device) => {

        console.log("📱 Device registered");
        console.log("Name:", device.name);
        console.log("ID:", socket.id);

    });

    socket.on("location", (location) => {

        console.log("");
        console.log("================================");
        console.log("📍 LOCATION RECEIVED");
        console.log("================================");

        console.log("Device   :", location.name);
        console.log("Latitude :", location.latitude);
        console.log("Longitude:", location.longitude);
        console.log(
            "Accuracy :",
            Math.round(location.accuracy),
            "meters"
        );

        console.log("================================");
        console.log("");

        // Send location to all connected users
        io.emit("locationUpdate", location);
    });

    socket.on("disconnect", () => {

        console.log(
            "🔴 Device disconnected:",
            socket.id
        );

    });

});

// Start server
server.listen(PORT, "0.0.0.0", () => {

    console.log("");
    console.log("================================");
    console.log("🚀 GPS TRACKER SERVER STARTED");
    console.log("================================");
    console.log("Port:", PORT);
    console.log("================================");
    console.log("");

});