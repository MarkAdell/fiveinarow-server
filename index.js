const app = require('express')();
const utils = require('./utils.js');
const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  // when a user creates a new room
  console.log('socket id', socket.id);
  socket.on('new room', (data) => {
    const roomId = utils.generateRandomString();
    console.log('new room id', roomId);
    socket.join(roomId, () => {
      console.log('joined rooms', Object.keys(socket.rooms));
      socket.emit('room joined', { roomId, numberOfMembers: 1 });
      // on client: save the roomId and red color if number of members is one or blue if two, in local storate
      // navigate to disabled game page with the URL shown
    });
  });

  // when a user joins a room, by typing the roomId and clicking a button
  socket.on('join room', (data) => {
    const { roomId } = data;
    let numberOfMembers = io.sockets.adapter.rooms[roomId].length;
    console.log('number of members 1', numberOfMembers);
    if (numberOfMembers < 2) {
      socket.join(roomId, () => {
        numberOfMembers = io.sockets.adapter.rooms[roomId].length;
        socket.emit('room joined', { roomId, numberOfMembers });
      // on client: save the roomId and red color if number of members is one or blue if two, in local storate
      // navigate to disabled game page with the URL shown
        console.log('number of members 2', numberOfMembers);
        if (numberOfMembers === 2) { // it was 1 and now 2
          // TODO: update analytics in a database
          io.to(roomId).emit('game start');
          // on client: enable the view and start game
        }
      });
    } else {
      socket.emit('custom error', { message: 'this room is full' });
      // client should show this error
    }
  });

  // when a user makes a new move
  socket.on('new move', (data) => {
    const { roomId, row, col } = data;
    io.to(roomId).emit('new move', { row, col });
    // on client: update the view and check for a winner
  });

  // when a user wins
  socket.on('player win', (data) => {
    const { roomId, winningPlayer } = data;
    io.to(roomId).emit('player win', { winningPlayer });
    // on client: show a message of winner and a button for a new game
  });

  // when a user clicks new game
  socket.on('new game', (data) => {
    const { roomId } = data;
    io.to(roomId).emit('new game');
    // on client: reset the view
  });
  
  // when a user clicks cancel
  socket.on('game cancel', (data) => {
    const { roomId } = data;
    io.to(roomId).emit('game cancel');
    // on client: clear the local storage and navigate to the home page
  });

  socket.on('disconnecting', () => {
    const rooms = Object.keys(socket.rooms);
    console.log('disconnecting client socket id', socket.id);
    console.log('disconnecting client rooms', rooms);
    for (let i = 1; i < rooms.length; i++) {
      socket.to(rooms[1]).emit('user leave');
      // on client: inform the user that the other player left and reset, disable the game
    }
  });
});

server.listen(3000, function () {
  console.log('listening on port 3000');
});
