const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.get('/', (req, res) => res.send('سيرفر اللعبة شغال! 🚀'));

io.on('connection', (socket) => {
  console.log('لاعب اتصل:', socket.id);

  socket.on('createRoom', (callback) => {
    const roomId = Math.floor(1000 + Math.random() * 9000).toString();
    socket.join(roomId);
    console.log(`🏠 غرفة جديدة: ${roomId}`);
    if (callback) callback({ roomId });
  });

  socket.on('joinRoom', (data, callback) => {
    if (io.sockets.adapter.rooms.has(data.roomId)) {
      socket.join(data.roomId);
      console.log(`🚪 لاعب ${socket.id} انضم للغرفة ${data.roomId}`);
      if (callback) callback({ success: true });
    } else {
      if (callback) callback({ success: false, message: "الغرفة غير موجودة" });
    }
  });

  socket.on('hostStartGame', (data) => {
    socket.to(data.roomId).emit('startGame');
    console.log(`🚀 المضيف بدأ في الغرفة ${data.roomId}`);
  });

  socket.on('playerAction', (data) => {
    socket.to(data.roomId).emit('opponentAction', data);
  });

  socket.on('disconnect', () => console.log('❌ قطع:', socket.id));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ السيرفر شغال على بورت ${PORT}`));
