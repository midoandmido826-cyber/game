const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.get('/', (req, res) => {
  res.send('سيرفر اللعبة شغال!');
});

io.on('connection', (socket) => {
  console.log('لاعب اتصل:', socket.id);

  // 1. إنشاء غرفة
  socket.on('createRoom', (callback) => {
    const roomId = Math.floor(1000 + Math.random() * 9000).toString();
    socket.join(roomId);
    console.log(`غرفة جديدة: ${roomId} بواسطة ${socket.id}`);
    if (callback) callback({ roomId: roomId });
  });

  // 2. الانضمام لغرفة
  socket.on('joinRoom', (data, callback) => {
    const roomId = data.roomId;
    if (io.sockets.adapter.rooms.has(roomId)) {
      socket.join(roomId);
      console.log(`لاعب ${socket.id} انضم للغرفة ${roomId}`);
      socket.to(roomId).emit('playerJoined', { socketId: socket.id });
      if (callback) callback({ success: true });
    } else {
      if (callback) callback({ success: false, message: "الغرفة غير موجودة" });
    }
  });

  // 3. المضيف بدأ اللعبة
  socket.on('hostStartGame', (data) => {
    socket.to(data.roomId).emit('startGame');
    console.log(`🚀 المضيف بدأ اللعبة في الغرفة ${data.roomId}`);
  });

  // 4. حركة اللاعب
  socket.on('playerAction', (data) => {
    socket.to(data.roomId).emit('opponentAction', data);
  });

  socket.on('disconnect', () => {
    console.log('لاعب قطع الاتصال:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`السيرفر شغال على بورت ${PORT}`);
});
