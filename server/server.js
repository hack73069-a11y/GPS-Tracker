const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

app.use(express.static(path.join(__dirname, "../public")));

io.on("connection", (socket) => {

    console.log("🟢 Device connected:", socket.id);

    socket.on("register", (device) => {
        console.log("📱 Device registered:", device);
    });

    socket.on("location", (location) => {

        console.log("\n📍 LOCATION RECEIVED");
        console.log("Latitude :", location.latitude);
        console.log("Longitude:", location.longitude);
        console.log("Accuracy :", location.accuracy, "meters");
        console.log("-----------------------------");

        // Send location to all connected devices
        io.emit("locationUpdate", location);
    });

    socket.on("disconnect", () => {
        console.log("🔴 Device disconnected:", socket.id);
    });

});

server.listen(PORT, () => {
    console.log(`🚀 GPS Tracker running at http://localhost:${PORT}`);
});