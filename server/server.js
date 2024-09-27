const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = {};
let balloons = {};

function getRandomColor() {
    const colors = ['ballon-red', 'ballon-yellow', 'ballon-green'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function getRandomPosition() {
    return { left: Math.floor(Math.random() * 400) }; // Adjust the range as per canvas width
}

setInterval(() => {
    const balloonId = `balloon-${Math.random().toString(36).substr(2, 9)}`;
    const balloon = {
        id: balloonId,
        color: getRandomColor(),
        position: getRandomPosition(),
        speed: Math.random() * 10 + 1
    };
    balloons[balloonId] = balloon;
    io.emit('newBalloon', balloon); // Broadcast to all players
}, 2000);

io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);

    players[socket.id] = {
        score: 0,
        id: socket.id,
    };

    io.emit('updatePlayers', players);

    socket.on('shootBalloon', (balloonId) => {
        if (balloons[balloonId]) {
            players[socket.id].score += 1;
            delete balloons[balloonId]; 
            io.emit('balloonDestroyed', { balloonId, playerId: socket.id });
            io.emit('updatePlayers', players);
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
