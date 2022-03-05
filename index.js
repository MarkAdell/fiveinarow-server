const initFirebase = require('./initFirebase');
const admin = require("firebase-admin");
const express = require('express');
const app = express();
const cors = require('cors');
const utils = require('./utils.js');
const server = require('http').createServer(app);
const io = require('socket.io')(server, { origins: '*:*'});
const compression = require("compression");

initFirebase();

const db = admin.database();

app.use(cors())
app.use(compression());

app.use(express.static('public'));

app.all('*', function (req, res) {
  res.status(200).sendFile('/', { root: 'public' });
});

io.on('connection', (socket) => {
  socket.on('new room', async () => {
    updateNumberOfCreatedRooms();
    const roomId = utils.generateRandomString();
    await leaveAllRooms(socket);
    socket.join(roomId, () => {
      socket.emit('room join', { roomId, numberOfMembers: 1 });
    });
  });

  socket.on('join room', async (data) => {
    const { roomId } = data;
    let numberOfMembers = 0;
    if (io.sockets.adapter.rooms[roomId]) {
      numberOfMembers = io.sockets.adapter.rooms[roomId].length;
    }
    if (numberOfMembers < 2) {
      await leaveAllRooms(socket);
      socket.join(roomId, () => {
        if (io.sockets.adapter.rooms[roomId]) {
          numberOfMembers = io.sockets.adapter.rooms[roomId].length;
        }
        socket.emit('room join', { roomId, numberOfMembers });
        if (numberOfMembers === 2) {
          io.to(roomId).emit('game start');
          updateNumberOfPlayedGames();
        }
      });
    } else {
      socket.emit('custom error', { message: 'This room is full' });
    }
  });

  socket.on('new move', (data) => {
    const { roomId, playerColor, row, col } = data;
    io.to(roomId).emit('new move', { row, col, playerColor });
  });

  socket.on('player win', (data) => {
    const { roomId, winningPlayer, score } = data;
    io.to(roomId).emit('player win', { winningPlayer, score });
  });

  socket.on('new game', (data) => {
    const { roomId } = data;
    io.to(roomId).emit('new game');
  });
  
  socket.on('game cancel', (data) => {
    const { roomId } = data;
    io.to(roomId).emit('game cancel');
  });

  socket.on('user leave', async () => {
    const rooms = Object.keys(socket.rooms);
    for (let i = 0; i < rooms.length; i++) {
      socket.to(rooms[i]).emit('user leave');
    }
    await leaveAllRooms(socket);
  });

  socket.on('disconnecting', () => {
    const rooms = Object.keys(socket.rooms);
    for (let i = 0; i < rooms.length; i++) {
      io.to(rooms[i]).emit('user leave');
    }
  });
});

function leaveAllRooms(socket) {
  return new Promise((resolve, reject) => {
    const rooms = Object.keys(socket.rooms);
    if (!rooms.length) { resolve(); }
    let leftRoomsCnt = 0;
    for (let room of rooms) {
      socket.leave(room, () => {
        leftRoomsCnt++;
        if (leftRoomsCnt === rooms.length) {
          resolve();
        }
      });
    }
  });
}

function updateNumberOfPlayedGames() {
  const playedGamesRef = db.ref('/analytics/numberOfPlayedGames');
  playedGamesRef.transaction(currentValue => (currentValue || 0) + 1);
}

function updateNumberOfCreatedRooms() {
  const createdRoomsRef = db.ref('/analytics/numberOfCreatedRooms');
  createdRoomsRef.transaction(currentValue => (currentValue || 0) + 1);
}

server.listen(3000, function () {
  console.log('listening on port 3000');
});
