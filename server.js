const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.get('/', (req, res) => res.send('سيرفر شغال'));

io.on('connection', (socket) => {
  socket.on('createRoom', (cb) => {
    const roomId = Math.floor(1000 + Math.random() * 9000).toString();
    socket.join(roomId);
    cb({ roomId });
  });

  socket.on('joinRoom', (data, cb) => {
    if (io.sockets.adapter.rooms.has(data.roomId)) {
      socket.join(data.roomId);
      cb({ success: true });
    } else {
      cb({ success: false });
    }
  });

  // إشارة البدء
  socket.on('hostStartGame', (data) => {
    socket.to(data.roomId).emit('startGame');
  });

  socket.on('playerAction', (data) => {
    socket.to(data.roomId).emit('opponentAction', data);
  });
});

server.listen(process.env.PORT || 3000);
